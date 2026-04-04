import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { Key, Users, Copy, Plus, Check, LogOut } from "lucide-react";
import { toast } from "sonner";

const AdminPage = () => {
  const { user, isAdmin, logout } = useAuth();
  const [tab, setTab] = useState<"keys" | "users">("keys");
  const [keys, setKeys] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [genCount, setGenCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadKeys = async () => {
    if (!user) return;
    try {
      const { keys } = await authApi.listKeys(user.id);
      setKeys(keys);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadUsers = async () => {
    if (!user) return;
    try {
      const { users } = await authApi.listUsers(user.id);
      setUsers(users);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadKeys();
      loadUsers();
    }
  }, [user, isAdmin]);

  if (!user || !isAdmin) return <Navigate to="/login" replace />;




  const handleGenerate = async () => {
    setLoading(true);
    try {
      await authApi.generateKeys(user.id, genCount);
      toast.success(`${genCount} key berhasil dibuat!`);
      loadKeys();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success("Key disalin!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unusedKeys = keys.filter((k) => !k.used_by);
  const usedKeys = keys.filter((k) => k.used_by);

  return (
    <div className="min-h-screen bg-background pt-16 pb-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-display font-bold text-foreground">Admin Panel</h1>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("keys")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === "keys" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Key className="w-4 h-4" /> Activation Keys
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === "users" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
        </div>

        {tab === "keys" && (
          <div className="space-y-4">
            {/* Generate */}
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Jumlah:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
                className="w-20 h-9 px-2 rounded-lg bg-background border border-border text-foreground text-center"
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {loading ? "..." : "Generate Keys"}
              </button>
            </div>

            {/* Unused Keys */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Belum Digunakan ({unusedKeys.length})
              </h3>
              <div className="space-y-1.5">
                {unusedKeys.length === 0 && (
                  <p className="text-sm text-muted-foreground p-3 bg-card rounded-lg">Tidak ada key tersedia</p>
                )}
                {unusedKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <code className="text-sm font-mono text-foreground">{k.key}</code>
                    <button
                      onClick={() => copyKey(k.key, k.id)}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      {copiedId === k.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Used Keys */}
            {usedKeys.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Sudah Digunakan ({usedKeys.length})
                </h3>
                <div className="space-y-1.5">
                  {usedKeys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 opacity-60">
                      <code className="text-xs font-mono text-muted-foreground">{k.key}</code>
                      <span className="text-xs text-muted-foreground">
                        {new Date(k.used_at).toLocaleDateString("id")}
                      </span>
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
                  {u.role === "admin" && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">admin</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("id")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
