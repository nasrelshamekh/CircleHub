import { apiClient } from "./apiClient";

export async function getFeedPosts(page, pageSize) {
  const response = await apiClient.get("/posts", {
    params: { page, pageSize },
  });
  return response.data;
}

export async function getPostById(postId) {
  const response = await apiClient.get(`/posts/${postId}`);

  return response.data;
}

export async function toggleLikePost(postId) {
  const response = await apiClient.patch(`/posts/${postId}/like`);

  return response.data;
}

export async function addPostComment(postId, content) {
  const response = await apiClient.post(`/posts/${postId}/comments`, { content });

  return response.data;
}

export async function deletePostComment(postId, commentId) {
  const response = await apiClient.delete(`/posts/${postId}/comments/${commentId}`);

  return response.data;
}

export async function getCommunityPosts(communityId) {
  const response = await apiClient.get(`/communities/${communityId}/posts`);

  return response.data;
}

export async function createPost({ content, communityId, imageFile }) {
  const formData = new FormData();
  formData.append("content", content);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const url = communityId
    ? `/communities/${communityId}/posts`
    : "/posts";

  const response = await apiClient.post(url, formData);

  return response.data;
}

export async function deletePost(postId) {
  const response = await apiClient.delete(`/posts/${postId}`);

  return response.data;
}

export async function updatePost({ postId, content, imageFile }) {
  const formData = new FormData();
  formData.append("content", content);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await apiClient.patch(`/posts/${postId}`, formData);

  return response.data;
}

export async function deleteCommunityPost(communityId, postId) {
  const response = await apiClient.delete(
    `/communities/${communityId}/posts/${postId}`
  );

  return response.data;
}
