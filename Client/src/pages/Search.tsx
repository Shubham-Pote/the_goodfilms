import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { TMDB_API_KEY } from "@/lib/tmdb";

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  media_type?: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState<TMDBItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  // Keep input synced if query param changes
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Fetch search results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query.trim()
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.results) {
          setResults(
            data.results.filter(
              (item: any) =>
                item.poster_path &&
                (item.media_type === "movie" ||
                  item.media_type === "tv" ||
                  !item.media_type)
            )
          );
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-x-hidden">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-12 pt-10 pb-16">
        <div className="flex flex-col gap-6">
          <h1 className="text-5xl font-black text-white tracking-tight">
            Search
          </h1>

          {/* Large Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[620px]">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-14 pr-6 py-3.5 bg-zinc-900 border border-red-950/60 rounded-full outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-base text-white"
            />
          </form>

          {/* Heading Results */}
          <h2 className="text-lg font-bold text-white mt-8 mb-4">
            Movies & TV
          </h2>

          {/* Grid Results */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-zinc-500 py-12 text-base">
              {query ? `No results found for "${query}".` : "Type a search query to find movies and shows."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-2">
              {results.map((item) => (
                <Link
                  key={item.id}
                  to={`/title/${item.media_type || "movie"}/${item.id}`}
                  className="relative rounded-md overflow-hidden transition duration-300 hover:scale-[1.03] z-0 hover:z-10 bg-zinc-900 group/grid shadow-lg"
                >
                  <div className="aspect-[2/3] w-full bg-zinc-800">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                    />
                  </div>
                  {/* Slide up Title block on hover */}
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
      </main>
    </div>
  );
}
