"use client";

import { AlertTriangle } from "lucide-react";
import { formatRetryAfter, parseApiError } from "@/lib/api-error";
import { useRateLimitCooldown } from "@/hooks/useRateLimitCooldown";

interface Props {
  /** The mutation/query error; renders nothing when falsy. */
  error: unknown;
  /** Shown when the API sends no message of its own. */
  fallback: string;
  /** Element id, used by tests and e2e. */
  id?: string;
  className?: string;
}

/**
 * Form-level error banner. For 429s it also counts down the API's retry window
 * ("Try again in 2:47") instead of leaving the user to guess when to retry.
 */
export function FormError({ error, fallback, id = "form-error", className = "mb-5" }: Props) {
  const secondsLeft = useRateLimitCooldown(error);
  if (!error) return null;

  const { message } = parseApiError(error, fallback);

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 text-sm ${className}`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          {message}
          {secondsLeft > 0 && (
            <span className="block mt-1 font-medium">
              Try again in <span id={`${id}-countdown`}>{formatRetryAfter(secondsLeft)}</span>.
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
