import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { aniwatchApi } from "@/lib/api";
import AnimeCard from "@/components/AnimeCard";
import { SkeletonGrid } from "@/components/Skeletons";
import { Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GenresPage = () => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: genresData, isLoading: genresLoading } = useQuery({
    queryKey: ["genres"],
    queryFn: () => aniwatchApi.genres(),
  });

  const { data: animeData, isLoading: animeLoading } = useQuery({
    queryKey: ["genre", selectedGenre, page],
    queryFn: () => aniwatchApi.genre(selectedGenre!, page),
    enabled: !!selectedGenre,
  });

  const handleGenreClick = (genreId: string) => {
    setSelectedGenre(genreId);
    setPage(1);
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-6 h-6 text-primary" />
          <h1 className="font-display font-bold text-2xl md:text-3xl">Genres</h1>
        </div>

        {genresLoading ? (
          <div className="flex flex-wrap gap-2 mb-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8">
            {genresData?.genres?.map((genre) => (
              <Badge
                key={genre.id}
                variant={selectedGenre === genre.id ? "default" : "secondary"}
                className="cursor-pointer text-sm px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleGenreClick(genre.id)}
              >
                {genre.name}
              </Badge>
            ))}
          </div>
        )}

        {selectedGenre && (
          <>
            {animeLoading ? (
              <SkeletonGrid count={18} />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {animeData?.results?.map((anime, i) => (
                    <AnimeCard key={anime.id || i} anime={anime} index={i} />
                  ))}
                </div>

                {animeData?.results?.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">Tidak ada hasil.</p>
                )}

                <div className="flex justify-center items-center gap-3 py-8">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <span className="text-sm text-muted-foreground">Halaman {page}</span>
                  <Button variant="outline" size="sm" disabled={!animeData?.hasNextPage} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {!selectedGenre && !genresLoading && (
          <p className="text-center text-muted-foreground py-12">Pilih genre untuk melihat anime.</p>
        )}
      </div>
    </div>
  );
};

export default GenresPage;
