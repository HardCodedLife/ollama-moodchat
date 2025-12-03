# Theme Generation Speed Optimization Plan

## Goal
Reduce theme generation time from ~20-30s to under 5 seconds by optimizing the theme generation pipeline while maintaining current model and minimal context.

## User Preferences
- **Priority**: Speed over quality
- **Model**: Keep `glm-4.6:cloud` (no local model switch)
- **Context**: Keep minimal (1 message, 60 chars)

## Critical Bottlenecks Identified
1. **DB query inside async task** - loads all messages from database within theme generation task
2. **Blocking await after chat** - frontend waits for theme even if it takes 20+ seconds
3. **Heavy JSON parsing loop** - regex search on every streaming chunk
4. **No generation parameters** - LLM may generate verbose output
5. **Unused caching system** - regenerates identical themes

---

## Optimization Strategy

### 1. **Pre-fetch Messages Before Task Creation** (CRITICAL)
**Impact**: Save 1-2 seconds on DB query overhead

**Current Flow** (`server_dynamic.py:262-274`):
```python
async def generate_theme_parallel():
    all_messages = db.get_messages(conversation_id)  # ← Blocks here
    theme_object = await generate_theme_streaming(all_messages)
```

**Optimized Flow**:
- Fetch messages BEFORE creating the async task
- Pass messages directly to task (no async DB call inside)

**Files to modify**:
- `server_dynamic.py:258-274` - WebSocket handler theme generation section

---

### 2. **Optimize Streaming JSON Parser** (HIGH IMPACT)
**Impact**: Save 2-3 seconds on parsing overhead

**Current Approach** (`server_dynamic.py:179-207`):
- Accumulates full response in string
- Runs regex `r'\{[\s\S]*\}'` on EVERY chunk
- Attempts JSON parse on every chunk with `}` character

**Optimized Approach**:
- Only attempt parse when complete JSON detected (count `{` and `}`)
- Use lightweight brace counter instead of regex
- Skip parsing until balanced braces found

**Pseudocode**:
```python
brace_count = 0
started = False
for chunk in stream:
    accumulated += chunk
    for char in chunk:
        if char == '{':
            brace_count += 1
            started = True
        elif char == '}':
            brace_count -= 1

    # Only try parsing when braces balanced
    if started and brace_count == 0:
        try:
            return json.loads(accumulated)
        except: pass
```

**Files to modify**:
- `server_dynamic.py:172-211` - `generate_theme_streaming()` function

---

### 3. **Add LLM Generation Parameters for Speed** (MEDIUM IMPACT)
**Impact**: Save 1-3 seconds by preventing verbose output

**Current Call** (`server_dynamic.py:184-185`):
```python
ollama.generate(model=THEME_MODEL, prompt=prompt, stream=True)
```

**Optimized Call**:
```python
ollama.generate(
    model=THEME_MODEL,
    prompt=prompt,
    stream=True,
    options={
        'temperature': 0.3,        # Low = faster, more deterministic
        'top_p': 0.8,              # Focused sampling
        'num_predict': 300,        # Max tokens (theme JSON ~200 tokens)
        'stop': ['}'],             # Stop after first closing brace
    }
)
```

**Benefits**:
- `temperature: 0.3` = Faster token selection
- `num_predict: 300` = Hard limit prevents runaway generation
- `stop: ['}']` = Stops immediately after JSON complete

**Files to modify**:
- `server_dynamic.py:184-185` - ollama.generate call

---

### 4. **Send Theme Update Immediately (Don't Wait)** (CRITICAL)
**Impact**: Theme appears 10-20 seconds earlier on frontend

**Current Flow** (`server_dynamic.py:325-338`):
```python
await websocket.send_json({"type": "end"})

# BLOCKS HERE waiting for theme
theme_object = await theme_task

if theme_object:
    await websocket.send_json({"type": "theme_update", "theme": theme_object})
```

**Problem**: Frontend waits for theme even if generation takes 20+ seconds

**Optimized Flow**:
```python
await websocket.send_json({"type": "end"})

# Continue in background, don't block
asyncio.create_task(send_theme_when_ready(websocket, theme_task))

# Function runs independently
async def send_theme_when_ready(ws, task):
    theme = await task
    if theme:
        await ws.send_json({"type": "theme_update", "theme": theme})
```

**Benefits**:
- Chat response completes immediately
- Theme update arrives asynchronously when ready
- User doesn't wait for theme

**Files to modify**:
- `server_dynamic.py:325-338` - Theme sending logic after chat ends

---

### 5. **Simplify Prompt Further** (SMALL IMPACT)
**Impact**: Save 0.5-1 second on prompt processing

**Current Prompt** (`server_dynamic.py:62-80`):
- 18 lines including template
- Requests 13 JSON fields

**Ultra-minimal Prompt**:
```python
THEME_GENERATION_PROMPT = """JSON theme from mood: {messages}
{{"primaryColor":"#hex","secondaryColor":"#hex","backgroundColor":"#hex","textColor":"#hex","accentColor":"#hex","gradientStart":"#hex","gradientEnd":"#hex","messageUserBg":"#hex","messageAssistantBg":"#hex","borderColor":"#hex","shadowColor":"rgba(0,0,0,0.3)","icon":"🎨","id":"theme","name":"Theme"}}"""
```

**Changes**:
- Single line prompt (minimal tokens)
- JSON on same line (faster parsing)
- Hardcoded shadowColor (one less field to generate)

**Files to modify**:
- `server_dynamic.py:62-80` - Prompt definition

---

### 6. **Activate Simple Theme Cache** (OPTIONAL)
**Impact**: Instant theme updates for repeated patterns (0 seconds)

**Implementation**:
- Hash last user message
- Check if theme exists in cache
- Return cached theme immediately if match
- Cache size: 20 most recent themes

**Trade-off**:
- Adds complexity
- May return stale themes
- Only helpful for repetitive conversations

**Recommendation**: Skip for now (can add later if needed)

---

## Expected Performance Improvements

### Current Timing:
```
Chat starts:     0s
Chat ends:       2-10s
Theme await:     10-30s (BLOCKING)
Theme arrives:   12-32s total
```

### After Optimizations:
```
Chat starts:     0s
Chat ends:       2-10s  (send "end" immediately)
Theme arrives:   3-8s   (background, async)

Speed improvement: 4-6x faster perceived time
Actual generation: 3-5s (down from 20-30s)
```

### Breakdown of Savings:
| Optimization | Time Saved |
|---|---|
| Pre-fetch messages | 1-2s |
| Optimized JSON parsing | 2-3s |
| LLM generation params | 1-3s |
| Async theme sending | 10-20s perceived |
| Simplified prompt | 0.5-1s |
| **Total** | **15-29s** |

---

## Implementation Order (Priority)

1. **#4 - Async theme sending** (HIGHEST IMPACT - 10-20s perceived improvement)
2. **#3 - LLM generation params** (EASY WIN - 1-3s improvement)
3. **#1 - Pre-fetch messages** (QUICK FIX - 1-2s improvement)
4. **#2 - Optimize JSON parser** (MEDIUM EFFORT - 2-3s improvement)
5. **#5 - Simplify prompt** (OPTIONAL - 0.5-1s improvement)

---

## Critical Files to Modify

1. **`server_dynamic.py:258-274`** - WebSocket theme task creation
2. **`server_dynamic.py:172-211`** - `generate_theme_streaming()` function
3. **`server_dynamic.py:325-338`** - Theme sending after chat completion
4. **`server_dynamic.py:184-185`** - ollama.generate call with parameters
5. **`server_dynamic.py:62-80`** - (Optional) Prompt simplification

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|---|---|---|
| Async theme sending | LOW | Theme still arrives, just non-blocking |
| LLM params | LOW | Can revert if theme quality drops |
| Pre-fetch messages | VERY LOW | Simple refactor, no logic change |
| JSON parser optimization | MEDIUM | Keep fallback to full parse |
| Prompt simplification | LOW | Easy to revert if needed |

---

## Testing Checklist

After implementation:
- [ ] Chat response streams normally
- [ ] Theme update arrives within 5-8 seconds
- [ ] Theme quality is acceptable (colors make sense)
- [ ] No WebSocket errors or disconnections
- [ ] Theme persists after page refresh
- [ ] Multiple rapid messages don't break theme generation

---

## Rollback Plan

If optimizations cause issues:
1. Revert to blocking await (restore line 328)
2. Remove LLM generation parameters
3. Restore original JSON parser
4. Keep pre-fetch messages (safe optimization)
