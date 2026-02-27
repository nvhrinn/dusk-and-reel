import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { aniwatchApi, AnimeSearchResult } from "@/lib/api";
import HeroSlider from "@/components/HeroSlider";
import AnimeCard from "@/components/AnimeCard";
import { SkeletonGrid, SkeletonHero } from "@/components/Skeletons";
import { TrendingUp, Clock, Flame, Star, Calendar } from "lucide-react";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["home"],
    queryFn: () => aniwatchApi.home(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });

  // Shuffle card positions on every data fetch
  const shuffled = useMemo(() => {
    if (!data) return null;
    return {
      slides: data.slides ? shuffle(data.slides) : [],
      trending: data.trending ? shuffle(data.trending) : [],
      latestEpisodes: data.latestEpisodes ? shuffle(data.latestEpisodes) : [],
      topAiring: data.topAiring ? shuffle(data.topAiring) : [],
      popular: data.popular ? shuffle(data.popular) : [],
      upcoming: data.upcoming ? shuffle(data.upcoming) : [],
    };
  }, [data, dataUpdatedAt]);

  return (
    <div className="min-h-screen pt-14">
      {isLoading ? (
        <SkeletonHero />
      ) : (
        shuffled?.slides && <HeroSlider slides={shuffled.slides} />
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
            {shuffled?.trending?.map((anime, i) => (
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
          <Section icon={Clock} title="Latest Episodes" items={shuffled?.latestEpisodes} />
          <Section icon={Flame} title="Top Airing" items={shuffled?.topAiring} />
          <Section icon={Star} title="Most Popular" items={shuffled?.popular} />
          <Section icon={Calendar} title="Upcoming Anime" items={shuffled?.upcoming} />
        </>
      )}
    </div>
  );
};

export default Index;
