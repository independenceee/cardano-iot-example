"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen bg-kiosk-bg text-white">
            <div className="bg-kiosk-error/20 rounded-full p-8 mb-8">
              <svg className="w-24 h-24 text-kiosk-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">System Error</h1>
            <p className="text-xl text-gray-400 mb-8">Please contact support</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-kiosk-accent rounded-lg text-lg font-medium"
            >
              Reload
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
