import { useQuery } from "@tanstack/react-query";
import { aniwatchApi, AnimeSearchResult } from "@/lib/api";
import HeroSlider from "@/components/HeroSlider";
import AnimeCard from "@/components/AnimeCard";
import { SkeletonGrid, SkeletonHero } from "@/components/Skeletons";
import { TrendingUp, Clock, Flame, Star } from "lucide-react";

const Section = ({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items?: AnimeSearchResult[];
}) => {
  if (!items?.length) return null;
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="font-display font-bold text-xl">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((anime, i) => (
          <AnimeCard key={anime.id || i} anime={anime} index={i} />
        ))}
      </div>
    </section>
  );
};

const Index = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: () => aniwatchApi.home(),
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    staleTime: 3 * 60 * 1000,
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

      {isLoading ? (
        <section className="container mx-auto px-4 py-6">
          <SkeletonGrid count={12} />
        </section>
      ) : (
        <>
          <Section icon={Clock} title="Latest Episodes" items={data?.latestEpisodes} />
          <Section icon={Flame} title="Top Airing" items={data?.topAiring} />
          <Section icon={Star} title="Most Popular" items={data?.popular} />
        </>
      )}
    </div>
  );
};

export default Index;
