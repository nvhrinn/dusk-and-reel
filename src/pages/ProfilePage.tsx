import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Shield, Key } from "lucide-react";
import { useState } from "react";
import { authApi } from "@/lib/auth";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen pt-14 bg-background flex flex-col items-center justify-center gap-4 px-4">
        <User className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">Kamu belum login</p>
        <p className="text-sm text-muted-foreground">Silakan login untuk melihat profil</p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
        >
          Login
        </button>
      </div>
    );
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPw || !newPw) return;
    setLoading(true);
    try {
      await authApi.changePassword(user.id, oldPw, newPw);
      toast.success("Password berhasil diubah");
      setOldPw("");
      setNewPw("");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Berhasil logout");
  };

  return (
    <div className="min-h-screen pt-14 bg-background">
      <div className="container mx-auto px-4 py-8 max-w-md space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{user.username}</h1>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {user.role === "admin" ? <Shield className="w-3 h-3" /> : <Key className="w-3 h-3" />}
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-bold text-foreground">Ganti Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              placeholder="Password lama"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              className="w-full h-10 px-4 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="Password baru"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full h-10 px-4 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
            >
              {loading ? "Mengubah..." : "Ubah Password"}
            </button>
          </form>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-medium text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
