# MoodChat Backend - Ollama-powered personalized AI chat with dynamic theme switching
# pip install fastapi uvicorn httpx
# uvicorn server_new:app --reload
# uvicorn server_new:app --host 127.0.0.1 --port 8000

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
import json
from typing import List, Optional
from datetime import datetime
import os
from pathlib import Path

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
DEFAULT_MODEL = "gpt-oss:120b-cloud"

# In-memory storage for conversations (use database in production)
conversations_db = {}  # {conversation_id: {...}}
active_sessions = {}  # {websocket_id: session_data}

# Request models
class ConversationCreate(BaseModel):
    title: str
    custom_context: Optional[str] = ""

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    custom_context: Optional[str] = None

# Theme detection system prompt
THEME_DETECTOR_PROMPT = """Analyze the emotional tone and context of this conversation. Respond with ONLY ONE word from this list:
romance, adventure, mystery, professional, playful, calm, energetic, melancholic, inspiring, cozy, dramatic, fantasy

Consider:
- Emotional tone (happy, sad, excited, calm)
- Topic (love, work, exploration, problem-solving)
- Conversational style (formal, casual, playful)

Latest messages:
{messages}

Theme:"""

@app.get("/")
async def serve_frontend():
    """Serve the React frontend (production) or API info (development)"""
    index_path = frontend_build_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    else:
        return {"message": "MoodChat API - Ollama powered personalized chat", "note": "Run 'npm run build' in frontend directory to build production frontend"}

@app.get("/api/conversations")
async def get_conversations():
    """Get all conversation summaries"""
    return {
        "conversations": [
            {
                "id": conv_id,
                "title": data["title"],
                "created_at": data["created_at"],
                "updated_at": data["updated_at"],
                "message_count": len(data["messages"])
            }
            for conv_id, data in conversations_db.items()
        ]
    }

@app.post("/api/conversations")
async def create_conversation(conv: ConversationCreate):
    """Create a new conversation"""
    conv_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
    conversations_db[conv_id] = {
        "id": conv_id,
        "title": conv.title,
        "custom_context": conv.custom_context,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "messages": [],
        "current_theme": "calm"
    }
    return {"conversation_id": conv_id, "conversation": conversations_db[conv_id]}

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    if conversation_id not in conversations_db:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})
    return {"conversation": conversations_db[conversation_id]}

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    if conversation_id not in conversations_db:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})
    del conversations_db[conversation_id]
    return {"message": "Conversation deleted successfully"}

@app.put("/api/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, update: ConversationUpdate):
    """Update conversation metadata"""
    if conversation_id not in conversations_db:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})

    if update.title:
        conversations_db[conversation_id]["title"] = update.title
    if update.custom_context is not None:
        conversations_db[conversation_id]["custom_context"] = update.custom_context

    conversations_db[conversation_id]["updated_at"] = datetime.now().isoformat()
    return {"conversation": conversations_db[conversation_id]}

@app.post("/api/conversations/{conversation_id}/files")
async def upload_context_file(conversation_id: str, file: UploadFile = File(...)):
    """Upload a context file (max 1MB)"""
    if conversation_id not in conversations_db:
        return JSONResponse(status_code=404, content={"error": "Conversation not found"})

    # File size limitation (1MB)
    content = await file.read()
    if len(content) > 1_000_000:
        return JSONResponse(status_code=400, content={"error": "File too large (max 1MB)"})

    # Only allow text-based files
    if file.content_type not in ["text/plain", "text/markdown", "application/json"]:
        return JSONResponse(status_code=400, content={"error": "Only txt, md, json files allowed"})

    text_content = content.decode("utf-8")
    current_context = conversations_db[conversation_id].get("custom_context", "")
    conversations_db[conversation_id]["custom_context"] = f"{current_context}\n\n[File: {file.filename}]\n{text_content}"

    return {"message": "File uploaded successfully", "filename": file.filename}

@app.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    """Handle WebSocket connections for real-time chat"""
    await websocket.accept()

    if conversation_id not in conversations_db:
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

                # Add user message to conversation
                conversations_db[conversation_id]["messages"].append({
                    "role": "user",
                    "content": user_message,
                    "timestamp": datetime.now().isoformat()
                })

                # Build context for Ollama
                custom_context = conversations_db[conversation_id].get("custom_context", "")
                messages = conversations_db[conversation_id]["messages"]

                # Prepare messages for Ollama (keep last 20 messages)
                recent_messages = messages[-20:] if len(messages) > 20 else messages

                # System prompt with custom context
                system_message = f"{custom_context}\n\nRespond naturally and contextually to the user." if custom_context else "You are a helpful AI assistant."

                # Stream response from Ollama
                await websocket.send_json({"type": "start"})

                bot_response = ""
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        f"{OLLAMA_BASE_URL}/api/chat",
                        json={
                            "model": DEFAULT_MODEL,
                            "messages": [
                                {"role": "system", "content": system_message},
                                *[{"role": m["role"], "content": m["content"]} for m in recent_messages]
                            ],
                            "stream": True
                        }
                    ) as response:
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    chunk = json.loads(line)
                                    if "message" in chunk:
                                        content = chunk["message"].get("content", "")
                                        if content:
                                            await websocket.send_json({"type": "chunk", "content": content})
                                            bot_response += content
                                except json.JSONDecodeError:
                                    continue

                # Save assistant response to database
                conversations_db[conversation_id]["messages"].append({
                    "role": "assistant",
                    "content": bot_response,
                    "timestamp": datetime.now().isoformat()
                })

                # Detect theme based on recent messages
                theme = await detect_theme(recent_messages[-6:])
                conversations_db[conversation_id]["current_theme"] = theme

                await websocket.send_json({"type": "end", "theme": theme})
                conversations_db[conversation_id]["updated_at"] = datetime.now().isoformat()

            except WebSocketDisconnect:
                break

    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})

    finally:
        if session_id in active_sessions:
            del active_sessions[session_id]

async def detect_theme(messages: List[dict]) -> str:
    """Detect conversation theme using Ollama"""
    if not messages:
        return "calm"

    # Format recent messages for theme detection
    messages_text = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    prompt = THEME_DETECTOR_PROMPT.format(messages=messages_text)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": prompt,
                    "stream": False
                }
            )
            result = response.json()
            theme = result.get("response", "calm").strip().lower()

            # Validate theme
            valid_themes = ["romance", "adventure", "mystery", "professional", "playful",
                          "calm", "energetic", "melancholic", "inspiring", "cozy", "dramatic", "fantasy"]
            return theme if theme in valid_themes else "calm"
    except:
        return "calm"
