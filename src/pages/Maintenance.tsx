const Maintenance = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="text-center">
        
        <h1 className="text-3xl font-bold mb-3">
          Anirull Maintenance 🚧
        </h1>

        <p className="text-gray-400 mb-6">
          Website sedang diperbaiki. Join WhatsApp untuk info update terbaru.
        </p>

        <a
          href="https://chat.whatsapp.com/XXXXXXXX"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold"
        >
          Join WhatsApp
        </a>

      </div>
    </div>
  );
};

export default Maintenance;
