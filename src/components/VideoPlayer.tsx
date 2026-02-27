import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import { SkipForward, AlertTriangle, Languages, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Track {
  file: string;
  label: string;
  kind: string;
}

interface VideoPlayerProps {
  src: string;
  tracks?: Track[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  onError?: () => void;
}

const VideoPlayer = ({ src, tracks, intro, outro, onError }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<number>(0);
  const [showTrackMenu, setShowTrackMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = auto

  const hasIntro = intro && intro.end > intro.start && intro.end > 0;
  const hasOutro = outro && outro.end > outro.start && outro.end > 0;

  const subtitleTracks = useMemo(() => {
    const subs = tracks?.filter((t) => t.kind === "captions" || t.kind === "subtitles") || [];
    return subs.sort((a, b) => {
      const priority = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes("indonesian") || l.includes("indonesia") || l.includes("ind")) return 0;
        if (l.includes("english")) return 1;
        return 2;
      };
      return priority(a.label) - priority(b.label);
    });
  }, [tracks]);

  const proxyBase = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/aniwatch?url=`;
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    setShowSkipIntro(!!hasIntro && t >= intro!.start && t < intro!.end);
    setShowSkipOutro(!!hasOutro && t >= outro!.start && t < outro!.end);
  }, [hasIntro, hasOutro, intro, outro]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(false);
    setQualities([]);
    setSelectedQuality(-1);

    if (Hls.isSupported()) {
      class ProxyLoader extends Hls.DefaultConfig.loader {
        load(context: any, config: any, callbacks: any) {
          context.url = `${proxyBase}${encodeURIComponent(context.url)}`;
          super.load(context, config, callbacks);
        }
      }

      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        loader: ProxyLoader,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        // Extract available quality levels
        const levels = hls.levels.map((level, index) => ({
          height: level.height,
          index,
        }));
        setQualities(levels);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data.type, data.details);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setError(true);
            onError?.();
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setError(true);
        onError?.();
      });
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, onError, proxyBase]);

  // Update active subtitle track
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const textTracks = video.textTracks;
    for (let i = 0; i < textTracks.length; i++) {
      textTracks[i].mode = i === selectedTrack ? "showing" : "hidden";
    }
  }, [selectedTrack, subtitleTracks]);

  const handleQualityChange = (levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = levelIndex; // -1 = auto
    setSelectedQuality(levelIndex);
    setShowQualityMenu(false);
  };

  const skipIntro = () => {
    if (videoRef.current && intro) videoRef.current.currentTime = intro.end;
  };
  const skipOutro = () => {
    if (videoRef.current && outro) videoRef.current.currentTime = outro.end;
  };

  if (error) {
    return (
      <div className="relative w-full aspect-video bg-secondary rounded-lg overflow-hidden flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground text-sm">Failed to load video. Try a different server.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
      >
        {subtitleTracks.map((track, i) => (
          <track
            key={`${track.label}-${i}`}
            src={track.file}
            label={track.label}
            kind="subtitles"
            default={i === selectedTrack}
          />
        ))}
      </video>

      {/* Top-right controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Quality selector */}
        {qualities.length > 1 && (
          <div className="relative">
            <button
              onClick={() => { setShowQualityMenu((v) => !v); setShowTrackMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              {selectedQuality === -1 ? "Auto" : `${qualities.find(q => q.index === selectedQuality)?.height}p`}
            </button>

            {showQualityMenu && (
              <div className="absolute top-full right-0 mt-1 min-w-[120px] rounded-md bg-black/90 backdrop-blur-lg border border-white/10 shadow-lg overflow-hidden animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold border-b border-white/10">
                  Quality
                </div>
                <button
                  onClick={() => handleQualityChange(-1)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    selectedQuality === -1
                      ? "bg-primary text-primary-foreground"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  Auto
                </button>
                {qualities
                  .sort((a, b) => b.height - a.height)
                  .map((q) => (
                    <button
                      key={q.index}
                      onClick={() => handleQualityChange(q.index)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        selectedQuality === q.index
                          ? "bg-primary text-primary-foreground"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {q.height}p
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Subtitle language selector */}
        {subtitleTracks.length > 0 && (
          <div className="relative">
            <button
              onClick={() => { setShowTrackMenu((v) => !v); setShowQualityMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              {subtitleTracks[selectedTrack]?.label || "Subtitles"}
            </button>

            {showTrackMenu && (
              <div className="absolute top-full right-0 mt-1 min-w-[160px] max-h-[240px] overflow-y-auto rounded-md bg-black/90 backdrop-blur-lg border border-white/10 shadow-lg overflow-hidden animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold border-b border-white/10">
                  Subtitle Language
                </div>
                {subtitleTracks.map((track, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedTrack(i);
                      setShowTrackMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      i === selectedTrack
                        ? "bg-primary text-primary-foreground"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {track.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showSkipIntro && (
        <Button
          size="sm"
          className="absolute bottom-20 right-4 z-10 glow-sm font-display animate-fade-in"
          onClick={skipIntro}
        >
          <SkipForward className="w-4 h-4 mr-1" /> Skip Intro
        </Button>
      )}

      {showSkipOutro && (
        <Button
          size="sm"
          className="absolute bottom-20 right-4 z-10 glow-sm font-display animate-fade-in"
          onClick={skipOutro}
        >
          <SkipForward className="w-4 h-4 mr-1" /> Skip Outro
        </Button>
      )}
    </div>
  );
};

export default VideoPlayer;
