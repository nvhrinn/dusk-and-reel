import { useState } from "react";
import { supabase } from "@/lib/api";

const ReportPage = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendReport = async (e) => {
    e.preventDefault();

    if (!message || message.length < 5) {
      alert("Pesan terlalu pendek");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke("report", {
      body: {
        message,
        page: window.location.href,
      },
    });

    if (error) {
      alert("Gagal mengirim laporan");
      console.error(error);
    } else {
      alert("Report berhasil dikirim");
      setMessage("");
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <h1 className="text-xl font-bold mb-6">Laporkan Masalah</h1>

      <form
        onSubmit={sendReport}
        className="glass-sm p-6 rounded-xl space-y-4"
      >
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Jelaskan masalah yang terjadi..."
          className="w-full border rounded-lg p-3 h-32 bg-transparent"
        />

        <button
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg"
        >
          {loading ? "Mengirim..." : "Kirim Laporan"}
        </button>
      </form>
    </div>
  );
};

export default ReportPage;
