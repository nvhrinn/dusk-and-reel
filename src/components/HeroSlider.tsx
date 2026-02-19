import { AnimeSlide } from "@/lib/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroSliderProps {
  slides: AnimeSlide[];
}

const HeroSlider = ({ slides }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {slide.image && (
            <img
              src={slide.image}
              alt={slide.name}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display font-bold text-3xl md:text-5xl lg:text-6xl max-w-2xl leading-tight">
              {slide.name}
            </h1>
            <div className="flex gap-3 mt-6">
              <Button
                size="lg"
                className="glow-sm font-display"
                onClick={() => navigate(`/anime/${slide.id}`)}
              >
                <Play className="w-4 h-4 mr-2" /> Watch Now
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="font-display"
                onClick={() => navigate(`/anime/${slide.id}`)}
              >
                <Info className="w-4 h-4 mr-2" /> Details
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((p) => (p + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 right-6 md:right-12 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? "w-8 bg-primary" : "w-3 bg-foreground/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroSlider;
