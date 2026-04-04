import { corsHeaders } from "https://deno.land/x/cors_headers@v0.1.1/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const translateUrl = Deno.env.get("SUPABASE_TRANSLATE_URL")!;
const translateKey = Deno.env.get("SUPABASE_TRANSLATE_SERVICE_ROLE_KEY")!;

function getDb() {
  return createClient(translateUrl, translateKey);
}

// Simple password hashing using Web Crypto
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "anirull_salt_2024");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(seg);
  }
  return segments.join("-");
}

// Auto-create tables if not exist
async function ensureTables(db: ReturnType<typeof createClient>) {
  const { error } = await db.rpc("ensure_user_tables" as any);
  if (error && error.message?.includes("function") && error.message?.includes("does not exist")) {
    // Create tables via raw SQL through a temporary RPC
    // We'll use the REST API directly
    const res = await fetch(`${translateUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": translateKey,
        "Authorization": `Bearer ${translateKey}`,
      },
    });
    // Fallback: create via direct SQL
    await createTablesDirectly();
  }
}

async function createTablesDirectly() {
  const sqlUrl = `${translateUrl}/rest/v1/`;
  // Try to query users table to check if it exists
  const db = getDb();
  const { error } = await db.from("users").select("id").limit(1);
  if (error && error.message?.includes("does not exist")) {
    // Need to create tables - use SQL via pg_net or direct approach
    // Since we can't run raw SQL via REST easily, we'll handle table creation
    // through the migration approach on the translate DB
    console.log("Tables don't exist yet - they need to be created manually or via migration");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { action, ...params } = await req.json();
    const db = getDb();

    switch (action) {
      case "setup": {
        // Create tables - run this once
        // We use the service role to execute SQL
        const sqlStatements = [
          `CREATE TABLE IF NOT EXISTS public.users (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            activation_key TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
          )`,
          `CREATE TABLE IF NOT EXISTS public.activation_keys (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            key TEXT UNIQUE NOT NULL,
            created_by uuid REFERENCES public.users(id),
            used_by uuid REFERENCES public.users(id),
            used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT now()
          )`,
        ];

        for (const sql of sqlStatements) {
          const res = await fetch(`${translateUrl}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": translateKey,
              "Authorization": `Bearer ${translateKey}`,
            },
            body: JSON.stringify({ query: sql }),
          });
        }

        // Check if admin exists, if not create default admin
        const { data: existingAdmin } = await db
          .from("users")
          .select("id")
          .eq("role", "admin")
          .limit(1);

        if (!existingAdmin || existingAdmin.length === 0) {
          const pwHash = await hashPassword("admin123");
          await db.from("users").insert({
            username: "admin",
            password_hash: pwHash,
            role: "admin",
            activation_key: "SETUP",
          });
        }

        return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
      }

      case "register": {
        const { username, password, key } = params;
        if (!username || !password || !key) {
          return new Response(JSON.stringify({ error: "Username, password, dan activation key wajib diisi" }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        if (username.length < 3 || username.length > 30) {
          return new Response(JSON.stringify({ error: "Username harus 3-30 karakter" }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        if (password.length < 6) {
          return new Response(JSON.stringify({ error: "Password minimal 6 karakter" }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        // Check activation key
        const { data: keyData, error: keyError } = await db
          .from("activation_keys")
          .select("*")
          .eq("key", key.toUpperCase().trim())
          .is("used_by", null)
          .single();

        if (keyError || !keyData) {
          return new Response(JSON.stringify({ error: "Activation key tidak valid atau sudah digunakan" }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        // Check username uniqueness
        const { data: existing } = await db
          .from("users")
          .select("id")
          .eq("username", username.toLowerCase().trim())
          .single();

        if (existing) {
          return new Response(JSON.stringify({ error: "Username sudah digunakan" }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const pwHash = await hashPassword(password);
        const { data: newUser, error: insertError } = await db
          .from("users")
          .insert({
            username: username.toLowerCase().trim(),
            password_hash: pwHash,
            role: "user",
            activation_key: key.toUpperCase().trim(),
          })
          .select("id, username, role")
          .single();

        if (insertError) {
          return new Response(JSON.stringify({ error: "Gagal membuat akun: " + insertError.message }), {
            status: 500, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        // Mark key as used
        await db
          .from("activation_keys")
          .update({ used_by: newUser.id, used_at: new Date().toISOString() })
          .eq("id", keyData.id);

        return new Response(JSON.stringify({ user: newUser }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      case "login": {
        const { username, password } = params;
        if (!username || !password) {
          return new Response(JSON.stringify({ error: "Username dan password wajib diisi" }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const pwHash = await hashPassword(password);
        const { data: user, error: loginError } = await db
          .from("users")
          .select("id, username, role")
          .eq("username", username.toLowerCase().trim())
          .eq("password_hash", pwHash)
          .single();

        if (loginError || !user) {
          return new Response(JSON.stringify({ error: "Username atau password salah" }), {
            status: 401, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ user }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      case "generate-keys": {
        const { userId, count = 5 } = params;
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        // Verify admin
        const { data: admin } = await db
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();

        if (!admin || admin.role !== "admin") {
          return new Response(JSON.stringify({ error: "Hanya admin yang bisa generate key" }), {
            status: 403, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const keys = [];
        const numKeys = Math.min(Math.max(1, count), 50);
        for (let i = 0; i < numKeys; i++) {
          keys.push({
            key: generateKey(),
            created_by: userId,
          });
        }

        const { data: insertedKeys, error: insertError } = await db
          .from("activation_keys")
          .insert(keys)
          .select("id, key, created_at");

        if (insertError) {
          return new Response(JSON.stringify({ error: "Gagal generate keys: " + insertError.message }), {
            status: 500, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ keys: insertedKeys }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      case "list-keys": {
        const { userId } = params;
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        // Verify admin
        const { data: admin } = await db
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();

        if (!admin || admin.role !== "admin") {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const { data: allKeys } = await db
          .from("activation_keys")
          .select("id, key, used_by, used_at, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        return new Response(JSON.stringify({ keys: allKeys || [] }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      case "list-users": {
        const { userId } = params;
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const { data: admin } = await db
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();

        if (!admin || admin.role !== "admin") {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const { data: users } = await db
          .from("users")
          .select("id, username, role, created_at")
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ users: users || [] }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      case "change-password": {
        const { userId, oldPassword, newPassword } = params;
        if (!userId || !oldPassword || !newPassword) {
          return new Response(JSON.stringify({ error: "Data tidak lengkap" }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        if (newPassword.length < 6) {
          return new Response(JSON.stringify({ error: "Password baru minimal 6 karakter" }), {
            status: 400, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const oldHash = await hashPassword(oldPassword);
        const { data: user } = await db
          .from("users")
          .select("id")
          .eq("id", userId)
          .eq("password_hash", oldHash)
          .single();

        if (!user) {
          return new Response(JSON.stringify({ error: "Password lama salah" }), {
            status: 401, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const newHash = await hashPassword(newPassword);
        await db.from("users").update({ password_hash: newHash }).eq("id", userId);

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
