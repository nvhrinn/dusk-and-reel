import { Coffee } from "lucide-react";
import { toast } from "sonner";

const FloatingDonate = () => {
  const handleDonate = () => {
    toast("Support AniRull", {
      description: "Thank you for considering a donation! Your support helps keep this project alive.",
      duration: 8000,
      action: {
        label: "Donate",
        onClick: () => window.open("https://saweria.co/RullZY", "_blank"),
      },
    });
  };

  return (
    <button
      onClick={handleDonate}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-2xl bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-transform flex items-center justify-center glow-sm"
      aria-label="Donate"
    >
      <Coffee className="w-5 h-5" />
    </button>
  );
};

export default FloatingDonate;
