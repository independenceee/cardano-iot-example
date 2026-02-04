"""
WebSocket connection manager for real-time NFC scan events.
Handles multiple client connections and broadcasts scan results.
"""

from fastapi import WebSocket
from typing import List
import json


class WebSocketManager:
    """Manages WebSocket connections for broadcasting NFC scan events."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection and add to pool."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket from connection pool."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        """Send data to all connected clients."""
        message = json.dumps(data)
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    @property
    def connection_count(self) -> int:
        """Return number of active connections."""
        return len(self.active_connections)


# Singleton instance
manager = WebSocketManager()
