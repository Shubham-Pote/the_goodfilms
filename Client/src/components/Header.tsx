import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, Search } from "lucide-react";
import { Brand } from "./Brand";
import { SearchOverlay } from "./SearchOverlay";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";

const destinations = [
  { label: "Home", path: "/" },
  { label: "Movies", path: "/?tab=movies" },
  { label: "TV Shows", path: "/?tab=tv" },
  { label: "Anime", path: "/?tab=anime" },
  { label: "Live", path: "/live" },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const logout = () => {
    setMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.altKey || event.ctrlKey || event.metaKey || menuOpen || searchOpen) return;
      if ((event.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, [menuOpen, searchOpen]);

  const links = user?.role === "ADMIN"
    ? [...destinations, { label: "Live Admin", path: "/admin/live" }]
    : destinations;
  const tab = new URLSearchParams(location.search).get("tab");
  const currentPath = location.pathname === "/" && tab ? `/?tab=${tab}` : location.pathname;

  const navigation = links.map(({ label, path }) => (
    <Link key={path} to={path} aria-current={currentPath === path ? "page" : undefined} onClick={() => setMenuOpen(false)}>
      {label}
    </Link>
  ));

  return (
    <>
      <header className="app-header">
        <div className="site-wrap header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">{navigation}</nav>
          <div className="header-actions">
            <Button ref={searchButton} variant="outline" className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={17} /><span>Search</span><kbd>/</kbd>
            </Button>
            {user ? (
              <div className="desktop-account">
                <span className="account-name">{user.username}</span>
                <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out" title="Sign out">
                  <LogOut size={17} />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="desktop-account" asChild><Link to="/login">Sign in</Link></Button>
            )}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="menu-trigger" aria-label="Open navigation"><Menu size={22} /></Button>
              </SheetTrigger>
              <SheetContent className="mobile-sheet" aria-describedby={undefined}>
                <SheetTitle>Explore</SheetTitle>
                <nav aria-label="Main navigation">{navigation}</nav>
                <div className="mobile-account">
                  {user ? (
                    <><span>{user.username}</span><Button variant="outline" onClick={logout}><LogOut size={16} />Sign out</Button></>
                  ) : <Button asChild><Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link></Button>}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} returnFocus={searchButton} />
    </>
  );
}
