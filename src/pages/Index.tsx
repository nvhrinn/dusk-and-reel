import { useQuery } from "@tanstack/react-query";
import { aniwatchApi } from "@/lib/api";
import HeroSlider from "@/components/HeroSlider";
import AnimeCard from "@/components/AnimeCard";
import { SkeletonGrid, SkeletonHero } from "@/components/Skeletons";
import { TrendingUp } from "lucide-react";

const Index = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: () => aniwatchApi.home(),
  });

  return (
    <div className="min-h-screen pt-14">
      {isLoading ? (
        <SkeletonHero />
      ) : (
        data?.slides && <HeroSlider slides={data.slides} />
      )}

      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl">Trending Now</h2>
        </div>

        {isLoading ? (
          <SkeletonGrid count={10} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data?.trending?.map((anime, i) => (
              <AnimeCard key={anime.id || i} anime={anime} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
