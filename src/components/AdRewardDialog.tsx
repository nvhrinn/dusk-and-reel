import { useState, useEffect } from "react";
import { Ticket, Play } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// list iklan manual (ganti sesuai kebutuhanmu)
const manualAds = [
  "https://raw.githubusercontent.com/nvhrinn/dusk-and-reel/refs/heads/main/src/assets/Gemini_Generated_Image_77zsij77zsij77zs.png",
  "https://via.placeholder.com/300x250?text=Anime+Promo+2",
  "https://via.placeholder.com/300x250?text=Join+Channel+WA",
];

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
  const [countdown, setCountdown] = useState(8);
  const [adsLoaded, setAdsLoaded] = useState(true);
  const [randomAd, setRandomAd] = useState("");

  useEffect(() => {
    if (open && watching) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});

        // fallback check (kalau adsense tidak muncul)
        const timer = setTimeout(() => {
          const adElement = document.querySelector(".adsbygoogle");

          if (!adElement || adElement.innerHTML.trim() === "") {
            setAdsLoaded(false);

            // pilih iklan manual random
            const random =
              manualAds[Math.floor(Math.random() * manualAds.length)];
            setRandomAd(random);
          }
        }, 2000);

        return () => clearTimeout(timer);
      } catch (e) {
        console.log("Adsense error", e);
        setAdsLoaded(false);

        const random =
          manualAds[Math.floor(Math.random() * manualAds.length)];
        setRandomAd(random);
      }
    }
  }, [watching, open]);

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
    setCountdown(8);

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          addCoupon();
          setWatching(false);
          onClose();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
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
              Tonton iklan untuk mendapatkan 1 kupon
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

            {/* ADSENSE */}
            {adsLoaded ? (
              <ins
                className="adsbygoogle"
                style={{ display: "block", minHeight: "250px" }}
                data-ad-client="ca-pub-4196916672015192"
                data-ad-slot="3432473630"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            ) : (
              <img
                src={randomAd}
                className="w-full rounded-xl"
                alt="Manual Ad"
              />
            )}

            <p className="text-xs text-muted-foreground">
              Tunggu {countdown} detik...
            </p>

          </div>
        )}

      </div>
    </div>
  );
};

export default AdRewardDialog;
