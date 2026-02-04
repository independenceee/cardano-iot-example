"use client";

import { useState, useEffect } from "react";
import { useWebSocketScanner, type ScanEvent } from "@/hooks/use-websocket-scanner";
import { KioskIdleScreen } from "@/components/kiosk-idle-screen";
import { KioskVerifyingScreen } from "@/components/kiosk-verifying-screen";
import { KioskResultScreen } from "@/components/kiosk-result-screen";
import { ConnectionStatusIndicator } from "@/components/connection-status";

type KioskState = "idle" | "verifying" | "result";

const SUCCESS_DISPLAY_TIME = 5000; // 5 seconds
const FAIL_DISPLAY_TIME = 3000;    // 3 seconds
const VERIFYING_MIN_TIME = 400;    // Minimum verifying display time

export default function KioskPage() {
  const { status, lastScan } = useWebSocketScanner();
  const [kioskState, setKioskState] = useState<KioskState>("idle");
  const [currentResult, setCurrentResult] = useState<ScanEvent | null>(null);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<string | null>(null);

  // Handle new scan events
  useEffect(() => {
    if (!lastScan || lastScan.timestamp === lastProcessedTimestamp) return;

    setLastProcessedTimestamp(lastScan.timestamp);
    setKioskState("verifying");

    let resetTimeout: NodeJS.Timeout | null = null;

    // Show verifying state for minimum time, then show result
    const verifyingTimeout = setTimeout(() => {
      setCurrentResult(lastScan);
      setKioskState("result");

      // Auto-reset to idle
      const displayTime = lastScan.verified ? SUCCESS_DISPLAY_TIME : FAIL_DISPLAY_TIME;
      resetTimeout = setTimeout(() => {
        setKioskState("idle");
        setCurrentResult(null);
      }, displayTime);
    }, VERIFYING_MIN_TIME);

    return () => {
      clearTimeout(verifyingTimeout);
      if (resetTimeout) clearTimeout(resetTimeout);
    };
  }, [lastScan, lastProcessedTimestamp]);

  return (
    <main className="relative">
      <ConnectionStatusIndicator status={status} />

      {kioskState === "idle" && <KioskIdleScreen />}
      {kioskState === "verifying" && <KioskVerifyingScreen />}
      {kioskState === "result" && currentResult && (
        <KioskResultScreen result={currentResult} />
      )}
    </main>
  );
}
