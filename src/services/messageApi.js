import { apiClient } from "./apiClient";

export async function getConversations() {
  const response = await apiClient.get("/messages/conversations");

  return response.data;
}

export async function getConversation(id, { page = 1, pageSize = 50 } = {}) {
  const response = await apiClient.get(`/messages/conversations/${id}`, {
    params: { page, pageSize },
  });

  return response.data;
}

export async function getMessageRecipients() {
  const response = await apiClient.get("/messages/recipients");

  return response.data;
}

export async function getOrCreateConversation({ recipientId, recipientUsername } = {}) {
  const response = await apiClient.post("/messages/conversations", {
    recipientId,
    recipientUsername,
  });

  return response.data;
}

export async function sendMessage({ recipientUsername, content, previewText, postId }) {
  const response = await apiClient.post("/messages", {
    recipientUsername,
    content,
    previewText,
    postId,
  });

  return response.data;
}
