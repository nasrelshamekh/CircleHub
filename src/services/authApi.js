import { apiClient } from "./apiClient";

export async function registerUser(userData) {
  const response = await apiClient.post("/auth/register", userData);

  return response.data;
}

export async function loginUser(credentials) {
  const response = await apiClient.post("/auth/login", credentials);

  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");

  return response.data;
}

export async function verifyEmail(userId, token) {
  const response = await apiClient.post("/auth/verify-email", { userId, token });

  return response.data;
}

export async function resendVerificationEmail(email) {
  const response = await apiClient.post("/auth/resend-verification", { email });

  return response.data;
}
