"use client";

import { useRouter } from "next/navigation";
import { Heart, CircleCheckBig, Users } from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/stores/auth.store";
import { useEventRsvp } from "@/hooks/useEvents";
import type { EventRsvpState } from "@/types";

interface Props {
  eventId: string;
  slug: string;
  initial?: EventRsvpState;
}

export function EventRsvp({ eventId, slug, initial }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const rsvp = useEventRsvp();

  const interested = initial?.interested ?? 0;
  const attending = initial?.attending ?? 0;
  const mine = initial?.myRsvp ?? null;

  const click = (type: "INTERESTED" | "ATTENDING") => {
    if (!isAuthenticated) {
      router.push(`/login?next=/events/${encodeURIComponent(slug)}`);
      return;
    }
    rsvp.mutate({ eventId, type: mine === type ? null : type });
  };

  return (
    <div id="event-rsvp" className="flex flex-wrap items-center gap-2">
      <button
        id="rsvp-interested"
        onClick={() => click("INTERESTED")}
        disabled={rsvp.isPending}
        className={clsx(
          "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50",
          mine === "INTERESTED"
            ? "bg-brand-50 text-brand-700 border-brand-300"
            : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700"
        )}
      >
        <Heart size={15} className={mine === "INTERESTED" ? "fill-brand-600 text-brand-600" : ""} />
        Interested
        <span className="text-xs text-slate-400">({interested})</span>
      </button>

      <button
        id="rsvp-attending"
        onClick={() => click("ATTENDING")}
        disabled={rsvp.isPending}
        className={clsx(
          "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50",
          mine === "ATTENDING"
            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
        )}
      >
        <CircleCheckBig size={15} />
        Attending
        <span className="text-xs text-slate-400">({attending})</span>
      </button>

      {(interested > 0 || attending > 0) && (
        <span className="inline-flex items-center gap-1 text-slate-400 text-xs ml-1">
          <Users size={13} /> {interested + attending} total
        </span>
      )}
    </div>
  );
}
