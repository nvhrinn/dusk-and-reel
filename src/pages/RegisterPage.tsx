import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/auth";
import { Flame, UserPlus, Key } from "lucide-react";
import { toast } from "sonner";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activationKey, setActivationKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }
    if (!activationKey.trim()) {
      toast.error("Activation key wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.register(username, password, activationKey);
      login(user);
      toast.success("Registrasi berhasil!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Flame className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold text-foreground">Daftar AniRull</h1>
          <p className="text-sm text-muted-foreground">Buat akun baru dengan activation key</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pilih username (min 3 karakter)"
              className="w-full h-10 px-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
              minLength={3}
              maxLength={30}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 karakter"
              className="w-full h-10 px-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
              className="w-full h-10 px-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> Activation Key
            </label>
            <input
              type="text"
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full h-10 px-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono tracking-wider"
              required
            />
            <p className="mt-2 text-xs text-muted-foreground">
    Tidak dapat key?{" "}
    <a 
      href="https://wa.me/nomor-whatsapp-kamu" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-primary hover:underline font-medium"
    >
      Join channel WhatsApp untuk mendapatkan
    </a>
  </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? "Loading..." : "Daftar"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
