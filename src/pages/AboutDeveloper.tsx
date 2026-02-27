import { ArrowLeft, Github, Globe, Mail, Code2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const AboutDeveloper = () => {
  return (
    <div className="min-h-screen pt-14 bg-background">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Code2 className="w-14 h-14 text-primary-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-foreground">AniRull Developer</h1>
            <p className="text-muted-foreground text-lg">Beginner Developer</p>
          </div>

          {/* About card */}
          <div className="w-full p-6 rounded-xl bg-card border border-border space-y-4 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-display font-semibold text-lg">Tentang Proyek</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              AniRull adalah platform streaming anime gratis yang dibangun dengan teknologi modern.
              Menggunakan React, TypeScript, Tailwind CSS, dan Lovable Cloud sebagai backend.
              Proyek ini dibuat untuk memberikan pengalaman menonton anime yang mulus dan menyenangkan.
            </p>
          </div>

          {/* Tech stack */}
          <div className="w-full p-6 rounded-xl bg-card border border-border space-y-4 text-left">
            <h2 className="font-display font-semibold text-lg text-foreground">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Tailwind CSS", "Vite", "Javascript", "Python", "PHP"].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="w-full p-6 rounded-xl bg-card border border-border space-y-3 text-left">
            <h2 className="font-display font-semibold text-lg text-foreground">Kontak</h2>
            <div className="space-y-2">
              <a href="#" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors py-1.5">
                <Github className="w-5 h-5" /> GitHub
              </a>
              <a href="https://irul-king.biz.id/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors py-1.5">
                <Globe className="w-5 h-5" /> Website
              </a>
              
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-4">
            Created by ©Rlzyy 🕊️
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutDeveloper;
