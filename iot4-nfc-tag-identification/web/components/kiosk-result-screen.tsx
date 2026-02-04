"use client";

import type { ScanEvent } from "@/hooks/use-websocket-scanner";

type Props = {
  result: ScanEvent;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KioskResultScreen({ result }: Props) {
  const isSuccess = result.verified === true;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in">
      {/* Icon */}
      <div
        className={`rounded-full p-8 mb-8 ${
          isSuccess ? "bg-kiosk-success/20" : "bg-kiosk-error/20"
        }`}
      >
        {isSuccess ? (
          <CheckIcon className="w-24 h-24 text-kiosk-success" />
        ) : (
          <XIcon className="w-24 h-24 text-kiosk-error" />
        )}
      </div>

      {/* Badge */}
      <div
        className={`px-6 py-2 rounded-full text-2xl font-bold mb-8 ${
          isSuccess
            ? "bg-kiosk-success text-white"
            : "bg-kiosk-error text-white"
        }`}
      >
        {isSuccess ? "VERIFIED" : "VERIFICATION FAILED"}
      </div>

      {/* Student info or error */}
      {isSuccess ? (
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold">{result.student_name}</h1>
          <div className="text-3xl text-gray-300">
            ID: {result.student_id}
          </div>
          <div className="text-2xl text-gray-400">
            {result.department}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-3xl text-gray-300">
            {result.error || "Unknown error"}
          </p>
        </div>
      )}
    </div>
  );
}
