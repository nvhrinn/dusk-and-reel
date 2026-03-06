import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { User, Ticket, LogOut } from "lucide-react";

const ProfilePage = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen pt-14 bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen pt-14 bg-background">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">{profile?.username || "User"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
            <Ticket className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{profile?.coupons ?? 0} Kupon</p>
              <p className="text-xs text-muted-foreground">Tersedia untuk menonton</p>
            </div>
          </div>

          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
