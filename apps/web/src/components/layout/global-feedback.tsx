"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, X, WifiOff } from "lucide-react";

export type FeedbackType = "SUCCESS" | "ERROR" | "INFO" | "WARNING" | "OFFLINE";

interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  message: string;
}

export function GlobalFeedback() {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addMessage("SUCCESS", "Back online. Reconnecting...");
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const addMessage = (type: FeedbackType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeMessage(id);
    }, 5000);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {isOffline && (
        <FeedbackItem
          message="You are currently offline. Some features may be unavailable."
          type="OFFLINE"
          onClose={() => setIsOffline(false)}
        />
      )}
      {messages.map((m) => (
        <FeedbackItem
          key={m.id}
          message={m.message}
          type={m.type}
          onClose={() => removeMessage(m.id)}
        />
      ))}
    </div>
  );
}

function FeedbackItem({
  message,
  type,
  onClose,
}: {
  message: string;
  type: FeedbackType;
  onClose: () => void;
}) {
  const styles = {
    SUCCESS: "bg-success-600 text-white",
    ERROR: "bg-danger-600 text-white",
    INFO: "bg-forest-700 text-white",
    WARNING: "bg-warning-500 text-white",
    OFFLINE: "bg-charcoal-800 text-white shadow-xs",
  };

  const Icon = {
    SUCCESS: CheckCircle,
    ERROR: AlertCircle,
    INFO: Info,
    WARNING: AlertCircle,
    OFFLINE: WifiOff,
  }[type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg animate-in slide-in-from-right duration-300 pointer-events-auto ${styles[type]}`}
    >
      <Icon size={20} className="shrink-0" />
      <p className="text-sm font-bold flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-card/20 rounded transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

