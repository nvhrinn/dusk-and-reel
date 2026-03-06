import { useAuth } from "@/hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, LogOut, User, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const UserMenu = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      try {
        
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
        });
        if (error) throw error;
        await refreshProfile();
        toast.success("Login berhasil!");
      } catch (err: any) {
        console.error("Login error:", err);
        toast.error("Login gagal: " + (err.message || "Unknown error"));
      }
    },
    onError: () => toast.error("Login Google dibatalkan"),
  });

  if (loading) return null;

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
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-border" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-card border border-border shadow-lg overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{profile?.username || "User"}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Ticket className="w-3 h-3" /> {profile?.coupons ?? 0} kupon
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
            onClick={() => { signOut(); setOpen(false); }}
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
