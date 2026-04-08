import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Shield, Key, Crown, Camera, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { useState, useRef } from "react";
import { authApi } from "@/lib/auth";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [vipCode, setVipCode] = useState("");
  const [vipLoading, setVipLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const isVip = user.is_vip === true;
  const isAdmin = user.role === "admin";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Ukuran gambar maksimal 500KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updated = { ...user, avatar_url: base64 };
      login(updated);
      toast.success("Foto profil berhasil diubah");
    };
    reader.readAsDataURL(file);
  };

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

  const handleRedeemVip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipCode.trim()) return;
    setVipLoading(true);
    try {
      await authApi.redeemVipCode(user.id, vipCode.trim());
      const updated = { ...user, is_vip: true };
      login(updated);
      toast.success("Selamat! Kamu sekarang VIP 🎉");
      setVipCode("");
    } catch (err: any) {
      toast.error(err.message || "Kode VIP tidak valid");
    } finally {
      setVipLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Berhasil logout");
  };

  return (
    <div className="min-h-screen pt-14 bg-background">
      <div className="container mx-auto px-4 py-8 max-w-md space-y-5">

        {/* Profile Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{user.username}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {isAdmin ? <Shield className="w-3 h-3" /> : <Key className="w-3 h-3" />}
                  {user.role}
                </span>
                {isVip || isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-medium">
                    <Crown className="w-3 h-3" /> VIP
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Free
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-bold text-foreground text-sm">Status Akun</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Role</span>
              <span className="text-foreground font-medium capitalize">{user.role}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status VIP</span>
              {isVip || isAdmin ? (
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <XCircle className="w-3.5 h-3.5" /> Tidak Aktif
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Benefit</span>
              <span className="text-foreground text-xs">
                {isVip || isAdmin ? "Nonton tanpa kupon" : "Perlu kupon per episode"}
              </span>
            </div>
          </div>
        </div>

        {/* VIP Activation - only show if not VIP */}
        {!isVip && !isAdmin && (
  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
    <div className="flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-amber-500" />
      <h2 className="font-bold text-foreground text-sm">Aktivasi VIP</h2>
    </div>
    <p className="text-xs text-muted-foreground">
      Masukkan kode VIP 4 digit dari admin untuk nonton tanpa kupon
    </p>
    
    {/* PERBAIKAN: Tambahkan flex-col sm:flex-row agar button pindah ke bawah saat mobile */}
    <form onSubmit={handleRedeemVip} className="flex gap-2 w-full items-center">
  <input
    type="text"
    maxLength={4}
    placeholder="0000"
    value={vipCode}
    onChange={(e) => setVipCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
    className="flex-1 min-w-0 h-10 px-4 rounded-xl bg-secondary text-foreground text-center text-lg tracking-[0.5em] font-mono placeholder:text-muted-foreground placeholder:tracking-[0.5em] focus:outline-none focus:ring-1 focus:ring-amber-500"
  />
  <button
    type="submit"
    disabled={vipLoading || vipCode.length !== 4}
    className="h-10 px-5 rounded-xl bg-amber-500 text-white font-medium text-sm disabled:opacity-50 flex-none shrink-0 w-max"
  >
    {vipLoading ? "..." : "Aktifkan"}
  </button>
</form>
  </div>
)}
        {/* Change Password */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-bold text-foreground text-sm">Ganti Password</h2>
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

        {/* Logout */}
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
