# NFC Verification Kiosk - Implementation Plan

## Overview
Build Verification Kiosk UI (Next.js) + API layer (FastAPI) for Student NFC Identity system on Raspberry Pi.

## Architecture
```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Next.js UI    │◄──────────────────►│  FastAPI Server │
│   (port 3000)   │     REST API       │   (port 5000)   │
└─────────────────┘                    └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │  Python NFC     │
                                       │  (PN532/SPI)    │
                                       └─────────────────┘
```

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** FastAPI, WebSocket, uvicorn
- **Hardware:** Existing Python NFC scripts (nfc.py, cardano.py)

## Phases

| # | Phase | Status | Link |
|---|-------|--------|------|
| 1 | FastAPI Backend | **DONE** | [phase-01](./phase-01-fastapi-backend.md) |
| 2 | Next.js Kiosk UI | **DONE** | [phase-02](./phase-02-nextjs-kiosk-ui.md) |
| 3 | Integration & Testing | pending | [phase-03](./phase-03-integration-testing.md) |

## Timeline
- Phase 1: API wrapper for existing Python code
- Phase 2: Kiosk UI with WebSocket connection
- Phase 3: End-to-end testing on Raspberry Pi

## Success Criteria
- [ ] NFC scan triggers real-time UI update
- [ ] Student info displayed within 2 seconds
- [ ] Clear success/fail visual feedback
- [ ] Runs stable on Raspberry Pi 5
