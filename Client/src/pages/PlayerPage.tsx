import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

export function PlayerPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [playerUrls, setPlayerUrls] = useState<PlayerUrls | null>(null);
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

    fetch(playerApiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.servers) setPlayerUrls(data.servers);
      })
      .catch(console.error);
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
      const url = new URL(raw);
      url.searchParams.set("color", "E50914");
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
    const options = [{ value: "videasy", label: "VIDEASY" }];
    if (playerUrls?.vidfast) {
      options.push({ value: "vidfast", label: "VIDFAST" });
    }
    if (playerUrls?.twoEmbed) {
      options.push({ value: "twoEmbed", label: "2EMBED" });
    }
    return options;
  }, [playerUrls]);

  return (
    <div className="fixed inset-0 bg-black text-white">
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-black/60 rounded-full px-1 border border-white/10">
          <div className="pl-3 flex items-center text-zinc-300">
            <Server size={12} />
          </div>
          <Select
            value={activeServer}
            onValueChange={(val) => setActiveServer(val as "videasy" | "twoEmbed" | "vidfast")}
            disabled={serverOptions.length === 0}
          >
            <SelectTrigger className="bg-transparent border-0 focus:ring-0 focus:ring-offset-0 text-xs font-bold text-white w-28 h-8 rounded-full cursor-pointer">
              <SelectValue placeholder="Server" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white min-w-[7rem]">
              {serverOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="focus:bg-red-900/30 focus:text-white cursor-pointer text-xs font-semibold"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div ref={playerRef} className="absolute inset-0">
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
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            <Play size={48} className="animate-pulse opacity-50" />
          </div>
        )}
      </div>

    </div>
  );
}
