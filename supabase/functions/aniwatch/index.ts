import * as cheerio from "npm:cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE = "https://aniwatchtv.to";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET = HLS proxy mode (bypass CDN CORS restrictions)
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

      // For m3u8 playlists, rewrite relative URLs to absolute
      if (contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8')) {
        let text = await proxyRes.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        // Replace relative paths (lines not starting with # or http) with absolute URLs
        text = text.replace(/^(?!#)(?!https?:\/\/)(.+)$/gm, (match) => {
          return baseUrl + match.trim();
        });
        return new Response(text, {
          status: proxyRes.status,
          headers: { ...corsHeaders, 'Content-Type': contentType },
        });
      }

      const body = await proxyRes.arrayBuffer();
      return new Response(body, {
        status: proxyRes.status,
        headers: { ...corsHeaders, 'Content-Type': contentType },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Proxy error';
      return new Response(msg, { status: 502, headers: corsHeaders });
    }
  }

  try {
    const { action, query, page, id, episodeId, sourceId, subtitleUrl } = await req.json();

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

        // Scrape additional sections
        const latestEpisodes: unknown[] = [];
        const popular: unknown[] = [];
        const topAiring: unknown[] = [];

        // Latest Episode section
        $("section.block_area.block_area_home:has(.cat-heading:contains('Latest Episode'))").find(".flw-item").each((_: number, el: cheerio.Element) => {
          latestEpisodes.push(parseAnimeCard($, el));
        });

        // If that didn't work, try a more general approach
        if (latestEpisodes.length === 0) {
          $(".anif-block-ul").first().find(".flw-item").each((_: number, el: cheerio.Element) => {
            latestEpisodes.push(parseAnimeCard($, el));
          });
        }

        // Top Airing section
        $("section.block_area.block_area_home:has(.cat-heading:contains('Top Airing'))").find(".flw-item").each((_: number, el: cheerio.Element) => {
          topAiring.push(parseAnimeCard($, el));
        });

        if (topAiring.length === 0) {
          $(".anif-block-ul").eq(1).find(".flw-item").each((_: number, el: cheerio.Element) => {
            topAiring.push(parseAnimeCard($, el));
          });
        }

        // Most Popular section
        $("section.block_area.block_area_home:has(.cat-heading:contains('Most Popular'))").find(".flw-item").each((_: number, el: cheerio.Element) => {
          popular.push(parseAnimeCard($, el));
        });

        if (popular.length === 0) {
          $(".anif-block-ul").eq(2).find(".flw-item").each((_: number, el: cheerio.Element) => {
            popular.push(parseAnimeCard($, el));
          });
        }

        // Upcoming Anime section
        const upcoming: unknown[] = [];
        $("section.block_area.block_area_home:has(.cat-heading:contains('Upcoming'))").find(".flw-item").each((_: number, el: cheerio.Element) => {
          const card = parseAnimeCard($, el);
          // Override duration with release date info if available
          const release = $(el).find(".fdi-item.fdi-duration").text().trim();
          if (release) (card as any).duration = release;
          upcoming.push(card);
        });

        result = { slides, trending, latestEpisodes, topAiring, popular, upcoming };
        break;
      }

      case 'search': {
        const url = `${BASE}/search?keyword=${encodeURIComponent(query)}&page=${page || 1}`;
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
        
        // Better selectors for anime info
        const aniDetail = $(".anisc-detail");
        const filmStats = $(".film-stats");
        
        // Get sub/dub/ep counts from the stats items specifically
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

        // Get format and duration from item-head/item-title pairs
        let format = "", duration = "";
        $(".item-head").each((_: number, el: cheerio.Element) => {
          const label = $(el).text().trim().toLowerCase();
          const value = $(el).next(".name").text().trim();
          if (label.includes("type")) format = value;
          else if (label.includes("duration")) duration = value;
        });

        // Fallback: try from spe-infos
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

        // Remove duplicate descriptions (site often has them doubled)
        const halfLen = Math.floor(description.length / 2);
        const cleanDesc = description.slice(0, halfLen) === description.slice(halfLen).trim()
          ? description.slice(0, halfLen).trim()
          : description;

        const genres: string[] = [];
        $(".item-list a[href*='genre']").each((_: number, el: cheerio.Element) => {
          genres.push($(el).text().trim());
        });

        // Fallback genre extraction
        if (genres.length === 0) {
          $(".item-title a").each((_: number, el: cheerio.Element) => {
            const href = $(el).attr("href") || "";
            if (href.includes("genre")) {
              genres.push($(el).text().trim());
            }
          });
        }

        result = {
          name: aniDetail.find(".film-name.dynamic-name").text().trim() ||
            $(".film-name.dynamic-name").text().trim(),
          jname: aniDetail.find(".dynamic-name").attr("data-jname") ||
            $(".dynamic-name").attr("data-jname"),
          image: $(".film-poster img").attr("src") || $(".film-poster img").attr("data-src"),
          description: cleanDesc,
          pg,
          quality,
          sub,
          dub: dub || null,
          totalEp: totalEp || null,
          format,
          duration,
          genre: genres,
          id: $(".film-buttons a").attr("href")?.split("/watch/")[1] ||
            $(".btn-play").attr("href")?.replace("/watch/", "") || null,
        };
        break;
      }

      case 'episodes': {
        const animeIdMatch = id.match(/-(\d+)(?:\?.*)?$/) || id.match(/(\d+)(?:\?.*)?$/);
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
        const sId = episodeId.toString().match(/\d+/)?.[0];
        if (!sId) throw new Error("Invalid episode id");

        const res = await fetch(`${BASE}/ajax/v2/episode/servers?episodeId=${sId}`, { headers: HEADERS });
        const data = await res.json();
        const $ = cheerio.load(data.html);

        const sub: unknown[] = [];
        const dub: unknown[] = [];

        // Sub servers
        $(".servers-sub .server-item").each((_: number, el: cheerio.Element) => {
          sub.push({
            server: $(el).text().trim().toLowerCase(),
            serverId: $(el).attr("data-server-id"),
            sourceId: $(el).attr("data-id"),
          });
        });

        // Dub servers
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

        const srcRes = await fetch(`${BASE}/ajax/v2/episode/sources?id=${sourceId}`, { headers: HEADERS });
        const srcData = await srcRes.json();

        if (!srcData?.link) throw new Error("Source link not found");

        // Try to extract from MegaCloud-style link
        const match = srcData.link.match(/\/e(?:-1)?\/(.*?)(?:\?|$)/);
        if (!match) {
          // For non-MegaCloud sources, try to get the direct embed URL
          // Return a fallback with the embed link for iframe usage
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
        
        // Determine the correct MegaCloud endpoint
        const isMegaCloud = srcData.link.includes("megacloud") || srcData.link.includes("e-1");
        const embedBase = isMegaCloud ? "megacloud.blog" : "megacloud.blog";
        const embedPath = isMegaCloud ? "embed-2/v3/e-1" : "embed-2/v3/e-1";
        
        const videoUrl = `https://${embedBase}/${embedPath}/${hash}?k=1`;

        // Extract from MegaCloud
        const megaHeaders = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-Requested-With": "XMLHttpRequest",
          Accept: "*/*",
          Referer: videoUrl,
        };

        const iframeRes = await fetch(videoUrl, { headers: megaHeaders });
        const iframeHtml = await iframeRes.text();

        // Extract nonce
        const nonceMatch = iframeHtml.match(/\b[a-zA-Z0-9]{48}\b/) ||
          iframeHtml.match(/\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b/);

        const nonce = nonceMatch
          ? nonceMatch.length === 4
            ? nonceMatch.slice(1).join("")
            : nonceMatch[0]
          : null;

        if (!nonce) throw new Error("Nonce not found");

        const videoId = videoUrl.split("/").pop()?.split("?")[0];

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

          // Get secret
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

          // Decrypt using Web Crypto API
          const cipher = Uint8Array.from(atob(encryptedSource), (c) => c.charCodeAt(0));
          const salt = cipher.slice(8, 16);

          const passwordBytes = new TextEncoder().encode(secret);
          const password = new Uint8Array([...passwordBytes, ...salt]);

          // MD5 key derivation
          async function md5(data: Uint8Array): Promise<Uint8Array> {
            const hash = await crypto.subtle.digest("MD5", data);
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
            { name: "AES-CBC", iv }, cryptoKey, contents
          );

          const decoded = new TextDecoder().decode(decrypted);
          // Remove PKCS7 padding
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

      case 'translate-subtitle': {
  if (!subtitleUrl) throw new Error("subtitleUrl required");

  const subRes = await fetch(subtitleUrl);
  const subText = await subRes.text();

  const lines = subText.split("\n");
  const cues: { timestamp: string; text: string }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.includes("-->")) {
      const timestamp = line;
      const textLines: string[] = [];
      i++;

      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i].trim());
        i++;
      }

      cues.push({
        timestamp,
        text: textLines.join(" ")
      });
    } else {
      i++;
    }
  }

  if (!cues.length) throw new Error("No subtitle cues found");

  const BATCH_SIZE = 20; // kecilin biar aman
  const translatedCues: string[] = [];

  for (let b = 0; b < cues.length; b += BATCH_SIZE) {
    const batch = cues.slice(b, b + BATCH_SIZE);
    const textsToTranslate = batch.map(c => c.text);

    try {
      const ltRes = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          q: textsToTranslate,
          source: "en",
          target: "id",
          format: "text"
        })
      });

      const ltData = await ltRes.json();

      // FIX handling response
      let translations: string[] = [];

      if (Array.isArray(ltData.translatedText)) {
        translations = ltData.translatedText;
      } else if (typeof ltData.translatedText === "string") {
        translations = [ltData.translatedText];
      } else if (Array.isArray(ltData)) {
        translations = ltData.map((t: any) => t.translatedText);
      }

      for (let idx = 0; idx < batch.length; idx++) {
        const cue = batch[idx];
        const trans = translations[idx] || cue.text;

        translatedCues.push(`${cue.timestamp}\n${trans}`);
      }

    } catch (err) {
      // fallback kalau gagal
      for (const cue of batch) {
        translatedCues.push(`${cue.timestamp}\n${cue.text}`);
      }
    }
  }

  const vtt = "WEBVTT\n\n" + translatedCues.join("\n\n");

  result = { vtt };
  break;
}

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Aniwatch API error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
