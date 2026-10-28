'use client';

import { useCallback, useEffect, useState } from 'react';

export function useOtpTimer(seconds = 300, resendAfterSeconds = 30) {
  const [expiresIn, setExpiresIn] = useState(seconds);
  const [resendIn, setResendIn] = useState(resendAfterSeconds);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setExpiresIn((current) => Math.max(0, current - 1));
      setResendIn((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const reset = useCallback(() => {
    setExpiresIn(seconds);
    setResendIn(resendAfterSeconds);
  }, [resendAfterSeconds, seconds]);

  const minutes = Math.floor(expiresIn / 60);
  const remainingSeconds = expiresIn % 60;

  return {
    expiresIn,
    expired: expiresIn === 0,
    canResend: resendIn === 0,
    resendIn,
    formattedExpiry: `${minutes}:${String(remainingSeconds).padStart(2, '0')}`,
    reset,
  };
}
