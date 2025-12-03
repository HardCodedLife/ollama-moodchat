// TypeScript type definitions for MoodChat

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DynamicTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  gradientStart: string;
  gradientEnd: string;
  messageUserBg: string;
  messageAssistantBg: string;
  borderColor: string;
  shadowColor: string;
  icon: string;

  // Extended conversation design properties (optional for backward compatibility)
  conversationDesign?: {
    // Message bubble styling
    messageBubbleStyle?: {
      borderRadius?: string;           // e.g., "12px", "50% 10px"
      padding?: string;                 // e.g., "1rem", "12px 16px"
      fontSize?: string;                // e.g., "1rem", "16px"
      fontFamily?: string;              // e.g., "Arial", "Georgia"
      fontWeight?: string;              // e.g., "normal", "600"
      maxWidth?: string;                // e.g., "70%", "600px"
      boxShadow?: string;               // Custom shadow
      userAlign?: 'left' | 'right';    // User message alignment
      assistantAlign?: 'left' | 'right'; // Assistant message alignment
    };

    // Typography
    typography?: {
      headerFont?: string;              // e.g., "Playfair Display"
      bodyFont?: string;                // e.g., "Inter"
      monoFont?: string;                // e.g., "Fira Code"
      headerSize?: string;              // e.g., "1.5rem"
    };

    // Animations
    animations?: {
      messageEntrance?: string;         // e.g., "slideIn", "fadeIn", "none"
      typingIndicator?: string;         // e.g., "pulse", "bounce", "wave"
      transitionSpeed?: string;         // e.g., "0.3s", "0.5s"
    };

    // Layout
    layout?: {
      messageSpacing?: string;          // e.g., "1rem", "24px"
      chatPadding?: string;             // e.g., "2rem", "24px"
      inputHeight?: string;             // e.g., "auto", "120px"
    };

    // Special effects
    effects?: {
      backgroundPattern?: string;       // e.g., "dots", "grid", "waves", "none"
      glassEffect?: boolean;            // Glassmorphism on bubbles
      particles?: boolean;              // Particle background animation
      gradient?: boolean;               // Use gradient backgrounds
    };

    // Mood-specific styling
    mood?: {
      description?: string;             // e.g., "Calm and peaceful"
      intensity?: 'subtle' | 'moderate' | 'bold'; // Design intensity
      personality?: string;             // e.g., "Professional", "Playful", "Elegant"
    };
  };
}

export interface Conversation {
  id: string;
  title: string;
  custom_context: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  current_theme: DynamicTheme | string | null;  // Can be DynamicTheme object OR string theme ID (for backward compatibility)
  user_message_count?: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  user_message_count?: number;
}

export interface WebSocketMessage {
  type: 'start' | 'chunk' | 'end' | 'error' | 'theme_generating' | 'theme_design_complete' | 'theme_update' | 'theme_error';
  content?: string;
  theme?: DynamicTheme | string;  // Can be DynamicTheme object OR string theme ID (for backward compatibility)
  design?: string;
  message?: string;
}
