import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { aniwatchApi } from "@/lib/api";
import VideoPlayer from "@/components/VideoPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Subtitles, Mic, Monitor } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const epId = params.get("ep");
  const navigate = useNavigate();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [audioType, setAudioType] = useState<"sub" | "dub">("sub");

  const { data: episodes } = useQuery({
    queryKey: ["episodes", id],
    queryFn: () => aniwatchApi.episodes(id!),
    enabled: !!id,
  });

  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ["servers", epId],
    queryFn: () => aniwatchApi.servers(epId!),
    enabled: !!epId,
  });

  // Filter to megacloud only
  const megacloudServers = servers
    ? {
        sub: servers.sub?.filter((s) => s.server === "megacloud") || [],
        dub: servers.dub?.filter((s) => s.server === "megacloud") || [],
      }
    : null;

  // Auto-select megacloud server when audio type or servers change
  useEffect(() => {
    if (!megacloudServers) return;
    const list = audioType === "sub" ? megacloudServers.sub : megacloudServers.dub;
    if (list?.length) {
      setSelectedSourceId(list[0].sourceId);
    } else if (audioType === "dub" && megacloudServers.sub?.length) {
      // Fallback to sub if dub not available
      setAudioType("sub");
      setSelectedSourceId(megacloudServers.sub[0].sourceId);
    } else if (audioType === "sub" && megacloudServers.dub?.length) {
      setAudioType("dub");
      setSelectedSourceId(megacloudServers.dub[0].sourceId);
    }
  }, [servers, audioType]);

  const { data: stream, isLoading: streamLoading } = useQuery({
    queryKey: ["watch", selectedSourceId],
    queryFn: () => aniwatchApi.watch(selectedSourceId!),
    enabled: !!selectedSourceId,
    retry: 1,
  });

  const currentEp = episodes?.find((e) => e.epId === epId);
  const streamUrl = stream?.sources?.[0]?.url;

  const handlePlayerError = useCallback(() => {}, []);

  const hasSub = megacloudServers && megacloudServers.sub.length > 0;
  const hasDub = megacloudServers && megacloudServers.dub.length > 0;

  return (
    <div className="min-h-screen pt-14 bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Back button */}
        <button
          onClick={() => navigate(`/anime/${id}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke detail
        </button>

        {/* Player */}
        {streamLoading || serversLoading ? (
          <Skeleton className="w-full aspect-video rounded-lg" />
        ) : streamUrl ? (
          <VideoPlayer
            src={streamUrl}
            tracks={stream?.tracks}
            intro={stream?.intro}
            outro={stream?.outro}
            onError={handlePlayerError}
          />
        ) : stream?.embedUrl ? (
          <div className="w-full aspect-video rounded-lg overflow-hidden">
            <iframe
              src={stream.embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-lg bg-secondary flex items-center justify-center">
            <p className="text-muted-foreground">Pilih server untuk mulai menonton</p>
          </div>
        )}

        {/* Episode title + Controls row */}
        <div className="mt-4 space-y-4">
          {currentEp && (
            <h2 className="font-display font-bold text-lg">
              Episode {currentEp.order}
              {currentEp.name && ` — ${currentEp.name}`}
            </h2>
          )}

          {/* Audio & Server controls */}
          {megacloudServers && (hasSub || hasDub) && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              {/* Audio type */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audio</span>
                <div className="flex rounded-md overflow-hidden border border-border">
                  {hasSub && (
                    <button
                      onClick={() => setAudioType("sub")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                        audioType === "sub"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Subtitles className="w-3.5 h-3.5" /> Sub
                    </button>
                  )}
                  {hasDub && (
                    <button
                      onClick={() => setAudioType("dub")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                        audioType === "dub"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" /> Dub
                    </button>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-border hidden sm:block" />

              {/* Server badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Server</span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                  <Monitor className="w-3.5 h-3.5" /> MegaCloud
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Episode list */}
        {episodes && episodes.length > 0 && (
          <section className="mt-8 pb-8">
            <h3 className="font-display font-bold text-lg mb-3">Episodes</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {episodes.map((ep) => (
                <button
                  key={ep.epId}
                  onClick={() => navigate(`/watch/${id}?ep=${ep.epId}`)}
                  className={`h-10 rounded-md text-sm font-medium transition-colors ${
                    ep.epId === epId
                      ? "bg-primary text-primary-foreground glow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {ep.order}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default WatchPage;
