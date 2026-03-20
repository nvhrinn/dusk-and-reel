import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Wrench, SendHorizonal } from "lucide-react";

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
        <div className="container mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
          <div className="grid w-full items-center gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur">
                <Wrench className="h-4 w-4" />
                Sistem laporan sementara dinonaktifkan
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                  Halaman ini sedang
                  <span className="block text-primary">dalam perbaikan</span>
                </h1>

                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Kami sedang meningkatkan fitur laporan agar lebih stabil,
                  cepat, dan nyaman digunakan. Untuk sementara, halaman ini
                  belum dapat dipakai.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    Status
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Maintenance aktif
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <SendHorizonal className="h-4 w-4" />
                    Form Laporan
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sementara tidak tersedia
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                Silakan kembali lagi nanti saat halaman sudah dibuka kembali.
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-2xl" />
              <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-xl">
                <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-8">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                      <Wrench className="h-10 w-10 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-3 text-center">
                    <h2 className="text-2xl font-bold">Maintenance Mode</h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Fitur ini sedang dirapikan agar hasil laporan bisa masuk
                      dengan lebih baik tanpa error.
                    </p>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                      <span className="text-sm font-medium">Status halaman</span>
                      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-600">
                        Perbaikan
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                      <span className="text-sm font-medium">Akses form</span>
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600">
                        Nonaktif
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                      <span className="text-sm font-medium">Mode</span>
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                        Aman
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Laporkan Masalah</h1>
        <p className="text-sm text-muted-foreground">
          Bantu kami memperbaiki website dengan mengirim laporan kendala yang kamu temui.
        </p>
      </div>

      <form
        onSubmit={sendReport}
        className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-xl space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Pesan Laporan</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Jelaskan masalah yang terjadi..."
            className="h-36 w-full resize-none rounded-xl border border-border bg-transparent p-3 outline-none transition focus:ring-2 focus:ring-primary/30"
          />
        </div>

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
