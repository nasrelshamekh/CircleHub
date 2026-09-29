import { apiClient } from "./apiClient";

export async function search(query) {
  const response = await apiClient.get("/search", { params: { q: query } });

  return response.data;
}
