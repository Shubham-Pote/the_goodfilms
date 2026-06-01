import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, Info, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { TMDB_API_KEY } from "@/lib/tmdb";

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  media_type?: "movie" | "tv" | "anime";
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  // extra fields for continue watching
  progress?: number;
  duration?: number;
  season?: number;
  episode?: number;
}

const GENRES = [
  { id: "all", name: "All Genres" },
  { id: "28", name: "Action" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "99", name: "Documentary" },
  { id: "27", name: "Horror" },
  { id: "10749", name: "Romance" },
  { id: "878", name: "Sci-Fi" },
  { id: "53", name: "Thriller" },
];

const CATEGORIES = [
  { title: "Trending Now", endpoint: "/trending/all/day", mediaType: "movie" },
  { title: "Latest Release", endpoint: "/movie/now_playing", mediaType: "movie" },
  { title: "Popular Movies", endpoint: "/movie/popular", mediaType: "movie" },
  { title: "Top Rated", endpoint: "/movie/top_rated", mediaType: "movie" },
  { title: "Popular TV Shows", endpoint: "/tv/popular", mediaType: "tv" },
  { title: "Action & Adventure", endpoint: "/discover/movie?with_genres=28,12", mediaType: "movie" },
  { title: "Comedy", endpoint: "/discover/movie?with_genres=35", mediaType: "movie" },
  { title: "Crime TV", endpoint: "/discover/tv?with_genres=80", mediaType: "tv" },
  { title: "Animation", endpoint: "/discover/movie?with_genres=16", mediaType: "movie" },
  { title: "Horror", endpoint: "/discover/movie?with_genres=27", mediaType: "movie" },
  { title: "Romance", endpoint: "/discover/movie?with_genres=10749", mediaType: "movie" },
  { title: "Documentaries", endpoint: "/discover/movie?with_genres=99", mediaType: "movie" },
  { title: "Mystery & Thriller", endpoint: "/discover/movie?with_genres=9648,53", mediaType: "movie" },
  { title: "Sci-Fi & Fantasy", endpoint: "/discover/movie?with_genres=878,14", mediaType: "movie" },
  { title: "Family", endpoint: "/discover/movie?with_genres=10751", mediaType: "movie" },
];

function FeaturedHero() {
  const [featured, setFeatured] = useState<TMDBItem | null>(null);

  useEffect(() => {
    // Fetch trending.
    fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        const results = data.results.filter((item: any) => item.backdrop_path);
        // Pick a random trending item on each reload
        const randomItem = results[Math.floor(Math.random() * results.length)];
        setFeatured(randomItem);
      })
      .catch(err => console.error("Failed to load featured:", err));
  }, []);

  if (!featured) return <div className="h-[70vh] animate-pulse bg-zinc-900 w-full mb-12"></div>;

  const isTV = featured.media_type === "tv" || !featured.title;
  const title = featured.title || featured.name;

  return (
    <div className="relative h-[82vh] w-full">
      <div className="absolute inset-0">
        <img
          src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
          alt={title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col justify-end px-4 md:px-12 pb-20 md:pb-28 max-w-5xl">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg uppercase tracking-wider">
            FEATURED {isTV ? "SERIES" : "FILM"}
          </span>
          <span className="text-zinc-300 text-sm font-medium">
            {new Date(featured.release_date || featured.first_air_date || 0).getFullYear() || ""}
          </span>
          <span className="text-yellow-500 text-sm flex items-center gap-1 font-bold">
            ★ {featured.vote_average?.toFixed(1)}
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-5 drop-shadow-2xl leading-[1.05] break-words line-clamp-3">
          {title}
        </h1>

        <p className="text-base md:text-xl text-zinc-300 mb-8 line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-md">
          {featured.overview}
        </p>

        <div className="flex items-center gap-2">
          <Link to={`/play/${featured.media_type || (isTV ? "tv" : "movie")}/${featured.id}${isTV ? "?s=1&e=1" : ""}`}>
            <Button className="bg-white text-black px-6 py-5 rounded-full text-sm md:text-base font-semibold flex items-center gap-2 shadow-md shadow-black/30 hover:bg-zinc-100 hover:shadow-lg hover:shadow-black/40 transition-all hover:-translate-y-0.5">
              <Play fill="currentColor" size={20} />
              Watch
            </Button>
          </Link>
          <Link to={`/title/${featured.media_type || (isTV ? "tv" : "movie")}/${featured.id}`}>
            <Button className="bg-white/5 text-white px-5 py-5 rounded-full text-sm md:text-base font-medium flex items-center gap-2 border border-white/20 hover:bg-white/15 hover:border-white/35 transition-all hover:-translate-y-0.5">
              <Info size={18} />
              Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ContinueWatchingRow() {
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        let historyData: any[] = [];

        try {
          if (token && token !== "null" && token !== "undefined") {
            const res = await fetch("http://localhost:8080/api/movies/progress", {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
              const data = await res.json();
              if (data.history) {
                historyData = data.history;
              }
            }
          } else {
            const localStr = localStorage.getItem("video_progress_guest");
            if (localStr) {
              const localObj = JSON.parse(localStr);
              historyData = Object.values(localObj);
            }
          }
        } catch (fetchErr) {
          console.warn("Could not fetch progress from server, backend might be offline.");
        }

        if (historyData.length === 0) {
          setItems([]);
          setIsLoading(false);
          return;
        }

        historyData.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.timestamp || 0).getTime();
          const timeB = new Date(b.updatedAt || b.timestamp || 0).getTime();
          return timeB - timeA;
        });

        const recentHistory = historyData.slice(0, 10);

        const detailedItems = await Promise.all(
          recentHistory.map(async (item: any) => {
            const tmdbType = (item.contentType === "anime" || item.contentType === "tv") ? "tv" : "movie";
            const contentId = item.contentId || item.id;
            if (!contentId) return null;

            const tmdbRes = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${contentId}?api_key=${TMDB_API_KEY}`);
            if (!tmdbRes.ok) return null;

            const tmdbData = await tmdbRes.json();
            return {
              ...tmdbData,
              title: tmdbData.title || tmdbData.name,
              media_type: item.contentType || "movie",
              progress: item.progress || item.timestamp,
              duration: item.duration,
              season: item.season,
              episode: item.episode,
              timestamp: item.timestamp,
            };
          })
        );

        const validItems = detailedItems.filter(Boolean) as TMDBItem[];
        setItems(validItems);

      } catch (err) {
        console.error("Failed to load continue watching:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleRemoveProgress = async (e: React.MouseEvent, item: TMDBItem) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    try {
      if (token && token !== "null" && token !== "undefined") {
        await fetch("http://localhost:8080/api/movies/progress", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            contentId: String(item.id),
            contentType: item.media_type,
            season: item.season,
            episode: item.episode
          })
        });
      } else {
        const localKey = "video_progress_guest";
        const existingStr = localStorage.getItem(localKey);
        if (existingStr) {
          const existing = JSON.parse(existingStr);
          let progressKey = `${item.media_type}_${item.id}`;
          if (item.media_type === "tv") {
            progressKey += `_s${item.season}_e${item.episode}`;
          }
          delete existing[progressKey];
          localStorage.setItem(localKey, JSON.stringify(existing));
        }
      }

      setItems((prev) =>
        prev.filter(
          (i) =>
            !(
              i.id === item.id &&
              i.media_type === item.media_type &&
              i.season === item.season &&
              i.episode === item.episode
            )
        )
      );
    } catch (err) {
      console.error("Failed to remove progress:", err);
    }
  };

  if (!isLoading && items.length === 0) {
    return (
      <div className="mb-12 w-full px-4 md:px-12">
        <h2 className="text-2xl font-bold mb-4 text-white/90">Continue Watching</h2>
        <div className="flex items-center justify-center h-40 bg-zinc-900/40 rounded-xl border border-white/5">
          <p className="text-zinc-500 text-sm font-medium">You don't have any active shows or movies to continue.</p>
        </div>
      </div>
    );
  }

  const scrollLeft = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: -window.innerWidth / 2, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: window.innerWidth / 2, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-12 w-full relative">
      <h2 className="text-2xl font-bold mb-4 px-4 md:px-12 text-white/90">Continue Watching</h2>

      {isLoading ? (
        <div className="flex px-4 md:px-12 gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-none w-72 aspect-video bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="relative group px-4 md:px-12">
          {/* Left Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Row container */}
          <div
            ref={rowRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item, idx) => {
              // Usually progress is in seconds. Let's calculate percentage if duration exists
              const percent = item.duration ? Math.min(100, Math.max(0, (item.progress! / item.duration) * 100)) : 0;

              return (
                <Link
                  key={`${item.id}-${idx}`}
                  to={`/play/${item.media_type}/${item.id}${(item.media_type === "tv" || item.media_type === "anime") ? `?s=${item.season || 1}&e=${item.episode || 1}` : ""}`}
                  className="flex-none w-72 relative rounded-md overflow-hidden transition duration-300 hover:scale-[1.03] z-0 hover:z-10 group/item shadow-lg"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleRemoveProgress(e, item)}
                    className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors opacity-0 group-hover/item:opacity-100 shadow-md"
                    title="Remove from Continue Watching"
                  >
                    <X size={14} />
                  </button>

                  <div className="aspect-video w-full relative bg-[#141414]">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.backdrop_path || item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity bg-black/40">
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-black/40 flex items-center justify-center shadow-lg hover:bg-white/20 transition-colors">
                        <Play className="text-white ml-0.5" fill="currentColor" size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Title block that slides up on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/80 to-transparent translate-y-full group-hover/item:translate-y-0 transition-transform duration-300 pointer-events-none">
                    <h3 className="font-bold text-sm mb-1 truncate text-white drop-shadow-md">
                      {item.title || item.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-300 font-medium tracking-wide drop-shadow-md">
                        {item.media_type === "tv" && item.season && item.episode ? (
                          `S${item.season} · E${item.episode}`
                        ) : (
                          new Date(item.release_date || item.first_air_date || 0).getFullYear() || "Movie"
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right Button */}
          <button
            onClick={scrollRight}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

function MovieRow({ title, endpoint, mediaType }: { title: string; endpoint: string; mediaType: string }) {
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    // Cache per row basis for 24 hours (86400000 ms) so it refreshes daily
    const CACHE_KEY = `tmdb_cache_${title.replace(/\s+/g, "_")}`;
    const CACHE_TTL = 24 * 60 * 60 * 1000;
    const cachedStr = localStorage.getItem(CACHE_KEY);

    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        if (Date.now() - cached.ts < CACHE_TTL) {
          setItems(cached.data);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // Ignore cache errors
      }
    }

    const url = `https://api.themoviedb.org/3${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.results) {
          const validItems = data.results.filter((i: any) => i.poster_path);
          setItems(validItems);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: validItems, ts: Date.now() }));
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [endpoint, title]);

  if (!isLoading && items.length === 0) return null;

  const scrollLeft = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: -window.innerWidth / 2, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: window.innerWidth / 2, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-12 w-full relative">
      <h2 className="text-2xl font-bold mb-4 px-4 md:px-12">{title}</h2>

      {isLoading ? (
        <div className="flex px-4 md:px-12 gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-48 aspect-[2/3] bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="relative group px-4 md:px-12">
          {/* Left Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Row container */}
          <div
            ref={rowRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pt-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                to={`/title/${item.media_type || mediaType}/${item.id}`}
                className="flex-none w-44 sm:w-48 relative rounded-md overflow-hidden transition duration-300 hover:scale-[1.03] z-0 hover:z-10 bg-zinc-900 group/grid shadow-lg"
              >
                <div className="aspect-[2/3] w-full">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                  />
                </div>
                {/* Slide up Title block on hover */}
                {/* Title shown only on hover */}
                <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center opacity-0 group-hover/grid:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/100 to-transparent">

                  <h3 className="font-bold text-sm text-white drop-shadow-md">
                    {item.title || item.name}
                  </h3>

                </div>
              </Link>
            ))}
          </div>

          {/* Right Button */}
          <button
            onClick={scrollRight}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

// Filter categories based on the active tab
const TV_CATEGORIES = [
  { title: "Popular TV Shows", endpoint: "/tv/popular", mediaType: "tv" },
  { title: "Top Rated TV", endpoint: "/tv/top_rated", mediaType: "tv" },
  { title: "Airing Today", endpoint: "/tv/airing_today", mediaType: "tv" },
  { title: "On The Air", endpoint: "/tv/on_the_air", mediaType: "tv" },
  { title: "Crime TV", endpoint: "/discover/tv?with_genres=80", mediaType: "tv" },
  { title: "Drama TV", endpoint: "/discover/tv?with_genres=18", mediaType: "tv" },
  { title: "Comedy TV", endpoint: "/discover/tv?with_genres=35", mediaType: "tv" },
  { title: "Sci-Fi & Fantasy TV", endpoint: "/discover/tv?with_genres=10765", mediaType: "tv" },
  { title: "Mystery TV", endpoint: "/discover/tv?with_genres=9648", mediaType: "tv" },
];

const MOVIE_CATEGORIES = [
  { title: "Popular Movies", endpoint: "/movie/popular", mediaType: "movie" },
  { title: "Top Rated Movies", endpoint: "/movie/top_rated", mediaType: "movie" },
  { title: "Now Playing", endpoint: "/movie/now_playing", mediaType: "movie" },
  { title: "Upcoming", endpoint: "/movie/upcoming", mediaType: "movie" },
  { title: "Action & Adventure", endpoint: "/discover/movie?with_genres=28,12", mediaType: "movie" },
  { title: "Comedy", endpoint: "/discover/movie?with_genres=35", mediaType: "movie" },
  { title: "Horror", endpoint: "/discover/movie?with_genres=27", mediaType: "movie" },
  { title: "Romance", endpoint: "/discover/movie?with_genres=10749", mediaType: "movie" },
  { title: "Sci-Fi & Fantasy", endpoint: "/discover/movie?with_genres=878,14", mediaType: "movie" },
  { title: "Mystery & Thriller", endpoint: "/discover/movie?with_genres=9648,53", mediaType: "movie" },
];

const ANIME_CATEGORIES = [
  { title: "Popular Anime", endpoint: "/discover/tv?with_genres=16&with_original_language=ja", mediaType: "tv" },
  { title: "Top Rated Anime", endpoint: "/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=100", mediaType: "tv" },
  { title: "Anime Movies", endpoint: "/discover/movie?with_genres=16&with_original_language=ja", mediaType: "movie" },
  { title: "Action Anime", endpoint: "/discover/tv?with_genres=16,10759&with_original_language=ja", mediaType: "tv" },
  { title: "Sci-Fi Anime", endpoint: "/discover/tv?with_genres=16,10765&with_original_language=ja", mediaType: "tv" },
  { title: "Comedy Anime", endpoint: "/discover/tv?with_genres=16,35&with_original_language=ja", mediaType: "tv" },
  { title: "Drama Anime", endpoint: "/discover/tv?with_genres=16,18&with_original_language=ja", mediaType: "tv" },
];

function getTabCategories(tab: string) {
  switch (tab) {
    case "tv":
      return TV_CATEGORIES;
    case "movies":
      return MOVIE_CATEGORIES;
    case "anime":
      return ANIME_CATEGORIES;
    default:
      return CATEGORIES;
  }
}

export function Landing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const genreParam = searchParams.get("genre") || "all";
  const activeTab = searchParams.get("tab") || "";

  const [selectedGenre, setSelectedGenre] = useState(genreParam);

  const [gridItems, setGridItems] = useState<TMDBItem[]>([]);
  const [isGridLoading, setIsGridLoading] = useState(false);

  const filteredCategories = getTabCategories(activeTab);

  useEffect(() => {
    setSelectedGenre(genreParam);
  }, [genreParam]);

  useEffect(() => {
    if (selectedGenre === "all") {
      setGridItems([]);
      return;
    }

    setIsGridLoading(true);
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${selectedGenre}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.results) {
          setGridItems(
            data.results.filter((i: any) => i.poster_path),
          );
        }
      })
      .catch(console.error)
      .finally(() => setIsGridLoading(false));
  }, [selectedGenre]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-x-hidden">
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>

      <main className="flex-1 w-full mx-auto pb-8 bg-black">
        {selectedGenre !== "all" ? (
          <div className="px-4 md:px-12 max-w-7xl mx-auto pt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">
                {`${GENRES.find(g => g.id === selectedGenre)?.name} Movies`}
              </h2>
              <Button variant="outline" onClick={() => { setSearchParams({ genre: "all" }); }} className="border-zinc-700 hover:bg-zinc-800">
                Clear Filter
              </Button>
            </div>

            {isGridLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : gridItems.length === 0 ? (
              <div className="text-center text-zinc-500 py-12">No results found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-2">
                {gridItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/title/${item.media_type || "movie"}/${item.id}`}
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
                      <h3 className="font-bold text-sm text-white drop-shadow-md truncate text-center w-full">
                        {item.title || item.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Only show hero and continue watching on Home tab */}
            {!activeTab && (
              <>
                <FeaturedHero />
                <ContinueWatchingRow />
              </>
            )}

            {/* Tab title for non-home tabs */}
            {activeTab && (
              <div className="px-4 md:px-12 pt-8">
                <h2 className="text-3xl font-bold capitalize">
                  {activeTab === "tv" ? "TV Shows" : activeTab === "anime" ? "Anime" : "Movies"}
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  {activeTab === "tv"
                    ? "Explore popular TV series, dramas, and more"
                    : activeTab === "anime"
                    ? "Discover the best Japanese animation"
                    : "Browse the latest and greatest films"}
                </p>
              </div>
            )}

            {filteredCategories.map(cat => (
              <MovieRow key={cat.title} {...cat} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
