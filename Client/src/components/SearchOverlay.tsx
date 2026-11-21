import { useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Film, Search, X } from "lucide-react";
import { TMDB_IMG, tmdbUrl } from "@/lib/tmdb";
import type { PosterItem } from "./PosterLink";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

export function SearchOverlay({ open, onClose, returnFocus }: {
  open: boolean;
  onClose: () => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="search-dialog sm:max-w-xl" aria-describedby={undefined} showCloseButton={false}
        onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus(); }}>
        <DialogTitle className="sr-only">Search the catalog</DialogTitle>
        {open && <QuickSearch onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function QuickSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PosterItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const term = query.trim();

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(term ? tmdbUrl("/search/multi", { query: term }) : tmdbUrl("/trending/all/day"), { signal: controller.signal });
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        const items: PosterItem[] = (data.results ?? []).filter((item: PosterItem) => item.poster_path && (item.media_type === "movie" || item.media_type === "tv"));
        setResults(items.slice(0, term ? 8 : 10));
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, term ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term]);

  useEffect(() => {
    if (selected >= 0) document.getElementById(`quick-title-${selected}`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function updateQuery(value: string) {
    if (value.trim() !== term) {
      setSelected(-1);
      setStatus("loading");
      setResults([]);
    }
    setQuery(value);
  }

  function openTitle(item: PosterItem) {
    onClose();
    navigate(`/title/${item.media_type || "movie"}/${item.id}`);
  }

  function openResults() {
    onClose();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <>
      <form className="flex items-center gap-2 border-b px-3 sm:px-4" onSubmit={(event) => {
        event.preventDefault();
        const item = results[selected];
        if (item) openTitle(item);
        else if (term) openResults();
      }}>
        <Search size={19} className="shrink-0 text-primary" />
        <Input ref={inputRef} value={query} aria-label="Search movies and series" placeholder="Search movies and series"
          className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={(event) => {
            if (!results.length || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            setSelected(selected < 0 && step === -1 ? results.length - 1 : (selected + step + results.length) % results.length);
          }} />
        {query && <Button variant="ghost" size="icon" type="button" aria-label="Clear search" onClick={() => { updateQuery(""); inputRef.current?.focus(); }}><X /></Button>}
        <DialogClose asChild><Button variant="outline" type="button" size="sm" aria-label="Close search">Esc</Button></DialogClose>
      </form>
      <div className="max-h-[min(54dvh,420px)] overflow-y-auto py-2">
        <p className="eyebrow px-4 py-2">{term ? "Matches" : "Trending now"}</p>
        {status !== "ready" || results.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted-foreground" role="status">
            {status === "loading" ? "Loading titles…" : status === "error" ? "Titles are temporarily unavailable." : "No matching titles."}
          </p>
        ) : results.map((item, index) => (
          <button type="button" className="search-item flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-2 text-left"
            key={`${item.media_type}-${item.id}`} id={`quick-title-${index}`} data-selected={index === selected}
            onClick={() => openTitle(item)}>
            <div className="poster-art w-8 shrink-0"><Film size={14} aria-hidden="true" /><img src={`${TMDB_IMG}/w92${item.poster_path}`} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /></div>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.title || item.name}</span>
              <span className="block text-xs text-muted-foreground">{item.media_type === "tv" ? "Series" : "Film"} · {(item.release_date || item.first_air_date)?.slice(0, 4) || "Year unknown"}</span>
            </span>
            <ArrowUpRight size={16} className="shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
      {term && <div className="border-t p-3"><Button variant="outline" className="w-full" onClick={openResults}>See all results <ArrowUpRight /></Button></div>}
    </>
  );
}
