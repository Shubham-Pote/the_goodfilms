import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Radio, Search } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const filters = {
  LIVE: "Live now",
  UPCOMING: "Upcoming",
  ENDED: "Past events",
} as const;
type EventStatus = keyof typeof filters;

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: EventStatus;
}

export function LivePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventStatus>("LIVE");

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/live"), {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Live events unavailable");
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, []);

  const filtered = events.filter((event) => event.status === filter && event.title.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <main className="site-wrap catalog-page">
      <header className="page-heading"><h1>Live events</h1></header>
      <div className="live-toolbar">
        <div className="filter-group" role="group" aria-label="Event status">
          {(Object.keys(filters) as EventStatus[]).map((value) => (
            <Button key={value} variant="ghost" aria-pressed={filter === value} onClick={() => setFilter(value)}>{filters[value]}</Button>
          ))}
        </div>
        <div className="search-field relative">
          <Search className="absolute left-3 text-muted-foreground" size={17} aria-hidden="true" />
          <Input className="pl-9" type="search" aria-label="Search events" placeholder="Find an event" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>
      <div className="section-line"><h2 className="section-heading">{filters[filter]}</h2>{status === "ready" && <span className="search-summary">{filtered.length} {filtered.length === 1 ? "event" : "events"}</span>}</div>
      {status === "loading" ? <p className="state-panel" role="status">Loading events…</p>
        : status === "error" ? <p className="state-panel" role="status">Live events are temporarily unavailable.</p>
        : !filtered.length ? <p className="state-panel">{query.trim() ? "No matching events." : filter === "LIVE" ? "Nothing is live right now." : filter === "UPCOMING" ? "No upcoming events are scheduled." : "There are no past events."}</p>
        : <div className="event-grid">{filtered.map((event) => (
          <Link className="event-card" to={`/live/${event.id}`} key={event.id}>
            <div className="resume-art">
              <Radio size={28} aria-hidden="true" />
              {event.thumbnail && <img src={event.thumbnail} alt="" loading="lazy" onError={(image) => { image.currentTarget.hidden = true; }} />}
            </div>
            <div className="event-card-copy">
              <div className="flex items-center justify-between"><span className="eyebrow">{filters[event.status]}</span><ArrowUpRight size={16} aria-hidden="true" /></div>
              <h3>{event.title}</h3>
              {event.description && <p className="line-clamp-2">{event.description}</p>}
            </div>
          </Link>
        ))}</div>}
    </main>
  );
}
