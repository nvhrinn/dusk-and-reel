import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export default function JoinWhatsAppPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.location.pathname === "/") {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 900);

      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    setOpen(false);
  };

  const joinWhatsApp = () => {
    
    window.open("https://whatsapp.com/channel/0029VbCGAUm3bbV9AjUZaY0v", "_blank");
    setOpen(false);
  };

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>

        {/* overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl animate-fadeIn"/>

        {/* modal */}
        <Dialog.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="fixed z-50 left-1/2 top-1/2 w-[92%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 animate-popup"
        >

          <div className="relative rounded-[32px] bg-white/10 backdrop-blur-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] text-center overflow-hidden">

            {/* glass highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

            {/* close button dihilangkan */}
            

            {/* icon */}
            <div className="flex justify-center mb-5 animate-float">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 shadow-lg">
                <MessageCircle size={24} className="text-white"/>
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
                className="px-5 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-all duration-200 active:scale-95 hover:scale-105"
              >
                Join Channel
              </button>

              <button
                onClick={closePopup}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-all duration-200 hover:scale-105 active:scale-95"
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
