import { apiClient } from "./apiClient";

export async function getConversations() {
  const response = await apiClient.get("/messages/conversations");

  return response.data;
}

export async function getConversation(
  id,
  { page = 1, pageSize = 25, markRead = true } = {}
) {
  const response = await apiClient.get(`/messages/conversations/${id}`, {
    params: markRead ? { page, pageSize } : { page, pageSize, markRead: false },
  });

  return response.data;
}

export async function markConversationRead(id) {
  await apiClient.post(`/messages/conversations/${id}/read`);
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
