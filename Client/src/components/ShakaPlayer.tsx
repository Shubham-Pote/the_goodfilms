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
  const [corsBlocked, setCorsBlocked] = useState(false);
  const [forceProxy, setForceProxy] = useState(false);

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

      const player = new shaka.Player();
      await player.attach(videoRef.current);
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
        if (event.detail.code !== 6006) {
          console.error('Error code', event.detail.code, 'object', event.detail);
        }
        if (event.detail.code === 7002) {
          setError("The broadcast appears to have ended or is experiencing network delays.");
        } else if (event.detail.code === 6012) {
          setError("Unable to decrypt this stream. The DRM license may be invalid.");
        } else if (event.detail.code !== 6006) {
          setError(`We encountered a stream issue (Code: ${event.detail.code}).`);
        }
      });

      // Dynamically decide if we need a proxy. 
      // If the stream requires DRM, custom headers, or specific spoofing, we MUST use the proxy.
      // Otherwise, we fetch directly from the browser to bypass Datacenter IP blocks for standard streams.
      // If user clicked "Try with Proxy", forceProxy overrides the decision.
      const needsProxy = forceProxy || Boolean(drmScheme || drmKey || referer || cookie || origin || userAgent);

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
        drm: {
          parseInbandPsshEnabled: true, // Crucial for HLS DRM streams that don't advertise PSSH in manifest
        },
        streaming: {
          bufferingGoal: 30,       // Buffer 30s ahead (optimized from 60s for lower memory & faster adaptation)
          rebufferingGoal: 2,      // Resume playback much faster (2s instead of 5s) after a stall
          bufferBehind: 30,        // Keep 30 seconds behind for seeking back smoothly
          lowLatencyMode: true,    // Enable LL-HLS and LL-DASH support
          jumpLargeGaps: true,     // Smooth streaming: Automatically skip missing segments instead of freezing
          inaccurateManifestTolerance: 0.1, // Tolerate slight manifest timing errors without stalling
          stallEnabled: true,      // Actively detect if the browser's video decoder gets stuck
          stallThreshold: 1,       // Consider it a stall if the video freezes for 1 second despite having buffer
          stallSkip: 0.1,          // Nudge the playhead forward by 100ms to jumpstart a stuck decoder
          retryParameters: {
            maxAttempts: 3,        // Fail faster to switch qualities instead of hanging
            baseDelay: 500,        // Extremely fast retry delay (500ms) for real-time responsiveness
            backoffFactor: 2,
          }
        },
        manifest: {
          retryParameters: {
            maxAttempts: 3,
            baseDelay: 500,
          },
          dash: {
            autoCorrectDrift: true, // Prevent the player from falling out of sync with live edges
          }
        },
        abr: {
          enabled: true,
          defaultBandwidthEstimate: 100000000, // Start with high bandwidth (100Mbps) for highest quality initial load
          switchInterval: 1,                 // Aggressively check for quality changes every 1s (down from 2s)
          bandwidthDowngradeTarget: 0.85,    // Keep a safer margin to prevent buffering when bandwidth drops
        }
      });

      // Clear any previous error before loading
      setError(null);
      setCorsBlocked(false);

      try {
        await player.load(streamUrl);
      } catch (e: any) {
        if (destroyed) return; // Don't set errors if we're already cleaning up
        if (e.code !== 6006) {
          console.error('Error code', e.code, 'object', e);
        }
        
        // Detect CORS / network block errors when NOT using proxy
        // Error 1001 = BAD_HTTP_STATUS on manifest, 1002 = HTTP_ERROR
        if (!needsProxy && (e.code === 1001 || e.code === 1002)) {
          setCorsBlocked(true);
          return;
        }
        
        if (e.code === 7002) {
          setError("The broadcast appears to have ended or is experiencing network delays.");
        } else if (e.code === 6007) {
          setError("DRM license request failed. The keys may be incorrect or expired.");
        } else if (e.code === 6012) {
          setError("Unable to decrypt this stream. The DRM license may be invalid.");
        } else if (e.code !== 6006) {
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
  }, [streamUrl, drmScheme, drmKeyId, drmKey, licenseUrl, referer, cookie, origin, userAgent, forceProxy]);

  // CORS Blocked Fallback UI
  if (corsBlocked) {
    return (
      <div className={`relative w-full h-full bg-black overflow-hidden flex items-center justify-center z-[100] pointer-events-auto ${className || ''}`}>
        <div className="flex flex-col items-center gap-6 p-8 text-center max-w-md relative z-[110]">
          {/* Shield Icon */}
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <div>
            <h3 className="text-white text-lg font-semibold mb-2">Stream Protected by CORS</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              This stream's server blocks playback from third-party websites. You can open it directly in your browser instead.
            </p>
          </div>

          {/* Open in Browser Button */}
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 pointer-events-auto cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Open Stream in Browser
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>

          {/* Try with Proxy Button */}
          <button
            onClick={() => {
              setCorsBlocked(false);
              setForceProxy(true);
            }}
            className="text-white/40 hover:text-white/70 text-xs underline underline-offset-2 transition-colors"
          >
            Try with backend proxy instead
          </button>

          {/* Extension Tip */}
          <div className="flex items-start gap-3 bg-white/5 rounded-lg p-3 border border-white/10 text-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p className="text-white/40 text-xs leading-relaxed">
              <span className="text-white/60 font-medium">Tip:</span> Install the "Native HLS Playback" Chrome extension for the best experience with fullscreen, quality selection, and more.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      />
    </div>
  );
}

