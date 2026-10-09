import { apiClient } from "@/lib/api-client";
import type { ApiSuccess, PaginatedResponse, Event, EventSummary, EventRsvpState } from "@/types";

export interface EventFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  city?: string;
  area?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
  organizer?: string;
}

export const eventService = {
  async listEvents(filters: EventFilters = {}) {
    const res = await apiClient.get<PaginatedResponse<EventSummary>>("/events", { params: filters });
    return res.data;
  },

  async getEvent(slug: string) {
    const res = await apiClient.get<ApiSuccess<Event>>(`/events/${slug}`);
    return res.data.data;
  },

  async createEvent(data: unknown) {
    const res = await apiClient.post<ApiSuccess<{ event: Event; possibleDuplicate: unknown }>>("/events", data);
    return res.data.data;
  },

  async updateEvent(id: string, data: unknown) {
    const res = await apiClient.patch<ApiSuccess<Event>>(`/events/${id}`, data);
    return res.data.data;
  },

  async deleteEvent(id: string) {
    await apiClient.delete(`/events/${id}`);
  },

  async saveEvent(id: string) {
    const res = await apiClient.post(`/events/${id}/save`);
    return res.data;
  },

  async unsaveEvent(id: string) {
    await apiClient.delete(`/events/${id}/save`);
  },

  async uploadPoster(file: File, eventId?: string) {
    const form = new FormData();
    form.append("poster", file);
    if (eventId) form.append("eventId", eventId);

    const res = await apiClient.post<ApiSuccess<{
      url: string;
      publicId: string;
      width: number;
      height: number;
    }>>("/upload/poster", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.data;
  },

  async reportEvent(id: string, data: { reason: string; description?: string }) {
    const res = await apiClient.post(`/events/${id}/reports`, data);
    return res.data;
  },

  async getMyEvents(page = 1, limit = 12) {
    const res = await apiClient.get<PaginatedResponse<EventSummary>>("/events/mine", {
      params: { page, limit },
    });
    return res.data;
  },

  async getSavedEvents(page = 1, limit = 12) {
    const res = await apiClient.get<
      PaginatedResponse<{ id: string; createdAt: string; event: EventSummary }>
    >("/users/me/saved-events", { params: { page, limit } });
    return res.data;
  },

  async setRsvp(eventId: string, type: "INTERESTED" | "ATTENDING") {
    const res = await apiClient.put<ApiSuccess<EventRsvpState>>(`/events/${eventId}/rsvps`, { type });
    return res.data.data;
  },

  async removeRsvp(eventId: string) {
    const res = await apiClient.delete<ApiSuccess<EventRsvpState>>(`/events/${eventId}/rsvps`);
    return res.data.data;
  },

  async getEventRsvps(eventId: string, page = 1, limit = 20) {
    const res = await apiClient.get<
      PaginatedResponse<{ id: string; type: "INTERESTED" | "ATTENDING"; createdAt: string; user: { id: string; name: string; email: string } }>
    >(`/events/${eventId}/rsvps`, { params: { page, limit } });
    return res.data;
  },
};
