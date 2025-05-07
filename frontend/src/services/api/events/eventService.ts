import api from "@/services/api/apiClient";
import { AxiosResponse } from "axios";
import { Event } from "@/types/event"; // Ensure Event type is imported

// Safe fetchEvent for both server and client
export const fetchEvent = async (id: number): Promise<AxiosResponse<Event>> => {
  return api.get(`/api/events/${id}/`);
};

// Other event endpoints
export const fetchEvents = async (): Promise<AxiosResponse<Event[]>> => {
  return api.get("/api/events/");
};

export const fetchMyEvents = async (): Promise<AxiosResponse<Event[]>> => {
  return api.get("/api/events/my/");
};

export const joinEvent = async (id: number): Promise<AxiosResponse<void>> => {
  return api.post(`/api/events/${id}/join/`);
};

export const leaveEvent = async (id: number): Promise<AxiosResponse<void>> => {
  return api.post(`/api/events/${id}/leave/`);
};

export const createEvent = async (formData: FormData): Promise<AxiosResponse<Event>> => {
  return api.post("/api/events/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateEvent = async (id: number, data: FormData): Promise<AxiosResponse<Event>> => {
  return api.put(`/api/events/${id}/`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteEvent = async (id: number): Promise<AxiosResponse<void>> => {
  return api.delete(`/api/events/${id}/`);
};
