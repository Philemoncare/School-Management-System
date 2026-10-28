"use client";

import React, { forwardRef, ReactNode, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs"
          >
            {label}
          </label>
        )}
        <div className="group relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 z-10 text-warm-500 transition-colors group-focus-within:text-forest-700">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "flex h-11 min-h-[44px] w-full rounded-lg border border-warm-300 bg-card px-3.5 py-2 text-sm text-charcoal-900 outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-warm-400 focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15 disabled:cursor-not-allowed disabled:bg-warm-50 disabled:opacity-60",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-danger-400 focus-visible:border-danger-500 focus-visible:ring-danger-500/15",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-muted-foreground z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-semibold text-destructive ml-0.5 animate-slide-up">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted-foreground ml-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "multiple"> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  leftIcon?: ReactNode;
  className?: string;
}

function extractOptionsFromChildren(childrenNode: ReactNode): SelectOption[] {
  const opts: SelectOption[] = [];
  React.Children.forEach(childrenNode, (child) => {
    if (!child) return;
    if (Array.isArray(child)) {
      opts.push(...extractOptionsFromChildren(child));
      return;
    }
    if (React.isValidElement(child)) {
      if (child.type === React.Fragment) {
        opts.push(...extractOptionsFromChildren(child.props.children));
        return;
      }
      const props = child.props as any;
      const val = props.value !== undefined ? props.value : props.children;
      let labelText = "";
      if (Array.isArray(props.children)) {
        labelText = props.children
          .map((c: any) => (typeof c === "string" || typeof c === "number" ? c : ""))
          .join("")
          .trim();
      } else if (props.children !== undefined) {
        labelText = String(props.children);
      } else {
        labelText = String(props.value || "");
      }

      if (val !== undefined) {
        opts.push({
          value: String(val),
          label: labelText || String(val),
          disabled: props.disabled,
        });
      }
    }
  });
  return opts;
}

function toSelectEvent(
  name: string | undefined,
  value: string,
): React.ChangeEvent<HTMLSelectElement> {
  return {
    target: { name, value },
    currentTarget: { name, value },
  } as unknown as React.ChangeEvent<HTMLSelectElement>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options: optionsProp,
      value,
      defaultValue,
      onChange,
      placeholder = "Select an option",
      leftIcon,
      className,
      name,
      id,
      children,
      disabled,
      required,
      title,
      tabIndex,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId.replace(/:/g, "")}`;
    const labelId = label ? `${selectId}-label` : undefined;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const typeahead = useRef("");
    const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
    const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));

    const options: SelectOption[] = optionsProp?.length
      ? optionsProp
      : extractOptionsFromChildren(children);
    const selectedValue = value !== undefined ? String(value ?? "") : internalValue;
    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    const emptyOption = options.find((option) => option.value === "");
    const displayText = selectedOption?.label || emptyOption?.label || placeholder;

    useImperativeHandle(ref, () => triggerRef.current as unknown as HTMLSelectElement, []);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
      if (!open) {
        setActiveIndex(-1);
        return;
      }

      const initialIndex =
        selectedIndex >= 0
          ? selectedIndex
          : options.findIndex((option) => !option.disabled);
      setActiveIndex(initialIndex);
    }, [open, selectedIndex]);

    useEffect(() => {
      if (!open) return;
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    useEffect(() => {
      if (!open) return;

      const positionPanel = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const mobile = window.innerWidth < 640;
        setIsMobile(mobile);
        if (mobile) {
          setPanelStyle({});
          return;
        }

        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 12;
        const spaceAbove = rect.top - 12;
        const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
        const width = Math.max(rect.width, 224);
        const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        const maxHeight = Math.min(320, Math.max(160, openUp ? spaceAbove : spaceBelow));

        setPanelStyle({
          position: "fixed",
          left,
          width,
          maxHeight,
          ...(openUp
            ? { bottom: window.innerHeight - rect.top + 6 }
            : { top: rect.bottom + 6 }),
        });
      };

      positionPanel();
      const handleResize = () => positionPanel();
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize, true);
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize, true);
      };
    }, [open]);

    useEffect(() => {
      if (!open || !isMobile) return;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }, [open, isMobile]);

    useEffect(() => {
      return () => {
        if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
      };
    }, []);

    function updateValue(nextValue: string) {
      if (value === undefined) setInternalValue(nextValue);
      onChange?.(toSelectEvent(name, nextValue));
    }

    function closePanel(restoreFocus = true) {
      setOpen(false);
      if (restoreFocus) {
        window.setTimeout(() => triggerRef.current?.focus(), 0);
      }
    }

    function chooseOption(option: SelectOption) {
      if (option.disabled) return;
      updateValue(option.value);
      closePanel();
    }

    function enabledIndex(from: number, direction: 1 | -1) {
      if (!options.length) return -1;
      for (let step = 1; step <= options.length; step += 1) {
        const index = (from + step * direction + options.length) % options.length;
        if (!options[index].disabled) return index;
      }
      return -1;
    }

    function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      if (disabled) return;

      if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key === "Tab") {
        closePanel(false);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const start = activeIndex >= 0 ? activeIndex : selectedIndex;
        setActiveIndex(enabledIndex(start, direction));
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const start = event.key === "Home" ? -1 : options.length;
        setActiveIndex(enabledIndex(start, event.key === "Home" ? 1 : -1));
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (activeIndex >= 0) chooseOption(options[activeIndex]);
        return;
      }

      if (event.key.length === 1 && /\S/.test(event.key)) {
        typeahead.current += event.key.toLowerCase();
        if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
        typeaheadTimer.current = setTimeout(() => {
          typeahead.current = "";
        }, 500);

        const match = options.findIndex(
          (option) =>
            !option.disabled &&
            option.label.toLowerCase().startsWith(typeahead.current),
        );
        if (match >= 0) setActiveIndex(match);
      }
    }

    const panel = open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[120]">
            <button
              type="button"
              className={cn(
                "absolute inset-0 cursor-default",
                isMobile ? "bg-charcoal-950/40" : "bg-transparent",
              )}
              onClick={() => closePanel()}
              aria-label="Close options"
              tabIndex={-1}
            />

            <div
              ref={panelRef}
              id={`${selectId}-listbox`}
              role="listbox"
              aria-labelledby={labelId}
              aria-label={!label ? ariaLabel || placeholder : undefined}
              style={isMobile ? undefined : panelStyle}
              className={cn(
                "flex flex-col overflow-hidden border border-warm-200 bg-card shadow-panel",
                isMobile
                  ? "absolute inset-x-0 bottom-0 max-h-[72vh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
                  : "rounded-lg",
              )}
            >
              {isMobile && (
                <div className="flex items-center justify-between border-b border-warm-200 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                      {label || "Choose an option"}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-charcoal-900">
                      {displayText}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => closePanel()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-500 hover:bg-warm-100 hover:text-charcoal-900"
                    aria-label="Close options"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="overflow-y-auto p-1.5">
                {options.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-warm-500">
                    No options available
                  </p>
                )}

                {options.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={`${option.value}-${index}`}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseOption(option)}
                      className={cn(
                        "flex min-h-[42px] w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-forest-50 font-semibold text-forest-900"
                          : "text-charcoal-800",
                        isActive && !option.disabled && "bg-warm-100",
                        option.disabled && "cursor-not-allowed opacity-45",
                      )}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-forest-700" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            id={labelId}
            htmlFor={selectId}
            className="ml-0.5 select-none text-[11px] font-semibold text-warm-600 sm:text-xs"
          >
            {label}
          </label>
        )}
        {name && <input type="hidden" name={name} value={selectedValue} />}
        <div className="relative w-full">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-warm-500">
              {leftIcon}
            </div>
          )}
          <button
            ref={triggerRef}
            id={selectId}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${selectId}-listbox`}
            aria-labelledby={ariaLabelledBy || labelId}
            aria-describedby={ariaDescribedBy}
            aria-label={!label ? ariaLabel || placeholder : undefined}
            aria-required={required || undefined}
            aria-invalid={Boolean(error) || undefined}
            disabled={disabled}
            onClick={() => setOpen((current) => !current)}
            onKeyDown={handleTriggerKeyDown}
            tabIndex={tabIndex}
            title={title}
            className={cn(
              "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg border border-warm-300 bg-card py-2 pl-3.5 pr-10 text-left text-sm font-medium text-charcoal-900 outline-none transition-colors hover:border-warm-400 focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15 disabled:cursor-not-allowed disabled:bg-warm-50 disabled:opacity-60",
              leftIcon && "pl-10",
              !selectedValue && "text-warm-500",
              error && "border-danger-400 focus-visible:border-danger-500 focus-visible:ring-danger-500/15",
              className,
            )}
          >
            <span className="min-w-0 flex-1 truncate">{displayText}</span>
            <ChevronDown
              className={cn(
                "absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-500 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
        {error && (
          <p className="ml-0.5 text-xs font-medium text-danger-600">{error}</p>
        )}
        {!error && helperText && (
          <p className="ml-0.5 text-xs text-warm-500">{helperText}</p>
        )}
        {panel}
      </div>
    );
  },
);

Select.displayName = "Select";
