"""
FastAPI main entry point for NFC verification kiosk backend.
Run with: uvicorn api.main:app --host 0.0.0.0 --port 5000
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import validate_config
from backend.cardano import check_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events for the FastAPI app."""
    # Startup
    print("Starting NFC Verification Kiosk API...")

    # Validate config
    errors = validate_config()
    if errors:
        print(f"Config errors: {errors}")
        print("Warning: Running without blockchain verification")

    # Check blockchain connection
    if check_connection():
        print("Blockchain connection: OK")
    else:
        print("Warning: Cannot connect to Blockfrost")

    # Initialize NFC scanner
    from backend.api.websocket_manager import manager
    from backend.api import nfc_scanner

    if nfc_scanner.scanner.initialize():
        print("NFC reader: OK")
        # Set broadcast callback
        nfc_scanner.scanner.set_broadcast_callback(manager.broadcast)
        # Start scanner in background task
        scanner_task = asyncio.create_task(nfc_scanner.scanner.scan_loop())
    else:
        print("Warning: NFC reader not available")
        scanner_task = None

    print("API ready on port 5000")

    yield

    # Shutdown
    print("Shutting down...")
    if scanner_task:
        nfc_scanner.scanner.stop()
        scanner_task.cancel()
        try:
            await asyncio.wait_for(scanner_task, timeout=5.0)
        except asyncio.CancelledError:
            print("Scanner task cancelled")
        except asyncio.TimeoutError:
            print("Warning: Scanner task did not stop within timeout")


app = FastAPI(
    title="NFC Verification Kiosk API",
    description="Backend API for student NFC identity verification via Cardano blockchain",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - localhost only for kiosk mode
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
from backend.api.routes import router
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
