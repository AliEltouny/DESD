import api from "@/services/api/apiClient";

// Safe fetchEvent for both server and client
export const fetchEvent = async (id: number) => {
  return api.get(`/api/events/${id}/`);
};

// Other event endpoints
export const fetchEvents = () => api.get("/api/events/");
export const fetchMyEvents = () => api.get("/api/events/my/");
export const joinEvent = (id: number) => api.post(`/api/events/${id}/join/`);
export const leaveEvent = (id: number) => api.post(`/api/events/${id}/leave/`);
export const createEvent = (formData: FormData) =>
  api.post("/api/events/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const updateEvent = (id: number, data: any) => api.put(`/api/events/${id}/`, data);
export const deleteEvent = (id: number) => api.delete(`/api/events/${id}/`);
