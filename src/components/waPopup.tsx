import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function JoinWhatsAppPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("wa-popup");

    if (!seen) {
      setTimeout(() => setOpen(true), 900);
    }
  }, []);

  const close = () => {
    localStorage.setItem("wa-popup", "true");
    setOpen(false);
  };

  const join = () => {
    window.open("https://whatsapp.com/channel/CHANNELMU", "_blank");
    close();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>

        {/* Background */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xl animate-overlay" />

        {/* Modal */}
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[92%] max-w-[420px] -translate-x-1/2 -translate-y-1/2">

          {/* Glass Card */}
          <div className="relative rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-3xl shadow-[0_30px_120px_rgba(0,0,0,0.6)] p-7 overflow-hidden animate-popup">

            {/* Liquid gradient reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 opacity-40 pointer-events-none"></div>

            {/* Glow bubble */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-green-400/30 blur-3xl rounded-full"></div>

            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <X size={16} className="text-white"/>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5 relative">
              <div className="p-5 rounded-full bg-green-500 shadow-lg ring-4 ring-white/20">
                <MessageCircle size={34} className="text-white"/>
              </div>
            </div>

            {/* Title */}
            <Dialog.Title className="text-center text-xl font-semibold text-white mb-2">
              Join WhatsApp Channel
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="text-center text-gray-300 text-sm leading-relaxed mb-6">
              Dapatkan update anime terbaru, episode baru,
              dan pengumuman penting dari website ini langsung di WhatsApp.
            </Dialog.Description>

            {/* Buttons */}
            <div className="flex gap-3 justify-center">

              <button
                onClick={join}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white font-medium shadow-lg transition active:scale-95"
              >
                <MessageCircle size={18}/>
                Join Channel
              </button>

              <button
                onClick={close}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
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
