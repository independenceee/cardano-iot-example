#!/usr/bin/env python3
"""
Run the FastAPI backend server.
Usage: python run.py
"""

import uvicorn
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=5000,
        reload=False,
    )
