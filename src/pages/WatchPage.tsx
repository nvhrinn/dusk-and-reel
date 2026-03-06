import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { aniwatchApi } from "@/lib/api";
import VideoPlayer from "@/components/VideoPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Monitor, Volume2, Languages, Settings, ChevronDown, LogIn, Ticket } from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import AdRewardDialog from "@/components/AdRewardDialog";

const Dropdown = ({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-card border border-border hover:border-primary/40 transition-colors"
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-foreground">{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[180px] z-30 rounded-xl bg-card border border-border shadow-lg overflow-hidden animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.value === value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const epId = params.get("ep");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
const [coupons, setCoupons] = useState(0);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [audioType, setAudioType] = useState<"sub" | "dub">("sub");
  const [cachedSubTracks, setCachedSubTracks] = useState<{ file: string; label: string; kind: string }[]>([]);
  const [episodeUnlocked, setEpisodeUnlocked] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);

  // Player state lifted up
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [selectedTrack, setSelectedTrack] = useState<number>(0);

  // Check if episode already unlocked
useEffect(() => {
  const stored = localStorage.getItem("google_user");

  if (stored) {
    const data = JSON.parse(stored);
    setUser(data);
    setCoupons(data.coupons ?? 0);
  }
}, []);

  const handleUnlock = () => {

  if (!user) {
    toast.error("Login dulu");
    return;
  }

  if (coupons <= 0) {
    setShowAdDialog(true);
    return;
  }

  const updatedUser = {
    ...user,
    coupons: coupons - 1
  };

  localStorage.setItem("google_user", JSON.stringify(updatedUser));

  setUser(updatedUser);
  setCoupons(updatedUser.coupons);
  setEpisodeUnlocked(true);

  toast.success("Episode berhasil dibuka!");
};

const rewardCoupon = () => {

  if (!user) return;

  const updatedUser = {
    ...user,
    coupons: coupons + 1
  };

  localStorage.setItem("google_user", JSON.stringify(updatedUser));

  setUser(updatedUser);
  setCoupons(updatedUser.coupons);

  toast.success("Kupon +1 berhasil didapat!");
};
  
  const googleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {

    try {

      const res = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`
          }
        }
      );

      const profile = await res.json();

      const userData = {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        avatar: profile.picture,
        coupons: 2
      };

      localStorage.setItem("google_user", JSON.stringify(userData));

      setUser(userData);
      setCoupons(2);

      toast.success("Login berhasil!");

    } catch {
      toast.error("Login gagal");
    }

  }
});

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

  const megacloudServers = servers
    ? {
        sub: servers.sub?.filter((s) => s.server === "megacloud") || [],
        dub: servers.dub?.filter((s) => s.server === "megacloud") || [],
      }
    : null;

  const subSourceId = megacloudServers?.sub?.[0]?.sourceId || null;
  const { data: subStream } = useQuery({
    queryKey: ["watch-sub-tracks", subSourceId],
    queryFn: () => aniwatchApi.watch(subSourceId!),
    enabled: !!subSourceId,
    retry: 1,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (subStream?.tracks?.length) setCachedSubTracks(subStream.tracks);
  }, [subStream]);

  useEffect(() => {
    if (!megacloudServers) return;
    const list = audioType === "sub" ? megacloudServers.sub : megacloudServers.dub;
    if (list?.length) {
      setSelectedSourceId(list[0].sourceId);
    } else if (audioType === "dub" && megacloudServers.sub?.length) {
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

  const baseTracks = useMemo(() => {
    const subs = stream?.tracks?.filter((t) => t.kind === "captions" || t.kind === "subtitles");
    if (subs?.length) return stream!.tracks;
    if (cachedSubTracks.length) return cachedSubTracks;
    return stream?.tracks || [];
  }, [stream, cachedSubTracks]);

  const englishSubUrl = useMemo(() => {
    const subs = baseTracks.filter((t) => t.kind === "captions" || t.kind === "subtitles");
    const hasIndo = subs.some((t) => {
      const l = t.label.toLowerCase();
      return l.includes("indonesian") || l.includes("indonesia");
    });
    if (hasIndo) return null;
    const eng = subs.find((t) => t.label.toLowerCase().includes("english"));
    return eng?.file || null;
  }, [baseTracks]);

  const { data: translatedVtt } = useQuery({
    queryKey: ["translate-sub", englishSubUrl],
    queryFn: () => aniwatchApi.translateSubtitle(englishSubUrl!),
    enabled: !!englishSubUrl,
    staleTime: Infinity,
    retry: 1,
  });

  const effectiveTracks = useMemo(() => {
    const tracks = [...baseTracks];
    if (translatedVtt?.vtt) {
      const blob = new Blob([translatedVtt.vtt], { type: "text/vtt" });
      const blobUrl = URL.createObjectURL(blob);
      tracks.unshift({ file: blobUrl, label: "Indonesian (Auto)", kind: "captions" });
    }
    return tracks;
  }, [baseTracks, translatedVtt]);

  const handlePlayerError = useCallback(() => {}, []);
  const handleQualitiesChange = useCallback((q: { height: number; index: number }[]) => {
    setQualities(q);
    setSelectedQuality(-1);
  }, []);

  // Compute subtitle options for dropdown
  const subtitleOptions = useMemo(() => {
    const subs = effectiveTracks.filter((t) => t.kind === "captions" || t.kind === "subtitles");
    // Deduplicate by label
    const seen = new Set<string>();
    const unique = subs.filter((t) => {
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
    return sorted.map((t, i) => ({ label: t.label, value: String(i) }));
  }, [effectiveTracks]);

  const qualityOptions = useMemo(() => {
    const opts = [{ label: "Auto", value: "-1" }];
    qualities
      .sort((a, b) => b.height - a.height)
      .forEach((q) => opts.push({ label: `${q.height}p`, value: String(q.index) }));
    return opts;
  }, [qualities]);

  const hasSub = megacloudServers && megacloudServers.sub.length > 0;
  const hasDub = megacloudServers && megacloudServers.dub.length > 0;

  const currentQualityLabel = selectedQuality === -1
    ? "Auto"
    : `${qualities.find((q) => q.index === selectedQuality)?.height || "?"}p`;
  const currentSubLabel = subtitleOptions[selectedTrack]?.label || "—";

  return (
    <div className="min-h-screen pt-14 bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <button
          onClick={() => navigate(`/anime/${id}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to details
        </button>

        {/* Coupon Gate */}
        {!user ? (
          <div className="w-full aspect-video rounded-lg bg-secondary flex flex-col items-center justify-center gap-4">
            <LogIn className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Login untuk menonton</p>
            <button onClick={() => googleLogin()} className="px-4 py-2 rounded-xl text-sm bg-primary text-primary-foreground font-medium">
              Login dengan Google
            </button>
          </div>
        ) : !episodeUnlocked ? (
          <div className="w-full aspect-video rounded-lg bg-secondary flex flex-col items-center justify-center gap-4">
            <Ticket className="w-10 h-10 text-muted-foreground" />
            <p className="text-foreground font-medium">Gunakan 1 kupon untuk menonton</p>
            <p className="text-sm text-muted-foreground">Kamu punya {coupons} kupon</p>
            <button onClick={handleUnlock} className="px-4 py-2 rounded-xl text-sm bg-primary text-primary-foreground font-medium">
              {coupons > 0 ? "Unlock Episode" : "Tonton Iklan untuk Kupon"}
            </button>
          </div>
        ) : streamLoading || serversLoading ? (
          <Skeleton className="w-full aspect-video rounded-lg" />
        ) : streamUrl ? (
          <VideoPlayer
            src={streamUrl}
            tracks={effectiveTracks}
            intro={stream?.intro}
            outro={stream?.outro}
            onError={handlePlayerError}
            selectedTrack={selectedTrack}
            selectedQuality={selectedQuality}
            onQualitiesChange={handleQualitiesChange}
          />
        ) : stream?.embedUrl ? (
          <div className="w-full aspect-video rounded-lg overflow-hidden">
            <iframe src={stream.embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-lg bg-secondary flex items-center justify-center">
            <p className="text-muted-foreground">Select a server to start watching</p>
          </div>
        )}

        <AdRewardDialog open={showAdDialog} onClose={() => setShowAdDialog(false)} onReward={rewardCoupon} />

        {/* Controls below player */}
        <div className="mt-4 space-y-4">
          {currentEp && (
            <h2 className="font-display font-bold text-lg">
              Episode {currentEp.order}
              {currentEp.name && ` — ${currentEp.name}`}
            </h2>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* Audio toggle */}
            {megacloudServers && (hasSub || hasDub) && (
              <div className="flex rounded-xl overflow-hidden border border-border">
                {hasSub && (
                  <button
                    onClick={() => setAudioType("sub")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                      audioType === "sub"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" /> SUB
                  </button>
                )}
                {hasDub && (
                  <button
                    onClick={() => setAudioType("dub")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                      audioType === "dub"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" /> DUB
                  </button>
                )}
              </div>
            )}

            {/* Server badge */}
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-card border border-primary/40 text-muted-foreground">
              <Monitor className="w-3.5 h-3.5" /> MegaCloud
            </span>
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-card border border-border text-muted-foreground">
              <Monitor className="w-3.5 h-3.5" /> RapidCloud
            </span>

            {/* Quality dropdown */}
            {qualityOptions.length > 1 && (
              <Dropdown
                label="Quality"
                icon={Settings}
                value={currentQualityLabel}
                options={qualityOptions}
                onChange={(v) => setSelectedQuality(Number(v))}
              />
            )}

            {/* Subtitle dropdown */}
            {subtitleOptions.length > 0 && (
              <Dropdown
                label="Subtitle"
                icon={Languages}
                value={currentSubLabel}
                options={subtitleOptions}
                onChange={(v) => setSelectedTrack(Number(v))}
              />
            )}
          </div>
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
                  className={`h-10 rounded-xl text-sm font-medium transition-colors ${
                    ep.epId === epId
                      ? "bg-primary text-primary-foreground glow-sm"
                      : "glass-sm text-muted-foreground hover:text-foreground"
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
