import { useNavigate } from "react-router-dom";
import { User, Ticket, LogOut } from "lucide-react";
import { getUser, logoutUser, getCoupons } from "@/lib/auth";

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = getUser();

  if (!user) {
    navigate("/");
    return null;
  }

  const coupons = getCoupons();

  return (
    <div className="min-h-screen pt-14 bg-background">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            {user.picture ? (
              <img src={user.picture} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
            <Ticket className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{coupons} Kupon</p>
              <p className="text-xs text-muted-foreground">Tersedia untuk menonton iklan</p>
            </div>
          </div>
<button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" /> Beranda
          </button>
          <button
            onClick={() => { logoutUser(); navigate("/"); window.location.reload(); }}
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
