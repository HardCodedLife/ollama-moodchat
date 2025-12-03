// Chat Interface Component - Main chat view with message display and input

import { useState, useEffect, useRef } from 'react';
import type { Conversation, Message, WebSocketMessage, DynamicTheme } from '../types';
import type { Theme } from '../themes';
import { api } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import './ChatInterface.css';
import 'highlight.js/styles/github-dark.css';

interface ChatInterfaceProps {
  conversation: Conversation;
  theme: Theme;
  onThemeChange: (theme: Theme | DynamicTheme) => void;
  onUpdateConversation: () => void;
}

const ChatInterface = ({ conversation, theme, onThemeChange, onUpdateConversation }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');
  const [themeStatus, setThemeStatus] = useState<string>('');
  const [showThemeStatus, setShowThemeStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract conversation design (backward compatible - returns defaults if not present)
  const design = (theme as DynamicTheme).conversationDesign;
  const bubbleStyle = design?.messageBubbleStyle || {};
  const typography = design?.typography || {};
  const animations = design?.animations || {};
  const layout = design?.layout || {};
  const effects = design?.effects || {};

  // Initialize WebSocket connection
  useEffect(() => {
    // Update messages when conversation changes (from backend refresh)
    setMessages(conversation.messages);

    const websocket = api.createWebSocket(conversation.id);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);

      if (data.type === 'start') {
        setIsTyping(true);
        setCurrentAssistantMessage('');
      } else if (data.type === 'chunk' && data.content) {
        setCurrentAssistantMessage((prev) => prev + data.content);
      } else if (data.type === 'end') {
        setIsTyping(false);

        // Just clear the streaming message - backend has already saved it
        setCurrentAssistantMessage('');

        // Handle theme from server_new.py (comes with 'end' message)
        if (data.theme) {
          if (typeof data.theme === 'object') {
            onThemeChange(data.theme);
          } else {
            // String theme ID - convert to theme object
            import('../themes').then(({ getTheme }) => {
              onThemeChange(getTheme(data.theme as string));
            });
          }
        }

        // Fetch updated conversation from backend to get the saved message
        // This prevents duplicates by using backend as single source of truth
        api.getConversation(conversation.id).then((updatedConv) => {
          setMessages(updatedConv.messages);
        });
      } else if (data.type === 'theme_generating') {
        setShowThemeStatus(true);
        setThemeStatus('🎨 Generating custom theme...');
      } else if (data.type === 'theme_design_complete') {
        setThemeStatus('🎨 Theme designed! Coding implementation...');
      } else if (data.type === 'theme_update' && data.theme) {
        console.log('Theme update received:', data.theme);
        setThemeStatus('✨ Theme updated!');
        setShowThemeStatus(true);

        // Handle both DynamicTheme object and string theme ID (backward compatible)
        if (typeof data.theme === 'object') {
          // Create a new object to force React to detect the change
          const newTheme = { ...data.theme };
          console.log('Applying new theme:', newTheme);
          onThemeChange(newTheme);  // Dynamic theme object
        } else {
          // String theme ID from server_new.py - convert using getTheme
          import('../themes').then(({ getTheme }) => {
            onThemeChange(getTheme(data.theme as string));
          });
        }
        setTimeout(() => {
          setShowThemeStatus(false);
          setThemeStatus('');
        }, 3000);
      } else if (data.type === 'theme_error') {
        setThemeStatus('⚠️ Theme generation failed, using default');
        setTimeout(() => {
          setShowThemeStatus(false);
          setThemeStatus('');
        }, 3000);
      } else if (data.type === 'error') {
        setIsTyping(false);
        alert('Error: ' + data.message);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [conversation.id]);

  // Don't sync messages from parent - causes duplicates
  // Messages are managed locally via WebSocket
  // useEffect(() => {
  //   if (conversation.messages.length > messages.length) {
  //     setMessages(conversation.messages);
  //   }
  // }, [conversation.messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAssistantMessage]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !ws || isTyping) return;

    // Add user message to display immediately
    const newMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    setMessages([...messages, newMessage]);

    // Send to WebSocket
    ws.send(JSON.stringify({ message: inputMessage }));
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className="chat-interface"
      style={{
        backgroundColor: theme.backgroundColor,
        fontFamily: typography.bodyFont || 'inherit',
        transition: `all ${animations.transitionSpeed || '0.3s'} ease`,
      }}
      data-background-pattern={effects.backgroundPattern || 'none'}
      data-has-particles={effects.particles ? 'true' : 'false'}
    >
      {/* Chat header */}
      <div className="chat-header" style={{
        borderBottom: `2px solid ${theme.borderColor}`,
        fontFamily: typography.headerFont || 'inherit',
      }}>
        <div>
          <h2 style={{
            color: theme.primaryColor,
            fontSize: typography.headerSize || '1.5rem',
          }}>{conversation.title}</h2>
          <div className="theme-indicator" style={{ color: theme.secondaryColor }}>
            {theme.icon} {theme.name} Mode
            {design?.mood?.personality && (
              <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                • {design.mood.personality}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Theme generation status banner */}
      {showThemeStatus && (
        <div
          className="theme-status-banner"
          style={{
            backgroundColor: theme.accentColor,
            color: theme.textColor,
            padding: '1rem',
            textAlign: 'center',
            fontWeight: 'bold',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          {themeStatus}
        </div>
      )}

      {/* Messages area */}
      <div
        className="messages-area"
        style={{
          padding: layout.chatPadding || '2rem',
          gap: layout.messageSpacing || '1rem',
        }}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const align = isUser
            ? (bubbleStyle.userAlign || 'right')
            : (bubbleStyle.assistantAlign || 'left');

          return (
            <div
              key={idx}
              className={`message ${msg.role}`}
              style={{
                alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
                backgroundColor: isUser ? theme.messageUserBg : theme.messageAssistantBg,
                color: isUser ? 'white' : theme.textColor,
                borderRadius: bubbleStyle.borderRadius || '12px',
                padding: bubbleStyle.padding || '1rem',
                fontSize: bubbleStyle.fontSize || '1rem',
                fontFamily: bubbleStyle.fontFamily || 'inherit',
                fontWeight: bubbleStyle.fontWeight || 'normal',
                maxWidth: bubbleStyle.maxWidth || '70%',
                boxShadow: bubbleStyle.boxShadow || `0 2px 8px ${theme.shadowColor}`,
                backdropFilter: effects.glassEffect ? 'blur(10px)' : 'none',
                animation: animations.messageEntrance
                  ? `${animations.messageEntrance} ${animations.transitionSpeed || '0.3s'} ease-out`
                  : 'none',
              }}
              data-message-index={idx}
            >
              <div className="message-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    code: ({ node, inline, className, children, ...props }: any) => {
                      return inline ? (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              <div className="message-time" style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}

        {/* Typing indicator with streaming message */}
        {isTyping && (
          <div
            className="message assistant typing"
            style={{
              alignSelf: (bubbleStyle.assistantAlign || 'left') === 'right' ? 'flex-end' : 'flex-start',
              backgroundColor: theme.messageAssistantBg,
              color: theme.textColor,
              borderRadius: bubbleStyle.borderRadius || '12px',
              padding: bubbleStyle.padding || '1rem',
              fontSize: bubbleStyle.fontSize || '1rem',
              fontFamily: bubbleStyle.fontFamily || 'inherit',
              fontWeight: bubbleStyle.fontWeight || 'normal',
              maxWidth: bubbleStyle.maxWidth || '70%',
              boxShadow: bubbleStyle.boxShadow || `0 2px 8px ${theme.shadowColor}`,
              backdropFilter: effects.glassEffect ? 'blur(10px)' : 'none',
            }}
            data-typing-indicator={animations.typingIndicator || 'pulse'}
          >
            <div className="message-content">
              {currentAssistantMessage ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                >
                  {currentAssistantMessage}
                </ReactMarkdown>
              ) : (
                <div className="typing-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="input-area" style={{ borderTop: `2px solid ${theme.borderColor}` }}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isTyping}
          style={{
            borderColor: theme.borderColor,
            color: theme.textColor,
            fontSize: bubbleStyle.fontSize || '1rem',
            fontFamily: bubbleStyle.fontFamily || 'inherit',
            height: layout.inputHeight || 'auto',
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isTyping || !inputMessage.trim()}
          style={{
            backgroundColor: isTyping ? theme.secondaryColor : theme.primaryColor,
            boxShadow: `0 2px 8px ${theme.shadowColor}`,
            transition: `all ${animations.transitionSpeed || '0.3s'} ease`,
          }}
        >
          {isTyping ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
