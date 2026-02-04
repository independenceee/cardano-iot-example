"use client";

import { useState, useEffect } from "react";

// NFC icon SVG component
function NfcIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
      <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
      <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
      <path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
    </svg>
  );
}

export function KioskIdleScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in">
      {/* NFC Icon with pulse animation */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-kiosk-accent/20 rounded-full animate-pulse-ring" />
        <div className="relative bg-kiosk-accent/10 rounded-full p-12">
          <NfcIcon className="w-32 h-32 text-kiosk-accent" />
        </div>
      </div>

      {/* Main text */}
      <h1 className="text-5xl font-bold mb-4 text-center">
        Tap Your Card
      </h1>
      <p className="text-2xl text-gray-400 text-center">
        Place your student card on the reader to verify
      </p>

      {/* Time display */}
      <div className="absolute bottom-8 text-gray-500 text-xl">
        <CurrentTime />
      </div>
    </div>
  );
}

function CurrentTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{time}</span>;
}
