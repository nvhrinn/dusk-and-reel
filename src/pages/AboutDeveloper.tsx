import { ArrowLeft, Github, Globe, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";

const contributors = [
  { name: "Irull", role: "Dev" },
  { name: "Kyuurzyy", role: "Advertising Distribution" },
];

const AboutDeveloper = () => {
  return (
    <div className="min-h-screen pt-14 bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Back */}
        <Link
          to="/"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex flex-col items-center text-center space-y-6">

          {/* Avatar */}
          <div className="relative w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-white/30 to-white/5 shadow-xl">
            <div className="w-full h-full rounded-full overflow-hidden bg-background/40 backdrop-blur-md">
              <img
                src="https://i.ibb.co.com/N2RkgPG1/image.jpg"
                alt="avatar"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover scale-105"
                />
            </div>
          </div>

          {/* Name */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Irull</h1>
            <p className="text-gray-400">Beginner Developer</p>
          </div>

          {/* Tentang Proyek */}
          <div className="w-full p-6 rounded-3xl glass border border-white/10 shadow-md text-left space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={18} />
              <h2 className="font-semibold text-lg">Tentang Proyek</h2>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm">
              AniRull adalah platform streaming anime gratis yang dibangun
              dengan teknologi modern untuk memberikan pengalaman menonton
              yang cepat, ringan, dan nyaman.
            </p>
          </div>

          {/* Tech Stack */}
          <div className="w-full p-6 rounded-3xl glass border border-white/10 shadow-md">
            <h2 className="font-semibold mb-3 text-left">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {["React","TypeScript","Tailwind","Vite","Javascript","Python","PHP"].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10 text-gray-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Contributor Section */}
          <div className="w-full p-6 rounded-3xl glass border border-white/10 shadow-md text-left">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} />
              <h2 className="font-semibold">Contributors</h2>
            </div>

            <div className="space-y-2">
              {contributors.map((c, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm text-gray-300 border-b border-white/5 pb-2"
                >
                  <span>{c.name}</span>
                  <span className="text-gray-500">{c.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kontak */}
          <div className="w-full p-6 rounded-3xl glass border border-white/10 shadow-md text-left space-y-3">
            <h2 className="font-semibold">Kontak</h2>

            <a
              href="#"
              className="flex items-center gap-3 text-gray-300 hover:text-white transition"
            >
              <Github size={18} /> GitHub
            </a>

            <a
              href="https://irul-king.biz.id/"
              className="flex items-center gap-3 text-gray-300 hover:text-white transition"
            >
              <Globe size={18} /> Website
            </a>
          </div>

          <p className="text-xs text-gray-500 pt-2">
            Created by ©Rlzyy 🕊️
          </p>

        </div>
      </div>
    </div>
  );
};

export default AboutDeveloper;
