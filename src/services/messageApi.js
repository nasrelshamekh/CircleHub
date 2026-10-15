import { apiClient } from "./apiClient";

export async function getConversations() {
  const response = await apiClient.get("/messages/conversations");

  return response.data;
}

export async function getConversation(id) {
  const response = await apiClient.get(`/messages/conversations/${id}`);

  return response.data;
}

export async function getMessageRecipients() {
  const response = await apiClient.get("/messages/recipients");

  return response.data;
}

export async function sendMessage({ recipientUsername, content, postId }) {
  const response = await apiClient.post("/messages", {
    recipientUsername,
    content,
    postId,
  });

  return response.data;
}
