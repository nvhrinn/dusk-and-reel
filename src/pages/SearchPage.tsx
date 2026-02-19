import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { aniwatchApi } from "@/lib/api";
import AnimeCard from "@/components/AnimeCard";
import { SkeletonGrid } from "@/components/Skeletons";
import { Search as SearchIcon } from "lucide-react";

const SearchPage = () => {
  const [params] = useSearchParams();
  const q = params.get("q") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => aniwatchApi.search(q),
    enabled: q.length > 0,
  });

  return (
    <div className="min-h-screen pt-14">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <SearchIcon className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl">
            Results for "<span className="text-primary">{q}</span>"
          </h1>
        </div>

        {isLoading ? (
          <SkeletonGrid />
        ) : !data?.results?.length ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.results.map((anime, i) => (
              <AnimeCard key={anime.id || i} anime={anime} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
