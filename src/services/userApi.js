import { apiClient } from "./apiClient";

export async function getSuggestedUsers() {
  const response = await apiClient.get("/users/suggested");

  return response.data;
}

export async function getUserProfile(username) {
  const response = await apiClient.get(`/users/${username}`);

  return response.data;
}

export async function getUserPosts(username) {
  const response = await apiClient.get(`/users/${username}/posts`);

  return response.data;
}

export async function getUserLikedPosts(username) {
  const response = await apiClient.get(`/users/${username}/liked-posts`);

  return response.data;
}

export async function getUserCommunities(username) {
  const response = await apiClient.get(`/users/${username}/communities`);

  return response.data;
}

export async function getUserFollowers(username) {
  const response = await apiClient.get(`/users/${username}/followers`);

  return response.data;
}

export async function getUserFollowing(username) {
  const response = await apiClient.get(`/users/${username}/following`);

  return response.data;
}

export async function followUser(userId) {
  const response = await apiClient.post(`/users/${userId}/follow`);

  return response.data;
}

export async function unfollowUser(userId) {
  const response = await apiClient.delete(`/users/${userId}/follow`);

  return response.data;
}

export async function updateProfile({ name, jobTitle, bio, location, website, gender, skills, dateOfBirth, avatarImage, coverImage }) {
  const formData = new FormData();

  if (name != null) formData.append("name", name);
  if (jobTitle != null) formData.append("jobTitle", jobTitle);
  if (bio != null) formData.append("bio", bio);
  if (location != null) formData.append("location", location);
  if (website != null) formData.append("website", website);
  if (gender != null) formData.append("gender", gender);
  if (dateOfBirth != null && dateOfBirth !== "") formData.append("dateOfBirth", dateOfBirth);

  if (Array.isArray(skills)) {
    skills.forEach((skill) => formData.append("skills", skill));
  }

  if (avatarImage) formData.append("avatarImage", avatarImage);
  if (coverImage) formData.append("coverImage", coverImage);

  const response = await apiClient.patch("/users/me", formData);

  return response.data;
}
