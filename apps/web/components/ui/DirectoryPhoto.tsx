"use client";

import Image from "next/image";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface DirectoryPhotoProps {
  src: string | null;
  alt: string;
  icon: LucideIcon;
  variant?: "avatar" | "compact" | "banner";
  className?: string;
}

/**
 * One consistent treatment for admin-uploaded reference photos. The icon-only
 * fallback keeps the card layout calm when a directory entry has no image.
 */
export function DirectoryPhoto({
  src,
  alt,
  icon: Icon,
  variant = "avatar",
  className,
}: DirectoryPhotoProps) {
  const isBanner = variant === "banner";

  return (
    <div
      className={clsx(
        "relative shrink-0 overflow-hidden border border-slate-200/90 bg-gradient-to-br from-slate-50 to-amber-50/80",
        isBanner
          ? "h-36 w-full rounded-2xl sm:h-44"
          : variant === "compact"
            ? "h-12 w-12 rounded-xl"
            : "h-16 w-16 rounded-2xl sm:h-[72px] sm:w-[72px]",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={isBanner ? "(max-width: 640px) 100vw, 33vw" : "72px"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          <Icon
            size={isBanner ? 42 : variant === "compact" ? 20 : 26}
            strokeWidth={1.4}
            aria-hidden="true"
          />
        </div>
      )}
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/50"
        aria-hidden="true"
      />
    </div>
  );
}
