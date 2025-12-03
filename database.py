# SQLite Database Module for MoodChat
# Handles persistent storage of conversations, messages, and themes

import sqlite3
import json
from typing import Optional, List, Dict
from datetime import datetime
from pathlib import Path
import threading

# Thread-local storage for database connections
thread_local = threading.local()

class Database:
    def __init__(self, db_path: str = "moodchat.db"):
        """Initialize database connection and create tables if needed"""
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        """Get thread-local database connection"""
        if not hasattr(thread_local, "connection"):
            thread_local.connection = sqlite3.connect(
                self.db_path,
                check_same_thread=False
            )
            thread_local.connection.row_factory = sqlite3.Row
        return thread_local.connection

    def _init_db(self):
        """Create database tables if they don't exist"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Conversations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                custom_context TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                user_message_count INTEGER DEFAULT 0,
                current_theme TEXT
            )
        """)

        # Messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        """)

        # Theme cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS themes (
                conversation_id TEXT PRIMARY KEY,
                theme_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        """)

        # Create indexes for better performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_messages_conversation
            ON messages(conversation_id, timestamp)
        """)

        conn.commit()

    # Conversation operations

    def create_conversation(self, conv_id: str, title: str, custom_context: str = "") -> Dict:
        """Create a new conversation"""
        conn = self._get_connection()
        cursor = conn.cursor()

        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO conversations (id, title, custom_context, created_at, updated_at, user_message_count)
            VALUES (?, ?, ?, ?, ?, 0)
        """, (conv_id, title, custom_context, now, now))

        conn.commit()
        return self.get_conversation(conv_id)

    def get_conversation(self, conv_id: str) -> Optional[Dict]:
        """Get a conversation by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        row = cursor.fetchone()

        if not row:
            return None

        # Get messages
        messages = self.get_messages(conv_id)

        # Parse theme if exists
        current_theme = None
        if row["current_theme"]:
            try:
                current_theme = json.loads(row["current_theme"])
            except json.JSONDecodeError:
                current_theme = row["current_theme"]  # String theme ID

        return {
            "id": row["id"],
            "title": row["title"],
            "custom_context": row["custom_context"] or "",
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "user_message_count": row["user_message_count"],
            "messages": messages,
            "current_theme": current_theme
        }

    def get_all_conversations(self) -> List[Dict]:
        """Get all conversation summaries"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT c.*, COUNT(m.id) as message_count
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            GROUP BY c.id
            ORDER BY c.updated_at DESC
        """)

        rows = cursor.fetchall()
        return [{
            "id": row["id"],
            "title": row["title"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "message_count": row["message_count"],
            "user_message_count": row["user_message_count"]
        } for row in rows]

    def update_conversation(self, conv_id: str, title: Optional[str] = None,
                          custom_context: Optional[str] = None) -> Optional[Dict]:
        """Update conversation metadata"""
        conn = self._get_connection()
        cursor = conn.cursor()

        updates = []
        params = []

        if title is not None:
            updates.append("title = ?")
            params.append(title)

        if custom_context is not None:
            updates.append("custom_context = ?")
            params.append(custom_context)

        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(conv_id)

            cursor.execute(f"""
                UPDATE conversations
                SET {', '.join(updates)}
                WHERE id = ?
            """, params)

            conn.commit()

        return self.get_conversation(conv_id)

    def delete_conversation(self, conv_id: str) -> bool:
        """Delete a conversation and all its messages"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        conn.commit()

        return cursor.rowcount > 0

    def update_conversation_timestamp(self, conv_id: str):
        """Update the updated_at timestamp"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE conversations
            SET updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), conv_id))

        conn.commit()

    def increment_user_message_count(self, conv_id: str) -> int:
        """Increment user message count and return new count"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE conversations
            SET user_message_count = user_message_count + 1,
                updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), conv_id))

        cursor.execute("SELECT user_message_count FROM conversations WHERE id = ?", (conv_id,))
        row = cursor.fetchone()

        conn.commit()
        return row["user_message_count"] if row else 0

    def save_theme(self, conv_id: str, theme_data: Dict):
        """Save generated theme for a conversation"""
        conn = self._get_connection()
        cursor = conn.cursor()

        theme_json = json.dumps(theme_data)
        now = datetime.now().isoformat()

        cursor.execute("""
            INSERT OR REPLACE INTO themes (conversation_id, theme_data, created_at)
            VALUES (?, ?, ?)
        """, (conv_id, theme_json, now))

        # Also update conversation
        cursor.execute("""
            UPDATE conversations
            SET current_theme = ?,
                updated_at = ?
            WHERE id = ?
        """, (theme_json, now, conv_id))

        conn.commit()

    def get_theme(self, conv_id: str) -> Optional[Dict]:
        """Get cached theme for a conversation"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT theme_data FROM themes WHERE conversation_id = ?", (conv_id,))
        row = cursor.fetchone()

        if row:
            try:
                return json.loads(row["theme_data"])
            except json.JSONDecodeError:
                return None

        return None

    # Message operations

    def add_message(self, conv_id: str, role: str, content: str) -> Dict:
        """Add a message to a conversation"""
        conn = self._get_connection()
        cursor = conn.cursor()

        timestamp = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO messages (conversation_id, role, content, timestamp)
            VALUES (?, ?, ?, ?)
        """, (conv_id, role, content, timestamp))

        conn.commit()

        return {
            "role": role,
            "content": content,
            "timestamp": timestamp
        }

    def get_messages(self, conv_id: str, limit: Optional[int] = None) -> List[Dict]:
        """Get messages for a conversation"""
        conn = self._get_connection()
        cursor = conn.cursor()

        if limit:
            cursor.execute("""
                SELECT role, content, timestamp
                FROM messages
                WHERE conversation_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (conv_id, limit))
            rows = cursor.fetchall()
            rows = list(reversed(rows))  # Return in chronological order
        else:
            cursor.execute("""
                SELECT role, content, timestamp
                FROM messages
                WHERE conversation_id = ?
                ORDER BY timestamp ASC
            """, (conv_id,))
            rows = cursor.fetchall()

        return [{
            "role": row["role"],
            "content": row["content"],
            "timestamp": row["timestamp"]
        } for row in rows]

    def get_recent_messages(self, conv_id: str, count: int = 20) -> List[Dict]:
        """Get recent messages (for context window)"""
        return self.get_messages(conv_id, limit=count)

    # Utility functions

    def close(self):
        """Close database connection"""
        if hasattr(thread_local, "connection"):
            thread_local.connection.close()
            delattr(thread_local, "connection")

    def vacuum(self):
        """Optimize database (clean up deleted records)"""
        conn = self._get_connection()
        conn.execute("VACUUM")
        conn.commit()

    def get_stats(self) -> Dict:
        """Get database statistics"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) as count FROM conversations")
        conv_count = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM messages")
        msg_count = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM themes")
        theme_count = cursor.fetchone()["count"]

        # Get database file size
        db_size = Path(self.db_path).stat().st_size if Path(self.db_path).exists() else 0

        return {
            "conversations": conv_count,
            "messages": msg_count,
            "themes": theme_count,
            "db_size_bytes": db_size,
            "db_size_mb": round(db_size / (1024 * 1024), 2)
        }


# Singleton instance
_db_instance = None

def get_db() -> Database:
    """Get database instance (singleton)"""
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
    return _db_instance
