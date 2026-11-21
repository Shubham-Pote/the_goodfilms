import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { PosterLink, type PosterItem } from "@/components/PosterLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tmdbUrl } from "@/lib/tmdb";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q")?.trim() || "";
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<PosterItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("ready");

  useEffect(() => setInput(query), [query]);
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    setStatus("loading");
    fetch(tmdbUrl("/search/multi", { query }), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        setResults((data.results ?? []).filter((item: PosterItem) =>
          item.poster_path && (!item.media_type || item.media_type === "movie" || item.media_type === "tv")));
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [query]);

  return (
    <main className="site-wrap catalog-page">
      <header className="page-heading">
        <h1>Search</h1>
        <form className="search-field" role="search" onSubmit={(event) => {
          event.preventDefault();
          setParams(input.trim() ? { q: input.trim() } : {});
        }}>
          <Input type="search" aria-label="Search movies and series" placeholder="Find a movie or series" value={input} onChange={(event) => setInput(event.target.value)} />
          <Button type="submit"><Search /> Search</Button>
        </form>
      </header>
      <div className="section-line"><h2 className="section-heading">Movies & TV</h2>
        {query && status === "ready" && <span className="search-summary">{results.length} {results.length === 1 ? "title" : "titles"}</span>}
      </div>
      {!query ? <p className="state-panel">Enter a title to search the catalog.</p>
        : status === "loading" ? <p className="state-panel" role="status">Searching…</p>
        : status === "error" ? <p className="state-panel" role="status">Search is temporarily unavailable.</p>
        : results.length === 0 ? <p className="state-panel">No titles found for “{query}”.</p>
        : <div className="poster-grid">{results.map((item) => <PosterLink key={`${item.media_type}-${item.id}`} item={item} />)}</div>}
    </main>
  );
}
