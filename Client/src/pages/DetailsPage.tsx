import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Clock, Download, Calendar, Check, AlertCircle, Film, Tv, X, Trash2, Loader2, Grid, List, ExternalLink, HardDrive, FileVideo, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "../components/ui/dialog";

import { TMDB_API_KEY } from "@/lib/tmdb";
import { apiUrl } from "../lib/api";

const POPULAR_TAGLINES: Record<string, string> = {
  "76179": "Never meet your heroes.",
  "1399": "Winter is coming",
  "322184": "The First Television Series to Come to the Biggest Screen of All",
};

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  media_type?: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  overview?: string;
  still_path?: string;
  runtime?: number;
  air_date?: string;
}

export function DetailsPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState<any>(null);
  const [similar, setSimilar] = useState<TMDBItem[]>([]);
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
  const [cast, setCast] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"episodes" | "similar" | "details">(
    "details",
  );
  const [episodeLayout, setEpisodeLayout] = useState<"grid" | "list">(() => {
    try {
      const saved = localStorage.getItem("episode_layout");
      return (saved === "grid" || saved === "list") ? saved : "grid";
    } catch {
      return "grid";
    }
  });

  const handleSetLayout = (layout: "grid" | "list") => {
    setEpisodeLayout(layout);
    try {
      localStorage.setItem("episode_layout", layout);
    } catch (e) {
      console.error(e);
    }
  };

  // Download State Management
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<any>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "fetching" | "matches" | "sources" | "completed">("idle");
  const [searchMatches, setSearchMatches] = useState<any[]>([]);
  const [downloadSources, setDownloadSources] = useState<any>(null); // Full API response
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Sonix Hub TV download states
  const [resolvedSubjectId, setResolvedSubjectId] = useState<string | null>(null);
  const [tvInfoData, setTvInfoData] = useState<any>(null);
  const [activeSeason, setActiveSeason] = useState<number>(1);
  const [activeDubSubjectId, setActiveDubSubjectId] = useState<string | null>(null);
  const [tvSeasonData, setTvSeasonData] = useState<any>(null);
  const [expandedEpisodeNumber, setExpandedEpisodeNumber] = useState<number | null>(null);

  const [downloadedItems, setDownloadedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("downloaded_items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isDownloaded = (episodeNumber?: number) => {
    let key = `${type}_${id}`;
    if (type === "tv" && episodeNumber != null) {
      key += `_s${season}_e${episodeNumber}`;
    }
    return downloadedItems.includes(key);
  };

  const isMovieDownloaded = type === "movie" && downloadedItems.includes(`${type}_${id}`);

  const saveDownloadedItem = (key: string) => {
    setDownloadedItems((prev) => {
      const updated = prev.includes(key) ? prev : [...prev, key];
      localStorage.setItem("downloaded_items", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteDownloadedItem = (key: string) => {
    setDownloadedItems((prev) => {
      const updated = prev.filter((item) => item !== key);
      localStorage.setItem("downloaded_items", JSON.stringify(updated));
      return updated;
    });
    setDownloadState("idle");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const fetchTvDownloadData = async (subjId: string, sNumber: number, forceShowLoader = false) => {
    if (forceShowLoader) {
      setDownloadState("fetching");
    }
    setDownloadError(null);
    try {
      const res = await fetch(apiUrl("/api/movies/downloads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tv-season",
          subjectId: subjId,
          season: sNumber
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status} for tv-season`);
      }

      const data = await res.json();
      setTvSeasonData(data);
      setDownloadState("sources");
    } catch (err: any) {
      console.error("TV Season fetch error:", err);
      setDownloadError(err.message || "Failed to fetch episode sources");
      setDownloadState("idle");
    }
  };

  const initTvDownloadFlow = async (sNumber: number, initialEpisode?: number) => {
    setDownloadState("fetching");
    setDownloadError(null);
    setTvInfoData(null);
    setTvSeasonData(null);
    setResolvedSubjectId(null);
    setActiveDubSubjectId(null);
    if (initialEpisode !== undefined) {
      setExpandedEpisodeNumber(initialEpisode);
    } else {
      setExpandedEpisodeNumber(null);
    }

    try {
      let currentTitle = details?.title || details?.name || "";
      let currentYear = year ? String(year) : "";

      if (!currentTitle) {
        console.log("[DetailsPage] TMDB details not loaded yet. Fetching fallback directly...");
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}`);
        if (tmdbRes.ok) {
          const tmdbData = await tmdbRes.json();
          currentTitle = tmdbData.title || tmdbData.name || "";
          const date = tmdbData.release_date || tmdbData.first_air_date;
          if (date) {
            currentYear = String(new Date(date).getFullYear());
          }
        }
      }

      if (!currentTitle) {
        throw new Error("Unable to resolve TV show details");
      }

      console.log(`[DetailsPage] Searching for: ${currentTitle} (${currentYear})`);

      const searchRes = await fetch(apiUrl("/api/movies/downloads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          title: currentTitle,
          year: currentYear || undefined,
          type: "tv"
        })
      });

      if (!searchRes.ok) {
        throw new Error(`Search failed: ${searchRes.status}`);
      }

      const searchData = await searchRes.json();
      if (!searchData.matches || searchData.matches.length === 0) {
        throw new Error("No download matches found for this title");
      }

      const bestMatch = searchData.matches.find((m: any) => m.hasResource === true) || searchData.matches[0];
      const subjId = bestMatch.subjectId;
      setResolvedSubjectId(subjId);
      setActiveDubSubjectId(subjId);

      const infoRes = await fetch(apiUrl("/api/movies/downloads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tv-info",
          subjectId: subjId
        })
      });

      if (!infoRes.ok) {
        throw new Error(`TV Info failed: ${infoRes.status}`);
      }

      const infoData = await infoRes.json();
      setTvInfoData(infoData);

      await fetchTvDownloadData(subjId, sNumber || 1);
    } catch (err: any) {
      console.error("TV download initialization error:", err);
      setDownloadError(err.message || "Failed to initialize TV download flow");
      setDownloadState("idle");
    }
  };

  const fetchDownloadLinks = async (target: any) => {
    if (type === "tv") {
      initTvDownloadFlow(target?.season || season || activeSeason || 1);
      return;
    }

    setDownloadState("fetching");
    setDownloadError(null);
    setDownloadSources(null);
    setSearchMatches([]);

    try {
      const searchPayload: Record<string, any> = {
        action: "search",
        title: details?.title || details?.name || "",
        year: year ? String(year) : undefined,
        type: "movie",
      };

      const searchRes = await fetch(apiUrl("/api/movies/downloads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchPayload),
      });

      if (!searchRes.ok) {
        throw new Error(`Search returned ${searchRes.status}`);
      }

      const searchData = await searchRes.json();
      
      if (!searchData.matches || searchData.matches.length === 0) {
        throw new Error("No download matches found for this movie");
      }

      setSearchMatches(searchData.matches);
      setDownloadState("matches");
    } catch (err: any) {
      console.error("Download fetch error:", err);
      setDownloadError(err.message || "Failed to fetch download links");
      setDownloadState("idle");
    }
  };

  const selectTvMatch = async (subjId: string) => {
    setDownloadState("fetching");
    try {
      setResolvedSubjectId(subjId);
      setActiveDubSubjectId(subjId);
      
      const infoRes = await fetch(apiUrl("/api/movies/downloads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tv-info", subjectId: subjId })
      });
      if (!infoRes.ok) throw new Error(`TV Info failed`);
      
      const infoData = await infoRes.json();
      setTvInfoData(infoData);
      
      await fetchTvDownloadData(subjId, activeSeason || 1);
    } catch (err: any) {
      setDownloadError(err.message || "Failed to fetch TV details");
      setDownloadState("idle");
    }
  };

  const selectMovieMatch = async (subjId: string) => {
    setDownloadState("fetching");
    try {
      const movieRes = await fetch(apiUrl("/api/movies/downloads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "movie", subjectId: subjId }),
      });
      if (!movieRes.ok) throw new Error(`Movie details fetch failed`);
      const movieData = await movieRes.json();
      setDownloadSources(movieData);
      setDownloadState("sources");
    } catch (err: any) {
      setDownloadError(err.message || "Failed to fetch movie details");
      setDownloadState("idle");
    }
  };

  const handleOpenDownloadModal = (target?: any) => {
    if (type === "movie") {
      const movieTarget = { type: "movie", name: title };
      setDownloadTarget(movieTarget);
      setDownloadSources(null);
      setDownloadError(null);
      setDownloadState("idle");
      setDownloadModalOpen(true);
      fetchDownloadLinks(movieTarget);
      return;
    } else {
      // For TV show, open modal and trigger search/tv-info/tv-season
      setDownloadTarget(null);
      setDownloadState("idle");
      setDownloadSources(null);
      setDownloadError(null);
      setDownloadModalOpen(true);
      if (target?.episode) {
        setExpandedEpisodeNumber(target.episode);
      } else {
        setExpandedEpisodeNumber(null);
      }
      initTvDownloadFlow(target?.season || season || activeSeason || 1, target?.episode);
      return;
    }
    setDownloadModalOpen(true);
  };

  const handleDownloadClick = (url: string, target: any) => {
    window.open(url, "_blank");

    let key = `${type}_${id}`;
    if (target?.type === "episode") {
      key += `_s${target.season}_e${target.episode}`;
      saveDownloadedItem(key);
      // Keep UI in sources list so user can download more
    } else {
      saveDownloadedItem(key);
      setDownloadModalOpen(false);
    }
  };

  const title = details?.title || details?.name || "Loading...";
  const year = useMemo(() => {
    const date = details?.release_date || details?.first_air_date;
    if (!date) return "";
    return new Date(date).getFullYear();
  }, [details]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [id]);

  useEffect(() => {
    if (!id || !type) return;

    fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=seasons`,
    )
      .then((res) => res.json())
      .then((data) => {
        setDetails(data);
        if (type === "tv" && data?.seasons?.length) {
          const firstSeason = data.seasons.find((s: any) => s.season_number > 0);
          if (firstSeason) {
            setSeason(firstSeason.season_number);
          }
        }
      })
      .catch(console.error);
  }, [id, type]);

  useEffect(() => {
    if (!id || !type) return;
    fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${TMDB_API_KEY}`)
      .then((res) => res.json())
      .then((data) => {
        setCast(data?.cast || []);
        setCrew(data?.crew || []);
      })
      .catch(console.error);
  }, [id, type]);

  useEffect(() => {
    if (!type) return;
    if (type === "tv") {
      setActiveTab("episodes");
    } else {
      setActiveTab("details");
    }
  }, [type]);

  const directors = crew.filter((person: any) => person.job === "Director");
  const directorNames = directors.length
    ? directors.map((person: any) => person.name).join(", ")
    : "-";

  const creators = details?.created_by?.length
    ? details.created_by.map((creator: any) => creator.name).join(", ")
    : "-";

  const runtimeLabel = details?.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : details?.episode_run_time?.[0]
      ? `${details.episode_run_time[0]}m`
      : "-";

  useEffect(() => {
    if (!id || !type) return;
    fetch(`https://api.themoviedb.org/3/${type}/${id}/similar?api_key=${TMDB_API_KEY}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.results) {
          setSimilar(data.results.filter((item: TMDBItem) => item.poster_path));
        }
      })
      .catch(console.error);
  }, [id, type]);

  useEffect(() => {
    if (!id || type !== "tv") return;
    setIsEpisodesLoading(true);
    fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`)
      .then((res) => res.json())
      .then((data) => {
        setEpisodes(data?.episodes || []);
      })
      .catch(console.error)
      .finally(() => setIsEpisodesLoading(false));
  }, [id, type, season]);

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="w-full max-w-[1400px] mx-auto flex flex-col gap-8 px-6 pb-16 pt-0 md:px-12">
        <section className="relative overflow-hidden min-h-[70vh]">
          <div className="absolute inset-0">
            {details?.backdrop_path && (
              <img
                src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
                alt="Backdrop"
                className="w-full h-full object-cover opacity-70"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col h-full min-h-[70vh] justify-end px-4 md:px-12 pb-8 md:pb-12 pt-20 md:pt-28">
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 md:top-8 left-4 md:left-12 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors z-20 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="hidden md:block flex-shrink-0">
                {details?.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                    alt="Poster"
                    className="w-[200px] h-[300px] object-cover rounded-xl shadow-2xl border border-white/10"
                  />
                )}
              </div>

              <div className="flex flex-col gap-3 pt-2">
                {(details?.tagline || (id && POPULAR_TAGLINES[id])) ? (
                  <p className="text-red-500 text-sm font-semibold italic">
                    "{details?.tagline || POPULAR_TAGLINES[id!]}"
                  </p>
                ) : null}

                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight break-words">{title}</h1>

                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                  {details?.vote_average ? (
                    <span className="text-yellow-400 font-bold flex items-center gap-1">
                      ★ {details.vote_average.toFixed(1)}
                    </span>
                  ) : null}
                  {details?.vote_average && year ? <span className="text-zinc-600">|</span> : null}
                  {year ? <span className="text-zinc-300">{year}</span> : null}
                  {type === "movie" && details?.runtime ? (
                    <>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-300 flex items-center gap-1">
                        <Clock size={13} />
                        {runtimeLabel}
                      </span>
                    </>
                  ) : null}
                  {type === "tv" && details?.number_of_seasons ? (
                    <>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-300">
                        {details.number_of_seasons} Season{details.number_of_seasons > 1 ? "s" : ""}
                      </span>
                    </>
                  ) : null}
                  {details?.status ? (
                    <>
                      <span className="text-zinc-600">|</span>
                      <span className="uppercase text-[11px] tracking-wider bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-400">
                        {details.status}
                      </span>
                    </>
                  ) : null}
                </div>

                {details?.genres?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {details.genres.slice(0, 4).map((genre: any) => (
                      <span
                        key={genre.id}
                        className="text-xs px-3 py-1.5 rounded-md bg-zinc-800/80 text-zinc-200 font-medium"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                {details?.overview && (
                  <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl">
                    {details.overview}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 w-full sm:w-auto">
                  <Button
                    onClick={() => navigate(`/play/${type}/${id}?s=${season}&e=1`)}
                    className="bg-white text-black px-7 py-5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-100 shadow-md shadow-black/30 hover:shadow-lg transition-all hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <Play fill="currentColor" size={18} />
                    Watch
                  </Button>
                  <Button
                    onClick={() => handleOpenDownloadModal()}
                    className={`px-7 py-5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-md w-full sm:w-auto ${isMovieDownloaded
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800"
                      }`}
                  >
                    {isMovieDownloaded ? <Check size={18} /> : <Download size={18} />}
                    {isMovieDownloaded ? "Downloaded" : "Download"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-6 border-b border-zinc-900 text-sm">
          {type === "tv" && (
            <button
              onClick={() => setActiveTab("episodes")}
              className={`pb-3 ${activeTab === "episodes" ? "border-b-2 border-red-500 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Episodes
            </button>
          )}
          <button
            onClick={() => setActiveTab("similar")}
            className={`pb-3 ${activeTab === "similar" ? "border-b-2 border-red-500 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            More Like This
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 ${activeTab === "details" ? "border-b-2 border-red-500 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Details & Cast
          </button>
        </section>

        <section
          className={`flex flex-col gap-4 transition-opacity duration-300 ${activeTab === "episodes" ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
            }`}
        >
          {type === "tv" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-semibold">Episodes</h3>
              {details?.seasons && (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Grid / List Layout Toggle */}
                  <div className="flex items-center bg-zinc-900/80 border border-zinc-800/85 rounded-full p-1">
                    <button
                      type="button"
                      onClick={() => handleSetLayout("grid")}
                      className={`p-1.5 rounded-full transition-all duration-200 ${episodeLayout === "grid"
                        ? "bg-red-600 text-white shadow-md shadow-red-600/25"
                        : "text-zinc-400 hover:text-zinc-250"
                        }`}
                      title="Grid View"
                    >
                      <Grid size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetLayout("list")}
                      className={`p-1.5 rounded-full transition-all duration-200 ${episodeLayout === "list"
                        ? "bg-red-600 text-white shadow-md shadow-red-600/25"
                        : "text-zinc-400 hover:text-zinc-250"
                        }`}
                      title="List View"
                    >
                      <List size={15} />
                    </button>
                  </div>

                  <Select
                    value={String(season)}
                    onValueChange={(val) => {
                      setSeason(Number(val));
                    }}
                  >
                    <SelectTrigger className="w-36 bg-black/60 border-zinc-800 rounded-full focus:ring-red-650 text-white font-semibold">
                      <SelectValue placeholder="Select Season" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {details.seasons
                        .filter((s: any) => s.season_number > 0)
                        .map((s: any) => (
                          <SelectItem
                            key={s.id}
                            value={String(s.season_number)}
                            className="focus:bg-red-900/30 focus:text-white cursor-pointer"
                          >
                            Season {s.season_number}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {type === "tv" && (
            <>
              {isEpisodesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
                </div>
              ) : episodes.length === 0 ? (
                <div className="text-zinc-500 py-8 text-center">No episodes available for this season.</div>
              ) : episodeLayout === "grid" ? (
                /* Responsive Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {episodes.map((episodeItem) => {
                    const epKey = `${type}_${id}_s${season}_e${episodeItem.episode_number}`;
                    const isEpDownloaded = downloadedItems.includes(epKey);

                    return (
                      <div
                        key={episodeItem.id}
                        onClick={() => navigate(`/play/${type}/${id}?s=${season}&e=${episodeItem.episode_number}`)}
                        className="group flex flex-col bg-zinc-900/20 hover:bg-zinc-800/30 border border-zinc-900 hover:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.6)] cursor-pointer"
                      >
                        {/* Thumbnail */}
                        <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden border-b border-zinc-900 flex-shrink-0">
                          {episodeItem.still_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${episodeItem.still_path}`}
                              alt={episodeItem.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900/40">
                              <Tv size={32} className="stroke-[1.5]" />
                            </div>
                          )}

                          {/* Hover Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-305 hover:bg-red-700 hover:scale-105">
                              <Play className="ml-1" fill="currentColor" size={20} />
                            </div>
                          </div>

                          {/* Episode Number Badge (Top-Left) */}
                          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-500 border border-zinc-800/80 tracking-wider">
                            EP {episodeItem.episode_number}
                          </div>

                          {/* Download Button (Top-Right) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDownloadModal({
                                type: "episode",
                                season,
                                episode: episodeItem.episode_number,
                                name: episodeItem.name,
                                still_path: episodeItem.still_path
                              });
                            }}
                            className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-md transition-all duration-200 border ${isEpDownloaded
                              ? "bg-green-600/95 border-green-500 text-white"
                              : "bg-black/75 border-zinc-800 text-zinc-300 hover:border-red-500 hover:text-red-500 hover:bg-red-600/10"
                              }`}
                            title={isEpDownloaded ? "Downloaded (Click to Manage)" : "Download Episode"}
                          >
                            {isEpDownloaded ? <Check size={13} strokeWidth={2.5} /> : <Download size={13} />}
                          </button>

                          {/* Runtime Overlay (Bottom-Right) */}
                          {episodeItem.runtime ? (
                            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-zinc-305 font-medium border border-zinc-800/80">
                              <Clock size={10} className="text-red-500" />
                              {episodeItem.runtime} min
                            </div>
                          ) : null}
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-grow gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                            {episodeItem.name}
                          </h4>

                          {/* Badges / Air Date */}
                          <div className="flex items-center gap-2">
                            {episodeItem.air_date ? (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-405 bg-zinc-950 border border-zinc-800/80 px-2 py-0.5 rounded-md">
                                <Calendar size={10} className="text-red-500" />
                                {new Date(episodeItem.air_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            ) : null}
                            {isEpDownloaded && (
                              <span className="text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                Offline
                              </span>
                            )}
                          </div>

                          {/* Episode Description */}
                          {episodeItem.overview ? (
                            <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mt-1 flex-grow">
                              {episodeItem.overview}
                            </p>
                          ) : (
                            <p className="text-zinc-600 text-xs italic mt-1 flex-grow">
                              No description available.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Improved List Layout */
                <div className="flex flex-col gap-3">
                  {episodes.map((episodeItem) => {
                    const epKey = `${type}_${id}_s${season}_e${episodeItem.episode_number}`;
                    const isEpDownloaded = downloadedItems.includes(epKey);

                    return (
                      <div
                        key={episodeItem.id}
                        onClick={() => navigate(`/play/${type}/${id}?s=${season}&e=${episodeItem.episode_number}`)}
                        className="group flex flex-col sm:flex-row sm:items-start gap-5 bg-zinc-900/30 hover:bg-zinc-800/40 border border-zinc-900 hover:border-zinc-800/80 rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:shadow-lg"
                      >
                        {/* Episode Number */}
                        <span className="hidden sm:flex text-zinc-505 text-lg font-bold w-6 text-center justify-center items-center self-center flex-shrink-0">
                          {episodeItem.episode_number}
                        </span>

                        {/* Thumbnail */}
                        <div className="w-full sm:w-48 md:w-56 aspect-video rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0 relative border border-zinc-900">
                          {episodeItem.still_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w300${episodeItem.still_path}`}
                              alt={episodeItem.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900/40">
                              <Tv size={24} className="stroke-[1.5]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                            <div className="w-10 h-10 rounded-full border border-white bg-black/60 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                              <Play className="text-white ml-0.5" fill="currentColor" size={14} />
                            </div>
                          </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="sm:hidden text-red-500 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded">
                              EP {episodeItem.episode_number}
                            </span>
                            <h4 className="text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                              {episodeItem.name}
                            </h4>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {episodeItem.runtime ? (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-0.5 rounded-md">
                                <Clock size={10.5} className="text-red-500" />
                                {episodeItem.runtime} min
                              </span>
                            ) : null}
                            {episodeItem.air_date ? (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-0.5 rounded-md">
                                <Calendar size={10.5} className="text-red-500" />
                                {new Date(episodeItem.air_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            ) : null}
                            {isEpDownloaded && (
                              <span className="text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Downloaded
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {episodeItem.overview ? (
                            <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mt-1 max-w-3xl">
                              {episodeItem.overview}
                            </p>
                          ) : (
                            <p className="text-zinc-600 text-xs italic mt-1">
                              No description available for this episode.
                            </p>
                          )}
                        </div>

                        {/* Actions (right side) */}
                        <div className="flex items-center justify-end gap-2 flex-shrink-0 pt-3 sm:pt-0 border-t border-zinc-900 sm:border-t-0 self-center">
                          {/* Watch Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/play/${type}/${id}?s=${season}&e=${episodeItem.episode_number}`);
                            }}
                            className="p-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-zinc-850 hover:border-zinc-700"
                            title="Watch Episode"
                          >
                            <Play size={15} fill="currentColor" />
                          </button>

                          {/* Download Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDownloadModal({
                                type: "episode",
                                season,
                                episode: episodeItem.episode_number,
                                name: episodeItem.name,
                                still_path: episodeItem.still_path
                              });
                            }}
                            className={`p-3 rounded-full border transition-all ${isEpDownloaded
                              ? "bg-green-600/15 border-green-500/40 text-green-500 hover:bg-green-600 hover:text-white"
                              : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-red-500 hover:text-red-500 hover:bg-red-600/10"
                              }`}
                            title={isEpDownloaded ? "Downloaded (Click to Manage)" : "Download Episode"}
                          >
                            {isEpDownloaded ? <Check size={15} strokeWidth={2.5} /> : <Download size={15} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <section
          className={`flex flex-col gap-4 transition-opacity duration-300 ${activeTab === "similar" ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
            }`}
        >
          <h3 className="text-xl font-semibold">More Like This</h3>
          {similar.length === 0 ? (
            <div className="text-zinc-500">No recommendations yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {similar.map((item) => (
                <Link
                  key={item.id}
                  to={`/title/${item.media_type || type}/${item.id}`}
                  className="relative rounded-md overflow-hidden transition duration-300 hover:scale-[1.03] z-0 hover:z-10 bg-zinc-900 group/grid shadow-lg"
                >
                  <div className="aspect-[2/3] w-full">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center opacity-0 group-hover/grid:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/100 to-transparent">
                    <h3 className="font-bold text-sm text-white drop-shadow-md">
                      {item.title || item.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section
          className={`flex flex-col gap-6 transition-opacity duration-300 ${activeTab === "details" ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
            }`}
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Cast</h3>
            {cast.length === 0 ? (
              <div className="text-zinc-500">No cast data.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                {cast.slice(0, 12).map((member) => (
                  <div key={member.id} className="flex flex-col items-center text-center gap-2">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                      {member.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="text-sm font-semibold text-white truncate w-full">
                      {member.name}
                    </div>
                    <div className="text-xs text-zinc-400 truncate w-full">
                      {member.character}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <h3 className="text-xl font-semibold">Information</h3>
            {type === "tv" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 text-sm text-zinc-300 mt-4">
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Created By</div>
                  <div>{creators}</div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Release Year</div>
                  <div>{year || "-"}</div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Status</div>
                  <div>{details?.status || "-"}</div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Genres</div>
                  <div>
                    {details?.genres?.length
                      ? details.genres.map((genre: any) => genre.name).join(" · ")
                      : "-"}
                  </div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Episodes</div>
                  <div>
                    {details?.number_of_episodes
                      ? `${details.number_of_episodes} across ${details.number_of_seasons || 1} season(s)`
                      : "-"}
                  </div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Network</div>
                  <div>{details?.networks?.[0]?.name || "-"}</div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Production</div>
                  <div>
                    {details?.production_companies?.length
                      ? details.production_companies.slice(0, 3).map((c: any) => c.name).join(", ")
                      : "-"}
                  </div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Homepage</div>
                  <div>
                    {details?.homepage ? (
                      <a
                        href={details.homepage}
                        className="text-red-400 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit site
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 text-sm text-zinc-300 mt-4">
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Director</div>
                  <div>{directorNames}</div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Release Year</div>
                  <div>{year || "-"}</div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Status</div>
                  <div>{details?.status || "-"}</div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Genres</div>
                  <div>
                    {details?.genres?.length
                      ? details.genres.map((genre: any) => genre.name).join(" · ")
                      : "-"}
                  </div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Runtime</div>
                  <div>{runtimeLabel}</div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Budget</div>
                  <div>
                    {typeof details?.budget === "number" && details.budget > 0
                      ? `$${details.budget.toLocaleString()}`
                      : "-"}
                  </div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Revenue</div>
                  <div>
                    {typeof details?.revenue === "number" && details.revenue > 0
                      ? `$${details.revenue.toLocaleString()}`
                      : "-"}
                  </div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Production</div>
                  <div>
                    {details?.production_companies?.length
                      ? details.production_companies.slice(0, 3).map((c: any) => c.name).join(", ")
                      : "-"}
                  </div>
                </div>
                <div className="border-b border-zinc-800/60 py-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Homepage</div>
                  <div>
                    {details?.homepage ? (
                      <a
                        href={details.homepage}
                        className="text-red-400 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit site
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Download Modal */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 rounded-[2rem] overflow-y-auto shadow-[0_0_50px_rgba(220,38,38,0.05)] p-6 sm:p-8 sm:max-w-[750px] md:max-w-[900px] !flex !flex-col max-h-[88vh] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent animate-in zoom-in-95 duration-300">
          <DialogClose className="absolute right-6 top-6 z-[100] rounded-full w-8 h-8 flex items-center justify-center bg-black/60 text-white hover:bg-black ring-2 ring-red-500/50 transition-all border border-red-500/30 hover:text-red-500 cursor-pointer shadow-xl">
            <X size={16} strokeWidth={3} />
            <span className="sr-only">Close</span>
          </DialogClose>

          {/* Matches State */}
          {downloadState === "matches" && searchMatches.length > 0 && (
            <div className="flex flex-col gap-4 relative">
              <div className="border-b border-zinc-800 pb-3 pr-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Download size={18} className="text-red-500" />
                  Download
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{title} ({year})</p>
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1.5 mb-1">
                <span><Film size={12} /></span>
                <span>{searchMatches.length} VERSIONS FOUND</span>
              </div>
              <div className="flex flex-col gap-2">
                {searchMatches.map((match: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => type === "tv" ? selectTvMatch(match.subjectId) : selectMovieMatch(match.subjectId)}
                    className={`group flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 text-left ${match.hasResource ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.05)]" : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50"}`}
                  >
                    {match.cover?.url || match.subject?.cover?.url ? (
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md">
                        <img src={match.cover?.url || match.subject?.cover?.url} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Film size={20} className="text-zinc-600" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                        {match.title || match.subject?.title}
                      </div>
                      <div className="flex items-center gap-3">
                        {match.hasResource && (
                          <span className="text-[9px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                            Original
                          </span>
                        )}
                        {(match.imdbRatingValue || match.subject?.imdbRatingValue) && (
                          <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
                            ★ {match.imdbRatingValue || match.subject?.imdbRatingValue}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-zinc-500 group-hover:text-red-500 transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TV Show Sources Accordion State */}
          {type === "tv" && downloadState === "sources" && tvSeasonData ? (
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="border-b border-zinc-800 pb-3 pr-8 flex flex-col gap-1 flex-shrink-0">
                <div className="flex items-center gap-2 text-red-500">
                  <Download size={18} />
                  <h3 className="text-lg font-bold text-white">Download</h3>
                </div>
                <p className="text-xs text-zinc-400">
                  {details?.title || details?.name || "Loading..."} • Season {activeSeason}
                </p>
              </div>

              {/* Dropdowns / Selectors */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Season Dropdown */}
                {tvInfoData?.seasons && (
                  <Select
                    value={String(activeSeason)}
                    onValueChange={(val) => {
                      const newSeason = Number(val);
                      setActiveSeason(newSeason);
                      fetchTvDownloadData(activeDubSubjectId || resolvedSubjectId || "", newSeason, true);
                    }}
                  >
                    <SelectTrigger className="w-32 sm:w-40 bg-zinc-900 border-zinc-800 rounded-xl focus:ring-red-500 text-white font-semibold h-10 transition-colors hover:bg-zinc-800">
                      <SelectValue placeholder="Select Season" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white shadow-2xl rounded-xl overflow-hidden">
                      {tvInfoData.seasons.map((s: any) => (
                        <SelectItem
                          key={s.se}
                          value={String(s.se)}
                          className="focus:bg-red-600/20 focus:text-white cursor-pointer py-2.5 transition-colors"
                        >
                          Season {s.se}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Dub/Language Dropdown */}
                {tvInfoData?.dubs && (
                  <Select
                    value={activeDubSubjectId || resolvedSubjectId || ""}
                    onValueChange={(val) => {
                      setActiveDubSubjectId(val);
                      fetchTvDownloadData(val, activeSeason, true);
                    }}
                  >
                    <SelectTrigger className="w-40 sm:w-48 bg-zinc-900 border-zinc-800 rounded-xl focus:ring-red-500 text-white font-semibold h-10 transition-colors hover:bg-zinc-800">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white shadow-2xl rounded-xl overflow-hidden">
                      {tvInfoData.dubs.map((d: any) => {
                        const displayName = d.lanName.replace(/\s*(?:Audio|dub|Dub)\s*/gi, "");
                        return (
                          <SelectItem
                            key={d.subjectId}
                            value={d.subjectId}
                            className="focus:bg-red-600/20 focus:text-white cursor-pointer py-2.5 transition-colors"
                          >
                            {displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Episode List Accordion */}
              <div className="flex flex-col gap-1.5 flex-shrink-0 text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-2">
                {tvSeasonData.episodes ? `${tvSeasonData.episodes.length} EPISODES` : "0 EPISODES"}
              </div>

              <div className="flex flex-col gap-2 pr-1 pointer-events-auto">
                {tvSeasonData.episodes && tvSeasonData.episodes.length > 0 ? (
                  tvSeasonData.episodes.map((ep: any, index: number) => {
                    const epNum = ep.episode || ep.episode_number || ep.episodeId || ep.id || (index + 1);
                    const isExpanded = expandedEpisodeNumber === epNum;
                    const epKey = `${type}_${id}_s${activeSeason}_e${epNum}`;
                    const isDownloadedEp = downloadedItems.includes(epKey);

                    // Calculate max quality and size range
                    let maxQuality = "";
                    let sizeStr = "";
                    if (ep.sources && ep.sources.length > 0) {
                      const qualities = ep.sources.map((s: any) => Number(s.quality) || 0);
                      const maxQ = Math.max(...qualities);
                      if (maxQ >= 1080) maxQuality = "1080p";
                      else if (maxQ >= 720) maxQuality = "720p";
                      else if (maxQ > 0) maxQuality = `${maxQ}p`;

                      const sizes = ep.sources.map((s: any) => Number(s.size) || 0).filter((s: number) => s > 0);
                      if (sizes.length > 0) {
                        const maxSize = Math.max(...sizes);
                        sizeStr = ` • up to ${formatFileSize(maxSize)}`;
                      }
                    }

                    const subtitle = maxQuality ? `${maxQuality}${sizeStr}` : "SD";

                    return (
                      <div
                        key={epNum}
                        className="flex flex-col rounded-xl bg-zinc-900/30 border border-zinc-900 overflow-hidden hover:border-zinc-850 hover:bg-zinc-900/50 transition-all duration-200"
                      >
                        {/* Episode Card Header Toggle */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedEpisodeNumber(isExpanded ? null : epNum);
                          }}
                          className="flex items-center justify-between p-3.5 text-left transition-colors hover:bg-zinc-900/20 w-full cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="flex items-center justify-center text-white text-xs font-black bg-red-600 w-8 h-8 rounded-lg flex-shrink-0 shadow-md shadow-red-650/15">
                              {epNum}
                            </span>
                            <div className="flex flex-col min-w-0 gap-0.5">
                              <span className="text-sm font-bold text-white truncate">
                                Episode {epNum}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-medium">
                                {subtitle}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isDownloadedEp && (
                              <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Check size={10} strokeWidth={3} />
                                Available Offline
                              </span>
                            )}
                            <span className="text-zinc-500">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </span>
                          </div>
                        </button>

                        {/* Expanded Download Options */}
                        {isExpanded && (
                          <div className="p-4 bg-zinc-950/40 border-t border-zinc-900 flex flex-col gap-3">
                            {ep.sources && ep.sources.length > 0 ? (
                              ep.sources.map((source: any, sIdx: number) => {
                                const formatLabel = source.format?.toUpperCase() || "MP4";
                                const qualityVal = Number(source.quality) || 480;
                                const sizeLabel = source.size ? formatFileSize(source.size) : "Unknown size";

                                return (
                                  <div
                                    key={sIdx}
                                    className="flex items-center gap-3.5"
                                  >
                                      {/* Quality Badge aligned vertically with Episode Badge */}
                                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                                        {qualityVal}p
                                      </div>

                                      {/* Info container aligned vertically with Episode Title */}
                                      <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-xs font-bold text-white">
                                          {qualityVal >= 720 ? "HD" : "SD"} - {formatLabel}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                          {sizeLabel} • {source.language || "Original"}
                                        </span>
                                      </div>

                                      {/* Action button aligned vertically with Chevron */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDownloadClick(source.url, {
                                            type: "episode",
                                            season: activeSeason,
                                            episode: epNum
                                          });
                                        }}
                                        className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-md shadow-red-600/10 cursor-pointer ml-auto flex-shrink-0"
                                      >
                                        <Download size={13} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  );
                              })
                            ) : (
                              <div className="text-zinc-500 text-xs py-2 text-center">
                                No download links available for this episode.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-zinc-500 py-12 text-center">No episodes found.</div>
                )}
              </div>
            </div>
          ) : (
            // Original rendering logic for Movie / Idle / Fetching states
            <>
              {/* Idle / Error State */}
              {downloadState === "idle" && (
                <div className="flex flex-col gap-5">
                  {downloadError && (
                    <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold">Failed to fetch sources</span>
                        <span className="text-[11px] text-red-400/80">{downloadError}</span>
                      </div>
                    </div>
                  )}

                  <div className="border-b border-zinc-800 pb-3 pr-8">
                    <h3 className="text-lg font-bold text-white">Download Failed</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {type === "movie" ? `Movie: ${title}` : `TV: ${title}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <DialogClose className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold py-3 px-4 rounded-xl border border-zinc-850 text-sm transition-all">
                      Cancel
                    </DialogClose>
                    <button
                      onClick={() => fetchDownloadLinks(downloadTarget)}
                      className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all"
                    >
                      <Download size={16} />
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Fetching State — Loading Spinner */}
              {downloadState === "fetching" && (
                <div className="flex flex-col items-center justify-center py-16 gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-[3px] border-zinc-800"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin m-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Download size={20} className="text-red-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <h3 className="text-base font-bold text-white">Fetching Download Sources</h3>
                    <p className="text-xs text-zinc-500 max-w-xs text-center">
                      Searching for available download links for{" "}
                      <span className="text-zinc-300 font-medium">
                        {title}
                      </span>
                      ...
                    </p>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              )}

              {/* Movie Sources State — Show download links from API */}
              {downloadState === "sources" && downloadSources && (
                <div className="flex flex-col gap-4">
                  <div className="border-b border-zinc-800 pb-3 pr-8">
                    <h3 className="text-lg font-bold text-white">Available Downloads</h3>
                    <p className="text-xs text-zinc-400 mt-1">Movie: {title}</p>
                  </div>

                  <div className="flex flex-col gap-2 pr-1">
                    {(() => {
                      const sourcesToShow = downloadSources.sources || [];

                      if (sourcesToShow.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                            <AlertCircle size={32} className="text-zinc-600" />
                            <div>
                              <p className="text-sm font-semibold text-zinc-400">No sources found</p>
                              <p className="text-xs text-zinc-600 mt-1">No download links are available for this movie right now.</p>
                            </div>
                          </div>
                        );
                      }

                      return sourcesToShow.map((source: any, idx: number) => {
                        const qualityVal = Number(source.quality) || 480;
                        const qualityLabel = qualityVal >= 1080 ? "Full HD" : qualityVal >= 720 ? "HD" : qualityVal >= 480 ? "SD" : "Low";
                        const formatLabel = source.format?.toUpperCase() || "MP4";
                        const sizeLabel = source.size ? formatFileSize(source.size) : "Unknown size";

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 transition-colors group"
                          >
                            {/* Quality Badge aligned to the left */}
                            <div className="w-12 h-8 rounded bg-red-600 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 shadow-[0_2px_10px_rgba(220,38,38,0.2)]">
                              {source.quality}p
                            </div>

                            {/* Info container */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                              <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                                {qualityLabel} · {formatLabel}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-medium tracking-wide">
                                {sizeLabel} · {source.language || "Original"}
                              </div>
                            </div>

                            {/* Download Button */}
                            <button
                              onClick={() => handleDownloadClick(source.url, downloadTarget)}
                              className="w-10 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center transition-all shadow-md shadow-red-600/20 cursor-pointer flex-shrink-0 ml-auto"
                            >
                              <Download size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}


            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
