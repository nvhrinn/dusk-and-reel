import { Link, useNavigate } from "react-router-dom";
import { Search, Home, Flame, User, LogIn, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg text-gradient">AniRull</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>

          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 text-sm text-primary hover:opacity-80 transition"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.username}</span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}

          <Link
            to="/about"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">About</span>
          </Link>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime..."
              className="w-40 sm:w-56 h-9 pl-9 pr-3 rounded-xl glass-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
