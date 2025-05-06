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
// Add proper typing for update
export const updateEvent = async (id: number, data: FormData): Promise<Event> => {
  const response = await api.put(`/api/events/${id}/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Make sure delete is properly typed
export const deleteEvent = async (id: number): Promise<void> => {
  await api.delete(`/api/events/${id}/`);
};
