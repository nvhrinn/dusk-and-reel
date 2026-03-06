import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  coupons: number;
};

type AuthCtx = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  useCoupon: (episodeId: string) => Promise<boolean>;
  addCoupon: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const useCoupon = useCallback(async (episodeId: string): Promise<boolean> => {
    if (!user || !profile) return false;

    // Check if already unlocked
    const { data: existing } = await supabase
      .from("coupon_usage")
      .select("id")
      .eq("user_id", user.id)
      .eq("episode_id", episodeId)
      .maybeSingle();

    if (existing) return true;

    if (profile.coupons <= 0) return false;

    // Deduct coupon
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ coupons: profile.coupons - 1 })
      .eq("id", user.id);

    if (updateErr) return false;

    // Record usage
    await supabase.from("coupon_usage").insert({ user_id: user.id, episode_id: episodeId });

    setProfile((p) => p ? { ...p, coupons: p.coupons - 1 } : p);
    return true;
  }, [user, profile]);

  const addCoupon = useCallback(async () => {
    if (!user || !profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ coupons: profile.coupons + 1 })
      .eq("id", user.id);
    if (!error) setProfile((p) => p ? { ...p, coupons: p.coupons + 1 } : p);
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, useCoupon, addCoupon }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
