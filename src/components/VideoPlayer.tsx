import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import { SkipForward, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  src: string;
  tracks?: { file: string; label: string; kind: string }[];
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

  const hasIntro = intro && intro.end > intro.start && intro.end > 0;
  const hasOutro = outro && outro.end > outro.start && outro.end > 0;

  // Build proxy base URL for HLS requests
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

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        xhrSetup: (xhr, url) => {
          // Route all HLS requests through our proxy to bypass CORS
          const proxiedUrl = `${proxyBase}${encodeURIComponent(url)}`;
          xhr.open('GET', proxiedUrl, true);
          xhr.withCredentials = false;
        },
      });
      hlsRef.current = hls;

      // Load the source URL through proxy as well
      const proxiedSrc = `${proxyBase}${encodeURIComponent(src)}`;
      hls.loadSource(proxiedSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
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
      // Safari native HLS - can't proxy easily, try direct
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

  const skipIntro = () => {
    if (videoRef.current && intro) videoRef.current.currentTime = intro.end;
  };
  const skipOutro = () => {
    if (videoRef.current && outro) videoRef.current.currentTime = outro.end;
  };

  const subtitleTracks = tracks?.filter((t) => t.kind === "captions" || t.kind === "subtitles") || [];

  if (error) {
    return (
      <div className="relative w-full aspect-video bg-secondary rounded-lg overflow-hidden flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground text-sm">Failed to load video. Try a different server.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
      >
        {subtitleTracks.map((track, i) => (
          <track
            key={i}
            src={track.file}
            label={track.label}
            kind="subtitles"
            default={i === 0}
          />
        ))}
      </video>

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
