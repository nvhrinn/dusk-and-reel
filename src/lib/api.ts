import { supabase } from "@/integrations/supabase/client";

export interface AnimeSlide {
  name: string;
  image: string;
  id: string;
}

export interface AnimeTrending {
  name: string;
  rank: string;
  id: string;
  image?: string;
}

export interface AnimeSearchResult {
  name: string;
  jname: string;
  format: string;
  duration: string;
  id: string;
  sub: string;
  dub: string;
  totalEp: string | null;
  image: string;
  rating: string | null;
}

export interface AnimeInfo {
  name: string;
  jname: string;
  image: string;
  description: string;
  pg: string;
  quality: string;
  sub: string;
  dub: string | null;
  totalEp: string | null;
  format: string;
  duration: string;
  genre: string[];
  id: string | null;
}

export interface Episode {
  order: string;
  name: string;
  epId: string | null;
}

export interface Server {
  server: string;
  serverId: string;
  sourceId: string;
}

export interface StreamSource {
  url: string;
  type: string;
}

export interface StreamData {
  sources: StreamSource[];
  tracks: { file: string; label: string; kind: string }[];
  intro: { start: number; end: number };
  outro: { start: number; end: number };
}

async function callApi<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("aniwatch", { body });
  if (error) throw new Error(error.message);
  return data as T;
}

export const aniwatchApi = {
  home: () => callApi<{ slides: AnimeSlide[]; trending: AnimeTrending[] }>({ action: "home" }),
  search: (query: string, page = 1) => callApi<{ results: AnimeSearchResult[] }>({ action: "search", query, page }),
  info: (id: string) => callApi<AnimeInfo>({ action: "info", id }),
  episodes: (id: string) => callApi<Episode[]>({ action: "episodes", id }),
  servers: (episodeId: string) => callApi<{ sub: Server[]; dub: Server[] }>({ action: "servers", episodeId }),
  watch: (sourceId: string) => callApi<StreamData>({ action: "watch", sourceId }),
};
