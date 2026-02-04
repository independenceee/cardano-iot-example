"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type ScanEvent = {
  event: "scan" | "connected";
  verified?: boolean;
  student_id?: string;
  student_name?: string;
  department?: string;
  issued_at?: string;
  error?: string;
  uid?: string;
  timestamp: string;
};

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

type UseWebSocketScannerReturn = {
  status: ConnectionStatus;
  lastScan: ScanEvent | null;
  reconnect: () => void;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000/ws/scan";
const RECONNECT_DELAY = 3000;

export function useWebSocketScanner(): UseWebSocketScannerReturn {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data: ScanEvent = JSON.parse(event.data);
          if (data.event === "scan") {
            setLastScan(data);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        console.log("WebSocket disconnected, reconnecting...");
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setStatus("disconnected");
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  }, [connect]);

  const reconnect = useCallback(() => {
    wsRef.current?.close();
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, lastScan, reconnect };
}
