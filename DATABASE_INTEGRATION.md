# Database Integration Guide

## Overview

`server_dynamic.py` now uses SQLite for persistent storage instead of in-memory dictionaries. All conversations, messages, and generated themes are automatically saved to `moodchat.db`.

## What Changed

### Before (In-Memory)
```python
conversations_db = {}  # Lost on server restart
theme_cache = {}       # Lost on server restart
```

### After (SQLite Database)
```python
from database import get_db
db = get_db()  # Persistent storage in moodchat.db
```

## Features

### 1. **Persistent Storage**
- All conversations saved to `moodchat.db`
- Messages persist across server restarts
- Generated themes are cached in database

### 2. **Thread-Safe Operations**
- Each thread gets its own database connection
- Safe for concurrent WebSocket connections

### 3. **Automatic CASCADE Deletion**
- Deleting a conversation automatically removes:
  - All messages in that conversation
  - Cached theme for that conversation

### 4. **Database Schema**

**conversations table:**
```sql
- id (TEXT PRIMARY KEY)
- title (TEXT)
- custom_context (TEXT)
- created_at (TEXT)
- updated_at (TEXT)
- user_message_count (INTEGER)
- current_theme (TEXT, JSON)
```

**messages table:**
```sql
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- conversation_id (TEXT, FOREIGN KEY)
- role (TEXT: 'user' or 'assistant')
- content (TEXT)
- timestamp (TEXT)
```

**themes table:**
```sql
- conversation_id (TEXT PRIMARY KEY, FOREIGN KEY)
- theme_data (TEXT, JSON)
- created_at (TEXT)
```

## Database Operations

### Conversations
```python
# Create
db.create_conversation(conv_id, title, custom_context)

# Read
db.get_conversation(conv_id)
db.get_all_conversations()

# Update
db.update_conversation(conv_id, title=new_title, custom_context=new_context)
db.update_conversation_timestamp(conv_id)

# Delete
db.delete_conversation(conv_id)
```

### Messages
```python
# Add message
db.add_message(conv_id, role, content)

# Get messages
db.get_messages(conv_id)  # All messages
db.get_recent_messages(conv_id, count=20)  # Last N messages

# Increment user message count
user_msg_count = db.increment_user_message_count(conv_id)
```

### Themes
```python
# Save generated theme
db.save_theme(conv_id, theme_object)

# Get cached theme
theme = db.get_theme(conv_id)
```

### Statistics
```python
# Get database stats
stats = db.get_stats()
# Returns:
# {
#   "conversations": 10,
#   "messages": 150,
#   "themes": 8,
#   "db_size_bytes": 81920,
#   "db_size_mb": 0.08
# }
```

## Database File Location

The database file is created at:
```
D:\API實驗室\ollama個人化聊天室\moodchat.db
```

## Benefits

1. **No Data Loss** - Conversations persist across server restarts
2. **Better Performance** - Indexed queries for fast message retrieval
3. **Scalability** - Can handle thousands of conversations efficiently
4. **Data Integrity** - Foreign key constraints prevent orphaned data
5. **Easy Backup** - Just copy `moodchat.db` file

## Maintenance

### View Database Contents
```bash
# Using SQLite CLI
sqlite3 moodchat.db
.tables
SELECT * FROM conversations;
SELECT * FROM messages WHERE conversation_id = 'xxx';
```

### Optimize Database
```python
db.vacuum()  # Reclaim space from deleted records
```

### Backup Database
```bash
# Simple file copy
cp moodchat.db moodchat_backup.db

# Or using SQLite
sqlite3 moodchat.db ".backup moodchat_backup.db"
```

## Migration Notes

If you have existing conversations in `server_new.py` (in-memory), they won't be automatically migrated. The database starts fresh. This is intentional since `server_dynamic.py` generates different themes than `server_new.py`.

## Testing the Integration

```bash
# Start the server
uvicorn server_dynamic:app --reload

# Create a conversation
# Send some messages
# Stop the server (Ctrl+C)
# Restart the server
# Your conversation history should still be there!
```

## Backward Compatibility

`server_new.py` still uses in-memory storage. If you want to add database support to `server_new.py`, you can follow the same pattern used in `server_dynamic.py`.
