import { useGoogleLogin } from "@react-oauth/google";
import { LogIn, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const UserMenu = () => {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ambil user dari localStorage saat load
  useEffect(() => {
    const stored = localStorage.getItem("google_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // klik di luar menu
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // login google
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const profile = await res.json();

        localStorage.setItem("google_user", JSON.stringify(profile));
        setUser(profile);

        toast.success("Login berhasil!");
      } catch (err) {
        console.error(err);
        toast.error("Gagal mengambil data user");
      }
    },
    onError: () => toast.error("Login Google dibatalkan"),
  });

  // logout
  const logout = () => {
    localStorage.removeItem("google_user");
    setUser(null);
    setOpen(false);
    toast.success("Logout berhasil");
  };

  // jika belum login
  if (!user) {
    return (
      <button
        onClick={() => googleLogin()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Login</span>
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt="avatar"
            className="w-7 h-7 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-card border border-border shadow-lg overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Profil
          </Link>

          <button
            onClick={logout}
            className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
