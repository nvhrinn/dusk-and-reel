import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

    const { data, error } = await supabase.functions.invoke("reportv2", {
      body: {
        message,
        page: window.location.href,
      },
    });

    if (error) {
      console.error(error);
      alert("Gagal mengirim laporan");
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
      <input type="text" name="website" style="display:none" />

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
