import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { eventService, type EventFilters } from "@/services/event.service";

// ─── Query keys ───────────────────────────────────────────────────────────────
export const eventKeys = {
  all: ["events"] as const,
  list: (filters: EventFilters) => ["events", "list", filters] as const,
  detail: (slug: string) => ["events", "detail", slug] as const,
  my: (page: number) => ["events", "my", page] as const,
};

export const savedEventKeys = {
  all: ["saved-events"] as const,
  list: (page: number) => ["saved-events", "list", page] as const,
};

// ─── List events ──────────────────────────────────────────────────────────────
export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => eventService.listEvents(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000, // 1 minute
  });
}

// ─── Single event ─────────────────────────────────────────────────────────────
export function useEvent(slug: string) {
  return useQuery({
    queryKey: eventKeys.detail(slug),
    queryFn: () => eventService.getEvent(slug),
    staleTime: 60_000,
    enabled: Boolean(slug),
  });
}

// ─── Create event ─────────────────────────────────────────────────────────────
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => eventService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// ─── Save/unsave ──────────────────────────────────────────────────────────────
export function useSaveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.saveEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-events"] });
    },
  });
}

export function useUnsaveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.unsaveEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-events"] });
    },
  });
}

// ─── RSVPs ────────────────────────────────────────────────────────────────────
export function useEventRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      type,
    }: {
      eventId: string;
      type: "INTERESTED" | "ATTENDING" | null;
    }) =>
      type === null
        ? eventService.removeRsvp(eventId)
        : eventService.setRsvp(eventId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// ─── Saved events list ────────────────────────────────────────────────────────
export function useSavedEvents(page = 1, limit = 12, enabled = true) {
  return useQuery({
    queryKey: savedEventKeys.list(page),
    queryFn: () => eventService.getSavedEvents(page, limit),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled,
  });
}

// ─── My events (current user) ─────────────────────────────────────────────────
export function useMyEvents(page = 1, limit = 12) {
  return useQuery({
    queryKey: eventKeys.my(page),
    queryFn: () => eventService.getMyEvents(page, limit),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
