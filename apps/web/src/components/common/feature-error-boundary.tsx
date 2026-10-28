"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  fullPage?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by FeatureErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || "Something went wrong in this section";
      const message =
        this.props.fallbackMessage ||
        (this.state.error?.message
          ? `An error occurred: ${this.state.error.message}`
          : "This section encountered an unexpected error. You can retry or safely continue using the rest of SchooMA.");

      if (this.props.fullPage) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4 border dark:bg-gray-900 dark:border-gray-800">
              <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {message}
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4" /> Try Reloading Component
                </button>
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <Home className="h-4 w-4" /> Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-950/20 my-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">
                {title}
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300">
                {message}
              </p>
              <div className="pt-2">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry Section
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
