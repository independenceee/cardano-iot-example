"""
Background NFC scanner service.
Polls NFC reader and broadcasts scan results via WebSocket.
Includes 3-second debounce to prevent duplicate scans.
"""

import asyncio
import time
from datetime import datetime
from typing import Optional, Callable, Awaitable
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.nfc import init_pn532, read_json_from_nfc
from backend.cardano import query_asset


# Debounce time in seconds
DEBOUNCE_SECONDS = 3.0


def verify_on_blockchain(policy_id: str, asset_name_hex: str, student_id: str) -> dict:
    """Verify student NFT on Cardano blockchain."""
    try:
        asset = query_asset(policy_id, asset_name_hex)
    except Exception as e:
        return {"verified": False, "error": f"Blockchain error: {str(e)}", "student_id": student_id}

    if not asset:
        return {"verified": False, "error": "NFT not found", "student_id": student_id}

    metadata = asset.get("onchain_metadata", {})
    onchain_student_id = metadata.get("student_id", "")

    if str(onchain_student_id) != str(student_id):
        return {"verified": False, "error": "ID mismatch", "student_id": student_id}

    return {
        "verified": True,
        "student_id": onchain_student_id,
        "student_name": metadata.get("student_name", ""),
        "department": metadata.get("department", ""),
        "issued_at": metadata.get("issued_at", ""),
    }


class NFCScanner:
    """Background NFC scanner with debounce and WebSocket broadcast."""

    def __init__(self):
        self.pn532 = None
        self.running = False
        self.last_uid: Optional[str] = None
        self.last_scan_time: float = 0
        self.broadcast_callback: Optional[Callable[[dict], Awaitable[None]]] = None

    def initialize(self) -> bool:
        """Initialize NFC reader. Returns True if successful."""
        try:
            self.pn532 = init_pn532()
            return True
        except Exception as e:
            print(f"NFC init failed: {e}")
            return False

    def set_broadcast_callback(self, callback: Callable[[dict], Awaitable[None]]):
        """Set async callback for broadcasting scan results."""
        self.broadcast_callback = callback

    def _should_process_card(self, uid_str: str) -> bool:
        """Check if card should be processed (debounce logic)."""
        now = time.time()
        if uid_str == self.last_uid and (now - self.last_scan_time) < DEBOUNCE_SECONDS:
            return False
        return True

    async def _try_read_card(self) -> tuple[Optional[str], Optional[dict]]:
        """Attempt to read NFC card. Returns (uid_str, data) or (None, None)."""
        if not self.pn532:
            return None, None

        try:
            # Run blocking I/O in thread pool to avoid blocking event loop
            uid = await asyncio.to_thread(
                self.pn532.read_passive_target,
                timeout=0.5
            )
            if uid is None:
                return None, None

            uid_str = "".join(f"{b:02X}" for b in uid)
            data = await asyncio.to_thread(
                read_json_from_nfc,
                self.pn532,
                num_blocks=8,
                debug=False
            )
            return uid_str, data
        except Exception as e:
            print(f"NFC read error: {e}")
            return None, None

    async def read_card_once(self, timeout: float = 10.0) -> dict:
        """Public method to read card with timeout. Returns verification result."""
        start = time.time()
        while (time.time() - start) < timeout:
            uid_str, nfc_data = await self._try_read_card()
            if uid_str:
                return await self._process_scan(uid_str, nfc_data)
            await asyncio.sleep(0.3)
        raise TimeoutError("No card detected within timeout")

    async def _process_scan(self, uid_str: str, nfc_data: Optional[dict]) -> dict:
        """Process NFC scan and return result."""
        timestamp = datetime.now().isoformat()

        if not nfc_data:
            return {
                "event": "scan",
                "verified": False,
                "error": "Could not read card data",
                "uid": uid_str,
                "timestamp": timestamp,
            }

        if not all(f in nfc_data for f in ["p", "a", "s"]):
            return {
                "event": "scan",
                "verified": False,
                "error": "Invalid card format",
                "uid": uid_str,
                "timestamp": timestamp,
            }

        # Verify on blockchain
        result = verify_on_blockchain(nfc_data["p"], nfc_data["a"], nfc_data["s"])
        result["event"] = "scan"
        result["uid"] = uid_str
        result["timestamp"] = timestamp

        return result

    async def scan_loop(self):
        """Main scanning loop. Call this from asyncio task."""
        self.running = True
        print("NFC scanner started")

        while self.running:
            uid_str, nfc_data = await self._try_read_card()

            if uid_str and self._should_process_card(uid_str):
                self.last_uid = uid_str
                self.last_scan_time = time.time()

                result = await self._process_scan(uid_str, nfc_data)
                print(f"Scan result: {result}")

                if self.broadcast_callback:
                    await self.broadcast_callback(result)

            await asyncio.sleep(0.3)

        print("NFC scanner stopped")

    def stop(self):
        """Stop the scanning loop."""
        self.running = False


# Singleton instance
scanner = NFCScanner()
