import { clsx } from "clsx";

interface Props {
  className?: string;
  lines?: number;
}

// ─── Event card skeleton ──────────────────────────────────────────────────────
export function EventCardSkeleton({ className }: Props) {
  return (
    <div className={clsx("card-glass overflow-hidden", className)}>
      <div className="skeleton aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-3 rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Generic line skeletons ───────────────────────────────────────────────────
export function TextSkeleton({ lines = 3, className }: Props) {
  return (
    <div className={clsx("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx("skeleton h-3 rounded", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}
