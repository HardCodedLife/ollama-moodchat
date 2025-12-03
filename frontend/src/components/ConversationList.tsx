// Conversation List Component - Displays all user conversations with management options

import type { ConversationSummary } from '../types';
import type { Theme } from '../themes';
import './ConversationList.css';

interface ConversationListProps {
  conversations: ConversationSummary[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  theme: Theme;
}

const ConversationList = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  theme
}: ConversationListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="conversation-list"
      style={{
        backgroundColor: theme.backgroundColor,
        borderRight: `1px solid ${theme.borderColor}`,
        boxShadow: `4px 0 12px ${theme.shadowColor}`
      }}
    >
      <div className="conversation-list-header" style={{ borderBottom: `2px solid ${theme.borderColor}` }}>
        <h2 style={{ color: theme.primaryColor }}>
          {theme.icon} MoodChat
        </h2>
        <button
          className="new-conversation-btn"
          onClick={onNewConversation}
          style={{
            backgroundColor: theme.primaryColor,
            color: 'white',
            boxShadow: `0 2px 8px ${theme.shadowColor}`
          }}
        >
          + New Chat
        </button>
      </div>

      <div className="conversations-container">
        {conversations.length === 0 ? (
          <div className="empty-state" style={{ color: theme.textColor, opacity: 0.6 }}>
            <p>No conversations yet</p>
            <p style={{ fontSize: '0.9rem' }}>Create your first chat to get started</p>
          </div>
        ) : (
          conversations
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id)}
                style={{
                  backgroundColor: conv.id === currentConversationId ? theme.secondaryColor : 'transparent',
                  borderLeft: conv.id === currentConversationId ? `4px solid ${theme.primaryColor}` : 'none',
                  color: conv.id === currentConversationId ? 'white' : theme.textColor
                }}
              >
                <div className="conversation-content">
                  <div className="conversation-title">{conv.title}</div>
                  <div className="conversation-meta">
                    <span>{conv.message_count} messages</span>
                    <span>•</span>
                    <span>{formatDate(conv.updated_at)}</span>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${conv.title}"?`)) {
                      onDeleteConversation(conv.id);
                    }
                  }}
                  style={{ color: conv.id === currentConversationId ? 'white' : theme.textColor }}
                >
                  ×
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
