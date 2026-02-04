"use client";

import type { ConnectionStatus } from "@/hooks/use-websocket-scanner";

type Props = {
  status: ConnectionStatus;
};

export function ConnectionStatusIndicator({ status }: Props) {
  const statusConfig = {
    connected: { color: "bg-kiosk-success", text: "Connected" },
    connecting: { color: "bg-yellow-500", text: "Connecting..." },
    disconnected: { color: "bg-kiosk-error", text: "Disconnected" },
  };

  const config = statusConfig[status];

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full">
      <div className={`w-3 h-3 rounded-full ${config.color}`} />
      <span className="text-sm text-gray-300">{config.text}</span>
    </div>
  );
}
