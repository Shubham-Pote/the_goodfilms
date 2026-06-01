import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Film, Tv, X, Loader2 } from "lucide-react";
import { TMDB_API_KEY, TMDB_IMG } from "@/lib/tmdb";

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch trending on mount
  useEffect(() => {
    if (!open) return;
    fetch(
      `https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.results) {
          setTrending(
            data.results
              .filter(
                (item: any) =>
                  item.poster_path &&
                  (item.media_type === "movie" || item.media_type === "tv")
              )
              .slice(0, 10)
          );
        }
      })
      .catch(console.error);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Debounced search
  const searchTMDB = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!q.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            q.trim()
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.results) {
              setResults(
                data.results
                  .filter(
                    (item: any) =>
                      item.poster_path &&
                      (item.media_type === "movie" || item.media_type === "tv")
                  )
                  .slice(0, 8)
              );
            }
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
      }, 300);
    },
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);
    searchTMDB(val);
  };

  const displayItems = query.trim() ? results : trending;
  const sectionLabel = query.trim() ? "Search Results" : "Top Searches";

  const handleNavigate = (item: SearchResult) => {
    const type = item.media_type || "movie";
    onClose();
    navigate(`/title/${type}/${item.id}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < displayItems.length) {
      handleNavigate(displayItems[selectedIndex]!);
    } else if (query.trim()) {
      onClose();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < displayItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : displayItems.length - 1
      );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl mx-auto mt-20 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center px-5 border-b border-zinc-800">
              <Search size={18} className="text-zinc-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search movies, TV shows, anime..."
                className="flex-1 bg-transparent text-white text-base px-4 py-4 outline-none placeholder:text-zinc-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setSelectedIndex(-1);
                    inputRef.current?.focus();
                  }}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ml-2 text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded font-mono hover:bg-zinc-700 transition-colors"
              >
                ESC
              </button>
            </div>
          </form>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading && query.trim() ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-red-500 animate-spin" />
              </div>
            ) : displayItems.length > 0 ? (
              <div className="py-3">
                <div className="px-5 pb-2 flex items-center gap-2">
                  {query.trim() ? (
                    <Search size={13} className="text-zinc-500" />
                  ) : (
                    <TrendingUp size={13} className="text-red-500" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {sectionLabel}
                  </span>
                </div>
                {displayItems.map((item, i) => {
                  const title = item.title || item.name || "";
                  const year = new Date(
                    item.release_date || item.first_air_date || ""
                  ).getFullYear();
                  const isTV = item.media_type === "tv";
                  const isSelected = i === selectedIndex;

                  return (
                    <button
                      key={`${item.id}-${i}`}
                      onClick={() => handleNavigate(item)}
                      className={`w-full flex items-center gap-4 px-5 py-2.5 text-left transition-colors duration-100 ${isSelected
                          ? "bg-red-600/15 border-l-2 border-red-500"
                          : "hover:bg-zinc-800/70 border-l-2 border-transparent"
                        }`}
                    >
                      {/* Poster */}
                      <div className="w-10 h-14 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
                        {item.poster_path ? (
                          <img
                            src={`${TMDB_IMG}/w92${item.poster_path}`}
                            alt={title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Film size={16} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {year && !isNaN(year) && (
                            <span className="text-xs text-zinc-500">
                              {year}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isTV
                                ? "bg-blue-500/15 text-blue-400"
                                : "bg-amber-500/15 text-amber-400"
                              }`}
                          >
                            {isTV ? "TV" : "Movie"}
                          </span>
                          {item.vote_average ? (
                            <span className="text-xs text-yellow-500 font-medium">
                              ★ {item.vote_average.toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Type icon */}
                      <div className="flex-shrink-0 text-zinc-600">
                        {isTV ? <Tv size={14} /> : <Film size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : query.trim() && !isLoading ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No results found for "{query}"
              </div>
            ) : null}

            {/* Quick hint */}
            {query.trim() && results.length > 0 && (
              <div className="px-5 py-3 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  Press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[10px]">Enter</kbd> to search all results
                </span>
                <span className="text-xs text-zinc-600">
                  <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[10px]">↑↓</kbd> navigate
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
