import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, SendHorizonal } from "lucide-react";

const IS_UNDER_MAINTENANCE = true;

const ReportPage = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!message || message.length < 5) {
      alert("Pesan terlalu pendek");
      return;
    }

    setLoading(true);

    const { error } = await supabase.functions.invoke("reportv3", {
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

  if (IS_UNDER_MAINTENANCE) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Wrench className="h-8 w-8 text-primary" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Halaman Sedang Dalam Perbaikan
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Fitur laporan sementara belum tersedia. Kami sedang merapikan halaman ini
              agar lebih stabil dan nyaman digunakan.
            </p>

            <div className="mt-6 inline-flex items-center rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground">
              Status: Maintenance Aktif
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Laporkan Masalah</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kirim laporan jika kamu menemukan bug atau kendala pada website.
        </p>
      </div>

      <form
        onSubmit={sendReport}
        className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
      >
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Jelaskan masalah yang terjadi..."
          className="h-36 w-full resize-none rounded-xl border border-border bg-transparent p-3 outline-none transition focus:ring-2 focus:ring-primary/20"
        />

        <input type="text" name="website" className="hidden" />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendHorizonal className="h-4 w-4" />
          {loading ? "Mengirim..." : "Kirim Laporan"}
        </button>
      </form>
    </div>
  );
};

export default ReportPage;
