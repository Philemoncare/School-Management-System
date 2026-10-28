'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  error?: string;
}

export function OtpCodeInput({
  value,
  onChange,
  length = 5,
  disabled = false,
  autoFocus = false,
  label = 'Verification code',
  error,
}: OtpCodeInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] || '');

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, length));
  };

  const focusInput = (index: number) => {
    const target = Math.max(0, Math.min(length - 1, index));
    inputs.current[target]?.focus();
    inputs.current[target]?.select();
  };

  const handleChange = (index: number, rawValue: string) => {
    const cleaned = rawValue.replace(/\D/g, '');
    if (!cleaned) {
      setDigit(index, '');
      return;
    }

    const next = digits.slice();
    for (let offset = 0; offset < cleaned.length && index + offset < length; offset += 1) {
      next[index + offset] = cleaned[offset];
    }
    onChange(next.join('').slice(0, length));

    const nextIndex = Math.min(length - 1, index + cleaned.length);
    focusInput(nextIndex);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index]) {
        setDigit(index, '');
        return;
      }
      if (index > 0) {
        const next = digits.slice();
        next[index - 1] = '';
        onChange(next.join('').slice(0, length));
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusInput(pasted.length - 1);
  };

  return (
    <div className="space-y-2">
      <label className="ml-0.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div
        className="flex items-center justify-center gap-2 sm:gap-3"
        role="group"
        aria-label={label}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={cn(
              'h-14 w-11 rounded-2xl border bg-card text-center font-sans text-2xl font-semibold text-charcoal-950 shadow-xs outline-none transition-all duration-200 sm:h-16 sm:w-14 sm:text-3xl',
              'border-warm-300 focus:border-forest-600 focus:ring-4 focus:ring-forest-600/15',
              digit && 'border-forest-300 bg-sage-50',
              error && 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/15',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          />
        ))}
      </div>
      {error ? (
        <p className="text-center text-xs font-semibold text-danger-600">{error}</p>
      ) : (
        <p className="text-center text-[11px] font-medium text-warm-500">
          Paste the 5-digit code from your email. It expires in 5 minutes.
        </p>
      )}
    </div>
  );
}
