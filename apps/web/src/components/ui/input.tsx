"use client";

import React, { forwardRef, ReactNode, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// useLayoutEffect on the client, useEffect during server rendering (where it
// never runs), so the panel can be measured before the browser paints without
// triggering the "useLayoutEffect does nothing on the server" warning.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  /** Optional second line, e.g. a student number or class code. */
  description?: string;
  /** Extra words that should match a search without being displayed. */
  keywords?: string;
  /** Optional group heading used to bucket long lists. */
  group?: string;
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
  /** Show a filter box inside the panel. Use for lists longer than ~10 items. */
  searchable?: boolean;
  /** Show a loading state and keep the control disabled while options arrive. */
  loading?: boolean;
  /** Copy shown when the list (or the current search) has no matches. */
  emptyMessage?: string;
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
      searchable = false,
      loading = false,
      emptyMessage,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId.replace(/:/g, "")}`;
    const labelId = label ? `${selectId}-label` : undefined;
    const listboxId = `${selectId}-listbox`;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const typeahead = useRef("");
    const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(
      () => typeof window !== "undefined" && window.innerWidth < 640,
    );
    const [activeIndex, setActiveIndex] = useState(-1);
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
    const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));
    const [query, setQuery] = useState("");

    const options: SelectOption[] = optionsProp?.length
      ? optionsProp
      : extractOptionsFromChildren(children);
    const selectedValue = value !== undefined ? String(value ?? "") : internalValue;
    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    const emptyOption = options.find((option) => option.value === "");
    const displayText = selectedOption?.label || emptyOption?.label || placeholder;
    const isDisabled = disabled || loading;

    const filteredOptions = useMemo(() => {
      const needle = query.trim().toLowerCase();
      if (!searchable || !needle) return options;
      return options.filter((option) => {
        const haystack = `${option.label} ${option.description ?? ""} ${option.keywords ?? ""}`.toLowerCase();
        return haystack.includes(needle);
      });
    }, [options, query, searchable]);

    const filteredSelectedIndex = filteredOptions.findIndex(
      (option) => option.value === selectedValue,
    );

    useImperativeHandle(ref, () => triggerRef.current as unknown as HTMLSelectElement, []);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
      if (!open) {
        setActiveIndex(-1);
        setQuery("");
        return;
      }

      const initialIndex =
        filteredSelectedIndex >= 0
          ? filteredSelectedIndex
          : filteredOptions.findIndex((option) => !option.disabled);
      setActiveIndex(initialIndex);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Keep the highlighted row valid while the search narrows the list.
    useEffect(() => {
      if (!open) return;
      setActiveIndex((current) => {
        if (current >= 0 && current < filteredOptions.length && !filteredOptions[current]?.disabled) {
          return current;
        }
        return filteredOptions.findIndex((option) => !option.disabled);
      });
    }, [filteredOptions, open]);

    useEffect(() => {
      if (!open) return;
      if (searchable) {
        const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
        return () => window.clearTimeout(timer);
      }
      return undefined;
    }, [open, searchable]);

    useEffect(() => {
      if (!open) return;
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    // Position before paint: on a phone the panel must already be the bottom
    // sheet on its first frame, otherwise it renders unpositioned underneath the
    // backdrop and the first tap looks like it did nothing.
    useIsomorphicLayoutEffect(() => {
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
        const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
        const width = Math.max(rect.width, 224);
        const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        const maxHeight = Math.min(360, Math.max(180, openUp ? spaceAbove : spaceBelow));

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
      setQuery("");
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
      if (!filteredOptions.length) return -1;
      for (let step = 1; step <= filteredOptions.length; step += 1) {
        const index = (from + step * direction + filteredOptions.length) % filteredOptions.length;
        if (!filteredOptions[index].disabled) return index;
      }
      return -1;
    }

    function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      if (isDisabled) return;

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
        const start = activeIndex >= 0 ? activeIndex : filteredSelectedIndex;
        setActiveIndex(enabledIndex(start, direction));
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const start = event.key === "Home" ? -1 : filteredOptions.length;
        setActiveIndex(enabledIndex(start, event.key === "Home" ? 1 : -1));
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          chooseOption(filteredOptions[activeIndex]);
        }
        return;
      }

      if (event.key.length === 1 && /\S/.test(event.key)) {
        typeahead.current += event.key.toLowerCase();
        if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
        typeaheadTimer.current = setTimeout(() => {
          typeahead.current = "";
        }, 500);

        const match = filteredOptions.findIndex(
          (option) =>
            !option.disabled &&
            option.label.toLowerCase().startsWith(typeahead.current),
        );
        if (match >= 0) setActiveIndex(match);
      }
    }

    function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
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
        const start = activeIndex >= 0 ? activeIndex : filteredSelectedIndex;
        setActiveIndex(enabledIndex(start, direction));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          chooseOption(filteredOptions[activeIndex]);
        } else if (filteredOptions.length === 1) {
          chooseOption(filteredOptions[0]);
        }
      }
    }

    const resolvedEmptyMessage =
      emptyMessage ??
      (query.trim() ? `No matches for "${query.trim()}"` : "No options available");

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

              {searchable && !loading && (
                <div className="relative border-b border-warm-100 p-2">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Type to filter…"
                    aria-label={`Filter ${label || "options"}`}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    className="h-9 w-full rounded-md border border-warm-200 bg-ivory-50 pl-9 pr-8 text-sm text-charcoal-900 outline-none placeholder:text-warm-400 focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        searchRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-warm-400 hover:bg-warm-100 hover:text-charcoal-800"
                      aria-label="Clear filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div
                id={listboxId}
                role="listbox"
                aria-labelledby={labelId}
                aria-label={!label ? ariaLabel || placeholder : undefined}
                aria-busy={loading || undefined}
                className="overflow-y-auto p-1.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-warm-500">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-warm-300 border-t-forest-700" />
                    Loading options…
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-warm-500">{resolvedEmptyMessage}</p>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = option.value === selectedValue;
                    const isActive = index === activeIndex;
                    const showGroup =
                      Boolean(option.group) && option.group !== filteredOptions[index - 1]?.group;
                    return (
                      <React.Fragment key={`${option.value}-${index}`}>
                        {showGroup && (
                          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-warm-400">
                            {option.group}
                          </p>
                        )}
                        <button
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
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{option.label}</span>
                            {option.description && (
                              <span className="block truncate text-xs font-normal text-warm-500">
                                {option.description}
                              </span>
                            )}
                          </span>
                          {isSelected && <Check className="h-4 w-4 shrink-0 text-forest-700" />}
                        </button>
                      </React.Fragment>
                    );
                  })
                )}
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
            aria-controls={listboxId}
            aria-labelledby={ariaLabelledBy || labelId}
            aria-describedby={ariaDescribedBy}
            aria-label={!label ? ariaLabel || placeholder : undefined}
            aria-required={required || undefined}
            aria-invalid={Boolean(error) || undefined}
            aria-busy={loading || undefined}
            disabled={isDisabled}
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
            <span className="min-w-0 flex-1 truncate">
              {loading ? "Loading options…" : displayText}
            </span>
            {loading ? (
              <span className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-warm-300 border-t-forest-700" />
            ) : (
              <ChevronDown
                className={cn(
                  "absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-500 transition-transform",
                  open && "rotate-180",
                )}
              />
            )}
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
