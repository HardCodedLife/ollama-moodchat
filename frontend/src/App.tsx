// MoodChat - Main Application Component

import { useState, useEffect } from 'react';
import type { ConversationSummary, Conversation, DynamicTheme } from './types';
import { api } from './api';
import { getThemeFromData, defaultTheme } from './themes';
import type { Theme } from './themes';
import ConversationList from './components/ConversationList';
import ChatInterface from './components/ChatInterface';
import NewConversationModal from './components/NewConversationModal';
import './App.css';

function App() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleCreateConversation = async (title: string, customContext: string) => {
    try {
      const { conversation } = await api.createConversation(title, customContext);
      await loadConversations();
      setCurrentConversation(conversation);
      setCurrentTheme(getThemeFromData(conversation.current_theme));
      setShowNewConversationModal(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      const conversation = await api.getConversation(conversationId);
      setCurrentConversation(conversation);
      setCurrentTheme(getThemeFromData(conversation.current_theme));
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleReloadCurrentConversation = async () => {
    if (currentConversation) {
      await handleSelectConversation(currentConversation.id);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await api.deleteConversation(conversationId);
      await loadConversations();
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleThemeChange = (newTheme: Theme | DynamicTheme) => {
    console.log('handleThemeChange called with:', newTheme);
    // Force new object reference to trigger React re-render
    setCurrentTheme({ ...newTheme } as Theme);

    // Also update the current conversation's theme to keep it in sync
    // This ensures theme persists without needing a full conversation reload
    if (currentConversation) {
      setCurrentConversation({
        ...currentConversation,
        current_theme: newTheme
      });
    }
  };

  const theme = currentTheme;

  return (
    <div
      className="app-container"
      style={{
        background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
        minHeight: '100vh',
        transition: 'background 0.8s ease'
      }}
    >
      <div className="app-content">
        {/* Sidebar with conversation list */}
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewConversation={() => setShowNewConversationModal(true)}
          theme={theme}
        />

        {/* Main chat interface */}
        <div className="main-content">
          {currentConversation ? (
            <ChatInterface
              conversation={currentConversation}
              theme={theme}
              onThemeChange={handleThemeChange}
              onUpdateConversation={handleReloadCurrentConversation}
            />
          ) : (
            <div className="welcome-screen" style={{ color: theme.textColor }}>
              <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {theme.icon} Welcome to MoodChat
              </h1>
              <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
                Create a new conversation to get started
              </p>
              <button
                onClick={() => setShowNewConversationModal(true)}
                style={{
                  marginTop: '2rem',
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  backgroundColor: theme.primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px ${theme.shadowColor}`,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${theme.shadowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${theme.shadowColor}`;
                }}
              >
                Start Your New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      {showNewConversationModal && (
        <NewConversationModal
          onClose={() => setShowNewConversationModal(false)}
          onCreate={handleCreateConversation}
          theme={theme}
        />
      )}
    </div>
  );
}

export default App;
