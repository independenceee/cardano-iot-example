"use client";

export function KioskVerifyingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in">
      {/* Spinner */}
      <div className="relative mb-12">
        <div className="w-32 h-32 border-4 border-gray-700 border-t-kiosk-accent rounded-full animate-spin" />
      </div>

      {/* Text */}
      <h1 className="text-5xl font-bold mb-4">
        Verifying...
      </h1>
      <p className="text-2xl text-gray-400">
        Please wait
      </p>
    </div>
  );
}
