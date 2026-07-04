import { useEffect, useRef, useState } from "react";
// @ts-ignore
import shaka from "shaka-player/dist/shaka-player.ui.js";
import "shaka-player/dist/controls.css";
// @ts-ignore
import muxjs from "mux.js";
import { apiUrl } from "@/lib/api";

if (typeof window !== "undefined") {
  (window as any).muxjs = muxjs;
}

interface ShakaPlayerProps {
  streamUrl: string;
  drmScheme?: string;
  drmKeyId?: string;
  drmKey?: string;
  licenseUrl?: string;
  referer?: string;
  cookie?: string;
  origin?: string;
  userAgent?: string;
  className?: string;
}

export function ShakaPlayer({ streamUrl, drmScheme, drmKeyId, drmKey, licenseUrl, referer, cookie, origin, userAgent, className = "aspect-video rounded-lg border border-white/10" }: ShakaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const uiContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const uiRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-hide error toast after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();

    // Check to see if the browser supports the basic APIs Shaka needs.
    if (!shaka.Player.isBrowserSupported()) {
      setError("Browser not supported!");
      return;
    }

    let destroyed = false;

    const initPlayer = async () => {
      if (!videoRef.current || !uiContainerRef.current) return;

      // Destroy any previous player instance cleanly before creating a new one
      if (uiRef.current) {
        try { uiRef.current.destroy(); } catch (e) { /* ignore */ }
        uiRef.current = null;
      }
      if (playerRef.current) {
        try { await playerRef.current.destroy(); } catch (e) { /* ignore */ }
        playerRef.current = null;
      }

      if (destroyed) return;

      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;

      // Initialize the Shaka Player UI Overlay
      const ui = new shaka.ui.Overlay(player, uiContainerRef.current, videoRef.current);
      uiRef.current = ui;
      
      ui.configure({
        controlPanelElements: [
          'play_pause',
          'mute',
          'volume',
          'time_and_duration',
          'spacer',
          'fullscreen',
          'overflow_menu'
        ],
        overflowMenuButtons: ['captions', 'quality', 'language', 'picture_in_picture', 'cast']
      });
      
      // Listen for error events.
      player.addEventListener('error', (event: any) => {
        console.error('Error code', event.detail.code, 'object', event.detail);
        if (event.detail.code === 7002) {
          setError("The broadcast appears to have ended or is experiencing network delays.");
        } else if (event.detail.code === 6012) {
          setError("Unable to decrypt this stream. The DRM license may be invalid.");
        } else {
          setError(`We encountered a stream issue (Code: ${event.detail.code}).`);
        }
      });

      // Dynamically decide if we need a proxy. 
      // If the stream requires DRM, custom headers, or specific spoofing, we MUST use the proxy.
      // Otherwise, we fetch directly from the browser to bypass Datacenter IP blocks for standard streams.
      const needsProxy = Boolean(drmScheme || drmKey || referer || cookie || origin || userAgent);

      // Network request filter: route requests through the backend proxy when needed
      player.getNetworkingEngine()?.registerRequestFilter((type: any, request: any) => {
        // Shaka uses data: URIs internally for clearKeys. Never proxy these!
        if (request.uris[0] && (request.uris[0].startsWith('data:') || request.uris[0].startsWith('blob:'))) {
          return;
        }
        
        // Don't proxy license requests for ClearKey, as they are handled locally
        if (type === shaka.net.NetworkingEngine.RequestType.LICENSE && drmScheme === "ClearKey") {
          return;
        }

        if (needsProxy && request.uris[0] && !request.uris[0].includes('/api/proxy')) {
          const params = new URLSearchParams();
          params.append("url", request.uris[0]);
          if (referer) params.append("referer", referer);
          if (origin) params.append("origin", origin);
          if (userAgent) params.append("userAgent", userAgent);
          if (cookie) params.append("cookie", cookie);
          
          request.uris[0] = apiUrl(`/api/proxy?${params.toString()}`);
        }
      });

      // Response filter: restore original URI so Shaka resolves relative segment paths correctly
      player.getNetworkingEngine()?.registerResponseFilter((type: any, response: any) => {
        if (response.uri && response.uri.includes('/api/proxy')) {
          try {
            const urlObj = new URL(response.uri, window.location.origin);
            const originalUrl = urlObj.searchParams.get('url');
            if (originalUrl) {
              response.uri = originalUrl;
            }
          } catch (e) {
            console.error("Failed to parse proxy URL in response filter:", e);
          }
        }
      });

      // Configure DRM using path-based config calls (more reliable than nested objects)
      if (drmScheme === "ClearKey" && drmKeyId && drmKey) {
        player.configure('drm.clearKeys', { [drmKeyId]: drmKey });
        
        // Map Widevine and PlayReady UUIDs to ClearKey so Shaka uses the clearKeys 
        // even if the manifest only advertises Widevine/PlayReady.
        player.configure('manifest.dash.keySystemsByURI', {
          'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed': 'org.w3.clearkey',
          'urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95': 'org.w3.clearkey'
        });
      } else if (drmScheme === "Widevine" && licenseUrl) {
        player.configure('drm.servers', { 'com.widevine.alpha': licenseUrl });
      }

      // Performance & Efficiency Tuning
      player.configure({
        streaming: {
          bufferingGoal: 60,       // Buffer up to 60 seconds of video to prevent stalls
          rebufferingGoal: 5,      // Require 5 seconds of buffer to resume after a stall
          bufferBehind: 30,        // Keep 30 seconds behind for seeking back smoothly
          lowLatencyMode: true,    // Live stream optimization
          retryParameters: {
            maxAttempts: 5,        // Retry failed segments up to 5 times
            baseDelay: 1000,       // Start retry delay at 1 second
          }
        },
        manifest: {
          retryParameters: {
            maxAttempts: 5,
            baseDelay: 1000,
          },
        },
        abr: {
          enabled: true,
          defaultBandwidthEstimate: 1000000, // Start with lower bandwidth (1Mbps) for faster initial load
          switchInterval: 2,                 // Check for better quality every 2s
        }
      });

      // Clear any previous error before loading
      setError(null);

      try {
        await player.load(streamUrl);
      } catch (e: any) {
        if (destroyed) return; // Don't set errors if we're already cleaning up
        console.error('Error code', e.code, 'object', e);
        if (e.code === 7002) {
          setError("The broadcast appears to have ended or is experiencing network delays.");
        } else if (e.code === 6007) {
          setError("DRM license request failed. The keys may be incorrect or expired.");
        } else if (e.code === 6012) {
          setError("Unable to decrypt this stream. The DRM license may be invalid.");
        } else {
          setError(`We encountered a stream issue (Code: ${e.code}).`);
        }
      }
    };

    initPlayer();

    return () => {
      destroyed = true;
      if (uiRef.current) {
        try { uiRef.current.destroy(); } catch (e) { /* ignore */ }
        uiRef.current = null;
      }
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
        playerRef.current = null;
      }
    };
  }, [streamUrl, drmScheme, drmKeyId, drmKey, licenseUrl, referer, cookie, origin, userAgent]);

  return (
    <div ref={uiContainerRef} className={`relative w-full bg-black overflow-hidden flex items-center justify-center group ${className}`}>
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-red-950/90 text-red-200 px-4 py-3 rounded-lg border border-red-500/30 shadow-lg backdrop-blur-sm max-w-[90%] w-max transition-all">
          <div className="flex-1 text-sm font-medium">
            {error}
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-300 hover:text-white p-1 rounded-md transition-colors bg-red-500/20 hover:bg-red-500/40 shrink-0"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted // Muted to allow autoplay without user interaction in most browsers
      />
    </div>
  );
}
