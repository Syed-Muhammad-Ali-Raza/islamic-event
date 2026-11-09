import {
  BookMarked,
  BookOpen,
  Building2,
  CalendarDays,
  Flame,
  Flower2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Mic,
  Moon,
  MoonStar,
  Sparkles,
  Star,
  Users,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Category icons — one lucide glyph per gathering type, rendered via <CategoryIcon />
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  majlis: Landmark,
  milad: MoonStar,
  "mehfil-e-naat": Mic,
  dars: BookOpen,
  "quran-khwani": BookMarked,
  jashan: Sparkles,
  urs: Flower2,
  "seerat-un-nabi": Star,
  muharram: Flame,
  ramadan: Moon,
  iftar: Utensils,
  charity: HeartHandshake,
  community: Users,
  educational: GraduationCap,
  other: CalendarDays,
  expo: Building2,
};

export const FALLBACK_CATEGORY_ICON: LucideIcon = CalendarDays;
