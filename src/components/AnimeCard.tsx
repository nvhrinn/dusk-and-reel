import { AnimeSearchResult, AnimeTrending } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Play, Subtitles, Mic } from "lucide-react";

interface AnimeCardProps {
  anime: AnimeSearchResult | AnimeTrending;
  index?: number;
}

const AnimeCard = ({ anime, index = 0 }: AnimeCardProps) => {
  const navigate = useNavigate();
  const isSearch = "image" in anime && "format" in anime;
  const searchAnime = anime as AnimeSearchResult;

  return (
    <div
      className="group cursor-pointer card-hover"
      onClick={() => navigate(`/anime/${anime.id}`)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary glass-sm">
        {"image" in anime && anime.image && (
          <img
            src={anime.image}
            alt={anime.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center glow-sm">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
        {isSearch && (
          <div className="absolute top-2 right-2 flex gap-1">
            {searchAnime.sub && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/80 backdrop-blur-sm">
                <Subtitles className="w-3 h-3 mr-0.5" />
                {searchAnime.sub}
              </Badge>
            )}
            {searchAnime.dub && searchAnime.dub !== "0" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/80 backdrop-blur-sm">
                <Mic className="w-3 h-3 mr-0.5" />
                {searchAnime.dub}
              </Badge>
            )}
          </div>
        )}
        {isSearch && searchAnime.rating && (
          <Badge className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0 bg-primary/90">
            ★ {searchAnime.rating}
          </Badge>
        )}
      </div>
      <div className="mt-2 px-1">
        <h3 className="font-display font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {anime.name}
        </h3>
        {isSearch && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {searchAnime.format} · {searchAnime.duration}
          </p>
        )}
      </div>
    </div>
  );
};

export default AnimeCard;
