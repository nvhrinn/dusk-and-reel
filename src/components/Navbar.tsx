import { Link, useNavigate } from "react-router-dom";
import { Search, Home, Flame, User } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg text-gradient">AniStream</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            to="/about"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="w-4 h-4" />
            About
          </Link>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime..."
              className="w-40 sm:w-56 h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
