// API client for MoodChat backend

import type { Conversation, ConversationSummary } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  // Get all conversations
  async getConversations(): Promise<ConversationSummary[]> {
    const response = await fetch(`${API_BASE_URL}/conversations`);
    const data = await response.json();
    return data.conversations;
  },

  // Create a new conversation
  async createConversation(title: string, customContext: string = ''): Promise<{ conversation_id: string; conversation: Conversation }> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, custom_context: customContext })
    });
    return await response.json();
  },

  // Get a specific conversation
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`);
    const data = await response.json();
    return data.conversation;
  },

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE'
    });
  },

  // Update conversation metadata
  async updateConversation(conversationId: string, title?: string, customContext?: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, custom_context: customContext })
    });
    const data = await response.json();
    return data.conversation;
  },

  // Upload a context file
  async uploadFile(conversationId: string, file: File): Promise<{ message: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/files`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'File upload failed');
    }

    return await response.json();
  },

  // Create WebSocket connection
  createWebSocket(conversationId: string): WebSocket {
    return new WebSocket(`ws://localhost:8000/ws/${conversationId}`);
  }
};
