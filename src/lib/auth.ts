import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
}

async function callAuthApi<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase2.functions.invoke("user-auth", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const authApi = {
  setup: () => callAuthApi<{ ok: boolean }>({ action: "setup" }),
  register: (username: string, password: string, key: string) =>
    callAuthApi<{ user: User }>({ action: "register", username, password, key }),
  login: (username: string, password: string) =>
    callAuthApi<{ user: User }>({ action: "login", username, password }),
  generateKeys: (userId: string, count = 5) =>
    callAuthApi<{ keys: { id: string; key: string; created_at: string }[] }>({
      action: "generate-keys", userId, count,
    }),
  listKeys: (userId: string) =>
    callAuthApi<{ keys: { id: string; key: string; used_by: string | null; used_at: string | null; created_at: string }[] }>({
      action: "list-keys", userId,
    }),
  listUsers: (userId: string) =>
    callAuthApi<{ users: { id: string; username: string; role: string; created_at: string }[] }>({
      action: "list-users", userId,
    }),
  changePassword: (userId: string, oldPassword: string, newPassword: string) =>
    callAuthApi<{ ok: boolean }>({ action: "change-password", userId, oldPassword, newPassword }),
};

const STORAGE_KEY = "anirull_user";

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setStoredUser(user: User | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}
