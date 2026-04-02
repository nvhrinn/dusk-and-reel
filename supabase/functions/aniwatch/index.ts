import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE = "https://aniwatchtv.to";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

// ─── In-memory response cache (LRU-style) ───
interface CacheEntry { data: string; expiry: number; }
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL: Record<string, number> = {
  home: 5 * 60_000,
  search: 3 * 60_000,
  info: 10 * 60_000,
  episodes: 10 * 60_000,
  servers: 2 * 60_000,
  watch: 10 * 60_000,      // ← increased: stream URLs are stable
  special: 5 * 60_000,
  movie: 5 * 60_000,
  genres: 30 * 60_000,
  genre: 5 * 60_000,
  'translate-subtitle': 24 * 60 * 60_000, // 24 hours — translations are permanent
};
const MAX_CACHE_SIZE = 1000;

function getCached(key: string): string | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { responseCache.delete(key); return null; }
  // Move to end (LRU)
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.data;
}

function setCache(key: string, data: string, ttl: number) {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { data, expiry: Date.now() + ttl });
}

// ─── Rate limiting per IP ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30; // reduced: 30 req/min per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

let rlCleanCounter = 0;
function cleanupRateLimit() {
  rlCleanCounter++;
  if (rlCleanCounter % 50 !== 0) return;
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}

// ─── In-flight deduplication ───
const inFlightRequests = new Map<string, Promise<string>>();

async function fetchPage(url: string) {
  const res = await fetch(url, { headers: HEADERS });
  const html = await res.text();
  return cheerio.load(html);
}

function parseAnimeCard($: cheerio.CheerioAPI, el: cheerio.Element) {
  return {
    name: $(el).find(".film-name .dynamic-name").text().trim(),
    jname: $(el).find(".film-name .dynamic-name").attr("data-jname") || "",
    format: $(el).find(".fd-infor .fdi-item").first().text().trim(),
    duration: $(el).find(".fd-infor .fdi-item").last().text().trim(),
    id: ($(el).find(".film-name a").attr("href") || "")
      .replace(/^\/(watch\/)?/, "")
      .split("?")[0]
      .split("#")[0],
    sub: $(el).find(".tick-sub").text().trim(),
    dub: $(el).find(".tick-dub").text().trim() || "0",
    totalEp: $(el).find(".tick-eps").text().trim() || null,
    image: $(el).find(".film-poster img").attr("data-src") || $(el).find("img").attr("data-src"),
    rating: $(el).find(".tick-rate").text().trim() || null,
  };
}

// ─── Persistent subtitle cache using Supabase DB ───
async function getCachedTranslation(subtitleUrlHash: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/subtitle_cache?subtitle_url_hash=eq.${encodeURIComponent(subtitleUrlHash)}&select=translated_vtt&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.translated_vtt || null;
  } catch { return null; }
}

async function saveCachedTranslation(subtitleUrlHash: string, originalUrl: string, vtt: string): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return;

    await fetch(`${supabaseUrl}/rest/v1/subtitle_cache`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ subtitle_url_hash: subtitleUrlHash, original_url: originalUrl, translated_vtt: vtt }),
    });
  } catch { /* silent */ }
}

// Simple hash for cache key
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") || "unknown";
  cleanupRateLimit();
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "30" },
    });
  }

  // GET = HLS proxy mode
  if (req.method === 'GET') {
    try {
      const reqUrl = new URL(req.url);
      const targetUrl = reqUrl.searchParams.get('url');
      if (!targetUrl) {
        return new Response('Missing url param', { status: 400, headers: corsHeaders });
      }

      const proxyRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': HEADERS['User-Agent'],
          'Referer': 'https://megacloud.blog/',
          'Origin': 'https://megacloud.blog',
        },
      });

      const contentType = proxyRes.headers.get('content-type') || 'application/octet-stream';

      if (contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8')) {
        let text = await proxyRes.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        text = text.replace(/^(?!#)(?!https?:\/\/)(.+)$/gm, (match) => {
          return baseUrl + match.trim();
        });
        return new Response(text, {
          status: proxyRes.status,
          headers: { ...corsHeaders, 'Content-Type': contentType, 'Cache-Control': 'public, max-age=60' },
        });
      }

      const body = await proxyRes.arrayBuffer();
      return new Response(body, {
        status: proxyRes.status,
        headers: { ...corsHeaders, 'Content-Type': contentType, 'Cache-Control': 'public, max-age=600' },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Proxy error';
      return new Response(msg, { status: 502, headers: corsHeaders });
    }
  }

  try {
    const { action, query, page, id, episodeId, sourceId, subtitleUrl } = await req.json();

    // Check in-memory cache
    const cacheKey = JSON.stringify({ action, query, page, id, episodeId, sourceId, subtitleUrl });
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    // In-flight deduplication: if the same request is already being processed, wait for it
    const existingFlight = inFlightRequests.get(cacheKey);
    if (existingFlight) {
      const flightResult = await existingFlight;
      return new Response(flightResult, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "DEDUP" },
      });
    }

    // Create a promise for this request
    const processPromise = processAction(action, { query, page, id, episodeId, sourceId, subtitleUrl });
    inFlightRequests.set(cacheKey, processPromise);

    try {
      const responseBody = await processPromise;
      const ttl = CACHE_TTL[action] || 3 * 60_000;
      setCache(cacheKey, responseBody, ttl);

      return new Response(responseBody, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  } catch (error) {
    console.error("Aniwatch API error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processAction(
  action: string,
  params: { query?: string; page?: number; id?: string; episodeId?: string; sourceId?: string; subtitleUrl?: string }
): Promise<string> {
  const { query, page, id, episodeId, sourceId, subtitleUrl } = params;
  let result: unknown;

  switch (action) {
    case 'home': {
      const $ = await fetchPage(`${BASE}/home`);
      const slides: unknown[] = [];
      $(".deslide-item").each((_: number, el: cheerio.Element) => {
        slides.push({
          name: $(el).find(".dynamic-name").text().trim(),
          image: $(el).find("img").attr("data-src"),
          id: $(el).find(".desi-buttons a").eq(1).attr("href")?.split("/")[1],
        });
      });

      const trending: unknown[] = [];
      $(".swiper-slide.item-qtip").each((_: number, el: cheerio.Element) => {
        trending.push({
          name: $(el).find(".dynamic-name").text().trim(),
          rank: $(el).find(".number span").text(),
          id: $(el).find("a").attr("href")?.replace("/", ""),
          image: $(el).find("img").attr("data-src"),
        });
      });

      const latestEpisodes: unknown[] = [];
      $("section.block_area.block_area_home:has(.cat-heading:contains('Latest Episode'))").find(".flw-item").each((_: number, el: cheerio.Element) => {
        latestEpisodes.push(parseAnimeCard($, el));
      });
      if (latestEpisodes.length === 0) {
        $(".anif-block-ul").first().find(".flw-item").each((_: number, el: cheerio.Element) => {
          latestEpisodes.push(parseAnimeCard($, el));
        });
      }

      const topAiring: unknown[] = [];
      $(".anif-block-01 ul li").each((_, el) => {
        topAiring.push({
          name: $(el).find(".film-name a").text().trim(),
          id: $(el).find(".film-name a").attr("href")?.split("/")[1],
          image: $(el).find(".film-poster-img").attr("data-src"),
          sub: $(el).find(".tick-sub").text().replace(/\D/g, ""),
          dub: $(el).find(".tick-dub").text().replace(/\D/g, ""),
          type: $(el).find(".fdi-item").text().trim(),
        });
      });

      const popular: unknown[] = [];
      $(".anif-block-03 .anif-block-ul ul li").each((_, el) => {
        popular.push({
          name: $(el).find(".film-name a").text().trim(),
          id: $(el).find(".film-name a").attr("href")?.split("/")[1],
          image: $(el).find(".film-poster-img").attr("data-src"),
          sub: $(el).find(".tick-sub").text().replace(/\D/g, ""),
          dub: $(el).find(".tick-dub").text().replace(/\D/g, ""),
          type: $(el).find(".fdi-item").text().trim(),
        });
      });

      const upcoming: unknown[] = [];
      $("section.block_area.block_area_home:has(.cat-heading:contains('Upcoming'))").find(".flw-item").each((_: number, el: cheerio.Element) => {
        const card = parseAnimeCard($, el);
        const release = $(el).find(".fdi-item.fdi-duration").text().trim();
        if (release) (card as any).duration = release;
        upcoming.push(card);
      });

      result = { slides, trending, latestEpisodes, topAiring, popular, upcoming };
      break;
    }

    case 'search': {
      const url = `${BASE}/search?keyword=${encodeURIComponent(query!)}&page=${page || 1}`;
      const $ = await fetchPage(url);
      const results: unknown[] = [];
      $(".flw-item").each((_: number, el: cheerio.Element) => {
        results.push(parseAnimeCard($, el));
      });
      result = { results };
      break;
    }

    case 'info': {
      const $ = await fetchPage(`${BASE}/${id}`);
      const aniDetail = $(".anisc-detail");
      const filmStats = $(".film-stats");
      const tickItems = filmStats.find(".tick .tick-item");
      let pg = "", quality = "", sub = "", dub = "", totalEp = "";

      tickItems.each((_: number, el: cheerio.Element) => {
        const text = $(el).text().trim();
        const classes = $(el).attr("class") || "";
        if (classes.includes("tick-pg")) pg = text;
        else if (classes.includes("tick-quality")) quality = text;
        else if (classes.includes("tick-sub")) sub = text;
        else if (classes.includes("tick-dub")) dub = text;
        else if (classes.includes("tick-eps")) totalEp = text;
      });

      let format = "", duration = "";
      $(".item-head").each((_: number, el: cheerio.Element) => {
        const label = $(el).text().trim().toLowerCase();
        const value = $(el).next(".name").text().trim();
        if (label.includes("type")) format = value;
        else if (label.includes("duration")) duration = value;
      });

      if (!format || !duration) {
        $(".spe-info").each((_: number, el: cheerio.Element) => {
          const label = $(el).find("small, .spe-head, strong, b").text().trim().toLowerCase();
          const value = $(el).find("a, span").last().text().trim();
          if (!format && (label.includes("type") || label.includes("format"))) format = value;
          if (!duration && label.includes("duration")) duration = value;
        });
      }

      const description = aniDetail.find(".film-description .text").text().trim() ||
        $(".film-description .text").text().trim() ||
        $(".text").first().text().trim();

      const halfLen = Math.floor(description.length / 2);
      const cleanDesc = description.slice(0, halfLen) === description.slice(halfLen).trim()
        ? description.slice(0, halfLen).trim()
        : description;

      const genres: string[] = [];
      $(".item-list a[href*='genre']").each((_: number, el: cheerio.Element) => {
        genres.push($(el).text().trim());
      });
      if (genres.length === 0) {
        $(".item-title a").each((_: number, el: cheerio.Element) => {
          const href = $(el).attr("href") || "";
          if (href.includes("genre")) genres.push($(el).text().trim());
        });
      }

      result = {
        name: aniDetail.find(".film-name.dynamic-name").text().trim() || $(".film-name.dynamic-name").text().trim(),
        jname: aniDetail.find(".dynamic-name").attr("data-jname") || $(".dynamic-name").attr("data-jname"),
        image: $(".film-poster img").attr("src") || $(".film-poster img").attr("data-src"),
        description: cleanDesc,
        pg, quality, sub,
        dub: dub || null,
        totalEp: totalEp || null,
        format, duration,
        genre: genres,
        id: $(".film-buttons a").attr("href")?.split("/watch/")[1] ||
          $(".btn-play").attr("href")?.replace("/watch/", "") || null,
      };
      break;
    }

    case 'episodes': {
      const animeIdMatch = id!.match(/-(\d+)(?:\?.*)?$/) || id!.match(/(\d+)(?:\?.*)?$/);
      const animeId = animeIdMatch?.[1];
      if (!animeId) throw new Error("Invalid anime id");

      const res = await fetch(`${BASE}/ajax/v2/episode/list/${animeId}`, { headers: HEADERS });
      const data = await res.json();
      const $ = cheerio.load(data.html);

      result = $(".ss-list .ep-item")
        .map((_: number, el: cheerio.Element) => ({
          order: $(el).find(".ssli-order").text().trim(),
          name: $(el).find(".e-dynamic-name").text().trim(),
          epId: $(el).attr("data-id") || null,
        }))
        .get();
      break;
    }

    case 'servers': {
      const sId = episodeId!.toString().match(/\d+/)?.[0];
      if (!sId) throw new Error("Invalid episode id");

      const res = await fetch(`${BASE}/ajax/v2/episode/servers?episodeId=${sId}`, { headers: HEADERS });
      const data = await res.json();
      const $ = cheerio.load(data.html);

      const sub: unknown[] = [];
      const dub: unknown[] = [];

      $(".servers-sub .server-item").each((_: number, el: cheerio.Element) => {
        sub.push({
          server: $(el).text().trim().toLowerCase(),
          serverId: $(el).attr("data-server-id"),
          sourceId: $(el).attr("data-id"),
        });
      });
      $(".servers-dub .server-item").each((_: number, el: cheerio.Element) => {
        dub.push({
          server: $(el).text().trim().toLowerCase(),
          serverId: $(el).attr("data-server-id"),
          sourceId: $(el).attr("data-id"),
        });
      });

      result = { sub, dub };
      break;
    }

    case 'watch': {
      if (!sourceId) throw new Error("sourceId required");

      // Step 1: Get source link from aniwatch (like their AJAX endpoint)
      const srcRes = await fetch(`${BASE}/ajax/v2/episode/sources?id=${sourceId}`, {
        headers: { ...HEADERS, "X-Requested-With": "XMLHttpRequest" },
      });
      const srcData = await srcRes.json();

      if (!srcData?.link) throw new Error("Source link not found");

      // Step 2: Extract hash from MegaCloud embed URL
      const match = srcData.link.match(/\/e(?:-1)?\/(.*?)(?:\?|$)/);
      if (!match) {
        result = {
          sources: [],
          embedUrl: srcData.link,
          tracks: [],
          intro: { start: 0, end: 0 },
          outro: { start: 0, end: 0 },
        };
        break;
      }

      const hash = match[1];
      const embedBase = "megacloud.blog";
      const embedPath = "embed-2/v3/e-1";
      const videoUrl = `https://${embedBase}/${embedPath}/${hash}?k=1`;

      const megaHeaders = {
        "User-Agent": HEADERS["User-Agent"],
        "X-Requested-With": "XMLHttpRequest",
        Accept: "*/*",
        Referer: videoUrl,
      };

      // Step 3: Get the embed page to extract nonce
      const iframeRes = await fetch(videoUrl, { headers: megaHeaders });
      const iframeHtml = await iframeRes.text();

      const nonceMatch = iframeHtml.match(/\b[a-zA-Z0-9]{48}\b/) ||
        iframeHtml.match(/\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b/);

      const nonce = nonceMatch
        ? nonceMatch.length === 4
          ? nonceMatch.slice(1).join("")
          : nonceMatch[0]
        : null;

      if (!nonce) throw new Error("Nonce not found");

      const videoId = videoUrl.split("/").pop()?.split("?")[0];

      // Step 4: Get sources
      const sourcesUrl = `https://${embedBase}/${embedPath}/getSources?id=${videoId}&_k=${nonce}`;
      const sourcesRes = await fetch(sourcesUrl, { headers: megaHeaders });
      const sourcesData = await sourcesRes.json();

      if (!sourcesData) throw new Error("Invalid video id");

      if (!sourcesData.encrypted && Array.isArray(sourcesData.sources)) {
        result = {
          sources: sourcesData.sources.map((s: { file: string; type: string }) => ({ url: s.file, type: s.type })),
          tracks: sourcesData.tracks || [],
          intro: sourcesData.intro || { start: 0, end: 0 },
          outro: sourcesData.outro || { start: 0, end: 0 },
        };
      } else {
        // Handle encrypted sources
        const scriptUrl = `https://megacloud.blog/js/player/a/v3/pro/embed-1.min.js?v=${Date.now()}`;
        const scriptRes = await fetch(scriptUrl);
        const scriptText = await scriptRes.text();

        const varRegex = /case\s*0x[0-9a-f]+:(?![^;]*partKey)\s*\w+\s*=\s*(\w+)\s*,\s*\w+\s*=\s*(\w+);/g;
        const varMatches = scriptText.matchAll(varRegex);

        const matchKey = (value: string, script: string) => {
          const regex = new RegExp(`,${value}=((?:0x)?([0-9a-fA-F]+))`);
          const m = script.match(regex);
          if (!m) throw new Error("Key match failed");
          return m[1].replace(/^0x/, "");
        };

        const vars = Array.from(varMatches, (m) => {
          const k1 = matchKey(m[1], scriptText);
          const k2 = matchKey(m[2], scriptText);
          return [parseInt(k1, 16), parseInt(k2, 16)];
        });

        if (!vars.length) throw new Error("Decrypt key not found");

        const sourceStr = sourcesData.sources;
        let secret = "";
        const encArr = sourceStr.split("");
        let currentIndex = 0;

        for (const index of vars) {
          const start = index[0] + currentIndex;
          const end = start + index[1];
          for (let i = start; i < end; i++) {
            secret += sourceStr[i];
            encArr[i] = "";
          }
          currentIndex += index[1];
        }

        const encryptedSource = encArr.join("");

        const cipher = Uint8Array.from(atob(encryptedSource), (c) => c.charCodeAt(0));
        const salt = cipher.slice(8, 16);

        const passwordBytes = new TextEncoder().encode(secret);
        const password = new Uint8Array([...passwordBytes, ...salt]);

        async function md5(data: Uint8Array): Promise<Uint8Array> {
          const hash = await crypto.subtle.digest("MD5", data.buffer as ArrayBuffer);
          return new Uint8Array(hash);
        }

        const hashes: Uint8Array[] = [];
        let digest = password;

        for (let i = 0; i < 3; i++) {
          hashes[i] = await md5(digest);
          const newDigest = new Uint8Array(hashes[i].length + password.length);
          newDigest.set(hashes[i]);
          newDigest.set(password, hashes[i].length);
          digest = newDigest;
        }

        const key = new Uint8Array([...hashes[0], ...hashes[1]]);
        const iv = hashes[2];
        const contents = cipher.slice(16);

        const cryptoKey = await crypto.subtle.importKey(
          "raw", key, { name: "AES-CBC" }, false, ["decrypt"]
        );
        const decrypted = await crypto.subtle.decrypt(
          { name: "AES-CBC", iv: iv.buffer as ArrayBuffer }, cryptoKey, contents.buffer as ArrayBuffer
        );

        const decoded = new TextDecoder().decode(decrypted);
        const padLen = decoded.charCodeAt(decoded.length - 1);
        const unpadded = decoded.slice(0, decoded.length - padLen);
        const parsed = JSON.parse(unpadded);

        result = {
          sources: parsed.map((s: { file: string; type: string }) => ({ url: s.file, type: s.type })),
          tracks: sourcesData.tracks || [],
          intro: sourcesData.intro || { start: 0, end: 0 },
          outro: sourcesData.outro || { start: 0, end: 0 },
        };
      }
      break;
    }

    case 'special': {
      const url = `${BASE}/special?page=${page || 1}`;
      const $ = await fetchPage(url);
      const results: unknown[] = [];
      $(".flw-item").each((_: number, el: cheerio.Element) => {
        results.push(parseAnimeCard($, el));
      });
      const hasNext = $(".pagination .page-item").last().hasClass("active") === false && $(".pagination .page-item").length > 0;
      result = { results, hasNextPage: hasNext };
      break;
    }

    case 'movie': {
      const url = (page || 1) > 1 ? `${BASE}/movie?page=${page}` : `${BASE}/movie`;
      const $ = await fetchPage(url);
      const results: unknown[] = [];
      $(".film_list-wrap .flw-item, .flw-item").each((_: number, el: cheerio.Element) => {
        results.push(parseAnimeCard($, el));
      });
      const hasNext = $(".pagination .page-item").last().hasClass("active") === false && $(".pagination .page-item").length > 0;
      result = { results, hasNextPage: hasNext };
      break;
    }

    case 'genres': {
      const $ = await fetchPage(`${BASE}/home`);
      const genres: unknown[] = [];
      $("#sidebar_subs_genre a.nav-link").each((_: number, el: cheerio.Element) => {
        const name = $(el).text().trim();
        const link = $(el).attr("href");
        if (!link) return;
        genres.push({ name, id: link.split("/")[2] || link.split("/").pop() });
      });
      result = { genres };
      break;
    }

    case 'genre': {
      const url = `${BASE}/genre/${id}?page=${page || 1}`;
      const $ = await fetchPage(url);
      const results: unknown[] = [];
      $(".flw-item").each((_: number, el: cheerio.Element) => {
        results.push(parseAnimeCard($, el));
      });
      const hasNext = $(".pagination .page-item").last().hasClass("active") === false && $(".pagination .page-item").length > 0;
      result = { results, hasNextPage: hasNext };
      break;
    }

    case 'translate-subtitle': {
      if (!subtitleUrl) throw new Error("subtitleUrl required");

      // Check DB cache first
      const urlHash = simpleHash(subtitleUrl);
      const dbCached = await getCachedTranslation(urlHash);
      if (dbCached) {
        result = { vtt: dbCached };
        break;
      }

      const subRes = await fetch(subtitleUrl);
      if (!subRes.ok) throw new Error("Failed to fetch subtitle source");
      const subText = await subRes.text();

      const lines = subText.split("\n");
      const cues: { timestamp: string; text: string[] }[] = [];
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (line.includes("-->")) {
          const timestamp = line;
          const textLines: string[] = [];
          i++;
          while (i < lines.length && lines[i].trim() !== "") {
            textLines.push(lines[i]);
            i++;
          }
          cues.push({ timestamp, text: textLines });
        } else {
          i++;
        }
      }

      if (!cues.length) throw new Error("No subtitle cues found");

      const translateBatch = async (texts: string[]): Promise<string[]> => {
        const joined = texts.join("\n");

        // Provider 1: Google Translate (free, fast)
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(joined)}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const translated = Array.isArray(data?.[0])
              ? data[0].map((p: any) => p?.[0] ?? "").join("")
              : "";
            const split = translated.split("\n");
            if (split.length === texts.length) return split;
          }
        } catch { /* fallback */ }

        // Provider 2: OpenRouter (ultra-fast AI)
try {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (apiKey) {

    const DELIM = "<<<SEP>>>";

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.com", // optional
        "X-Title": "subtitle-translator"
      },
      body: JSON.stringify({
        // 🔥 model cepat
        model: "deepseek/deepseek-chat", 
        temperature: 0,
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content:
              "Translate to Indonesian. Keep EXACT structure. Do not merge or split lines. Return ONLY translation separated by <<<SEP>>>."
          },
          {
            role: "user",
            content: texts.join(` ${DELIM} `)
          }
        ],
      }),
    });

    if (aiRes.ok) {
      const ai = await aiRes.json();
      const raw = ai?.choices?.[0]?.message?.content || "";

      let split = raw.split(DELIM).map((l: string) => l.trim()).filter(Boolean);

      if (split.length !== texts.length) {
        split = raw.split("\n").map((l: string) => l.trim()).filter(Boolean);
      }

      if (split.length === texts.length) return split;
      if (split.length > texts.length) return split.slice(0, texts.length);

      return texts.map((t, i) => split[i] || t);
    }
  }
} catch { /* fallback */ }

        // Provider 3: MyMemory fallback
        try {
          const results: string[] = [];
          for (const text of texts) {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|id`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              results.push(data?.responseData?.translatedText || text);
            } else {
              results.push(text);
            }
          }
          return results;
        } catch { /* return original */ }

        return texts;
      };

      const translatedCues: string[] = [];
      const BATCH_SIZE = 30;

      for (let i = 0; i < cues.length; i += BATCH_SIZE) {
        const batch = cues.slice(i, i + BATCH_SIZE);
        const texts = batch.map(c => c.text.join("\n"));
        const translated = await translateBatch(texts);
        batch.forEach((cue, idx) => {
          translatedCues.push(cue.timestamp + "\n" + translated[idx]);
        });
      }

      const vtt = "WEBVTT\n\n" + translatedCues.join("\n\n");

      // Save to DB cache (fire-and-forget)
      saveCachedTranslation(urlHash, subtitleUrl, vtt);

      result = { vtt };
      break;
    }

    default:
      throw new Error("Invalid action");
  }

  return JSON.stringify(result);
}
