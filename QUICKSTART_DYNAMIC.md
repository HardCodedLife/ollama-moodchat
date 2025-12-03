# 🎨 MoodChat Dynamic - Quick Start Guide

## Revolutionary Feature: AI-Generated Themes Every 2 Messages!

This version uses **3 LLMs working together** to create custom themes based on your conversation:
1. **Chat LLM** (llama3.2) - Responds to your messages
2. **Design LLM** (llama3.2) - Analyzes conversation and creates theme design
3. **Code LLM** (qwen2.5-coder:3b) - Generates CSS implementation from design

## Prerequisites

### 1. Install Ollama
Download from [https://ollama.ai](https://ollama.ai)

### 2. Pull Required Models

```bash
# Main chat model (required)
ollama pull llama3.2

# Coding model for CSS generation (required)
ollama pull qwen2.5-coder:3b
```

**Note**: The coding model (qwen2.5-coder:3b) is small (~2GB) and fast, perfect for generating CSS themes quickly.

### 3. Install Dependencies

```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies (in frontend directory)
cd frontend
npm install
cd ..
```

## Running the App

### Terminal 1: Start Ollama (if not already running)
```bash
ollama serve
```

### Terminal 2: Start Dynamic Backend
```bash
uvicorn server_dynamic:app --reload --host 127.0.0.1 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 3: Start Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
```

### Open Browser
Navigate to **http://localhost:5173**

## How It Works

### The Dynamic Theme Generation Pipeline

Every **2 user messages**, the system automatically:

1. **You send a message** → Chat LLM streams response in real-time

2. **After every 2nd user message**:
   - Status: "🎨 Generating custom theme..."
   - **Design LLM** analyzes your conversation and creates a theme design

3. **Theme Design Complete**:
   - Status: "🎨 Theme designed! Coding implementation..."
   - **Code LLM** converts the design into working CSS/JSON

4. **Theme Applied**:
   - Status: "✨ Theme updated!"
   - Your interface smoothly transitions to the new theme

### Example Flow

```
Message 1 (you): "I'm so excited about my upcoming adventure to Japan!"
→ AI responds (calm theme)

Message 2 (you): "I can't wait to climb Mount Fuji and explore Tokyo!"
→ AI responds
→ 🎨 Generating theme... (analyzing excitement + adventure)
→ 🎨 Coding implementation...
→ ✨ New theme: "Adventurous Sunrise"
   (vibrant oranges, energetic gradients, travel-inspired colors)

Message 3 (you): "What should I pack for the trip?"
→ AI responds (adventurous theme continues)

Message 4 (you): "Actually, I'm a bit nervous about traveling alone..."
→ AI responds
→ 🎨 Generating theme... (analyzing nervousness + reflection)
→ 🎨 Coding implementation...
→ ✨ New theme: "Calm Reflection"
   (soothing blues, gentle gradients, comforting tones)
```

## Configuration

### Change Models

Edit `server_dynamic.py`:

```python
CHAT_MODEL = "llama3.2"           # Main conversation
DESIGN_MODEL = "llama3.2"         # Theme design guidance
CODE_MODEL = "qwen2.5-coder:3b"   # CSS generation
```

You can use different models:
- For chat: `"llama2"`, `"mistral"`, `"llama3.2"`
- For design: Same as chat models
- For code: `"qwen2.5-coder:7b"` (better quality, slower), `"codellama"`, `"deepseek-coder"`

### Adjust Theme Generation Frequency

Edit `server_dynamic.py` line ~283:

```python
# Change from every 2 messages to every 3 messages
if user_msg_count % 3 == 0 and user_msg_count > 0:
```

## Tips for Best Results

### 1. **Express Emotions Clearly**
The more emotion you show, the better the theme:
- ✅ "I'm so excited and happy about this!"
- ❌ "ok"

### 2. **Let Conversations Flow**
Wait for at least 4-6 messages before expecting dramatic theme changes:
- Message 1-2: Initial theme generation
- Message 3-4: Refined based on conversation direction
- Message 5-6: Fully adapted to your emotional state

### 3. **Use Rich Language**
Descriptive words help the AI understand your mood:
- ✅ "I feel calm and peaceful thinking about the ocean waves"
- ❌ "water is nice"

### 4. **Try Different Conversation Types**
- **Romantic**: Talk about love, relationships, emotions
- **Adventure**: Discuss travel, exploration, excitement
- **Calm**: Meditative thoughts, peaceful topics
- **Dramatic**: Intense emotions, conflicts, challenges

## Troubleshooting

### "Theme generation failed"
**Cause**: Code LLM couldn't generate valid JSON

**Solutions**:
1. Make sure `qwen2.5-coder:3b` is installed: `ollama list`
2. Pull it if missing: `ollama pull qwen2.5-coder:3b`
3. Check backend terminal for error details
4. Try a different coding model (edit `CODE_MODEL` in server_dynamic.py)

### Themes not changing
**Cause**: Not enough user messages yet

**Solution**:
- Send at least 2 user messages
- Check message counter in header: "User messages: X"
- Wait for "(Next theme in 1 message)" indicator

### Slow theme generation
**Cause**: Models are processing (normal for first generation)

**Expected times**:
- Design phase: 10-30 seconds (analyzing conversation)
- Code phase: 5-15 seconds (generating CSS)
- **Total**: ~15-45 seconds for complete theme

**Speed improvements**:
- Use GPU for Ollama (significant speedup)
- Use smaller models (faster but less creative)
- Increase generation frequency (less frequent = feels faster)

### Backend errors
```bash
# Check if all models are loaded
ollama list

# You should see:
# llama3.2
# qwen2.5-coder:3b
```

## Understanding the UI

### Header Indicators
- **Theme Name**: Current active theme (e.g., "Calm 🌊")
- **User messages: X**: How many messages you've sent
- **(Next theme in 1 message)**: Theme will generate after next message

### Status Banner
- **🎨 Generating custom theme...**: Design LLM is analyzing
- **🎨 Theme designed! Coding...**: Code LLM is implementing
- **✨ Theme updated!**: New theme applied (disappears after 3s)
- **⚠️ Theme generation failed**: Error occurred, using previous theme

## Advanced Usage

### Save Custom Themes
Themes are temporarily stored per conversation. To make them permanent:

1. Check browser console for theme object: `console.log(theme)`
2. Copy the JSON
3. Add to `frontend/src/themes.ts` in the `themes` object

### Monitor Theme Generation
Open browser DevTools → Console to see:
- WebSocket messages
- Theme generation steps
- Generated theme JSON

### Experiment with Context
Add context that influences theme generation:
```
Custom context: "I prefer dark, mysterious themes with purple and black colors"
```

The design LLM will consider this when creating themes!

## What Makes This Special?

### Traditional Apps
- **Static themes**: 5-10 pre-defined themes
- **Manual switching**: User clicks to change
- **No adaptation**: Same colors regardless of mood

### MoodChat Dynamic
- **Infinite themes**: New theme generated for each conversation flow
- **Automatic switching**: Based on emotional analysis
- **Full adaptation**: Colors, gradients, everything customized

### The Magic
Every theme is **uniquely yours**, designed by AI specifically for your conversation's emotional journey. No two themes are exactly the same!

---

**Ready to experience emotionally intelligent design?** 🎨✨

Start chatting and watch your interface transform with your mood!
