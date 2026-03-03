import { useEffect, useRef, useState, useCallback, useMemo, useImperativeHandle, forwardRef } from "react";
import Hls from "hls.js";
import { SkipForward, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Track {
  file: string;
  label: string;
  kind: string;
}

export interface VideoPlayerHandle {
  getQualities: () => { height: number; index: number }[];
  getSelectedQuality: () => number;
  setQuality: (index: number) => void;
  getSubtitleTracks: () => Track[];
  getSelectedTrack: () => number;
  setTrack: (index: number) => void;
}

interface VideoPlayerProps {
  src: string;
  tracks?: Track[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  onError?: () => void;
  onReady?: (handle: VideoPlayerHandle) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ src, tracks, intro, outro, onError, onReady }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [error, setError] = useState(false);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [showSkipOutro, setShowSkipOutro] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<number>(0);
    const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
    const [selectedQuality, setSelectedQuality] = useState<number>(-1);

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

    const handle: VideoPlayerHandle = useMemo(() => ({
      getQualities: () => qualities,
      getSelectedQuality: () => selectedQuality,
      setQuality: (index: number) => {
        const hls = hlsRef.current;
        if (hls) hls.currentLevel = index;
        setSelectedQuality(index);
      },
      getSubtitleTracks: () => subtitleTracks,
      getSelectedTrack: () => selectedTrack,
      setTrack: (index: number) => setSelectedTrack(index),
    }), [qualities, selectedQuality, subtitleTracks, selectedTrack]);

    useImperativeHandle(ref, () => handle, [handle]);

    useEffect(() => {
      onReady?.(handle);
    }, [handle, onReady]);

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
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hls.levels.map((level, index) => ({
            height: level.height,
            index,
          }));
          setQualities(levels);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
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
        video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
        video.addEventListener("error", () => { setError(true); onError?.(); });
      }

      return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
    }, [src, onError, proxyBase]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const textTracks = video.textTracks;
      for (let i = 0; i < textTracks.length; i++) {
        textTracks[i].mode = i === selectedTrack ? "showing" : "hidden";
      }
    }, [selectedTrack, subtitleTracks]);

    const skipIntro = () => { if (videoRef.current && intro) videoRef.current.currentTime = intro.end; };
    const skipOutro = () => { if (videoRef.current && outro) videoRef.current.currentTime = outro.end; };

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
  }
);

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;
