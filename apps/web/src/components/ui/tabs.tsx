"use client";

import React, { ReactNode, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  activeTab: string;
  onChange?: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  children,
  defaultValue
}: {
  tabs?: { id: string; label: string; icon?: ReactNode }[];
  activeTab?: string;
  onChange?: (id: string) => void;
  className?: string;
  children?: ReactNode;
  defaultValue?: string;
}) {
  const [internalTab, setInternalTab] = React.useState(defaultValue || "");
  const currentTab = activeTab !== undefined ? activeTab : internalTab;
  const setTab = onChange || setInternalTab;

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, onChange: setTab }}>
      <div className={cn("w-full", className)}>
        {tabs && (
          <div className="flex border-b border-warm-200 dark:border-charcoal-800 gap-1 overflow-x-auto no-scrollbar mb-4">
            {tabs.map((tab) => {
              const isActive = tab.id === currentTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap outline-none select-none",
                    isActive
                      ? "border-terracotta-500 text-forest-900"
                      : "border-transparent text-warm-500 hover:border-warm-300 hover:text-forest-800"
                  )}
                >
                  {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex border-b border-warm-200 dark:border-charcoal-800 gap-1 overflow-x-auto no-scrollbar mb-4", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => context.onChange?.(value)}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap outline-none select-none",
        isActive
          ? "border-terracotta-500 text-forest-900"
          : "border-transparent text-warm-500 hover:border-warm-300 hover:text-forest-800",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.activeTab !== value) return null;

  return (
    <div className={cn("animate-in fade-in duration-300", className)}>
      {children}
    </div>
  );
}
