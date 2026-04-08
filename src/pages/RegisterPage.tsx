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
      toast.error("Password does not match!");
      return;
    }
    if (!activationKey.trim()) {
      toast.error("Activation key must be filled in");
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.register(username, password, activationKey);
      login(user);
      toast.success("Registration successful!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Flame className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold text-foreground">Register</h1>
          <p className="text-sm text-muted-foreground">Create a new account with activation key</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Select a username (min 3 characters)"
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
              placeholder="Min 6 characters"
              className="w-full h-10 px-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
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
    Can't get the key?{" "}
    <a 
      href="https://whatsapp.com/channel/0029VbCGAUm3bbV9AjUZaY0v" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-primary hover:underline font-medium"
    >
      Join WhatsApp channel to get
    </a>
  </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? "Loading..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
