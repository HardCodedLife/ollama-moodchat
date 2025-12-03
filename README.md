# 🎨 MoodChat - Context-Aware Personalized AI Companion

A next-generation chat application powered by Ollama that automatically adapts its visual theme based on the emotional tone of your conversation. Built with FastAPI and React + TypeScript.

## ✨ Unique Features

### 🌈 **Adaptive Mood Themes**
- **12 Distinct Emotional Themes**: Romance, Adventure, Mystery, Professional, Playful, Calm, Energetic, Melancholic, Inspiring, Cozy, Dramatic, Fantasy
- **Automatic Theme Detection**: AI analyzes conversation sentiment and dynamically switches themes
- **Smooth Transitions**: Beautiful gradient backgrounds and animations that evolve with your chat

### 🎭 **Personalization System**
- **Custom Context Profiles**: Define AI personality (romantic companion, study buddy, creative assistant, etc.)
- **File Upload Support**: Upload .txt, .md, or .json files (max 1MB) to provide additional context
- **Persistent Memory**: AI remembers your preferences and conversation history

### 💬 **Advanced Chat Management**
- **Save & Continue**: All conversations are automatically saved
- **Multiple Conversations**: Create and manage unlimited chat sessions
- **Delete Conversations**: Remove unwanted chats anytime
- **Real-time Streaming**: See AI responses appear character-by-character
- **History Management**: Continue old conversations seamlessly

### 🎨 **Modern UI/UX**
- Gradient background transitions based on mood
- Smooth animations and hover effects
- Responsive design (desktop & mobile)
- Clean, intuitive interface
- Typing indicators with streaming responses

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python)
- Ollama API (Local LLM)
- WebSocket for real-time communication
- httpx for async HTTP requests

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- CSS3 with custom animations
- WebSocket client

## 📋 Prerequisites

1. **Python 3.8+**
2. **Node.js 18+** and npm
3. **Ollama** - [Install Ollama](https://ollama.ai)
4. **Ollama Model** - Pull a model (recommended: `llama3.2`)

```bash
# Pull the recommended model
ollama pull llama3.2
```

## 🚀 Installation & Setup

### Backend Setup

1. **Install Python dependencies:**
```bash
pip install fastapi uvicorn httpx
```

2. **Start the backend server:**
```bash
# From the project root directory
uvicorn server_new:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies (if not already done):**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🎯 Usage Guide

### Creating Your First Conversation

1. Click **"+ New Chat"** or the welcome screen button
2. Enter a **conversation title** (e.g., "My AI Companion")
3. (Optional) Add **custom context**:
   - Example: "You are a supportive friend who loves poetry..."
   - Example: "You are a professional coding mentor..."
4. (Optional) Upload a **context file** with additional information
5. Click **"Create Conversation"**

### Chatting

1. Type your message in the input box
2. Press **Enter** or click **"Send"**
3. Watch the AI respond in real-time
4. Notice the theme changing based on conversation mood

### Managing Conversations

- **Switch Conversations**: Click on any conversation in the sidebar
- **Delete Conversations**: Click the × button next to a conversation (with confirmation)
- **Continue Old Chats**: Simply select a previous conversation to continue

## 🎨 Theme System

MoodChat features 12 distinct themes that automatically activate based on your conversation:

| Theme | Trigger | Visual Style |
|-------|---------|--------------|
| 💕 Romance | Love, relationships, emotions | Soft pinks and reds |
| 🗺️ Adventure | Exploration, travel, excitement | Warm oranges |
| 🔍 Mystery | Intrigue, puzzles, investigation | Deep purples |
| 💼 Professional | Work, business, formal topics | Cool blues |
| 🎉 Playful | Fun, games, lighthearted chat | Bright pinks |
| 🌊 Calm | Relaxation, peace, meditation | Teal greens |
| ⚡ Energetic | High energy, motivation | Vibrant yellows |
| 🌧️ Melancholic | Sadness, reflection | Gray blues |
| ✨ Inspiring | Motivation, goals, dreams | Bright cyan |
| 🏠 Cozy | Comfort, warmth, home | Warm browns |
| 🎭 Dramatic | Intense emotions, conflict | Bold reds |
| 🔮 Fantasy | Magic, imagination, stories | Royal purples |

## 📁 Project Structure

```
ollama個人化聊天室/
├── server_new.py              # FastAPI backend with Ollama integration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConversationList.tsx      # Sidebar conversation list
│   │   │   ├── ConversationList.css
│   │   │   ├── ChatInterface.tsx         # Main chat interface
│   │   │   ├── ChatInterface.css
│   │   │   ├── NewConversationModal.tsx  # Create conversation modal
│   │   │   └── NewConversationModal.css
│   │   ├── App.tsx                       # Main app component
│   │   ├── App.css
│   │   ├── api.ts                        # API client
│   │   ├── themes.ts                     # Theme definitions
│   │   ├── types.ts                      # TypeScript types
│   │   ├── main.tsx                      # Entry point
│   │   └── index.css                     # Global styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔧 Configuration

### Backend Configuration

Edit `server_new.py`:

```python
# Change Ollama API URL (if running on different host/port)
OLLAMA_BASE_URL = "http://localhost:11434"

# Change default model
DEFAULT_MODEL = "llama3.2"  # or "llama2", "mistral", etc.
```

### Frontend Configuration

Edit `frontend/src/api.ts`:

```typescript
// Change backend API URL
const API_BASE_URL = 'http://localhost:8000/api';
```

## 🎨 Customizing Themes

Add or modify themes in `frontend/src/themes.ts`:

```typescript
export const themes: Record<string, Theme> = {
  yourtheme: {
    id: 'yourtheme',
    name: 'Your Theme',
    primaryColor: '#hexcode',
    // ... other colors
    icon: '🎯'
  }
};
```

Update theme detector in `server_new.py` to include your new theme in the valid themes list.

## 🔒 Security Notes

- **File Upload Limit**: 1MB maximum to prevent memory issues
- **Allowed File Types**: Only .txt, .md, .json files
- **CORS**: Currently set for `localhost:5173` (development)
- **Production**: Use proper authentication and HTTPS in production

## 🐛 Troubleshooting

### Backend won't start
```bash
# Make sure Ollama is running
ollama serve

# Check if port 8000 is available
netstat -ano | findstr :8000
```

### Frontend can't connect
```bash
# Verify backend is running at http://localhost:8000
# Check CORS settings in server_new.py
# Ensure WebSocket connection URL is correct
```

### Theme not changing
- The AI needs at least 6 messages to detect theme changes
- Theme detection requires context (short messages may not trigger changes)

### Model not responding
```bash
# Verify model is installed
ollama list

# Pull the model if missing
ollama pull llama3.2
```

## 🚀 Future Enhancements

- [ ] Database persistence (SQLite/PostgreSQL)
- [ ] User authentication
- [ ] Export conversations
- [ ] Voice input/output
- [ ] Image generation integration
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Custom theme editor

## 📝 License

This project is open source and available for personal and educational use.

## 🤝 Contributing

Feel free to fork, modify, and submit pull requests. Suggestions for new themes and features are welcome!

## 💡 Tips for Best Experience

1. **Be descriptive** in your custom context to get better personalized responses
2. **Upload context files** with information about your preferences, projects, or interests
3. **Use specific conversation titles** to easily find chats later
4. **Let conversations flow naturally** - themes work best with 5+ message exchanges
5. **Experiment with different contexts** for varied AI personalities

---

**Built with ❤️ using Ollama, FastAPI, and React**
