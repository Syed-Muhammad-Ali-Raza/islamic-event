import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from "@/lib/constants";

export function CategoryIcon({
  slug,
  className,
  strokeWidth = 1.75,
}: {
  slug: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = CATEGORY_ICONS[slug] ?? FALLBACK_CATEGORY_ICON;

  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
