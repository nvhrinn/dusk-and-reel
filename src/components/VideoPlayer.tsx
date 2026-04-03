import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

interface Track {
  file: string;
  label: string;
  kind: string;
}

interface VideoPlayerProps {
  embedUrl: string;
  tracks?: Track[];
  translatedVtt?: string | null;
  selectedTrack: number;
  onError?: () => void;
}

const VideoPlayer = ({ embedUrl, tracks, translatedVtt, selectedTrack, onError }: VideoPlayerProps) => {
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState("");

  // Parse VTT for overlay subtitles
  const subtitleCues = useMemo(() => {
    const subtitleTracks = tracks?.filter((t) => t.kind === "captions" || t.kind === "subtitles") || [];
    // Deduplicate and sort
    const seen = new Set<string>();
    const unique = subtitleTracks.filter((t) => {
      const key = t.label.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const sorted = unique.sort((a, b) => {
      const priority = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes("indonesian") || l.includes("indonesia") || l.includes("ind")) return 0;
        if (l.includes("english")) return 1;
        return 2;
      };
      return priority(a.label) - priority(b.label);
    });
    return sorted;
  }, [tracks]);

  // We use iframe — the embed provider handles video playback entirely
  // Subtitle overlay is shown on top if translated subtitle is available

  if (error) {
    return (
      <div className="relative w-full aspect-video bg-secondary rounded-lg overflow-hidden flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground text-sm">Failed to load video. Try a different server.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        referrerPolicy="no-referrer"
        onError={() => {
          setError(true);
          onError?.();
        }}
      />
    </div>
  );
};

export default VideoPlayer;