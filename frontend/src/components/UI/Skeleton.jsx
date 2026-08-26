import React from "react";

/**
 * Skeleton — the app had none (0 occurrences of skeleton/shimmer).
 *
 * Every load state was the same 420px-wide pulsing logo, which also overflowed
 * a 375px viewport. Skeletons reserve the real layout, so content lands without
 * shifting (CLS) and the wait reads as progress rather than a stall.
 */
export const Skeleton = ({ className = "", rounded = "rounded-control" }) => (
  <div
    className={`animate-shimmer bg-surface-hover ${rounded} ${className}`}
    aria-hidden="true"
  />
);

/** 2:3 poster + title + meta — matches MovieCard's real geometry. */
export const PosterSkeleton = () => (
  <div className="flex w-full flex-col gap-3">
    <Skeleton className="aspect-[2/3] w-full" rounded="rounded-poster" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export const MovieGridSkeleton = ({ count = 8 }) => (
  <div
    className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5"
    role="status"
    aria-label="Loading movies"
  >
    {Array.from({ length: count }, (_, i) => (
      <PosterSkeleton key={i} />
    ))}
  </div>
);

export const CardSkeleton = ({ lines = 3 }) => (
  <div className="rounded-card border border-line bg-surface p-5">
    <Skeleton className="mb-4 h-5 w-1/3" />
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  </div>
);

export const RowSkeleton = ({ cols = 5 }) => (
  <div className="flex items-center gap-4 border-b border-line px-4 py-3.5">
    {Array.from({ length: cols }, (_, i) => (
      <Skeleton key={i} className="h-3.5 flex-1" />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div
    className="overflow-hidden rounded-card border border-line bg-surface"
    role="status"
    aria-label="Loading table"
  >
    {Array.from({ length: rows }, (_, i) => (
      <RowSkeleton key={i} cols={cols} />
    ))}
  </div>
);

export default Skeleton;
