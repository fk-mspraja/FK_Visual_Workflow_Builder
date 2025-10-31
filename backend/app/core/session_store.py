"""
Session Storage Module - Production-Ready with Redis Support
Handles persistent conversation storage with TTL and fallback to in-memory
"""
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import timedelta
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class SessionStore(ABC):
    """Abstract base class for session storage"""

    @abstractmethod
    def get_conversation(self, session_id: str) -> List[Any]:
        """Get conversation history for a session"""
        pass

    @abstractmethod
    def save_conversation(self, session_id: str, conversation: List[Any]) -> None:
        """Save conversation history for a session"""
        pass

    @abstractmethod
    def delete_session(self, session_id: str) -> None:
        """Delete a session"""
        pass

    @abstractmethod
    def get_all_sessions(self) -> List[str]:
        """Get all active session IDs"""
        pass


class RedisSessionStore(SessionStore):
    """Redis-based session store with TTL"""

    def __init__(self, redis_host='localhost', redis_port=6379, redis_db=0, ttl_hours=24):
        try:
            import redis
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            self.ttl = timedelta(hours=ttl_hours)
            logger.info(f"✅ Redis session store initialized (TTL: {ttl_hours}h)")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            raise

    def get_conversation(self, session_id: str) -> List[Any]:
        try:
            data = self.redis_client.get(f"conv:{session_id}")
            if data:
                return json.loads(data)
            return []
        except Exception as e:
            logger.error(f"Error getting conversation {session_id}: {e}")
            return []

    def save_conversation(self, session_id: str, conversation: List[Any]) -> None:
        try:
            # Serialize conversation (handles LangChain message objects)
            serialized = json.dumps(conversation, default=str)
            self.redis_client.setex(
                f"conv:{session_id}",
                self.ttl,
                serialized
            )
            logger.debug(f"Saved conversation {session_id} to Redis")
        except Exception as e:
            logger.error(f"Error saving conversation {session_id}: {e}")

    def delete_session(self, session_id: str) -> None:
        try:
            self.redis_client.delete(f"conv:{session_id}")
            logger.info(f"Deleted session {session_id}")
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")

    def get_all_sessions(self) -> List[str]:
        try:
            keys = self.redis_client.keys("conv:*")
            return [key.replace("conv:", "") for key in keys]
        except Exception as e:
            logger.error(f"Error getting all sessions: {e}")
            return []


class InMemorySessionStore(SessionStore):
    """In-memory session store (fallback, not production-safe)"""

    def __init__(self, max_sessions=1000):
        self.store: Dict[str, List[Any]] = {}
        self.max_sessions = max_sessions
        logger.warning("⚠️  Using in-memory session store - sessions will be lost on restart")

    def get_conversation(self, session_id: str) -> List[Any]:
        return self.store.get(session_id, [])

    def save_conversation(self, session_id: str, conversation: List[Any]) -> None:
        # Implement basic LRU by removing oldest session if at capacity
        if len(self.store) >= self.max_sessions and session_id not in self.store:
            oldest = next(iter(self.store))
            del self.store[oldest]
            logger.warning(f"Max sessions reached, removed oldest: {oldest}")

        self.store[session_id] = conversation

    def delete_session(self, session_id: str) -> None:
        if session_id in self.store:
            del self.store[session_id]

    def get_all_sessions(self) -> List[str]:
        return list(self.store.keys())


def create_session_store(use_redis=True, redis_host='localhost', redis_port=6379) -> SessionStore:
    """
    Factory function to create appropriate session store

    Args:
        use_redis: Whether to use Redis (recommended for production)
        redis_host: Redis host
        redis_port: Redis port

    Returns:
        SessionStore instance
    """
    if use_redis:
        try:
            return RedisSessionStore(redis_host=redis_host, redis_port=redis_port)
        except Exception as e:
            logger.error(f"Failed to create Redis store, falling back to in-memory: {e}")
            return InMemorySessionStore()
    else:
        return InMemorySessionStore()
