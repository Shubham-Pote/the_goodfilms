import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Server } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { apiUrl } from "../lib/api";

interface PlayerUrls {
  videasy: string;
  twoEmbed: string | null;
  vidfast: string | null;
}

function normalizeVideasyUrl(raw: string): URL {
  const url = new URL(raw);

  if (url.hostname === "player.videasy.net") {
    url.hostname = "player.videasy.ws";
  }

  if (!url.pathname.startsWith("/embed/")) {
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      url.pathname = `/embed/${pathParts.join("/")}`;
    }
  }

  return url;
}

export function PlayerPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();

  const [playerUrls, setPlayerUrls] = useState<PlayerUrls | null>(null);
  const [sourcesUnavailable, setSourcesUnavailable] = useState(false);
  const [activeServer, setActiveServer] = useState<"videasy" | "twoEmbed" | "vidfast">(
    "videasy",
  );
  const [season, setSeason] = useState(Number(searchParams.get("s")) || 1);
  const [episode, setEpisode] = useState(Number(searchParams.get("e")) || 1);

  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!id || !type) return;

    try {
      const localKey = "video_progress";
      const existingStr = localStorage.getItem(localKey);
      const existing = existingStr ? JSON.parse(existingStr) : {};

      let progressKey = `${type}_${id}`;
      if (type === "tv") progressKey += `_s${season}_e${episode}`;

      if (!existing[progressKey]) {
        existing[progressKey] = {
          contentId: id,
          contentType: type,
          progress: 1,
          timestamp: Date.now(),
          duration: 0,
          season,
          episode,
          updatedAt: Date.now(),
        };
      } else {
        existing[progressKey].timestamp = Date.now();
        existing[progressKey].updatedAt = Date.now();
      }
      localStorage.setItem(localKey, JSON.stringify(existing));
    } catch (err) {
      console.warn("Failed to set initial progress", err);
    }
  }, [id, type, season, episode]);

  useEffect(() => {
    if (!id || !type) return;

    let playerApiUrl = apiUrl(`/api/movies/player/${type}/${id}`);
    if (type === "tv") {
      playerApiUrl += `?s=${season}&e=${episode}`;
    }

    const controller = new AbortController();
    setSourcesUnavailable(false);
    setPlayerUrls(null);
    fetch(playerApiUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Playback unavailable");
        return res.json();
      })
      .then((data) => {
        if (data.servers) setPlayerUrls(data.servers);
        else setSourcesUnavailable(true);
      })
      .catch(() => { if (!controller.signal.aborted) setSourcesUnavailable(true); });
    return () => controller.abort();
  }, [id, type, season, episode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        let payload;
        if (typeof event.data === "string") {
          try { payload = JSON.parse(event.data); } catch { return; }
        } else {
          return;
        }

        const currentId = payload.id || id;
        const currentType = payload.type || type;
        const currentProgress = payload.progress;

        if (currentId && currentType && currentProgress !== undefined) {
          const progressData = {
            contentId: currentId,
            contentType: currentType,
            progress: currentProgress,
            timestamp: payload.timestamp || 0,
            duration: payload.duration || 0,
            season: payload.season || season,
            episode: payload.episode || episode,
            updatedAt: Date.now(),
          };

          const localKey = "video_progress";
          const existingStr = localStorage.getItem(localKey);
          const existing = existingStr ? JSON.parse(existingStr) : {};

          let progressKey = `${currentType}_${currentId}`;
          if (currentType === "tv") {
            progressKey += `_s${progressData.season}_e${progressData.episode}`;
          }

          existing[progressKey] = progressData;
          localStorage.setItem(localKey, JSON.stringify(existing));
        }

        if (payload.event === "nextEpisode") {
          setEpisode((prev) => prev + 1);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [season, episode, id, type]);

  useEffect(() => {
    const requestFullscreen = async () => {
      if (!playerRef.current) return;
      try {
        await playerRef.current.requestFullscreen();
      } catch (err) {
        // browser may block without user gesture
      }
    };

    requestFullscreen();
  }, []);

  const currentSrc = useMemo(() => {
    if (!playerUrls) return null;
    const raw = playerUrls[activeServer];
    if (!raw) return null;

    if (activeServer === "videasy") {
      const url = normalizeVideasyUrl(raw);
      url.searchParams.set("color", "F4BF75");
      url.searchParams.set("overlay", "true");
      if (type === "tv") {
        url.searchParams.set("nextEpisode", "true");
        url.searchParams.set("autoplayNextEpisode", "true");
        url.searchParams.set("episodeSelector", "true");
      }
      return url.toString();
    }

    return raw;
  }, [playerUrls, activeServer, type]);

  const serverOptions = useMemo(() => {
    const options = [{ value: "videasy", label: "VIDEASY WS" }];
    if (playerUrls?.vidfast) {
      options.push({ value: "vidfast", label: "VIDFAST" });
    }
    if (playerUrls?.twoEmbed) {
      options.push({ value: "twoEmbed", label: "2EMBED" });
    }
    return options;
  }, [playerUrls]);

  return (
    <div ref={playerRef} className="player-shell fixed inset-0 bg-black text-white">
      <div className="player-toolbar absolute top-2 left-2 md:top-4 md:left-4">
        <button
          onClick={() => navigate(state?.returnTo || `/title/${type}/${id}`, { replace: true })}
          className="player-control size-11 flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="player-toolbar absolute top-2 right-2 md:top-4 md:right-4 flex items-center gap-2">
        <div className="player-control flex items-center gap-2 px-1">
          <div className="pl-3 flex items-center text-zinc-300">
            <Server size={12} />
          </div>
          <Select
            value={activeServer}
            onValueChange={(val) => setActiveServer(val as "videasy" | "twoEmbed" | "vidfast")}
            disabled={!playerUrls}
          >
            <SelectTrigger aria-label="Playback server" className="bg-transparent border-0 text-xs font-bold text-white w-28 min-h-10 cursor-pointer">
              <SelectValue placeholder="Server" />
            </SelectTrigger>
            <SelectContent portalContainer={playerRef.current} className="min-w-[7rem]">
              {serverOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer text-xs font-semibold"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="player-stage absolute inset-0">
        {currentSrc ? (
          <iframe
            src={currentSrc}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="encrypted-media"
            title="Video Player"
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center p-6 text-center text-muted-foreground" role="status">
            <Play size={35} className="text-primary" aria-hidden="true" />
            <p>{sourcesUnavailable || playerUrls ? "This playback source is unavailable." : "Loading playback sources…"}</p>
          </div>
        )}
      </div>

    </div>
  );
}
