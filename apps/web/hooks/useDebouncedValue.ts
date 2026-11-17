import { useEffect, useState } from "react";

/**
 * Returns `value` once it has stopped changing for `delay` ms.
 *
 * Used by search-as-you-type inputs so a keystroke burst produces a single
 * request instead of one per character.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
