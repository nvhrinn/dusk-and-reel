import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, Play } from "lucide-react";

const AdRewardDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { addCoupon } = useAuth();
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [done, setDone] = useState(false);

  const startAd = () => {
    setWatching(true);
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setDone(true);
          addCoupon();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleClose = () => {
    setWatching(false);
    setDone(false);
    setCountdown(5);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        {!watching && !done && (
          <div className="text-center space-y-4">
            <Ticket className="w-10 h-10 text-primary mx-auto" />
            <h3 className="font-display font-bold text-lg text-foreground">Kupon Habis!</h3>
            <p className="text-sm text-muted-foreground">Tonton iklan untuk mendapatkan 1 kupon gratis.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={handleClose} className="px-4 py-2 rounded-xl text-sm bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                Batal
              </button>
              <button onClick={startAd} className="px-4 py-2 rounded-xl text-sm bg-primary text-primary-foreground font-medium flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" /> Tonton Iklan
              </button>
            </div>
          </div>
        )}
        {watching && !done && (
          <div className="text-center space-y-4">
            <div className="w-full aspect-video bg-secondary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Ad placeholder — {countdown}s</p>
            </div>
            <p className="text-xs text-muted-foreground">Tunggu {countdown} detik...</p>
          </div>
        )}
        {done && (
          <div className="text-center space-y-4">
            <Ticket className="w-10 h-10 text-primary mx-auto" />
            <h3 className="font-display font-bold text-lg text-foreground">+1 Kupon!</h3>
            <p className="text-sm text-muted-foreground">Kupon berhasil ditambahkan.</p>
            <button onClick={handleClose} className="px-4 py-2 rounded-xl text-sm bg-primary text-primary-foreground font-medium">
              Lanjut Nonton
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdRewardDialog;
