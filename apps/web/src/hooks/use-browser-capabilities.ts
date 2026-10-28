"use client";

import { useState, useEffect } from "react";

export type BrowserFeature =
  | "camera"
  | "microphone"
  | "geolocation"
  | "pushNotifications"
  | "speechRecognition"
  | "speechSynthesis"
  | "webWorker"
  | "clipboard"
  | "webRtc"
  | "fileSystem";

export interface BrowserCapabilityState {
  camera: boolean;
  microphone: boolean;
  geolocation: boolean;
  pushNotifications: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
  webWorker: boolean;
  clipboard: boolean;
  webRtc: boolean;
  fileSystem: boolean;
}

export function useBrowserCapabilities() {
  const [capabilities, setCapabilities] = useState<BrowserCapabilityState>({
    camera: false,
    microphone: false,
    geolocation: false,
    pushNotifications: false,
    speechRecognition: false,
    speechSynthesis: false,
    webWorker: false,
    clipboard: false,
    webRtc: false,
    fileSystem: false,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const hasMedia =
      typeof window !== "undefined" &&
      !!window.navigator &&
      !!window.navigator.mediaDevices &&
      typeof window.navigator.mediaDevices.getUserMedia === "function";

    const hasGeo =
      typeof window !== "undefined" &&
      !!window.navigator &&
      "geolocation" in window.navigator;

    const hasPush =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator;

    const hasSpeechRec =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

    const hasSpeechSynth =
      typeof window !== "undefined" && "speechSynthesis" in window;

    const hasWorker =
      typeof window !== "undefined" && "Worker" in window;

    const hasClipboard =
      typeof window !== "undefined" &&
      !!window.navigator &&
      !!window.navigator.clipboard;

    const hasWebRtc =
      typeof window !== "undefined" &&
      ("RTCPeerConnection" in window || "webkitRTCPeerConnection" in window);

    const hasFileSystem =
      typeof window !== "undefined" && "showOpenFilePicker" in window;

    setCapabilities({
      camera: hasMedia,
      microphone: hasMedia,
      geolocation: hasGeo,
      pushNotifications: hasPush,
      speechRecognition: hasSpeechRec,
      speechSynthesis: hasSpeechSynth,
      webWorker: hasWorker,
      clipboard: hasClipboard,
      webRtc: hasWebRtc,
      fileSystem: hasFileSystem,
    });
  }, []);

  const checkCapability = (feature: BrowserFeature): { supported: boolean; message: string | null } => {
    if (!isClient) {
      return { supported: true, message: null }; // SSR safe
    }

    const supported = capabilities[feature];
    if (supported) {
      return { supported: true, message: null };
    }

    const featureLabels: Record<BrowserFeature, string> = {
      camera: "Camera access",
      microphone: "Microphone access",
      geolocation: "Location services",
      pushNotifications: "Push notifications",
      speechRecognition: "Voice input / Speech recognition",
      speechSynthesis: "Text-to-speech reading",
      webWorker: "Background processing workers",
      clipboard: "Clipboard access",
      webRtc: "Live video/audio calling",
      fileSystem: "Local file system picker",
    };

    return {
      supported: false,
      message: `Your browser does not support ${featureLabels[feature] || feature}. Please use a modern supported browser (such as Chrome, Edge, Safari, or Firefox).`,
    };
  };

  return { capabilities, isClient, checkCapability };
}
