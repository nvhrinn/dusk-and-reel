const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-[3/4] rounded-lg bg-secondary" />
    <div className="mt-2 px-1 space-y-1.5">
      <div className="h-4 bg-secondary rounded w-3/4" />
      <div className="h-3 bg-secondary rounded w-1/2" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonHero = () => (
  <div className="w-full h-[60vh] md:h-[70vh] bg-secondary animate-pulse" />
);

export default SkeletonCard;
