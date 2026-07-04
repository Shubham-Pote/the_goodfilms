import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/api";

interface LiveStream {
  id: string;
  name: string;
  streamUrl: string;
  streamType: string;
  drmKeyId?: string;
  drmKey?: string;
}

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: "UPCOMING" | "LIVE" | "ENDED";
  streams: LiveStream[];
}

export function LiveAdminPage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventThumb, setNewEventThumb] = useState("");
  const [newEventStatus, setNewEventStatus] = useState<"UPCOMING" | "LIVE" | "ENDED">("UPCOMING");

  // Edit Event states
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventDesc, setEditEventDesc] = useState("");
  const [editEventThumb, setEditEventThumb] = useState("");
  const [editEventStatus, setEditEventStatus] = useState<"UPCOMING" | "LIVE" | "ENDED">("UPCOMING");
  
  // Stream form
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [streamName, setStreamName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [streamType, setStreamType] = useState<"DASH" | "HLS">("DASH");
  const [drmScheme, setDrmScheme] = useState<"None" | "ClearKey" | "Widevine">("None");
  const [clearKeyString, setClearKeyString] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [referer, setReferer] = useState("");
  const [cookie, setCookie] = useState("");
  const [origin, setOrigin] = useState("");
  const [userAgent, setUserAgent] = useState("");

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [adminFilter, setAdminFilter] = useState<"ALL" | "LIVE" | "UPCOMING" | "ENDED">("ALL");

  const token = localStorage.getItem("token");

  const fetchEvents = async () => {
    try {
      const res = await fetch(apiUrl("/api/live"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/live"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDesc,
          thumbnail: newEventThumb,
          status: newEventStatus
        })
      });
      if (!res.ok) throw new Error("Failed to create event");
      setNewEventTitle("");
      setNewEventDesc("");
      setNewEventThumb("");
      setNewEventStatus("UPCOMING");
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditEventClick = (event: LiveEvent) => {
    setEditingEventId(event.id);
    setEditEventTitle(event.title);
    setEditEventDesc(event.description || "");
    setEditEventThumb(event.thumbnail || "");
    setEditEventStatus(event.status);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId) return;
    try {
      const res = await fetch(apiUrl(`/api/live/${editingEventId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editEventTitle,
          description: editEventDesc,
          thumbnail: editEventThumb,
          status: editEventStatus
        })
      });
      if (!res.ok) throw new Error("Failed to update event");
      setEditingEventId(null);
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await fetch(apiUrl(`/api/live/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStream = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl(`/api/live/${eventId}/streams`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: streamName,
          streamUrl,
          streamType,
          drmScheme: drmScheme !== "None" ? drmScheme : undefined,
          drmKeyId: (drmScheme === "ClearKey" && clearKeyString.includes(":")) ? clearKeyString.split(":")[0]?.trim() : undefined,
          drmKey: (drmScheme === "ClearKey" && clearKeyString.includes(":")) ? clearKeyString.split(":")[1]?.trim() : undefined,
          licenseUrl: licenseUrl || undefined,
          referer: referer || undefined,
          cookie: cookie || undefined,
          origin: origin || undefined,
          userAgent: userAgent || undefined
        })
      });
      if (!res.ok) throw new Error("Failed to add stream");
      setStreamName("");
      setStreamUrl("");
      setDrmScheme("None");
      setClearKeyString("");
      setLicenseUrl("");
      setReferer("");
      setCookie("");
      setOrigin("");
      setUserAgent("");
      setActiveEventId(null);
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    if (!confirm("Delete stream?")) return;
    try {
      await fetch(apiUrl(`/api/live/streams/${streamId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "LIVE": return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />;
      case "UPCOMING": return <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />;
      case "ENDED": return <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 px-6 flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 pt-24 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-6">
        
        <header className="mb-12">
          <h1 className="text-2xl font-medium text-white mb-1">Live Administration</h1>
          <p className="text-sm text-zinc-500">Manage broadcasts, streams, and DRM configurations.</p>
        </header>

        {error && (
          <div className="mb-6 p-4 border border-red-500/30 text-red-400 text-sm bg-red-500/5 rounded-md flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="hover:text-red-300">&times;</button>
          </div>
        )}

        {/* Create Event Form */}
        <section className="mb-12 border border-zinc-800 rounded-lg p-6 bg-zinc-950/50">
          <h2 className="text-sm font-medium text-white mb-6 uppercase tracking-widest">New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Title</label>
                <Input placeholder="Event Title" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} required className="bg-transparent border-zinc-800 focus:border-white rounded-none h-10 px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Status</label>
                <select value={newEventStatus} onChange={e => setNewEventStatus(e.target.value as any)} className="w-full bg-transparent border border-zinc-800 focus:border-white rounded-none h-10 px-3 text-sm outline-none text-white appearance-none">
                  <option className="bg-zinc-900 text-white" value="UPCOMING">UPCOMING</option>
                  <option className="bg-zinc-900 text-white" value="LIVE">LIVE</option>
                  <option className="bg-zinc-900 text-white" value="ENDED">ENDED</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Thumbnail URL</label>
                <Input placeholder="https://..." value={newEventThumb} onChange={e => setNewEventThumb(e.target.value)} className="bg-transparent border-zinc-800 focus:border-white rounded-none h-10 px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Description</label>
                <Input placeholder="Optional description" value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} className="bg-transparent border-zinc-800 focus:border-white rounded-none h-10 px-3 text-sm" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-white text-black hover:bg-zinc-200 rounded-none h-9 px-6 text-sm font-medium">
                Create Event
              </Button>
            </div>
          </form>
        </section>

        {/* Manage Events */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
            <h2 className="text-sm font-medium text-white uppercase tracking-widest">Manage Events ({events.length})</h2>
            
            {/* Admin Filter Tabs */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-sm p-1">
              {["ALL", "LIVE", "UPCOMING", "ENDED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setAdminFilter(status as any)}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    adminFilter === status 
                      ? "bg-white text-black" 
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 text-sm border border-zinc-900 border-dashed rounded-lg">
              No events configured.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {events
                .filter(e => adminFilter === "ALL" || e.status === adminFilter)
                .map(event => (
                        <div key={event.id} className="border border-zinc-800 bg-black rounded-lg overflow-hidden transition-colors hover:border-zinc-700">
                          
                          {/* List Item Header */}
                          {editingEventId === event.id ? (
                            <div className="p-5 border-b border-zinc-800 bg-zinc-900/30">
                              <form onSubmit={handleUpdateEvent} className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h3 className="text-sm font-medium text-white">Edit Event</h3>
                                  <button type="button" onClick={() => setEditingEventId(null)} className="text-xs text-zinc-500 hover:text-white">Cancel</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <Input value={editEventTitle} onChange={e => setEditEventTitle(e.target.value)} required className="bg-black border-zinc-800 h-9 rounded-none text-sm" />
                                  <select value={editEventStatus} onChange={e => setEditEventStatus(e.target.value as any)} className="bg-black border border-zinc-800 h-9 rounded-none px-3 text-sm text-white outline-none">
                                    <option className="bg-zinc-900 text-white" value="UPCOMING">UPCOMING</option>
                                    <option className="bg-zinc-900 text-white" value="LIVE">LIVE</option>
                                    <option className="bg-zinc-900 text-white" value="ENDED">ENDED</option>
                                  </select>
                                </div>
                                <Input placeholder="Description" value={editEventDesc} onChange={e => setEditEventDesc(e.target.value)} className="bg-black border-zinc-800 h-9 rounded-none text-sm" />
                                <Input placeholder="Thumbnail URL" value={editEventThumb} onChange={e => setEditEventThumb(e.target.value)} className="bg-black border-zinc-800 h-9 rounded-none text-sm" />
                                <div className="flex justify-end">
                                  <Button type="submit" size="sm" className="bg-white text-black hover:bg-zinc-200 rounded-none h-8 text-xs">Save</Button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer select-none"
                              onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                {getStatusDot(event.status)}
                                <div>
                                  <h3 className="text-sm font-medium text-zinc-100">{event.title}</h3>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600 font-mono">
                                    <span>{event.id.slice(0,8)}</span>
                                    <span>&bull;</span>
                                    <span>{event.streams?.length || 0} streams</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <button onClick={(e) => { e.stopPropagation(); handleEditEventClick(event); }} className="text-zinc-500 hover:text-white transition-colors">
                                  <Edit size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }} className="text-zinc-600 hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                                <div className="text-zinc-700">
                                  {expandedEventId === event.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Expanded Streams Section */}
                          {expandedEventId === event.id && !editingEventId && (
                            <div className="border-t border-zinc-900 bg-zinc-950/30 p-5">
                              
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Streams</h4>
                                {activeEventId !== event.id && (
                                  <button onClick={() => setActiveEventId(event.id)} className="text-xs text-white hover:underline flex items-center gap-1">
                                    <Plus size={12} /> Add
                                  </button>
                                )}
                              </div>

                              {/* Stream List */}
                              {event.streams && event.streams.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                  {event.streams.map(stream => (
                                    <div key={stream.id} className="flex items-start justify-between p-3 border border-zinc-900 bg-black rounded-md">
                                      <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium text-zinc-200">{stream.name}</span>
                                          <span className="text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 font-mono border border-zinc-800">{stream.streamType}</span>
                                          {stream.drmKeyId && <span className="text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 font-mono border border-zinc-800">DRM</span>}
                                        </div>
                                        <div className="text-xs text-zinc-600 truncate font-mono">
                                          {stream.streamUrl}
                                        </div>
                                      </div>
                                      <button onClick={() => handleDeleteStream(stream.id)} className="text-zinc-600 hover:text-red-500 pt-1 shrink-0">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-zinc-600 italic mb-4">No streams configured.</div>
                              )}

                              {/* Add Stream Form */}
                              {activeEventId === event.id && (
                                <div className="border border-zinc-800 bg-black p-5 rounded-md mt-4">
                                  <form onSubmit={(e) => handleAddStream(e, event.id)} className="space-y-6">
                                    
                                    {/* Basics */}
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2 space-y-1.5">
                                          <label className="text-xs text-zinc-500">Name</label>
                                          <Input placeholder="Stream Name" value={streamName} onChange={e => setStreamName(e.target.value)} required className="bg-transparent border-zinc-800 h-9 rounded-none text-sm focus:border-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs text-zinc-500">Type</label>
                                          <select value={streamType} onChange={e => setStreamType(e.target.value as any)} className="w-full bg-transparent border border-zinc-800 h-9 px-3 rounded-none text-sm text-white outline-none focus:border-white appearance-none">
                                            <option className="bg-zinc-900 text-white" value="DASH">DASH (.mpd)</option>
                                            <option className="bg-zinc-900 text-white" value="HLS">HLS (.m3u8)</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-xs text-zinc-500">URL</label>
                                        <Input 
                                          placeholder="Manifest URL" 
                                          value={streamUrl} 
                                          onChange={e => {
                                            const val = e.target.value;
                                            if (val.includes('|')) {
                                              const [urlPart, headersPart] = val.split('|');
                                              setStreamUrl(urlPart || "");
                                              const params = new URLSearchParams(headersPart || "");
                                              if (params.has('Origin')) setOrigin(params.get('Origin') || "");
                                              if (params.has('Referer')) setReferer(params.get('Referer') || "");
                                              if (params.has('User-Agent')) setUserAgent(params.get('User-Agent') || "");
                                              if (params.has('Cookie')) setCookie(params.get('Cookie') || "");
                                            } else {
                                              setStreamUrl(val);
                                            }
                                          }} 
                                          required 
                                          className="bg-transparent border-zinc-800 h-9 rounded-none text-sm font-mono focus:border-white" 
                                        />
                                      </div>
                                    </div>

                                    {/* Headers */}
                                    <div className="space-y-3">
                                      <label className="text-xs text-zinc-500">Request Headers (Optional)</label>
                                      <div className="grid grid-cols-2 gap-3">
                                        <Input placeholder="Referer" value={referer} onChange={e => setReferer(e.target.value)} className="bg-transparent border-zinc-800 h-8 rounded-none text-xs focus:border-white" />
                                        <Input placeholder="Origin" value={origin} onChange={e => setOrigin(e.target.value)} className="bg-transparent border-zinc-800 h-8 rounded-none text-xs focus:border-white" />
                                        <Input placeholder="Cookie" value={cookie} onChange={e => setCookie(e.target.value)} className="bg-transparent border-zinc-800 h-8 rounded-none text-xs focus:border-white" />
                                        <Input placeholder="User-Agent" value={userAgent} onChange={e => setUserAgent(e.target.value)} className="bg-transparent border-zinc-800 h-8 rounded-none text-xs focus:border-white" />
                                      </div>
                                    </div>

                                    {/* DRM */}
                                    <div className="space-y-3">
                                      <label className="text-xs text-zinc-500">DRM Strategy</label>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <select value={drmScheme} onChange={e => setDrmScheme(e.target.value as any)} className="w-full bg-transparent border border-zinc-800 h-9 px-3 rounded-none text-sm text-white outline-none focus:border-white appearance-none">
                                          <option className="bg-zinc-900 text-white" value="None">None</option>
                                          <option className="bg-zinc-900 text-white" value="ClearKey">ClearKey</option>
                                          <option className="bg-zinc-900 text-white" value="Widevine">Widevine</option>
                                        </select>
                                        <div className="md:col-span-2">
                                          {drmScheme === "ClearKey" && (
                                            <Input placeholder="KeyID:Key" value={clearKeyString} onChange={e => setClearKeyString(e.target.value)} className="bg-transparent border-zinc-800 h-9 rounded-none text-sm font-mono focus:border-white" />
                                          )}
                                          {drmScheme === "Widevine" && (
                                            <Input placeholder="License URL" value={licenseUrl} onChange={e => setLicenseUrl(e.target.value)} className="bg-transparent border-zinc-800 h-9 rounded-none text-sm font-mono focus:border-white" />
                                          )}
                                          {drmScheme === "None" && (
                                            <div className="h-9 flex items-center text-xs text-zinc-600">No encryption.</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                      <button type="button" onClick={() => setActiveEventId(null)} className="text-xs text-zinc-400 hover:text-white px-3">Cancel</button>
                                      <Button type="submit" className="bg-white text-black hover:bg-zinc-200 rounded-none h-8 px-6 text-xs font-medium">Add Stream</Button>
                                    </div>
                                  </form>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
