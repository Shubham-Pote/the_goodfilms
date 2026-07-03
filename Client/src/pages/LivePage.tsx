import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, Radio, Search } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: "UPCOMING" | "LIVE" | "ENDED";
}

export function LivePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"LIVE" | "UPCOMING" | "ENDED">("LIVE");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/api/live"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch live events:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const liveEvents = filteredEvents.filter(e => e.status === "LIVE");
  const upcomingEvents = filteredEvents.filter(e => e.status === "UPCOMING");
  const endedEvents = filteredEvents.filter(e => e.status === "ENDED");

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 px-6 flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const EventCard = ({ event }: { event: LiveEvent }) => (
    <Link key={event.id} to={`/live/${event.id}`} className="group relative block aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl">
      {event.thumbnail ? (
        <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-700 transition-colors group-hover:text-zinc-500">
          <PlayCircle size={48} className="group-hover:scale-110 transition-transform duration-300" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 md:p-5">
        <div className="flex flex-col gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div className="flex items-center gap-2 mb-1">
            {event.status === 'LIVE' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-red-600/90 text-white backdrop-blur-md">
                <Radio size={12} className="animate-pulse" /> LIVE NOW
              </span>
            )}
            {event.status === 'UPCOMING' && (
              <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-blue-600/80 text-white backdrop-blur-md">
                UPCOMING
              </span>
            )}
            {event.status === 'ENDED' && (
              <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-zinc-800/80 text-zinc-300 backdrop-blur-md">
                ENDED
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg md:text-xl leading-tight text-white group-hover:text-zinc-200 transition-colors duration-300">{event.title}</h3>
        </div>
      </div>
      
      {/* Play Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out">
          <PlayCircle size={28} className="ml-1" fill="currentColor" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 text-white">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="mb-8 md:mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Events</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl text-lg">Watch exclusive live broadcasts, sports, and special events in real-time.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-full pl-11 pr-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-500"
            />
          </div>
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-full p-1 w-full md:w-auto overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {["LIVE", "UPCOMING", "ENDED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  statusFilter === status 
                    ? "bg-red-600 text-white shadow-md" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {status === "LIVE" ? "Live Now" : status === "UPCOMING" ? "Upcoming" : "Past Events"}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 mt-4">
            <Radio size={48} className="mx-auto text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-zinc-300 mb-2">
              {events.length === 0 ? "No Events Scheduled" : "No Results Found"}
            </h3>
            <p className="text-zinc-500">
              {events.length === 0 
                ? "There are currently no live events scheduled." 
                : "Try adjusting your search or filters."}
            </p>
          </div>
        )}

        {/* LIVE NOW Section */}
        {liveEvents.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
              <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-100 flex items-center gap-2">
                Live Now <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span></span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {liveEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          </div>
        )}

        {/* UPCOMING Section */}
        {upcomingEvents.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-300">Upcoming</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          </div>
        )}

        {/* ENDED Section */}
        {endedEvents.length > 0 && (
          <div className="opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 bg-zinc-700 rounded-full"></div>
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-500">Past Events</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {endedEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
