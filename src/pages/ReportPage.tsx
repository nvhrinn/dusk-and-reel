import { useState } from "react";

const ReportPage = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendReport = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(
      "https://qpnbvcgbcmxjhohguztm.supabase.co/functions/v1/report",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          page: window.location.href,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Report berhasil dikirim");
      setMessage("");
    } else {
      alert(data.error);
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
          placeholder="Jelaskan masalah yang terjadi..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
