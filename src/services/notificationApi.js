import { apiClient } from "./apiClient";

export async function getNotifications(page = 1, pageSize = 20) {
  const response = await apiClient.get("/notifications", {
    params: { page, pageSize },
  });

  return response.data;
}

export async function markNotificationsSeen() {
  const response = await apiClient.post("/notifications/seen");

  return response.data;
}

export async function markNotificationRead(id) {
  const response = await apiClient.post(`/notifications/${id}/read`);

  return response.data;
}

export async function deleteNotification(id) {
  const response = await apiClient.delete(`/notifications/${id}`);

  return response.data;
}
