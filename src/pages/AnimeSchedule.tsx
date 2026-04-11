import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Star, Radio, Info } from "lucide-react";
import { useState, useEffect } from "react";

/* ================= HELPERS ================= */

async function fetchAllWeek() {
  let page = 1;
  let hasNextPage = true;
  let results: any[] = [];

  const { from, to } = getWeekRange();

  while (hasNextPage) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
        query ($page: Int, $from: Int, $to: Int) {
          Page(page: $page, perPage: 50) {
            pageInfo {
              hasNextPage
            }
            airingSchedules(
              airingAt_greater: $from
              airingAt_lesser: $to
              sort: TIME
            ) {
              airingAt
              episode
              media {
                id
                title { romaji english }
                coverImage { extraLarge large }
                genres
                averageScore
                format
              }
            }
          }
        }`,
        variables: { page, from, to },
      }),
    });

    const json = await res.json();

    const pageData = json?.data?.Page;
    if (!pageData) break;

    results.push(...pageData.airingSchedules);

    hasNextPage = pageData.pageInfo.hasNextPage;
    page++;
  }

  // 🔥 REMOVE DUPLICATE
  const map = new Map();

  results.forEach((item: any) => {
    const id = item.media.id;

    if (!map.has(id) || map.get(id).airingAt > item.airingAt) {
      map.set(id, item);
    }
  });

  return Array.from(map.values())
    .map((item: any) => ({
      id: item.media.id,
      title: item.media.title.romaji || item.media.title.english,
      image:
        item.media.coverImage.extraLarge ||
        item.media.coverImage.large,
      episode: item.episode,
      airingAt: item.airingAt,
      time: new Date(item.airingAt * 1000).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      score: item.media.averageScore,
      genres: item.media.genres,
      format: item.media.format,
    }))
    .sort((a, b) => {
      const now = Date.now();
      const aAired = a.airingAt * 1000 <= now;
      const bAired = b.airingAt * 1000 <= now;

      if (aAired !== bAired) return aAired ? 1 : -1;
      if (!aAired) return a.airingAt - b.airingAt;
      return b.airingAt - a.airingAt;
    });
}

function getDayRange(dayIndex: number) {
  const now = new Date();

  const start = new Date(now);
  const currentDay = start.getDay();

  const diff = dayIndex - currentDay;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return {
    from: Math.floor(start.getTime() / 1000),
    to: Math.floor(end.getTime() / 1000),
  };
}

function getWeekRange() {
  const now = new Date();

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    from: Math.floor(start.getTime() / 1000),
    to: Math.floor(end.getTime() / 1000),
  };
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return "WINTER";
  if (month <= 6) return "SPRING";
  if (month <= 9) return "SUMMER";
  return "FALL";
}

function formatSeason(season: string) {
  return season.charAt(0) + season.slice(1).toLowerCase();
}

function getCountdown(timestamp: number) {
  const diff = timestamp * 1000 - Date.now();
  if (diff <= 0) return "Aired";

  const h = Math.floor(diff / 1000 / 3600);
  const m = Math.floor((diff / 1000 / 60) % 60);
  return `${h}h ${m}m`;
}

function isNowAiring(timestamp: number) {
  const diff = timestamp * 1000 - Date.now();
  return diff <= 0 && diff > -30 * 60 * 1000;
}

/* ================= FETCH ================= */

async function fetchAnimeSchedule(mode: string, selectedDay: number) {
  let query = "";
  let variables: any = {};

  // ✅ SEASON
  if (mode === "season") {
    query = `
    query ($season: MediaSeason, $year: Int) {
      Page(perPage: 50) {
        media(season: $season, seasonYear: $year, type: ANIME) {
          id
          title { romaji english }
          coverImage { extraLarge large }
          genres
          averageScore
          format
        }
      }
    }`;

    variables = {
      season: getCurrentSeason(),
      year: new Date().getFullYear(),
    };
  }

  // 🔥 FIX ALL WEEK (WAJIB PAGINATION)
  else if (mode === "all") {
    return await fetchAllWeek(); // ⬅️ INI KUNCI NYA
  }

  // ✅ DAY
  else {
    const { from, to } = getDayRange(selectedDay);

    query = `
    query ($from: Int, $to: Int) {
      Page(perPage: 50) {
        airingSchedules(
          airingAt_greater: $from
          airingAt_lesser: $to
          sort: TIME
        ) {
          airingAt
          episode
          media {
            id
            title { romaji english }
            coverImage { extraLarge large }
            genres
            averageScore
            format
          }
        }
      }
    }`;

    variables = { from, to };
  }

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  // ✅ SEASON RETURN
  if (mode === "season") {
    return json.data.Page.media.map((m: any) => ({
      id: m.id,
      title: m.title.romaji || m.title.english,
      image: m.coverImage.extraLarge || m.coverImage.large,
      genres: m.genres,
      score: m.averageScore,
      format: m.format,
    }));
  }

  // 🔥 FIX DUPLICATE
  const map = new Map();

  json.data.Page.airingSchedules.forEach((item: any) => {
    const id = item.media.id;

    if (!map.has(id) || map.get(id).airingAt > item.airingAt) {
      map.set(id, item);
    }
  });

  return Array.from(map.values())
    .map((item: any) => ({
      id: item.media.id,
      title: item.media.title.romaji || item.media.title.english,
      image:
        item.media.coverImage.extraLarge ||
        item.media.coverImage.large,
      episode: item.episode,
      airingAt: item.airingAt,
      time: new Date(item.airingAt * 1000).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      score: item.media.averageScore,
      genres: item.media.genres,
      format: item.media.format,
    }))
    .sort((a, b) => {
      const now = Date.now();

      const aAired = a.airingAt * 1000 <= now;
      const bAired = b.airingAt * 1000 <= now;

      if (aAired !== bAired) return aAired ? 1 : -1;
      if (!aAired) return a.airingAt - b.airingAt;
      return b.airingAt - a.airingAt;
    });
}

/* ================= COMPONENT ================= */

const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const AnimeSchedule = () => {
  const navigate = useNavigate();

  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today);
  const [mode, setMode] = useState<"day" | "all" | "season">("day");

  // rerender countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", mode, selectedDay],
    queryFn: () => fetchAnimeSchedule(mode, selectedDay),
    refetchInterval: 60000,
  });

  /* ================= LOADING ================= */

  if (isLoading) {
    return (
      <div className="min-h-screen pt-14">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-6 w-40 mb-4" />

          <div className="flex gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-xl" />
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 pb-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ================= NOW AIRING ================= */

  const nowAiring = data?.filter((a: any) =>
    a.airingAt ? isNowAiring(a.airingAt) : false
  );

  /* ================= UI ================= */

  return (
    <div className="min-h-screen pt-14">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-4">Anime Schedule</h1>

        {/* MODE */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "day", label: "Day" },
            { key: "all", label: "All Week" },
            { key: "season", label: formatSeason(getCurrentSeason()) },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key as any)}
              className={`px-3 py-1.5 rounded-xl text-sm ${
                mode === m.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* DAY */}
        {mode === "day" && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`px-4 py-1.5 rounded-xl text-sm whitespace-nowrap ${
                  selectedDay === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

<div className="mb-5 mt-3 flex items-center justify-between rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-transparent px-4 py-3 backdrop-blur-sm">
  
  {/* LEFT */}
  <div className="flex items-center gap-2 text-xs text-yellow-600">
    <Info className="w-4 h-4 opacity-80" />
    <p>
      Jadwal dapat berubah sewaktu-waktu. Informasi mungkin tidak sepenuhnya akurat karena bersumber dari {" "}
      <a
        href="https://anilist.co"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-yellow-500"
      >
        AniList
      </a>
    </p>
  </div>
</div>

        {/* NOW AIRING */}
        {mode !== "season" && nowAiring?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-2">
  <Radio className="w-4 h-4 animate-pulse text-primary" />
  Now Airing
</h2>
             <div className="flex gap-3 overflow-x-auto">
              {nowAiring.map((a: any) => (
                <div key={a.id} className="w-40 shrink-0">
                  <img src={a.image} className="rounded-lg h-52 w-full object-cover" />
                  <p className="text-xs mt-1 line-clamp-2">{a.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="container mx-auto px-4 pb-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data?.map((anime: any) => (
          <div key={anime.id} className="bg-card rounded-xl overflow-hidden">
            <img src={anime.image} className="w-full h-56 object-cover" />

            <div className="p-2">
              <p className="text-sm font-semibold line-clamp-2">
                {anime.title}
              </p>

              {mode !== "all" && anime.time && (
  <div className="text-xs flex items-center gap-1 mt-1">
    <Clock className="w-3 h-3" /> {anime.time}
  </div>
)}

{mode !== "all" && anime.airingAt && (
  <div
    className={`text-[11px] ${
      anime.airingAt * 1000 <= Date.now()
        ? "text-muted-foreground"
        : "text-primary"
    }`}
  >
    {anime.airingAt * 1000 <= Date.now()
      ? "Aired"
      : getCountdown(anime.airingAt)}
  </div>
)}

              <div className="text-xs mt-1 flex gap-2">
                {anime.episode && <span>Ep {anime.episode}</span>}
                {anime.score && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> {anime.score}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimeSchedule;
