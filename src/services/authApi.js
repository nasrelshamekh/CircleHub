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

export async function forgotPassword(email) {
  const response = await apiClient.post("/auth/forgot-password", { email });

  return response.data;
}

export async function resetPassword(userId, token, password) {
  const response = await apiClient.post("/auth/reset-password", {
    userId,
    token,
    password,
  });

  return response.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await apiClient.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });

  return response.data;
}
