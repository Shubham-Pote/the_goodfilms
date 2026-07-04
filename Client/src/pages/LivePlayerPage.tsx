import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Server, ChevronDown } from "lucide-react";
import { ShakaPlayer } from "@/components/ShakaPlayer";
import { apiUrl } from "@/lib/api";

interface LiveStream {
  id: string;
  name: string;
  streamUrl: string;
  streamType: string;
  drmScheme?: string;
  drmKeyId?: string;
  drmKey?: string;
  licenseUrl?: string;
  referer?: string;
  cookie?: string;
  origin?: string;
  userAgent?: string;
}

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  status: string;
  streams: LiveStream[];
}

export function LivePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI interaction states
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const hideUITimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/live/${id}`), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Event not found");
        
        const data = await res.json();
        setEvent(data);
        if (data.streams && data.streams.length > 0) {
          setActiveStream(data.streams[0]);
        }
      } catch (err) {
        console.error("Failed to fetch live event:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);

  // Handle mouse movement to auto-hide UI
  useEffect(() => {
    const handleMouseMove = () => {
      setIsUIVisible(true);
      if (hideUITimeoutRef.current) {
        clearTimeout(hideUITimeoutRef.current);
      }
      hideUITimeoutRef.current = setTimeout(() => {
        if (!showServerMenu) {
          setIsUIVisible(false);
        }
      }, 3500); // Hide UI after 3.5 seconds of inactivity
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (hideUITimeoutRef.current) clearTimeout(hideUITimeoutRef.current);
    };
  }, [showServerMenu]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Event not found</h2>
        <button onClick={() => navigate("/live")} className="text-red-500 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Live Events
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden group">
      
      {/* Top Overlay UI */}
      <div 
        className={`absolute top-0 left-0 right-0 z-50 p-3 md:p-6 pt-4 md:pt-8 flex flex-row items-center md:items-start justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-all duration-500 ease-in-out ${
          isUIVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0 pr-2">
          <button 
            onClick={() => navigate("/live")}
            className="p-1 md:p-2 opacity-70 hover:opacity-100 text-white transition-opacity shrink-0"
          >
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white drop-shadow-md truncate">{event.title}</h1>
            {activeStream && (
              <p className="text-xs md:text-sm text-zinc-300 drop-shadow-md mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2 truncate">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-600 animate-pulse shrink-0"></span>
                <span className="truncate">Playing: {activeStream.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Server/Stream Selector */}
        {event.streams.length > 0 && (
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowServerMenu(!showServerMenu)}
              className="flex items-center gap-1.5 md:gap-2 px-2 py-2 opacity-70 hover:opacity-100 text-white text-sm md:text-base font-medium transition-opacity"
            >
              <Server className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
              <span className="hidden sm:inline-block max-w-[120px] truncate">{activeStream?.name || "Select Source"}</span>
              <span className="sm:hidden">Src</span>
              <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${showServerMenu ? "rotate-180" : ""}`} />
            </button>
            
            {showServerMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Available Sources</div>
                {event.streams.map((stream) => (
                  <button
                    key={stream.id}
                    onClick={() => {
                      setActiveStream(stream);
                      setShowServerMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      activeStream?.id === stream.id 
                        ? "bg-red-600/10 text-red-500 font-medium" 
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${activeStream?.id === stream.id ? 'bg-red-500' : 'bg-zinc-600'}`}></div>
                    {stream.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Video Player */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
        {activeStream ? (
          <div className="w-full h-full [&>div]:w-full [&>div]:h-full [&>div]:rounded-none [&>div]:border-none [&_video]:w-full [&_video]:h-full [&_video]:object-contain">
            <ShakaPlayer 
              key={activeStream.id}
              streamUrl={activeStream.streamUrl}
              drmScheme={activeStream.drmScheme}
              drmKeyId={activeStream.drmKeyId}
              drmKey={activeStream.drmKey}
              licenseUrl={activeStream.licenseUrl}
              referer={activeStream.referer}
              cookie={activeStream.cookie}
              origin={activeStream.origin}
              userAgent={activeStream.userAgent}
              className="h-full"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-500 gap-4">
            <p>No streams available for this event yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}
