import React from "react";
import { Button } from "@/components/ui/button";

const Maintenance = () => {
  const whatsappLink = "https://whatsapp.com/channel/0029VbCGAUm3bbV9AjUZaY0v"; // ganti link kamu

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="w-full max-w-xs text-center animate-fadeIn">

        {/* Brand */}
        <h1 className="text-lg font-medium tracking-wide text-white/70 mb-6">
          Anirull
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold tracking-tight mb-3">
          Maintenance
        </h2>

        {/* Divider */}
        <div className="w-10 h-[1px] bg-white/20 mx-auto mb-4" />

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed mb-6">
          Website sedang dalam perbaikan sistem.
          <br />
          Akan segera kembali online.
        </p>

        {/* Button */}
        <Button
          asChild
          className="w-full bg-white text-black hover:bg-white/90 rounded-lg py-2 text-sm font-medium transition"
        >
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            Join WhatsApp Channel
          </a>
        </Button>

        {/* Footer */}
        <p className="text-xs text-white/40 mt-6">
          Terima kasih atas kesabaranmu dan Jangan lupa join Channel untuk mendapatkan info penting!
        </p>

      </div>
    </div>
  );
};

export default Maintenance;
