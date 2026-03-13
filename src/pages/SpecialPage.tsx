import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { aniwatchApi } from "@/lib/api";
import AnimeCard from "@/components/AnimeCard";
import { SkeletonGrid } from "@/components/Skeletons";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SpecialPage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["special", page],
    queryFn: () => aniwatchApi.special(page),
  });

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="font-display font-bold text-2xl md:text-3xl">Special</h1>
        </div>

        {isLoading ? (
          <SkeletonGrid count={18} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {data?.results?.map((anime, i) => (
                <AnimeCard key={anime.id || i} anime={anime} index={i} />
              ))}
            </div>

            {data?.results?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Tidak ada hasil.</p>
            )}

            <div className="flex justify-center items-center gap-3 py-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">Halaman {page}</span>
              <Button variant="outline" size="sm" disabled={!data?.hasNextPage} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SpecialPage;
