import { AnimeSlide } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface HeroSliderProps {
  slides: AnimeSlide[];
}

const imageAnimations: Variants[] = [
  {
    initial: { opacity: 0, scale: 1.1 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
  },
  {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  },
  {
    initial: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(10px)" },
  },
  {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
  },
];

const textAnimations: Variants[] = [
  {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  },
  {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 40 },
  },
  {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
];

const truncateName = (name: string, maxLen = 40) => {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen).trimEnd() + "…";
};

const HeroSlider = ({ slides }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  // Pick a random animation index for each slide transition
  const [imgAnim, setImgAnim] = useState(0);
  const [txtAnim, setTxtAnim] = useState(0);

  const pickRandomAnims = () => {
    setImgAnim(Math.floor(Math.random() * imageAnimations.length));
    setTxtAnim(Math.floor(Math.random() * textAnimations.length));
  };

  const goTo = (index: number) => {
    pickRandomAnims();
    setCurrent(index);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      pickRandomAnims();
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
          variants={imageAnimations[imgAnim]}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.7, ease: "easeOut" }}
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
            variants={textAnimations[txtAnim]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h1 className="font-display font-bold text-3xl md:text-5xl lg:text-6xl max-w-2xl leading-tight">
              {truncateName(slide.name)}
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
            onClick={() => goTo((current - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl glass-strong flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo((current + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl glass-strong flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 right-6 md:right-12 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
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
