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
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50" />

        {/* modal */}
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 w-[92%] max-w-[420px] -translate-x-1/2 -translate-y-1/2">

          <div className="relative rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-2xl p-7 shadow-2xl text-center">

            <button
              onClick={closePopup}
              className="absolute right-4 top-4 rounded-full p-1 bg-white/10 hover:bg-white/20"
            >
              <X size={16} className="text-white" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-500 rounded-full">
                <MessageCircle size={30} className="text-white"/>
              </div>
            </div>

            <Dialog.Title className="text-white text-xl font-semibold mb-2">
              Join WhatsApp Channel
            </Dialog.Title>

            <Dialog.Description className="text-gray-300 text-sm mb-6">
              Dapatkan update anime terbaru dan episode baru langsung di WhatsApp.
            </Dialog.Description>

            <div className="flex justify-center gap-3">

              <button
                onClick={joinWhatsApp}
                className="px-5 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white"
              >
                Join Channel
              </button>

              <button
                onClick={closePopup}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
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
