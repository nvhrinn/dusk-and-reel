import { useState, useEffect } from "react";
import { authApi } from "@/lib/auth";
import { Key, Users, Copy, Plus, Check, LogIn, Shield, Crown } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  username: string;
  role: string;
}

const AdminPage = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState<"keys" | "users" | "vip">("keys");
  const [keys, setKeys] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [vipCodes, setVipCodes] = useState<any[]>([]);
  const [genCount, setGenCount] = useState(5);
  const [vipGenCount, setVipGenCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoginLoading(true);
    try {
      const { user } = await authApi.login(username, password);
      if (user.role !== "admin") {
        toast.error("Akun ini bukan admin");
        return;
      }
      setAdminUser(user);
      localStorage.setItem("admin_session", JSON.stringify(user));
      toast.success("Login admin berhasil!");
    } catch (err: any) {
      toast.error(err.message || "Login gagal");
    } finally {
      setLoginLoading(false);
    }
  };

  const loadKeys = async () => {
    if (!adminUser) return;
    try {
      const { keys } = await authApi.listKeys(adminUser.id);
      setKeys(keys);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadUsers = async () => {
    if (!adminUser) return;
    try {
      const { users } = await authApi.listUsers(adminUser.id);
      setUsers(users);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadVipCodes = async () => {
    if (!adminUser) return;
    try {
      const { codes } = await authApi.listVipCodes(adminUser.id);
      setVipCodes(codes);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (adminUser) {
      loadKeys();
      loadUsers();
      loadVipCodes();
    }
  }, [adminUser]);

  useEffect(() => {
  const saved = localStorage.getItem("admin_session");
  if (saved) {
    try {
      const user = JSON.parse(saved);
      setAdminUser(user);
    } catch {
      localStorage.removeItem("admin_session");
    }
  }
}, []);

  const handleGenerate = async () => {
    if (!adminUser) return;
    setLoading(true);
    try {
      await authApi.generateKeys(adminUser.id, genCount);
      toast.success(`${genCount} key berhasil dibuat!`);
      loadKeys();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVip = async () => {
    if (!adminUser) return;
    setLoading(true);
    try {
      await authApi.generateVipCodes(adminUser.id, vipGenCount);
      toast.success(`${vipGenCount} kode VIP berhasil dibuat!`);
      loadVipCodes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Disalin!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <Shield className="w-10 h-10 text-primary mx-auto" />
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Masuk dengan akun admin</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Admin username" className="w-full h-10 px-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" required />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" className="w-full h-10 px-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" required />
            </div>
            <button type="submit" disabled={loginLoading} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50">
              <LogIn className="w-4 h-4" />
              {loginLoading ? "Loading..." : "Masuk Admin"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const unusedKeys = keys.filter((k) => !k.used_by);
  const usedKeys = keys.filter((k) => k.used_by);
  const unusedVip = vipCodes.filter((c) => !c.used_by);
  const usedVip = vipCodes.filter((c) => c.used_by);

  return (
    <div className="min-h-screen bg-background pt-16 pb-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-display font-bold text-foreground">Admin Panel</h1>
          <button
  onClick={() => {
    setAdminUser(null);
    localStorage.removeItem("admin_session"); // ✅ hapus session
  }}
  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
>
  Logout
</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["keys", "users", "vip"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              {t === "keys" && <Key className="w-4 h-4" />}
              {t === "users" && <Users className="w-4 h-4" />}
              {t === "vip" && <Crown className="w-4 h-4" />}
              {t === "keys" ? "Activation Keys" : t === "users" ? "Users" : "VIP Codes"}
            </button>
          ))}
        </div>

        {tab === "keys" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Jumlah:</label>
              <input type="number" min={1} max={50} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} className="w-20 h-9 px-2 rounded-lg bg-background border border-border text-foreground text-center" />
              <button onClick={handleGenerate} disabled={loading} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition disabled:opacity-50">
                <Plus className="w-4 h-4" />{loading ? "..." : "Generate Keys"}
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Belum Digunakan ({unusedKeys.length})</h3>
              <div className="space-y-1.5">
                {unusedKeys.length === 0 && <p className="text-sm text-muted-foreground p-3 bg-card rounded-lg">Tidak ada key tersedia</p>}
                {unusedKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <code className="text-sm font-mono text-foreground">{k.key}</code>
                    <button onClick={() => copyText(k.key, k.id)} className="text-muted-foreground hover:text-foreground transition">
                      {copiedId === k.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {usedKeys.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Sudah Digunakan ({usedKeys.length})</h3>
                <div className="space-y-1.5">
                  {usedKeys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 opacity-60">
                      <code className="text-xs font-mono text-muted-foreground">{k.key}</code>
                      <span className="text-xs text-muted-foreground">{new Date(k.used_at).toLocaleDateString("id")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "vip" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-amber-500/20">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Jumlah:</label>
              <input type="number" min={1} max={50} value={vipGenCount} onChange={(e) => setVipGenCount(Number(e.target.value))} className="w-20 h-9 px-2 rounded-lg bg-background border border-border text-foreground text-center" />
              <button onClick={handleGenerateVip} disabled={loading} className="flex-1 h-9 rounded-lg bg-amber-500 text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition disabled:opacity-50">
                <Plus className="w-4 h-4" />{loading ? "..." : "Generate VIP"}
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Belum Digunakan ({unusedVip.length})</h3>
              <div className="space-y-1.5">
                {unusedVip.length === 0 && <p className="text-sm text-muted-foreground p-3 bg-card rounded-lg">Tidak ada kode VIP tersedia</p>}
                {unusedVip.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-amber-500/20">
                    <code className="text-lg font-mono text-amber-500 tracking-[0.3em]">{c.code}</code>
                    <button onClick={() => copyText(c.code, c.id)} className="text-muted-foreground hover:text-foreground transition">
                      {copiedId === c.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {usedVip.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Sudah Digunakan ({usedVip.length})</h3>
                <div className="space-y-1.5">
                  {usedVip.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 opacity-60">
                      <code className="text-sm font-mono text-muted-foreground tracking-[0.3em]">{c.code}</code>
                      <span className="text-xs text-muted-foreground">{new Date(c.used_at).toLocaleDateString("id")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-1.5">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div>
                  <span className="text-sm font-medium text-foreground">{u.username}</span>
                  {u.role === "admin" && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">admin</span>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("id")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
