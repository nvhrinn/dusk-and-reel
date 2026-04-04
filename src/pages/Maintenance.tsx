const Maintenance = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-xs w-full">

        {/* Brand */}
        <h1 className="text-lg text-white/70 mb-6">
          Anirull
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-red-500 mb-3">
          Maintenance
        </h2>

        {/* Divider */}
        <div className="w-10 h-px bg-white/20 mx-auto mb-4"></div>

        {/* Desc */}
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          Website sedang dalam perbaikan.
          <br />
          Akan segera kembali online.
        </p>

        {/* Button */}
        <a
          href="https://whatsapp.com/channel/0029VbCGAUm3bbV9AjUZaY0v"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-white text-black py-2 rounded-md text-sm font-medium hover:bg-white/90 transition"
        >
          Join WhatsApp Channel
        </a>

        {/* Footer */}
        <p className="text-xs text-white/40 mt-6">
          Terima kasih atas kesabaranmu
        </p>

      </div>
    </div>
  );
};

export default Maintenance;
