"""
FastAPI routes for NFC verification kiosk.
Endpoints: GET /api/health, POST /api/verify, WS /ws/scan
"""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from datetime import datetime
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.cardano import check_connection
from backend.api.websocket_manager import manager
from backend.api import nfc_scanner

router = APIRouter()


@router.get("/api/health")
async def health_check():
    """Health check endpoint. Returns server and NFC reader status."""
    nfc_ok = nfc_scanner.scanner.pn532 is not None
    blockchain_ok = check_connection()

    return {
        "status": "ok" if (nfc_ok and blockchain_ok) else "degraded",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "nfc_reader": "connected" if nfc_ok else "disconnected",
            "blockchain": "connected" if blockchain_ok else "disconnected",
        },
        "websocket_clients": manager.connection_count,
    }


@router.post("/api/verify")
async def manual_verify():
    """
    Manually trigger NFC scan and verification.
    Waits for card to be placed on reader (max 10 seconds).
    """
    if not nfc_scanner.scanner.pn532:
        raise HTTPException(status_code=503, detail="NFC reader not initialized")

    try:
        result = await nfc_scanner.scanner.read_card_once(timeout=10.0)
        return result
    except TimeoutError:
        raise HTTPException(status_code=408, detail="No card detected within timeout")


@router.websocket("/ws/scan")
async def websocket_scan(websocket: WebSocket):
    """
    WebSocket endpoint for real-time NFC scan events.
    Clients receive JSON messages when cards are scanned.
    """
    await manager.connect(websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "event": "connected",
            "timestamp": datetime.now().isoformat(),
            "message": "Connected to NFC scan events",
        })

        # Keep connection alive and wait for disconnection
        while True:
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        manager.disconnect(websocket)
