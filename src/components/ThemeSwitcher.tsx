import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const themes = [
  { id: "crimson", label: "Crimson", color: "hsl(0, 85%, 55%)" },
  { id: "ocean", label: "Ocean", color: "hsl(210, 90%, 55%)" },
  { id: "emerald", label: "Emerald", color: "hsl(155, 70%, 45%)" },
  { id: "violet", label: "Violet", color: "hsl(270, 75%, 60%)" },
  { id: "amber", label: "Amber", color: "hsl(38, 95%, 55%)" },
  { id: "rose", label: "Rose", color: "hsl(340, 80%, 58%)" },
];

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => localStorage.getItem("anirull-theme") || "crimson");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", active);
    localStorage.setItem("anirull-theme", active);
  }, [active]);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-11 h-11 rounded-2xl glass-strong flex items-center justify-center text-foreground hover:scale-110 active:scale-95 transition-transform"
        aria-label="Change theme color"
      >
        <Palette className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-14 left-0 p-3 rounded-2xl glass-strong flex flex-col gap-2 min-w-[140px]"
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1">
              Accent Color
            </span>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActive(t.id); setOpen(false); }}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  active === t.id
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full shrink-0 transition-shadow ${active === t.id ? "ring-2 ring-offset-1 ring-offset-background" : ""}`}
                  style={{
                    backgroundColor: t.color,
                    boxShadow: active === t.id ? `0 0 12px ${t.color}` : "none",
                  }}
                />
                {t.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;
