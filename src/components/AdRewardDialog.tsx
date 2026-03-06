import { useState } from "react";
import { Ticket, Play } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdRewardDialog = ({
  open,
  onClose,
  onReward,
}: {
  open: boolean;
  onClose: () => void;
  onReward: () => void;
}) => {
  const [watching, setWatching] = useState(false);

  const addCoupon = () => {
    const coupons = Number(localStorage.getItem("coupons") || 0);
    const newCoupons = coupons + 1;

    localStorage.setItem("coupons", String(newCoupons));

    onReward();
    toast.success("+1 Kupon didapat!");
  };

  const startAd = () => {
    if (watching) return;

    setWatching(true);

    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({
          google_ad_client: "ca-pub-XXXXXXXX",
          enable_page_level_ads: true,
        });
      }

      // simulasi reward callback
      setTimeout(() => {
        addCoupon();
        setWatching(false);
        onClose();
      }, 8000);

    } catch (err) {
      console.error("Adsense error:", err);
      toast.error("Iklan gagal dimuat");
      setWatching(false);
    }
  };

  const handleClose = () => {
    setWatching(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">

        {!watching && (
          <div className="text-center space-y-4">
            <Ticket className="w-10 h-10 text-primary mx-auto" />

            <h3 className="font-bold text-lg">Kupon Habis!</h3>

            <p className="text-sm text-muted-foreground">
              Tonton iklan untuk mendapatkan 1 kupon.
            </p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-secondary text-sm"
              >
                Batal
              </button>

              <button
                onClick={startAd}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm flex items-center gap-1"
              >
                <Play className="w-4 h-4" />
                Tonton Iklan
              </button>
            </div>
          </div>
        )}

        {watching && (
          <div className="text-center space-y-4">
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
              Memuat iklan...
            </div>

            <p className="text-xs text-muted-foreground">
              Tunggu sampai iklan selesai
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdRewardDialog;
