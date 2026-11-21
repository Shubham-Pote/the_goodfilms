import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Film, Play, Star, X } from "lucide-react";
import gsap from "gsap";
import { FeaturedArtwork } from "@/components/FeaturedArtwork";
import { PosterLink } from "@/components/PosterLink";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "../components/ui/button";
import { TMDB_IMG, tmdbUrl, TMDB_API_KEY } from "@/lib/tmdb";

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
  const [titles, setTitles] = useState<TMDBItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const section = useRef<HTMLElement>(null);
  const featured = titles[activeIndex];

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]);
    setStatus("loading");
    fetch(tmdbUrl("/trending/all/day"), { signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Featured titles unavailable");
        const data = await response.json();
        const titles: TMDBItem[] = (data.results ?? []).filter((item: TMDBItem) =>
          item.backdrop_path && (item.title || item.name) && (item.media_type === "movie" || item.media_type === "tv"));
        if (!titles.length) throw new Error("Missing featured title");
        setTitles(titles.slice(0, 3));
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("unavailable");
      });

    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!featured || !section.current) return;
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline()
        .from(".featured-art", { opacity: 0.35, duration: 0.52, ease: "power2.out" })
        .from("[data-hero-copy]", { y: 8, opacity: 0.45, stagger: 0.035, duration: 0.34, ease: "power2.out" }, 0.04);
    }, section.current);
    return () => motion.revert();
  }, [featured]);

  if (!featured) return (
    <section className="feature-message" aria-labelledby="spotlight-title">
      <Film className="feature-placeholder-icon" strokeWidth={0.55} aria-hidden="true" />
      <p className="eyebrow">Spotlight</p>
      <h1 id="spotlight-title">Find your next watch</h1>
      <p className="feature-status" role="status">{status === "loading" ? "Loading featured titles…" : "Featured titles couldn’t load."}</p>
      <div className="feature-actions">
        <Button asChild><Link to="/search">Search titles <ArrowRight size={16} /></Link></Button>
        {status === "unavailable" && <Button variant="outline" onClick={() => setAttempt(attempt + 1)}>Try again</Button>}
      </div>
    </section>
  );

  const type = featured.media_type || "movie";
  const title = featured.title || featured.name || "Untitled";
  const year = (featured.release_date || featured.first_air_date)?.slice(0, 4);

  return (
    <section ref={section} className="spotlight" aria-label="Spotlight">
      <div className="featured">
        <FeaturedArtwork key={`${type}-${featured.id}`} src={`${TMDB_IMG}/w1280${featured.backdrop_path}`}
          mobileSrc={`${TMDB_IMG}/w780${featured.backdrop_path}`}
          fallback={featured.poster_path ? `${TMDB_IMG}/w780${featured.poster_path}` : undefined} />
        <div className="featured-copy">
          <p className="eyebrow" data-hero-copy>Spotlight</p>
          <h1 className={title.length > 34 ? "feature-title-long" : undefined} data-hero-copy>{title}</h1>
          <p className="feature-meta" data-hero-copy>
            <span>{type === "tv" ? "Series" : "Film"}{year && ` · ${year}`}</span>
            {Boolean(featured.vote_average) && (
              <span className="feature-score" aria-label={`TMDB rating ${featured.vote_average?.toFixed(1)} out of 10`}>
                <Star size={13} fill="currentColor" aria-hidden="true" /> {featured.vote_average?.toFixed(1)}
              </span>
            )}
          </p>
          {featured.overview && <p className="feature-overview" data-hero-copy>{featured.overview}</p>}
          <div className="feature-actions" data-hero-copy>
            <Button asChild><Link to={`/play/${type}/${featured.id}${type === "tv" ? "?s=1&e=1" : ""}`} state={{ returnTo: "/" }}><Play fill="currentColor" /> Watch now</Link></Button>
            <Button variant="outline" asChild><Link to={`/title/${type}/${featured.id}`}>Details <ArrowRight /></Link></Button>
          </div>
        </div>
      </div>
      {titles.length > 1 && (
        <div className="spotlight-choices" role="group" aria-label="Choose a spotlight title">
          {titles.map((item, index) => (
            <button type="button" key={`${item.media_type}-${item.id}`} aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)} className="spotlight-choice">
              <img src={`${TMDB_IMG}/w300${item.backdrop_path}`} alt="" decoding="async" />
              <span>{item.title || item.name}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Shelf({ title, loading, children }: { title: string; loading?: boolean; children: React.ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  useEffect(() => {
    const track = row.current;
    if (!track) return;
    const update = () => setEdges({
      start: track.scrollLeft <= 1,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2,
    });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    if (track.lastElementChild) observer.observe(track.lastElementChild);
    track.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); track.removeEventListener("scroll", update); };
  }, [children]);

  function move(direction: number) {
    const track = row.current;
    if (!track) return;
    track.scrollBy({
      left: direction * track.clientWidth * 0.82,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <section className="shelf" aria-label={title} aria-busy={loading || undefined}>
      <div className="shelf-heading">
        <h2>{title}</h2>
        {!loading && (!edges.start || !edges.end) && (
          <div className="shelf-controls">
            <Button variant="outline" size="icon" onClick={() => move(-1)} disabled={edges.start} aria-label={`Scroll ${title} left`}><ChevronLeft /></Button>
            <Button variant="outline" size="icon" onClick={() => move(1)} disabled={edges.end} aria-label={`Scroll ${title} right`}><ChevronRight /></Button>
          </div>
        )}
      </div>
      <div ref={row} className="shelf-track">{children}</div>
    </section>
  );
}

function ContinueWatchingRow() {
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // Always read from localStorage — no server calls for progress
        const localStr = localStorage.getItem("video_progress");
        let historyData: any[] = [];

        if (localStr) {
          const localObj = JSON.parse(localStr);
          historyData = Object.values(localObj);
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

  const handleRemoveProgress = (e: React.MouseEvent, item: TMDBItem) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const localKey = "video_progress";
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
    } catch (err) {
      console.error("Failed to remove progress:", err);
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
  };

  if (isLoading) return <Shelf title="Continue watching" loading><div className="resume-skeleton" /></Shelf>;

  if (!items.length) return null;

  return (
    <Shelf title="Continue watching">
      {items.map((item) => {
        const series = item.media_type === "tv" || item.media_type === "anime";
        const percent = item.duration ? Math.min(100, Math.max(0, ((item.progress || 0) / item.duration) * 100)) : 0;
        const title = item.title || item.name;
        const path = item.backdrop_path || item.poster_path;
        return (
          <article className="resume-card" key={`${item.media_type}-${item.id}-${item.season}-${item.episode}`}>
            <Link to={`/play/${item.media_type}/${item.id}${series ? `?s=${item.season || 1}&e=${item.episode || 1}` : ""}`} state={{ returnTo: "/" }}>
              <div className="resume-art">
                <Film size={22} aria-hidden="true" />
                {path && <img src={`${TMDB_IMG}/w500${path}`} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}
                <span className="resume-play"><Play size={16} fill="currentColor" /></span>
                {percent > 0 && <progress value={percent} max={100} aria-label="Playback progress" />}
              </div>
              <span className="poster-title">{title}</span>
              {series && item.season && item.episode && <span className="poster-meta">Season {item.season} · Episode {item.episode}</span>}
            </Link>
            <Button className="resume-remove" variant="outline" size="icon" onClick={(event) => handleRemoveProgress(event, item)} aria-label={`Remove ${title} from continue watching`}><X size={16} /></Button>
          </article>
        );
      })}
    </Shelf>
  );
}

function MovieRow({ title, endpoint, mediaType, showUnavailable }: { title: string; endpoint: string; mediaType: string; showUnavailable: boolean }) {
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    fetch(url, { signal: AbortSignal.timeout(10000) })
      .then((res) => res.json())
      .then((data) => {
        if (data.results) {
          const validItems = data.results.filter((i: any) => i.poster_path && (!i.media_type || ["movie", "tv"].includes(i.media_type)));
          setItems(validItems);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: validItems, ts: Date.now() }));
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [endpoint, title]);

  if (!isLoading && items.length === 0) return showUnavailable ? <section className="shelf"><div className="shelf-heading"><h2>{title}</h2></div><p className="state-panel">No titles are available in this collection right now.</p></section> : null;

  return (
    <Shelf title={title} loading={isLoading}>
      {isLoading
        ? Array.from({ length: 7 }, (_, index) => <div className="poster-skeleton" key={index} />)
        : items.map((item) => <PosterLink key={`${item.media_type || mediaType}-${item.id}`} item={item} mediaType={mediaType} />)}
    </Shelf>
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
  const selectedGenre = searchParams.get("genre") || "all";
  const activeTab = searchParams.get("tab") || "";
  const [gridItems, setGridItems] = useState<TMDBItem[]>([]);
  const [genreStatus, setGenreStatus] = useState<"loading" | "ready" | "error">("loading");
  const categoryTitle = activeTab === "tv" ? "TV Shows" : activeTab === "anime" ? "Anime" : "Movies";
  const genre = GENRES.find((option) => option.id === selectedGenre);

  useEffect(() => {
    if (selectedGenre === "all") return;
    const controller = new AbortController();
    setGenreStatus("loading");
    fetch(tmdbUrl("/discover/movie", { with_genres: selectedGenre }), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Genre unavailable");
        const data = await response.json();
        setGridItems((data.results ?? []).filter((item: TMDBItem) => item.poster_path));
        setGenreStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setGenreStatus("error"); });
    return () => controller.abort();
  }, [selectedGenre]);

  function selectGenre(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("genre");
    else params.set("genre", value);
    setSearchParams(params);
  }

  return (
    <main className="site-wrap catalog-page">
      {!activeTab && selectedGenre === "all" && <FeaturedHero />}
      {(activeTab || selectedGenre !== "all") && (
        <header className="page-heading"><h1>{selectedGenre !== "all" ? `${genre?.name || "Genre"} films` : categoryTitle}</h1></header>
      )}
      {(!activeTab || activeTab === "movies" || selectedGenre !== "all") && (
        <div className="catalog-tools">
          <span>Film genre</span>
          <Select value={genre?.id || "all"} onValueChange={selectGenre}>
            <SelectTrigger className="genre-select" aria-label="Film genre"><SelectValue /></SelectTrigger>
            <SelectContent>{GENRES.map(({ id, name }) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent>
          </Select>
          {selectedGenre !== "all" && <Button variant="ghost" onClick={() => selectGenre("all")}>Clear filter</Button>}
        </div>
      )}
      {selectedGenre !== "all" ? (
        genreStatus === "loading" ? <p role="status" className="state-panel">Loading films…</p>
          : genreStatus === "error" ? <p role="status" className="state-panel">This genre is temporarily unavailable.</p>
          : gridItems.length ? <div className="poster-grid">{gridItems.map((item) => <PosterLink key={item.id} item={item} />)}</div>
          : <p className="state-panel">No films found in this genre.</p>
      ) : (
        <>
          {!activeTab && <ContinueWatchingRow />}
          {getTabCategories(activeTab).map((category, index) => <MovieRow key={category.title} {...category} showUnavailable={index === 0} />)}
        </>
      )}
    </main>
  );
}
