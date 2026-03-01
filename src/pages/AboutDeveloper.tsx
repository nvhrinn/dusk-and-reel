import { ArrowLeft, Github, Globe, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";

const contributors = [
  {
    name: "Rlzyy",
    role: "UI Designer",
    link: "#",
  },
  {
    name: "Open Source Community",
    role: "Support & Inspiration",
    link: "#",
  },
];

const AboutDeveloper = () => {
  return (
    <div className="min-h-screen pt-16 bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Back */}
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex flex-col items-center text-center space-y-10">

          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full glass flex items-center justify-center glow-liquid">
              <img
                src="https://tmpfiles.org/dl/26524454/96271bd0-cf01-48c5-8e68-e3c00c99105f.jpg"
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Irull</h1>
            <p className="text-gray-400">Beginner Developer</p>
          </div>

          {/* About Project */}
          <div className="glass w-full p-8 rounded-2xl text-left space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-semibold text-lg">Tentang Proyek</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              AniRull adalah platform streaming anime gratis yang dibangun dengan teknologi modern.
              Menggunakan React, TypeScript, Tailwind CSS, dan backend custom.
              Proyek ini dibuat untuk memberikan pengalaman menonton anime yang cepat,
              ringan, dan nyaman dengan desain modern liquid glass.
            </p>
          </div>

          {/* Tech Stack */}
          <div className="glass w-full p-8 rounded-2xl text-left space-y-4">
            <h2 className="font-semibold text-lg">Tech Stack</h2>

            <div className="flex flex-wrap gap-3">
              {[
                "React",
                "TypeScript",
                "Tailwind",
                "Vite",
                "Javascript",
                "Python",
                "PHP",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Contributor Section */}
          <div className="glass w-full p-8 rounded-2xl text-left space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Users className="w-5 h-5" />
              <h2 className="font-semibold text-lg">Contributors</h2>
            </div>

            <div className="space-y-4">
              {contributors.map((c, index) => (
                <a
                  key={index}
                  href={c.link}
                  className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition"
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-gray-400">{c.role}</p>
                  </div>
                  <Github className="w-5 h-5 text-gray-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="glass w-full p-8 rounded-2xl text-left space-y-4">
            <h2 className="font-semibold text-lg">Kontak</h2>

            <div className="space-y-3">
              <a
                href="#"
                className="flex items-center gap-3 text-gray-400 hover:text-white transition"
              >
                <Github className="w-5 h-5" />
                GitHub
              </a>

              <a
                href="https://irul-king.biz.id/"
                className="flex items-center gap-3 text-gray-400 hover:text-white transition"
              >
                <Globe className="w-5 h-5" />
                Website
              </a>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-500 pt-6">
            Created with ❤️ by ©Rlzyy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutDeveloper;
