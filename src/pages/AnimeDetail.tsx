import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { aniwatchApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft, Subtitles, Mic, Clock, Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const AnimeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { data: info, isLoading: infoLoading } = useQuery({
    queryKey: ["info", id],
    queryFn: () => aniwatchApi.info(id!),
    enabled: !!id,
  });

  const watchId = info?.id || id;

  const { data: episodes, isLoading: epsLoading } = useQuery({
    queryKey: ["episodes", watchId],
    queryFn: () => aniwatchApi.episodes(watchId!),
    enabled: !!watchId,
  });

  if (infoLoading) {
    return (
      <div className="min-h-screen pt-14">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-72 aspect-[3/4] rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center">
        <p className="text-muted-foreground">Anime not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14">
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {info.image && (
          <img src={info.image} alt="" className="w-full h-full object-cover blur-sm scale-105 opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-40 relative z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-48 md:w-64 shrink-0">
            {info.image && (
              <img src={info.image} alt={info.name} className="w-full rounded-lg shadow-2xl" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl md:text-4xl">{info.name}</h1>
            {info.jname && (
              <p className="text-muted-foreground text-sm mt-1">{info.jname}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {info.quality && <Badge variant="secondary">{info.quality}</Badge>}
              {info.pg && <Badge variant="secondary">{info.pg}</Badge>}
              {info.sub && (
                <Badge variant="secondary">
                  <Subtitles className="w-3 h-3 mr-1" /> SUB {info.sub}
                </Badge>
              )}
              {info.dub && (
                <Badge variant="secondary">
                  <Mic className="w-3 h-3 mr-1" /> DUB {info.dub}
                </Badge>
              )}
              {info.format && (
                <Badge variant="outline">
                  <Film className="w-3 h-3 mr-1" /> {info.format}
                </Badge>
              )}
              {info.duration && (
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" /> {info.duration}
                </Badge>
              )}
              {info.totalEp && (
                <Badge variant="outline">
                  {info.totalEp} Episodes
                </Badge>
              )}
            </div>

            {info.genre?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {info.genre.map((g) => (
                  <Badge key={g} className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            )}

            {info.description && (
              <div className="mt-4">
                <p
                  className={`text-sm text-muted-foreground leading-relaxed max-w-2xl ${
                    !showFullDesc ? "line-clamp-4" : ""
                  }`}
                >
                  {info.description}
                </p>
                {info.description.length > 200 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-primary text-xs mt-1 hover:underline"
                  >
                    {showFullDesc ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {episodes && episodes.length > 0 && (
              <Button
                className="mt-6 glow-sm font-display"
                onClick={() => navigate(`/watch/${watchId}?ep=${episodes[0].epId}`)}
              >
                <Play className="w-4 h-4 mr-2" /> Start Watching
              </Button>
            )}
          </div>
        </div>

        {/* Episodes */}
        <section className="mt-10 pb-10">
          <h2 className="font-display font-bold text-lg mb-4">Episodes</h2>

          {epsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
          ) : !episodes?.length ? (
            <p className="text-muted-foreground text-sm">No episodes available</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {episodes.map((ep) => (
                <button
                  key={ep.epId}
                  onClick={() => navigate(`/watch/${watchId}?ep=${ep.epId}`)}
                  className="h-12 rounded-md bg-secondary hover:bg-accent border border-border text-sm font-medium transition-colors flex items-center justify-center gap-1 group"
                >
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    {ep.order}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AnimeDetail;
