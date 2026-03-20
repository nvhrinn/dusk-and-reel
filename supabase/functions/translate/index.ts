import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Cue = {
  id?: string;
  timestamp: string;
  text: string[];
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeText(text: string) {
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseSubtitle(text: string): Cue[] {
  const lines = normalizeText(text).split("\n");
  const cues: Cue[] = [];
  let i = 0;

  if (lines[0]?.trim().startsWith("WEBVTT")) {
    i++;
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  while (i < lines.length) {
    let id: string | undefined;
    let line = lines[i]?.trim() ?? "";

    if (!line) {
      i++;
      continue;
    }

    if (!line.includes("-->")) {
      const next = lines[i + 1]?.trim() ?? "";
      if (next.includes("-->")) {
        id = line;
        i++;
        line = lines[i]?.trim() ?? "";
      }
    }

    if (!line.includes("-->")) {
      i++;
      continue;
    }

    const timestamp = line;
    i++;

    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i]);
      i++;
    }

    cues.push({ id, timestamp, text: textLines });

    while (i < lines.length && lines[i].trim() === "") i++;
  }

  return cues;
}

function toVtt(cues: Cue[]) {
  return (
    "WEBVTT\n\n" +
    cues.map((cue) => [cue.id, cue.timestamp, ...cue.text].filter(Boolean).join("\n")).join("\n\n")
  );
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function translateBatchOfficial(
  texts: string[],
  targetLang: string,
  sourceLang?: string,
): Promise<string[]> {
  const apiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
  if (!apiKey) throw new Error("Missing GOOGLE_TRANSLATE_API_KEY");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const body: Record<string, unknown> = {
      q: texts,
      target: targetLang,
      format: "text",
    };

    if (sourceLang) body.source = sourceLang;

    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Translate API error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const items = data?.data?.translations;

    if (!Array.isArray(items) || items.length !== texts.length) {
      throw new Error("Invalid translation response");
    }

    return items.map((item: any, i: number) => item?.translatedText || texts[i]);
  } finally {
    clearTimeout(timeout);
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) break;
      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runner());
  await Promise.all(workers);
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const {
      action,
      subtitleText,
      subtitleUrl,
      targetLang = "id",
      sourceLang,
    } = await req.json();

    if (action !== "translate-subtitle") {
      return json({ error: "Invalid action" }, 400);
    }

    let rawSubtitle = typeof subtitleText === "string" ? subtitleText : "";

    if (!rawSubtitle && typeof subtitleUrl === "string" && subtitleUrl) {
      const allowedOrigins = (Deno.env.get("ALLOWED_SUBTITLE_ORIGINS") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const url = new URL(subtitleUrl);
      if (!allowedOrigins.includes(url.origin)) {
        return json({ error: "subtitleUrl origin not allowed" }, 403);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const subRes = await fetch(subtitleUrl, { signal: controller.signal });
        if (!subRes.ok) {
          return json({ error: "Failed to fetch subtitleUrl" }, 400);
        }
        rawSubtitle = await subRes.text();
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!rawSubtitle) {
      return json({ error: "subtitleText atau subtitleUrl wajib diisi" }, 400);
    }

    const cacheKey = await sha256(`${targetLang}::${rawSubtitle}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: cached } = await supabase
      .from("translation_cache")
      .select("vtt")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.vtt) {
      return json({
        ok: true,
        cached: true,
        vtt: cached.vtt,
      });
    }

    const cues = parseSubtitle(rawSubtitle);
    if (!cues.length) {
      return json({ error: "No subtitle cues found" }, 400);
    }

    const BATCH_SIZE = 30;
    const CONCURRENCY = 2;

    const batches = [];
    for (let i = 0; i < cues.length; i += BATCH_SIZE) {
      batches.push(cues.slice(i, i + BATCH_SIZE));
    }

    const translatedBatchResults = await runWithConcurrency(
      batches,
      CONCURRENCY,
      async (batch) => {
        const texts = batch.map((cue) => cue.text.join("\n"));
        const translated = await translateBatchOfficial(texts, targetLang, sourceLang);

        return batch.map((cue, idx) => ({
          ...cue,
          text: translated[idx].split("\n"),
        }));
      }
    );

    const translatedCues = translatedBatchResults.flat();
    const vtt = toVtt(translatedCues);

    await supabase.from("translation_cache").upsert({
      cache_key: cacheKey,
      target_lang: targetLang,
      vtt,
    });

    return json({
      ok: true,
      cached: false,
      count: translatedCues.length,
      vtt,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});
