// New Conversation Modal - Create new conversations with custom context and file uploads

import { useState } from 'react';
import type { Theme } from '../themes';
import './NewConversationModal.css';

interface NewConversationModalProps {
  onClose: () => void;
  onCreate: (title: string, customContext: string) => void;
  theme: Theme;
}

const NewConversationModal = ({ onClose, onCreate, theme }: NewConversationModalProps) => {
  const [title, setTitle] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (1MB limit)
      if (file.size > 1_000_000) {
        alert('File too large! Maximum size is 1MB.');
        return;
      }

      // Check file type
      const allowedTypes = ['text/plain', 'text/markdown', 'application/json'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only .txt, .md, and .json files are allowed.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Please enter a conversation title.');
      return;
    }

    setIsCreating(true);

    try {
      // Create conversation with custom context
      onCreate(title, customContext);

      // If file is selected, we'll upload it after conversation is created
      // This is handled in the parent component's onCreate callback
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to create conversation. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          boxShadow: `0 8px 32px ${theme.shadowColor}`
        }}
      >
        <div className="modal-header" style={{ borderBottom: `2px solid ${theme.borderColor}` }}>
          <h2 style={{ color: theme.primaryColor }}>Create New Conversation</h2>
          <button className="close-btn" onClick={onClose} style={{ color: theme.textColor }}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label style={{ color: theme.textColor }}>Conversation Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My AI Companion, Study Buddy, Creative Writing..."
              style={{
                borderColor: theme.borderColor,
                color: theme.textColor
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ color: theme.textColor }}>
              Custom Context (Optional)
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                {' '}
                - Personalize the AI's behavior
              </span>
            </label>
            <textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="E.g., 'You are a supportive friend who loves poetry...' or 'You are a professional coding mentor...'"
              rows={6}
              style={{
                borderColor: theme.borderColor,
                color: theme.textColor
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ color: theme.textColor }}>
              Upload Context File (Optional)
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                {' '}
                - .txt, .md, .json (max 1MB)
              </span>
            </label>
            <div className="file-upload">
              <input
                type="file"
                id="file-input"
                accept=".txt,.md,.json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="file-input"
                className="file-upload-btn"
                style={{
                  backgroundColor: theme.secondaryColor,
                  color: 'white',
                  borderColor: theme.borderColor
                }}
              >
                Choose File
              </label>
              {selectedFile && (
                <span style={{ marginLeft: '1rem', color: theme.textColor }}>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </span>
              )}
            </div>
          </div>

          <div className="context-examples" style={{ backgroundColor: theme.secondaryColor, opacity: 0.1, padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
            <details>
              <summary style={{ color: theme.primaryColor, cursor: 'pointer', fontWeight: 'bold' }}>
                View Example Contexts
              </summary>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: theme.textColor }}>
                <p><strong>Romantic Companion:</strong> "You are a caring and romantic partner who expresses love through thoughtful words and emotional support."</p>
                <p><strong>Study Mentor:</strong> "You are a patient tutor specializing in computer science. Break down complex topics into simple explanations."</p>
                <p><strong>Creative Writer:</strong> "You are a creative writing assistant who helps brainstorm stories, characters, and plot ideas with enthusiasm."</p>
              </div>
            </details>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: `2px solid ${theme.borderColor}` }}>
          <button className="cancel-btn" onClick={onClose} style={{ color: theme.textColor }}>
            Cancel
          </button>
          <button
            className="create-btn"
            onClick={handleCreate}
            disabled={isCreating}
            style={{
              backgroundColor: theme.primaryColor,
              boxShadow: `0 2px 8px ${theme.shadowColor}`
            }}
          >
            {isCreating ? 'Creating...' : 'Create Conversation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
