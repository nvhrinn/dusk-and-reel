const Maintenance = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center px-4">
      <div className="text-center space-y-6">

        <h1 className="text-3xl font-semibold">
          Maintenance 🚧
        </h1>

        <p className="text-gray-400 text-sm">
          Website sedang diperbaiki.
        </p>

        <a
          href="https://chat.whatsapp.com/XXXXXXXX"
          target="_blank"
          className="bg-green-500 px-6 py-3 rounded-xl font-semibold"
        >
          Join WhatsApp
        </a>

      </div>
    </div>
  );
};

export default Maintenance;
