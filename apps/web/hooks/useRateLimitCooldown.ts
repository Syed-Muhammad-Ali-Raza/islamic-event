"use client";

import { useEffect, useState } from "react";
import { parseApiError } from "@/lib/api-error";

/**
 * Seconds left before a throttled form may be submitted again.
 *
 * Starts from the API's `retryAfter` (or `Retry-After` header) whenever the
 * error changes, ticks once a second, and returns 0 for anything that is not a
 * 429 — so callers can use `cooldown > 0` as a plain "disable the button" flag.
 */
export function useRateLimitCooldown(error: unknown): number {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const { retryAfter } = parseApiError(error, "");
    if (!retryAfter) {
      setSecondsLeft(0);
      return;
    }

    const deadline = Date.now() + retryAfter * 1000;
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [error]);

  return secondsLeft;
}
