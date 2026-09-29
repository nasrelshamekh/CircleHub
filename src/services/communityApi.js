import { apiClient } from "./apiClient";

export async function getCommunities() {
  const response = await apiClient.get("/communities");

  return response.data;
}

export async function createCommunity({ name, category, description, visibility, image, coverImage }) {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("category", category);
  formData.append("description", description);
  formData.append("visibility", visibility);

  if (image) formData.append("image", image);
  if (coverImage) formData.append("coverImage", coverImage);

  const response = await apiClient.post("/communities", formData);

  return response.data;
}

export async function getCommunityCategories() {
  const response = await apiClient.get("/communities/categories");

  return response.data;
}

export async function updateCommunity(communityId, { name, category, description, visibility, image, coverImage }) {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("category", category);
  formData.append("description", description);
  formData.append("visibility", visibility);

  if (image) formData.append("image", image);
  if (coverImage) formData.append("coverImage", coverImage);

  const response = await apiClient.patch(`/communities/${communityId}`, formData);

  return response.data;
}

export async function deleteCommunity(communityId) {
  const response = await apiClient.delete(`/communities/${communityId}`);

  return response.data;
}

export async function getCommunityBySlug(slug) {
  const response = await apiClient.get(`/communities/${slug}`);

  return response.data;
}

export async function getCommunityMembers(communityId) {
  const response = await apiClient.get(`/communities/${communityId}/members`);

  return response.data;
}

export async function joinCommunity(communityId) {
  const response = await apiClient.post(`/communities/${communityId}/join`);

  return response.data;
}

export async function leaveCommunity(communityId) {
  const response = await apiClient.delete(`/communities/${communityId}/membership`);

  return response.data;
}

export async function getCommunityJoinRequests(communityId) {
  const response = await apiClient.get(`/communities/${communityId}/requests`);

  return response.data;
}

export async function decideCommunityJoinRequest(communityId, requestId, decision) {
  const response = await apiClient.patch(
    `/communities/${communityId}/requests/${requestId}`,
    { decision }
  );

  return response.data;
}

export async function updateCommunityMemberRole(communityId, membershipId, role) {
  const response = await apiClient.patch(
    `/communities/${communityId}/members/${membershipId}/role`,
    { role }
  );

  return response.data;
}

export async function removeCommunityMember(communityId, membershipId) {
  const response = await apiClient.delete(`/communities/${communityId}/members/${membershipId}`);

  return response.data;
}
