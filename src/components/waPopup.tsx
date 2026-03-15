import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function JoinWhatsAppPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("wa-popup");

    if (!seen) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    localStorage.setItem("wa-popup", "true");
    setOpen(false);
  };

  const joinWhatsApp = () => {
    window.open("https://whatsapp.com/channel/CHANNELMU", "_blank");
    closePopup();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>

        {/* overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl animate-in fade-in" />

        {/* modal */}
        <Dialog.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="fixed z-50 left-1/2 top-1/2 w-[92%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 animate-in zoom-in-95 fade-in"
        >

          <div className="relative rounded-[34px] border border-white/20 bg-white/10 backdrop-blur-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] text-center overflow-hidden">

            {/* glass highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

            {/* close button */}
            <button
              onClick={closePopup}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
            >
              <X size={14} className="text-white/80" />
            </button>

            {/* icon */}
            <div className="flex justify-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/90 shadow-lg">
                <MessageCircle size={28} className="text-white" />
              </div>
            </div>

            {/* title */}
            <Dialog.Title className="text-white text-xl font-semibold mb-2">
              Join WhatsApp Channel
            </Dialog.Title>

            {/* desc */}
            <Dialog.Description className="text-gray-300 text-sm mb-6 leading-relaxed">
              Dapatkan update anime terbaru dan episode baru langsung dari
              channel WhatsApp kami.
            </Dialog.Description>

            {/* buttons */}
            <div className="flex justify-center gap-3">

              <button
                onClick={joinWhatsApp}
                className="px-6 py-2.5 rounded-md bg-green-500 hover:bg-green-600 text-white font-medium transition active:scale-95"
              >
                Join Channel
              </button>

              <button
                onClick={closePopup}
                className="px-6 py-2.5 rounded-md bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition"
              >
                Nanti saja
              </button>

            </div>

          </div>

        </Dialog.Content>

      </Dialog.Portal>
    </Dialog.Root>
  );
}
