import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { PlayCircle, Search, Menu, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchOverlay } from "@/components/SearchOverlay";
import { cn } from "@/lib/utils";

const NAV_TABS = [
  { label: "Home", tab: "", path: "/" },
  { label: "TV Shows", tab: "tv", path: "/?tab=tv" },
  { label: "Movies", tab: "movies", path: "/?tab=movies" },
  { label: "Anime", tab: "anime", path: "/?tab=anime" },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "";
  const isLanding = location.pathname === "/";

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActiveTab = (tab: string) => {
    if (!isLanding) return false;
    return currentTab === tab;
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full",
          "bg-black/80 supports-[backdrop-filter]:bg-black/60",
          "backdrop-blur-xl border-b border-white/[0.06]",
          "transition-all duration-300"
        )}
      >
        <nav className="flex items-center justify-between h-16 px-6 md:px-12 max-w-[1800px] mx-auto">
          {/* Left: Logo */}
          <Link
            to="/"
            className="flex items-center group flex-shrink-0"
          >
            <span className="text-xl font-extrabold text-white tracking-tight">
              the_goodfilms
            </span>
          </Link>

          {/* Center: Nav Tabs (desktop) */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            {NAV_TABS.map((tab) => (
              <Link
                key={tab.tab}
                to={tab.path}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActiveTab(tab.tab)
                    ? "text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                )}
              >
                {tab.label}
                {/* Active indicator */}
                {isActiveTab(tab.tab) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                )}
              </Link>
            ))}
          </div>

          {/* Right: Search + Auth */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                "text-zinc-400 hover:text-white hover:bg-white/[0.08]",
                "border border-transparent hover:border-white/10"
              )}
              aria-label="Search"
            >
              <Search size={16} />
              <span className="hidden lg:inline text-sm text-zinc-500">
                Search...
              </span>
              <kbd className="hidden lg:inline text-[10px] text-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono ml-4">
                /
              </kbd>
            </button>

            {/* Auth (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-zinc-400 text-sm hidden lg:inline">
                    {user.username}
                  </span>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <LogOut size={15} className="mr-1.5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                  <Button
                    asChild
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg px-5 border-0 shadow-md shadow-red-600/20 hover:shadow-red-600/30 transition-all"
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-black/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
            <div className="px-6 py-4 space-y-1">
              {NAV_TABS.map((tab) => (
                <Link
                  key={tab.tab}
                  to={tab.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActiveTab(tab.tab)
                      ? "text-white bg-red-600/10 border-l-2 border-red-500"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <div className="px-6 pb-4 pt-2 border-t border-white/[0.06] space-y-2">
              {user ? (
                <>
                  <div className="text-zinc-400 text-sm px-4 py-2">
                    Welcome, {user.username}
                  </div>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                  >
                    <LogOut size={15} className="mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                  <Button
                    asChild
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold border-0"
                  >
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard shortcut: "/" to open search */}
      <GlobalSearchShortcut onOpen={() => setSearchOpen(true)} />
    </>
  );
}

/** Listens for "/" key to open search (when not in an input field) */
function GlobalSearchShortcut({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
  return null;
}
