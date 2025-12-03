# MoodChat Dynamic Backend - AI-Generated Themes with Real-time Streaming
# Every AI response: (1) Stream response (2) Generate theme guidance (3) Generate CSS implementation
# pip install fastapi uvicorn ollama
# uvicorn server_dynamic:app --reload --host 127.0.0.1 --port 8000

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import ollama
import json
from typing import List, Optional, Dict
from datetime import datetime
import asyncio
import re
from pathlib import Path
from database import get_db

# Initialize FastAPI
app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000", "http://127.0.0.1:5173", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Serve static files from React build (if exists)
frontend_build_path = Path(__file__).parent / "frontend" / "dist"
if frontend_build_path.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_build_path / "assets")), name="assets")

# Ollama API configuration
OLLAMA_BASE_URL = "http://localhost:11434"
CHAT_MODEL = "gpt-oss:120b-cloud"           # Main conversation model
THEME_MODEL = "glm-4.6:cloud"  # Single fast model for theme generation (combined design + code)

# Database instance
db = get_db()

# Active WebSocket sessions (still in-memory)
active_sessions = {}   # {websocket_id: session_data}

# Theme generation cache (in-memory for speed)
theme_generation_cache = {}  # {conversation_id: {"theme": theme_obj, "message_count": int}}

# Request models
class ConversationCreate(BaseModel):
    title: str
    custom_context: Optional[str] = ""

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    custom_context: Optional[str] = None

# AI Prompts for theme generation pipeline
THEME_GENERATION_PROMPT = """Based on conversation mood, output ONLY this JSON (no text):
{{
  "id": "mood_theme",
  "name": "Theme Name",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "backgroundColor": "#hex",
  "textColor": "#hex",
  "accentColor": "#hex",
  "gradientStart": "#hex",
  "gradientEnd": "#hex",
  "messageUserBg": "#hex",
  "messageAssistantBg": "#hex",
  "borderColor": "#hex",
  "shadowColor": "rgba(r,g,b,0.3)",
  "icon": "emoji"
}}

Conversation: {messages}"""

@app.get("/")
async def serve_frontend():
    """Serve the React frontend (production) or API info (development)"""
    index_path = frontend_build_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    else:
        return {"message": "MoodChat Dynamic API - AI-powered theme generation", "note": "Run 'npm run build' in frontend directory to build production frontend"}

@app.get("/api/conversations")
async def get_conversations():
    """Get all conversation summaries"""
    conversations = db.get_all_conversations()
    return {"conversations": conversations}

@app.post("/api/conversations")
async def create_conversation(conv: ConversationCreate):
    """Create a new conversation"""
    conv_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
    conversation = db.create_conversation(conv_id, conv.title, conv.custom_context)
    return {"conversation_id": conv_id, "conversation": conversation}

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    conversation = db.get_conversation(conversation_id)
    if not conversation:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})
    return {"conversation": conversation}

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    success = db.delete_conversation(conversation_id)
    if not success:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})
    return {"message": "Conversation deleted successfully"}

@app.put("/api/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, update: ConversationUpdate):
    """Update conversation metadata"""
    conversation = db.update_conversation(
        conversation_id,
        title=update.title,
        custom_context=update.custom_context
    )
    if not conversation:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})
    return {"conversation": conversation}

@app.post("/api/conversations/{conversation_id}/files")
async def upload_context_file(conversation_id: str, file: UploadFile = File(...)):
    """Upload a context file (max 1MB)"""
    conversation = db.get_conversation(conversation_id)
    if not conversation:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})

    content = await file.read()
    if len(content) > 1_000_000:
        return JSONResponse(status_code=400, content={"error": "File too large (max 1MB)"})

    if file.content_type not in ["text/plain", "text/markdown", "application/json"]:
        return JSONResponse(status_code=400, content={"error": "Only txt, md, json files allowed"})

    text_content = content.decode("utf-8")
    current_context = conversation.get("custom_context", "")
    new_context = f"{current_context}\n\n[File: {file.filename}]\n{text_content}"

    db.update_conversation(conversation_id, custom_context=new_context)

    return {"message": "File uploaded successfully", "filename": file.filename}

async def call_ollama_chat(model: str, messages: List[Dict]) -> str:
    """Call Ollama chat API (non-streaming) and return complete response"""
    response = await asyncio.to_thread(
        ollama.chat,
        model=model,
        messages=messages
    )
    return response['message']['content']

async def call_ollama_generate(model: str, prompt: str) -> str:
    """Call Ollama generate endpoint (non-streaming)"""
    response = await asyncio.to_thread(
        ollama.generate,
        model=model,
        prompt=prompt
    )
    return response['response']

async def generate_theme_streaming(messages: List[Dict]) -> Optional[Dict]:
    """Generate theme with streaming for maximum speed - parse JSON as soon as complete"""
    # Only use last message for fastest processing
    messages_text = "\n".join([f"{m['role']}: {m['content'][:60]}" for m in messages[-1:]])
    prompt = THEME_GENERATION_PROMPT.format(messages=messages_text)

    # Stream response and accumulate in thread
    def stream_and_parse():
        """Stream from ollama and parse JSON as soon as complete"""
        accumulated = ""
        stream = ollama.generate(
            model=THEME_MODEL,
            prompt=prompt,
            stream=True
        )
        for chunk in stream:
            accumulated += chunk['response']
            # Try to parse as soon as we have closing brace
            if '}' in accumulated and '{' in accumulated:
                try:
                    json_match = re.search(r'\{[\s\S]*\}', accumulated)
                    if json_match:
                        theme_json = json.loads(json_match.group(0))
                        return theme_json  # Return immediately when valid JSON found
                except json.JSONDecodeError:
                    continue  # Keep accumulating

        # Final attempt with complete response
        try:
            json_match = re.search(r'\{[\s\S]*\}', accumulated)
            if json_match:
                return json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}, Response: {accumulated[:200]}")

        return None

    # Run in thread pool
    theme_json = await asyncio.to_thread(stream_and_parse)
    return theme_json

@app.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    """Handle WebSocket connections for real-time chat with dynamic theme generation"""
    await websocket.accept()

    # Check if conversation exists
    conversation = db.get_conversation(conversation_id)
    if not conversation:
        await websocket.send_json({"error": "Conversation not found"})
        await websocket.close()
        return

    session_id = id(websocket)
    active_sessions[session_id] = {"conversation_id": conversation_id}

    try:
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                user_message = message_data.get("message", "")

                # Add user message to database
                db.add_message(conversation_id, "user", user_message)

                # Increment user message count
                user_msg_count = db.increment_user_message_count(conversation_id)

                # Get conversation data
                conversation = db.get_conversation(conversation_id)
                custom_context = conversation.get("custom_context", "")

                # Get recent messages for context
                recent_messages = db.get_recent_messages(conversation_id, count=20)

                system_message = f"{custom_context}\n\nRespond naturally and contextually." if custom_context else "You are a helpful AI assistant."

                # Step 1: Stream response
                await websocket.send_json({"type": "start"})

                bot_response = ""

                # Use ollama.chat with streaming
                messages_for_llm = [
                    {"role": "system", "content": system_message},
                    *[{"role": m["role"], "content": m["content"]} for m in recent_messages]
                ]

                # Start theme generation in parallel (don't await yet)
                async def generate_theme_parallel():
                    """Generate theme in background while response streams"""
                    try:
                        # Get messages including the user message we just added
                        all_messages = db.get_messages(conversation_id)

                        # Streaming theme generation - returns as soon as JSON is complete
                        theme_object = await generate_theme_streaming(all_messages)

                        return theme_object
                    except Exception as e:
                        print(f"Theme generation error: {e}")
                        return None

                # Start theme generation immediately (runs in parallel)
                theme_task = asyncio.create_task(generate_theme_parallel())

                # Stream response from ollama in real-time
                bot_response = ""

                # Use queue for real-time streaming
                from queue import Queue
                chunk_queue = Queue()

                def stream_to_queue():
                    """Stream ollama chunks to queue as they arrive"""
                    try:
                        stream = ollama.chat(
                            model=CHAT_MODEL,
                            messages=messages_for_llm,
                            stream=True
                        )
                        for chunk in stream:
                            content = chunk['message'].get('content', '')
                            if content:
                                chunk_queue.put(content)
                    finally:
                        chunk_queue.put(None)  # Signal end

                # Start streaming in background thread
                import threading
                stream_thread = threading.Thread(target=stream_to_queue)
                stream_thread.start()

                # Send chunks to client as they arrive from queue
                while True:
                    # Non-blocking queue get with timeout
                    try:
                        chunk = await asyncio.to_thread(chunk_queue.get, timeout=0.1)
                        if chunk is None:  # End signal
                            break
                        await websocket.send_json({"type": "chunk", "content": chunk})
                        bot_response += chunk
                    except:
                        # Queue empty, wait a bit
                        await asyncio.sleep(0.01)
                        continue

                stream_thread.join()  # Ensure thread completes

                # Save assistant response to database
                db.add_message(conversation_id, "assistant", bot_response)

                await websocket.send_json({"type": "end"})

                # Wait for theme generation to complete (should be done or almost done by now)
                theme_object = await theme_task

                if theme_object:
                    # Save theme to database
                    db.save_theme(conversation_id, theme_object)

                    # Send to frontend immediately
                    await websocket.send_json({
                        "type": "theme_update",
                        "theme": theme_object
                    })
                else:
                    await websocket.send_json({
                        "type": "theme_error",
                        "message": "Failed to generate theme, using default"
                    })

                # Update conversation timestamp
                db.update_conversation_timestamp(conversation_id)

            except WebSocketDisconnect:
                break

    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})

    finally:
        if session_id in active_sessions:
            del active_sessions[session_id]
