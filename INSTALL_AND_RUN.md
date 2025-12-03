# Installation and Running Guide

## Quick Start

### 1. Install Backend Dependencies

```bash
# Install Python packages
pip install fastapi uvicorn ollama

# Verify ollama is installed
python -c "import ollama; print('Ollama package installed!')"
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

This installs:
- React 19
- react-markdown (for markdown rendering)
- remark-gfm (GitHub Flavored Markdown)
- rehype-highlight (syntax highlighting)
- rehype-raw (raw HTML support)

### 3. Build Frontend

```bash
# Still in frontend directory
npm run build
```

This creates `frontend/dist/` with production-ready files.

### 4. Run Server

```bash
# Back to root directory
cd ..

# Run the server
uvicorn server_dynamic:app --reload --host 127.0.0.1 --port 8000
```

### 5. Open Browser

Navigate to: **http://127.0.0.1:8000**

## What You'll See

1. **Create Conversation** - Click to start new chat
2. **Send Message** - Type and send
3. **AI Response** - Streams in real-time with markdown
4. **Theme Changes** - UI redesigns after every response
5. **Animations** - Messages animate in with AI-chosen style

## Features Enabled

✅ **Markdown rendering** - Code blocks, headers, tables, etc.
✅ **Syntax highlighting** - Code displays beautifully
✅ **Theme per response** - UI changes every time
✅ **8 animation styles** - slideIn, fadeIn, bounceIn, etc.
✅ **Persistent storage** - SQLite database
✅ **Ollama streaming** - Fast, real-time responses

## Development Mode

If you want to develop the frontend:

```bash
# Terminal 1 - Backend
uvicorn server_dynamic:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 - Frontend dev server
cd frontend
npm run dev
```

Frontend dev server runs on: **http://localhost:5173**

## Configuration

### Change Models

Edit `server_dynamic.py` lines 40-42:

```python
CHAT_MODEL = "gpt-oss:120b-cloud"      # Your conversation model
DESIGN_MODEL = "qwen3-vl:235b-cloud"   # Your design model
CODE_MODEL = "glm-4.6:cloud"           # Your code generation model
```

### Disable Theme Per Response

If you want themes every 2 messages instead:

Edit `server_dynamic.py` line 390:

```python
# Change from:
if True:

# To:
if user_msg_count % 2 == 0 and user_msg_count > 0:
```

### Change Default Animation

Edit `frontend/src/components/ChatInterface.css` to set default:

```css
.message {
  animation: fadeIn 0.3s ease-out;  /* Change to any animation */
}
```

## Troubleshooting

### "Module 'ollama' not found"

```bash
pip install ollama
```

### "Module 'react-markdown' not found"

```bash
cd frontend
npm install
npm run build
```

### Port 8000 already in use

```bash
# Use different port
uvicorn server_dynamic:app --reload --host 127.0.0.1 --port 8001
```

Then update frontend API URL in `frontend/src/api.ts`.

### Database errors

```bash
# Delete database and start fresh
rm moodchat.db
```

Database will be recreated automatically.

### Theme not generating

Check that your Ollama models are running:

```bash
# Test design model
ollama run qwen3-vl:235b-cloud "Test"

# Test code model
ollama run glm-4.6:cloud "Test"

# Test chat model
ollama run gpt-oss:120b-cloud "Test"
```

## File Structure

```
ollama個人化聊天室/
├── server_dynamic.py          # Main backend (use this!)
├── server_new.py              # Legacy static themes backend
├── database.py                # SQLite database module
├── moodchat.db               # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx    # Main chat UI
│   │   │   └── ChatInterface.css    # Styles + animations
│   │   ├── types.ts                 # TypeScript definitions
│   │   ├── api.ts                   # API client
│   │   └── App.tsx                  # Root component
│   ├── dist/                        # Built frontend (after npm run build)
│   └── package.json                 # Frontend dependencies
└── Documentation/
    ├── AI_CONVERSATION_DESIGN.md   # Full design system guide
    ├── LATEST_UPDATES.md           # Recent changes
    └── DATABASE_INTEGRATION.md      # Database guide
```

## Testing

### Test Markdown

Send this message:
```
# Test Header

This is **bold** and *italic*.

```python
def test():
    return "Hello"
```

- Item 1
- Item 2
```

Expected: Full markdown rendering with syntax highlighting

### Test Theme Changes

1. Send: "Hello"
2. Wait for response
3. **Theme changes**
4. Send: "Tell me a joke"
5. Wait for response
6. **Theme changes again**

Expected: Different theme after each response

### Test Animations

Open browser console and check theme object:
```javascript
// Look for:
conversationDesign.animations.messageEntrance
// Should be one of: slideIn, fadeIn, scaleIn, slideFromLeft, slideFromRight, bounceIn, rotateIn, flipIn
```

## Performance

**First Load:**
- Backend: ~1-2 seconds
- Frontend: ~0.5 seconds
- Total: ~2 seconds

**Per Message:**
- AI Response: 2-5 seconds (depends on model)
- Theme Generation: 3-5 seconds (parallel with next message)
- Markdown Rendering: <50ms

**Database:**
- Message save: <10ms
- Theme save: <10ms
- Load conversation: ~50ms

## Production Deployment

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Run with gunicorn or uvicorn:
```bash
uvicorn server_dynamic:app --host 0.0.0.0 --port 8000 --workers 4
```

3. Serve behind nginx (recommended):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Support

For issues, check:
1. **LATEST_UPDATES.md** - Recent changes and troubleshooting
2. **AI_CONVERSATION_DESIGN.md** - Design system details
3. **DATABASE_INTEGRATION.md** - Database help

Happy chatting! 🎨✨
