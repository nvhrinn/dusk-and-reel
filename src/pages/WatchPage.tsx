import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { aniwatchApi } from "@/lib/api";
import VideoPlayer from "@/components/VideoPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Subtitles, Mic } from "lucide-react";
import { useState, useEffect } from "react";

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

  // Auto-select first server
  useEffect(() => {
    if (servers) {
      const list = audioType === "sub" ? servers.sub : servers.dub;
      if (list?.length) {
        setSelectedSourceId(list[0].sourceId);
      } else if (servers.sub?.length) {
        setAudioType("sub");
        setSelectedSourceId(servers.sub[0].sourceId);
      }
    }
  }, [servers, audioType]);

  const { data: stream, isLoading: streamLoading } = useQuery({
    queryKey: ["watch", selectedSourceId],
    queryFn: () => aniwatchApi.watch(selectedSourceId!),
    enabled: !!selectedSourceId,
  });

  const currentEp = episodes?.find((e) => e.epId === epId);
  const streamUrl = stream?.sources?.[0]?.url;

  return (
    <div className="min-h-screen pt-14">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/anime/${id}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to details
        </button>

        {/* Player */}
        {streamLoading || serversLoading ? (
          <Skeleton className="w-full aspect-video rounded-lg" />
        ) : streamUrl ? (
          <VideoPlayer src={streamUrl} tracks={stream?.tracks} />
        ) : (
          <div className="w-full aspect-video rounded-lg bg-secondary flex items-center justify-center">
            <p className="text-muted-foreground">Select a server to start watching</p>
          </div>
        )}

        {/* Episode title */}
        {currentEp && (
          <h2 className="font-display font-bold text-lg mt-4">
            Episode {currentEp.order}
            {currentEp.name && ` - ${currentEp.name}`}
          </h2>
        )}

        {/* Audio type toggle */}
        {servers && (
          <div className="flex gap-2 mt-4">
            {servers.sub?.length > 0 && (
              <button
                onClick={() => setAudioType("sub")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  audioType === "sub"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Subtitles className="w-4 h-4" /> Sub
              </button>
            )}
            {servers.dub?.length > 0 && (
              <button
                onClick={() => setAudioType("dub")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  audioType === "dub"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mic className="w-4 h-4" /> Dub
              </button>
            )}
          </div>
        )}

        {/* Server list */}
        {servers && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(audioType === "sub" ? servers.sub : servers.dub)?.map((s) => (
              <button
                key={s.sourceId}
                onClick={() => setSelectedSourceId(s.sourceId)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  selectedSourceId === s.sourceId
                    ? "bg-primary text-primary-foreground glow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.server}
              </button>
            ))}
          </div>
        )}

        {/* Episode list */}
        {episodes && episodes.length > 0 && (
          <section className="mt-8 pb-8">
            <h3 className="font-display font-bold text-lg mb-3">Episodes</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12 gap-2">
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
