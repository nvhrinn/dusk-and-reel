import * as cheerio from "npm:cheerio@1.0.0";

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, page, id, episodeId, sourceId } = await req.json();

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
            id: $(el).find("a").attr("href")?.split("/")[1],
            image: $(el).find("img").attr("data-src"),
          });
        });

        result = { slides, trending };
        break;
      }

      case 'search': {
        const url = `${BASE}/search?keyword=${encodeURIComponent(query)}&page=${page || 1}`;
        const $ = await fetchPage(url);
        const results: unknown[] = [];

        $(".flw-item").each((_: number, el: cheerio.Element) => {
          results.push({
            name: $(el).find(".dynamic-name").text(),
            jname: $(el).find(".dynamic-name").attr("data-jname"),
            format: $(el).find(".fdi-item").eq(0).text(),
            duration: $(el).find(".fdi-item").eq(1).text(),
            id: $(el).find(".film-name a").attr("href")?.split("/")[1],
            sub: $(el).find(".tick-sub").text(),
            dub: $(el).find(".tick-dub").text() || "0",
            totalEp: $(el).find(".tick-eps").text() || null,
            image: $(el).find("img").attr("data-src"),
            rating: $(el).find(".tick-rate").text() || null,
          });
        });

        result = { results };
        break;
      }

      case 'info': {
        const $ = await fetchPage(`${BASE}/${id}`);
        result = {
          name: $(".film-name.dynamic-name").text().trim(),
          jname: $(".dynamic-name").attr("data-jname"),
          image: $(".film-poster img").attr("src"),
          description: $(".text").text().trim(),
          pg: $(".tick-pg").text(),
          quality: $(".tick-quality").text(),
          sub: $(".tick-sub").text(),
          dub: $(".tick-dub").text() || null,
          totalEp: $(".tick-eps").text() || null,
          format: $(".item").eq(0).text(),
          duration: $(".item").eq(1).text(),
          genre: $(".item-list a").map((_: number, el: cheerio.Element) => $(el).text()).get(),
          id: $(".film-buttons a").attr("href")?.split("/watch/")[1] || null,
        };
        break;
      }

      case 'episodes': {
        const animeId = id.match(/\d+/)?.[0];
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

        $(".ps_-block.ps_-block-sub.servers-sub .ps__-list .server-item").each((_: number, el: cheerio.Element) => {
          sub.push({
            server: $(el).text().trim().toLowerCase(),
            serverId: $(el).attr("data-server-id"),
            sourceId: $(el).attr("data-id"),
          });
        });

        $(".ps_-block.ps_-block-sub.servers-dub .ps__-list .server-item").each((_: number, el: cheerio.Element) => {
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

        const match = srcData.link.match(/\/e-1\/(.*?)\?/);
        if (!match) throw new Error("Invalid MegaCloud link");

        const hash = match[1];
        const videoUrl = `https://megacloud.blog/embed-2/v3/e-1/${hash}?k=1`;

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

        const sourcesUrl = `https://megacloud.blog/embed-2/v3/e-1/getSources?id=${videoId}&_k=${nonce}`;
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
