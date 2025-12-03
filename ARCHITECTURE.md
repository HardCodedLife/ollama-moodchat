# 🏗️ MoodChat Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                     http://localhost:5173                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │  HTTP + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │   App.tsx   │  │  themes.ts  │  │   api.ts (REST +     │   │
│  │  (Main App) │  │ (12 Themes) │  │   WebSocket Client)  │   │
│  └─────────────┘  └─────────────┘  └──────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    COMPONENTS                          │   │
│  │  • ConversationList (Sidebar)                         │   │
│  │  • ChatInterface (Main Chat)                          │   │
│  │  • NewConversationModal (Create Dialog)               │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │  REST API (port 8000)
                         │  WebSocket (/ws/{id})
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND (Python)                      │
│                     server_new.py                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REST ENDPOINTS                                          │  │
│  │  • GET  /api/conversations                              │  │
│  │  • POST /api/conversations                              │  │
│  │  • GET  /api/conversations/{id}                         │  │
│  │  • PUT  /api/conversations/{id}                         │  │
│  │  • DELETE /api/conversations/{id}                       │  │
│  │  • POST /api/conversations/{id}/files                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WEBSOCKET ENDPOINT                                      │  │
│  │  • /ws/{conversation_id}                                │  │
│  │    - Receive user messages                              │  │
│  │    - Stream AI responses                                │  │
│  │    - Detect and send theme updates                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IN-MEMORY STORAGE                                       │  │
│  │  • conversations_db: {id: conversation_data}            │  │
│  │  • active_sessions: {ws_id: session_data}               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  THEME DETECTION ENGINE                                  │  │
│  │  • Analyzes last 6 messages                             │  │
│  │  • Calls Ollama with detection prompt                   │  │
│  │  • Returns theme: romance/adventure/calm/etc.           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │  HTTP POST (localhost:11434)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OLLAMA SERVER                              │
│                   http://localhost:11434                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LLM MODEL (e.g., llama3.2)                             │  │
│  │  • Loaded in memory                                      │  │
│  │  • Processes chat messages                               │  │
│  │  • Generates streaming responses                         │  │
│  │  • Analyzes sentiment for theme detection                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Message Flow

### Creating a Conversation

```
User → Frontend Modal → POST /api/conversations
                        ↓
                   Backend creates conversation
                        ↓
                   Returns {conversation_id, conversation}
                        ↓
                   Frontend stores & displays
```

### Sending a Message

```
User types → Frontend → WebSocket.send({message: "..."})
                             ↓
                        Backend receives
                             ↓
                        Prepares context (custom + history)
                             ↓
                        POST to Ollama /api/chat (streaming)
                             ↓
                   ┌─────────┴─────────┐
                   ▼                   ▼
            WebSocket sends        Backend saves
            chunks to frontend     complete response
                   ▼
            Frontend displays
            character-by-character
                   ▼
            After 6+ messages
            Backend runs theme detection
                   ▼
            WebSocket sends new theme
                   ▼
            Frontend transitions background
```

### Theme Detection Flow

```
Conversation reaches 6+ messages
            ↓
Backend extracts last 6 messages
            ↓
Formats as text: "user: ...\nassistant: ...\n..."
            ↓
Sends to Ollama with THEME_DETECTOR_PROMPT
            ↓
Ollama analyzes emotional tone
            ↓
Returns single word: "romance" / "adventure" / etc.
            ↓
Backend validates against theme list
            ↓
Updates conversation.current_theme
            ↓
Sends theme to frontend via WebSocket
            ↓
Frontend applies new theme (0.8s transition)
```

## Component Hierarchy

```
App.tsx
│
├── ConversationList
│   ├── Header
│   │   ├── Title
│   │   └── New Chat Button
│   │
│   └── Conversation Items (map)
│       ├── Title
│       ├── Metadata (messages, date)
│       └── Delete Button
│
├── Main Content Area
│   │
│   ├── ChatInterface (if conversation selected)
│   │   ├── Chat Header
│   │   │   ├── Conversation Title
│   │   │   └── Theme Indicator
│   │   │
│   │   ├── Messages Area (scrollable)
│   │   │   ├── User Messages (map)
│   │   │   ├── Assistant Messages (map)
│   │   │   └── Typing Indicator (if active)
│   │   │
│   │   └── Input Area
│   │       ├── Textarea
│   │       └── Send Button
│   │
│   └── Welcome Screen (if no conversation)
│       ├── Title
│       ├── Description
│       └── Start Button
│
└── NewConversationModal (conditional)
    ├── Header (Title + Close)
    ├── Body
    │   ├── Title Input
    │   ├── Context Textarea
    │   ├── File Upload
    │   └── Example Contexts
    └── Footer
        ├── Cancel Button
        └── Create Button
```

## State Management

### Frontend State (React)

```typescript
// App.tsx
const [conversations, setConversations] = useState<ConversationSummary[]>([])
const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
const [showNewConversationModal, setShowNewConversationModal] = useState(false)
const [currentTheme, setCurrentTheme] = useState('calm')

// ChatInterface.tsx
const [messages, setMessages] = useState<Message[]>([])
const [inputMessage, setInputMessage] = useState('')
const [isTyping, setIsTyping] = useState(false)
const [ws, setWs] = useState<WebSocket | null>(null)
const [currentAssistantMessage, setCurrentAssistantMessage] = useState('')
```

### Backend State (Python)

```python
# In-memory dictionaries
conversations_db = {}  # {conversation_id: Conversation}
active_sessions = {}   # {websocket_id: {conversation_id}}
```

## Data Models

### TypeScript Types (Frontend)

```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  custom_context: string
  created_at: string
  updated_at: string
  messages: Message[]
  current_theme: string
}

interface ConversationSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

interface Theme {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  // ... more color properties
}

interface WebSocketMessage {
  type: 'start' | 'chunk' | 'end' | 'error'
  content?: string
  theme?: string
  message?: string
}
```

### Python Models (Backend)

```python
from pydantic import BaseModel

class ConversationCreate(BaseModel):
    title: str
    custom_context: Optional[str] = ""

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    custom_context: Optional[str] = None
```

## Technology Stack Deep Dive

### Frontend Stack
```
React 18
  ├── TypeScript (type safety)
  ├── Vite (build tool, HMR)
  ├── CSS3 (animations, gradients)
  └── WebSocket API (real-time)
```

### Backend Stack
```
FastAPI
  ├── Uvicorn (ASGI server)
  ├── httpx (async HTTP client)
  ├── WebSockets (bi-directional)
  └── Python asyncio (async/await)
```

### AI Stack
```
Ollama
  ├── llama3.2 (default model)
  ├── Local inference
  └── Streaming responses
```

## Security Considerations

### Current Implementation
- ✅ File size limits (1MB)
- ✅ File type validation (.txt, .md, .json)
- ✅ CORS configuration
- ✅ Input validation via Pydantic

### Production Recommendations
- 🔒 Add user authentication (JWT)
- 🔒 Implement rate limiting
- 🔒 Use HTTPS/WSS
- 🔒 Add database with proper isolation
- 🔒 Sanitize user inputs
- 🔒 Add API keys for backend
- 🔒 Implement session management

## Scalability Path

### Current Limitations
- In-memory storage (lost on restart)
- Single server instance
- No user accounts
- No persistence

### Scaling Steps

**Phase 1: Persistence**
```
In-Memory → SQLite → PostgreSQL
```

**Phase 2: Multi-User**
```
Add authentication → User isolation → Session management
```

**Phase 3: Horizontal Scaling**
```
Add Redis → Load balancer → Multiple backend instances
```

**Phase 4: Advanced Features**
```
Add message queue → Background jobs → Analytics
```

## Development Workflow

```
1. Frontend Development
   └── npm run dev (hot reload)
       └── Edit .tsx/.css files
           └── Changes reflect instantly

2. Backend Development
   └── uvicorn --reload
       └── Edit server_new.py
           └── Server restarts automatically

3. Theme Development
   └── Edit themes.ts
       └── Add new theme
           └── Update THEME_DETECTOR_PROMPT
               └── Test with conversations
```

## Performance Optimization

### Frontend
- Component memoization (React.memo)
- Lazy loading for routes
- Debounced input handling
- Virtual scrolling for long message lists

### Backend
- Async/await throughout
- Connection pooling
- Message history truncation (20 messages)
- Streaming responses (low latency)

### Ollama
- Model kept in memory
- GPU acceleration (if available)
- Batch processing for theme detection

---

**Architecture designed for**: Simplicity, Extensibility, Real-time Performance
