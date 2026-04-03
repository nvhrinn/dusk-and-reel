import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Hls from "hls.js";

interface Track {
  file: string;
  label: string;
  kind: string;
}

interface VideoPlayerProps {
  src: string;
  tracks?: Track[];
  selectedTrack: number;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  onError?: () => void;
}

const VideoPlayer = ({ src, tracks, selectedTrack, intro, outro, onError }: VideoPlayerProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Setup HLS
  useEffect(() => {
    if (!src || !videoRef.current) return;
    setError(false);
    setLoading(true);

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000,
        startLevel: -1,
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data.type, data.details);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 2000);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setError(true);
            onError?.();
          }
        }
      });

      hlsRef.current = hls;
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setError(true);
        onError?.();
      });
    } else {
      setError(true);
    }
  }, [src]);

  // Handle subtitle tracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !tracks?.length) return;

    // Remove existing track elements
    const existingTracks = video.querySelectorAll("track");
    existingTracks.forEach((t) => t.remove());

    // Add subtitle tracks
    const subtitleTracks = tracks.filter((t) => t.kind === "captions" || t.kind === "subtitles");
    const seen = new Set<string>();
    const unique = subtitleTracks.filter((t) => {
      const key = t.label.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.forEach((track, i) => {
      const el = document.createElement("track");
      el.kind = "subtitles";
      el.label = track.label;
      el.src = track.file;
      el.default = i === selectedTrack;
      video.appendChild(el);
    });

    // Activate selected track
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = i === selectedTrack ? "showing" : "hidden";
    }
  }, [tracks, selectedTrack]);

  // Skip intro/outro buttons
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;

    if (intro && intro.end > 0) {
      setShowSkipIntro(t >= intro.start && t < intro.end);
    }
    if (outro && outro.end > 0) {
      setShowSkipOutro(t >= outro.start && t < outro.end);
    }
  }, [intro, outro]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [handleTimeUpdate]);

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
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        crossOrigin="anonymous"
      />

      {showSkipIntro && (
        <button
          onClick={() => { if (videoRef.current && intro) videoRef.current.currentTime = intro.end; }}
          className="absolute bottom-20 right-4 z-20 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
        >
          Skip Intro
        </button>
      )}

      {showSkipOutro && (
        <button
          onClick={() => { if (videoRef.current && outro) videoRef.current.currentTime = outro.end; }}
          className="absolute bottom-20 right-4 z-20 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
        >
          Skip Outro
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
