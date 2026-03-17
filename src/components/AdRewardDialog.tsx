import { useState } from "react";
import { Ticket, Play } from "lucide-react";
import { toast } from "sonner";

const ads = [
  "https://raw.githubusercontent.com/nvhrinn/dusk-and-reel/refs/heads/main/src/assets/Gemini_Generated_Image_77zsij77zsij77zs.png",
  "https://raw.githubusercontent.com/nvhrinn/dusk-and-reel/refs/heads/main/src/assets/Gemini_Generated_Image_bjsm7cbjsm7cbjsm%20(1).png",
  "https://raw.githubusercontent.com/nvhrinn/dusk-and-reel/refs/heads/main/src/assets/Gemini_Generated_Image_bm8lm8bm8lm8bm8l.png",
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
  const [currentAd, setCurrentAd] = useState(ads[0]);

  const pickRandomAd = () => {
    const random = ads[Math.floor(Math.random() * ads.length)];
    setCurrentAd(random);
  };

  const addCoupon = () => {
    const coupons = Number(localStorage.getItem("coupons") || 0);
    const newCoupons = coupons + 1;

    localStorage.setItem("coupons", String(newCoupons));
    onReward();
    toast.success("+1 Kupon didapat!");
  };

  const startAd = () => {
    if (watching) return;

    pickRandomAd();
    setWatching(true);
    setCountdown(15);

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

            {/* IMAGE ADS ONLY */}
            <img
              src={currentAd}
              className="w-full rounded-xl select-none pointer-events-none"
              alt="Advertisement"
            />

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
