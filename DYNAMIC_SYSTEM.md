# 🎨 MoodChat Dynamic Theme System - Technical Documentation

## System Overview

MoodChat Dynamic is an advanced AI chat application that **generates custom visual themes in real-time** using a **3-LLM pipeline** that analyzes conversation emotion and automatically implements matching visual designs.

## The 3-LLM Pipeline

### Architecture Flow

```
User Message (every 2nd)
        ↓
┌───────────────────────────────────────────────────────────┐
│  STEP 1: CONVERSATION (Always)                            │
│  Model: llama3.2 (Chat LLM)                               │
│  Task: Respond to user message with streaming            │
│  Output: Real-time streamed response                      │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  STEP 2: DESIGN GUIDANCE (Every 2 user messages)          │
│  Model: llama3.2 (Design LLM)                             │
│  Task: Analyze conversation emotional tone                │
│  Input: Last 6 messages from conversation                 │
│  Prompt: Theme design specification request               │
│  Output: Structured design specification                  │
│    - Primary Color: #hexcode                              │
│    - Secondary Color: #hexcode                            │
│    - Background Color: #hexcode                           │
│    - Gradient Start/End: #hexcode                         │
│    - Theme Name: "Creative Name"                          │
│    - Theme Icon: 🎨                                        │
│    - Mood Description: "emotional atmosphere"             │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  STEP 3: CODE GENERATION (Immediately after Step 2)       │
│  Model: qwen2.5-coder:3b (Code LLM)                       │
│  Task: Convert design spec to working CSS/JSON            │
│  Input: Design specification from Step 2                  │
│  Prompt: JSON theme object generation                     │
│  Output: Valid JSON theme object                          │
│    {                                                       │
│      "id": "theme_id",                                    │
│      "name": "Theme Name",                                 │
│      "primaryColor": "#hexcode",                          │
│      "gradientStart": "#hexcode",                         │
│      ... (complete theme properties)                      │
│    }                                                       │
└───────────────────────────────────────────────────────────┘
        ↓
Frontend receives JSON → Applies theme → Smooth transition
```

## Detailed Pipeline Breakdown

### Step 1: Conversation (Chat LLM)

**Model**: `llama3.2` (or any chat model)

**Trigger**: Every user message

**Process**:
1. User sends message via WebSocket
2. Backend adds message to conversation history
3. Prepares context (custom context + last 20 messages)
4. Calls Ollama `/api/chat` with streaming=true
5. Streams response chunks to frontend in real-time
6. Frontend displays character-by-character

**WebSocket Messages**:
```json
{"type": "start"}  // Response starting
{"type": "chunk", "content": "text"}  // Each piece of response
{"type": "end"}  // Response complete
```

**Performance**: Real-time streaming (~10-50 tokens/second)

### Step 2: Design Guidance (Design LLM)

**Model**: `llama3.2` (same as chat, or different)

**Trigger**: Every 2 user messages (configurable)

**Input Format**:
```
You are a UX/UI designer analyzing a conversation to create a perfect visual theme.

Conversation context:
user: I'm so excited about my trip to Japan!
assistant: That sounds amazing! What are you most looking forward to?
user: Climbing Mount Fuji and exploring Tokyo at night!
assistant: What an adventure! The views from Fuji are breathtaking...
[... last 6 messages]

Based on the emotional tone, topics, and atmosphere of this conversation, design a visual theme.

[... structured output request ...]
```

**Output Example**:
```
PRIMARY: #ff6b35
SECONDARY: #f7931e
BACKGROUND: #fff8e1
ACCENT: #ffa726
TEXT: #3e2723
GRADIENT_START: #ff8a50
GRADIENT_END: #ff6b35
USER_BG: #ff8f50
ASSISTANT_BG: #ffe5b4
NAME: Adventurous Sunrise
ICON: 🗺️
MOOD: Vibrant and energetic, capturing the excitement of exploration and new adventures
```

**WebSocket Message**:
```json
{
  "type": "theme_generating",
  "message": "Generating custom theme..."
}
```

**Performance**: ~10-30 seconds (analyzing + generating design)

### Step 3: Code Generation (Code LLM)

**Model**: `qwen2.5-coder:3b` (specialized coding model)

**Trigger**: Immediately after Step 2 completes

**Input Format**:
```
You are a CSS expert. Generate a complete theme object based on this design specification:

PRIMARY: #ff6b35
SECONDARY: #f7931e
BACKGROUND: #fff8e1
[... full design spec ...]

Generate a JSON object with this EXACT structure (valid JSON only, no comments):
{
  "id": "unique_id_based_on_name",
  "name": "Theme Name",
  ...
}
```

**Output Example**:
```json
{
  "id": "adventurous_sunrise",
  "name": "Adventurous Sunrise",
  "primaryColor": "#ff6b35",
  "secondaryColor": "#f7931e",
  "backgroundColor": "#fff8e1",
  "textColor": "#3e2723",
  "accentColor": "#ffa726",
  "gradientStart": "#ff8a50",
  "gradientEnd": "#ff6b35",
  "messageUserBg": "#ff8f50",
  "messageAssistantBg": "#ffe5b4",
  "borderColor": "#ff9966",
  "shadowColor": "rgba(255, 107, 53, 0.3)",
  "icon": "🗺️"
}
```

**WebSocket Messages**:
```json
{"type": "theme_design_complete", "design": "preview..."}
{"type": "theme_update", "theme": {/* complete JSON */}}
```

**Performance**: ~5-15 seconds (code generation + JSON parsing)

## Frontend Integration

### Theme State Management

```typescript
// App.tsx manages current theme
const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

// Theme updates from WebSocket
if (data.type === 'theme_update' && data.theme) {
  setCurrentTheme(data.theme as Theme);
}
```

### Dynamic Theme Application

```tsx
// Theme is applied to root container with smooth transitions
<div
  className="app-container"
  style={{
    background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
    transition: 'background 0.8s ease'  // Smooth color transitions
  }}
>
```

### Visual Feedback

**Theme Generation Progress**:
1. "🎨 Generating custom theme..." (appears)
2. "🎨 Theme designed! Coding implementation..."
3. "✨ Theme updated!" (disappears after 3 seconds)

**Message Counter**:
```
User messages: 3
(Next theme in 1 message)  // Appears when count is odd
```

## Configuration Options

### server_dynamic.py

```python
# Model Configuration
CHAT_MODEL = "llama3.2"           # Main conversation
DESIGN_MODEL = "llama3.2"         # Theme design
CODE_MODEL = "qwen2.5-coder:3b"   # CSS generation

# Theme Generation Frequency
if user_msg_count % 2 == 0:  # Every 2 messages (change number here)

# Context Window
recent_messages = messages[-20:]  # Last 20 messages for context

# Design Analysis Window
recent_messages[-6:]  # Last 6 messages for theme detection
```

### Adjustable Parameters

| Parameter | Location | Default | Purpose |
|-----------|----------|---------|---------|
| Theme frequency | Line ~283 | 2 messages | How often to generate |
| Design window | Line ~308 | 6 messages | Context for design LLM |
| Context window | Line ~242 | 20 messages | Chat history limit |
| Timeout | Lines ~145, 149, 153 | 120s | API call timeout |

## Error Handling

### Theme Generation Failures

**Scenario 1**: Design LLM returns invalid format
```python
# Fallback: Use previous theme
# User sees: "⚠️ Theme generation failed"
```

**Scenario 2**: Code LLM returns invalid JSON
```python
# Regex extraction attempts to find JSON
# If fails: User sees "⚠️ Theme generation failed"
# Theme: Previous theme continues
```

**Scenario 3**: Network timeout
```python
# httpx.AsyncClient(timeout=120.0)
# After 120s: Raises exception
# Caught in try/except, error sent to frontend
```

### Recovery Strategies

1. **Graceful Degradation**: Always maintain previous valid theme
2. **User Notification**: Clear error messages in UI
3. **Logging**: Backend prints errors for debugging
4. **Auto-retry**: None (prevents infinite loops)

## Performance Characteristics

### Timing Breakdown

**Total Time for Theme Generation**: ~15-45 seconds

| Stage | Duration | Notes |
|-------|----------|-------|
| Message response | 2-10s | Streaming (parallel to user reading) |
| Design analysis | 10-30s | LLM processing conversation |
| Code generation | 5-15s | LLM generating JSON |
| JSON parsing | <1s | Regex + validation |
| Frontend apply | <1s | React state update + CSS |

### Optimization Strategies

**Speed Improvements**:
1. **GPU Acceleration**: Ollama with CUDA/ROCm (3-5x faster)
2. **Smaller Models**: Use qwen2.5-coder:1.5b instead of 3b (2x faster)
3. **Reduce Frequency**: Generate every 3-4 messages instead of 2
4. **Parallel Processing**: Design + Code could run in parallel (not implemented)

**Quality Improvements**:
1. **Larger Models**: qwen2.5-coder:7b (better CSS, slower)
2. **More Context**: Increase design window to 10 messages
3. **Iterative Refinement**: Generate multiple themes, pick best (not implemented)

## Data Flow

### Complete Message Flow

```
1. User types "I love sunny days!" → Press Enter

2. Frontend:
   - Adds to local messages array
   - Sends via WebSocket: {"message": "I love sunny days!"}

3. Backend:
   - Receives message
   - Increments user_message_count (now = 2)
   - Adds to conversation DB
   - Calls Chat LLM (streaming)

4. Chat LLM Response:
   - Streams chunks: "Sunny days", " are", " wonderful!", ...
   - Frontend displays in real-time
   - Backend saves complete response

5. Theme Generation Check:
   - user_message_count % 2 == 0? → YES (count is 2)
   - Send: {"type": "theme_generating"}

6. Design LLM:
   - Analyze last 6 messages
   - Generate design spec (~20 seconds)
   - Send: {"type": "theme_design_complete"}

7. Code LLM:
   - Convert spec to JSON (~10 seconds)
   - Validate JSON structure
   - Send: {"type": "theme_update", "theme": {...}}

8. Frontend:
   - Receive theme object
   - Update state: setCurrentTheme(newTheme)
   - CSS transitions kick in (0.8s smooth)
   - Show "✨ Theme updated!" for 3 seconds
```

## Advanced Features

### Theme Caching

```python
theme_cache = {}  # {conversation_id: generated_theme}

# Themes persist for conversation duration
# Lost on backend restart (in-memory only)
```

### Future: Persistent Themes

```python
# Save to database
db.save_theme(conversation_id, theme_json)

# Load on conversation resume
cached_theme = db.get_theme(conversation_id)
if cached_theme:
    send_theme_update(cached_theme)
```

### Future: Theme History

```python
# Track all generated themes
conversation_data = {
    "theme_history": [
        {"timestamp": "...", "theme": {...}, "user_msg_count": 2},
        {"timestamp": "...", "theme": {...}, "user_msg_count": 4},
    ]
}

# Allow user to revert to previous theme
```

## Security Considerations

### Input Validation

```python
# Message size limit
if len(user_message) > 5000:
    return error("Message too long")

# File upload validation
if file_size > 1_000_000:
    return error("File too large")
```

### LLM Output Sanitization

```python
# JSON validation prevents code injection
try:
    theme_json = json.loads(json_match.group(0))
except json.JSONDecodeError:
    return None  # Invalid JSON discarded
```

### Theme Object Validation

```python
# Frontend expects specific properties
# Missing properties use defaults
# Invalid hex codes: Browser handles gracefully
```

## Troubleshooting

### Common Issues

**Issue**: "Theme generation failed" on every attempt

**Debug Steps**:
1. Check backend logs for detailed error
2. Test code model directly: `ollama run qwen2.5-coder:3b "Generate JSON: {...}"`
3. Verify JSON parsing in backend
4. Try different coding model

**Issue**: Themes change too frequently

**Solution**: Increase frequency in `server_dynamic.py`:
```python
if user_msg_count % 4 == 0:  # Every 4 messages instead of 2
```

**Issue**: Themes don't match conversation mood

**Tuning**:
1. Increase design window: `messages[-10:]` instead of `[-6:]`
2. Add more specific prompts in `THEME_DESIGN_PROMPT`
3. Try different design model (e.g., GPT-4 via API)

---

**The Dynamic System**: Where AI doesn't just chat—it designs your entire experience in real-time. 🎨✨
