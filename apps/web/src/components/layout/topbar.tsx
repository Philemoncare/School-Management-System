"use client";

import React from "react";
import { Menu, Search, Command, Settings } from "lucide-react";
import Link from "next/link";
import { SchoolSwitcher } from "./school-switcher";
import { ChildSwitcher } from "./child-switcher";
import { UserMenu } from "./user-menu";
import { NotificationCenter } from "../notifications/notification-center";

interface TopBarProps {
  toggleMobileMenu: () => void;
}

export function TopBar({ toggleMobileMenu }: TopBarProps) {
  const openCommandPalette = () => {
    window.dispatchEvent(new Event("schoolma:command"));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 select-none items-center justify-between gap-3 border-b border-warm-200 bg-ivory-50 px-3.5 sm:px-6">
      <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-warm-600 hover:text-forest-900 hover:bg-sage-100 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="shrink-0">
          <SchoolSwitcher />
        </div>

        <div className="hidden lg:block w-px h-6 bg-warm-200" />

        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden h-10 w-full max-w-[280px] items-center rounded-lg border border-warm-200 bg-card px-3.5 text-left text-[13px] font-medium text-warm-500 transition-colors hover:border-warm-300 hover:bg-warm-50 focus-visible:ring-2 focus-visible:ring-forest-600/20 lg:max-w-[360px]"
          aria-label="Search the workspace"
        >
          <Search className="mr-2.5 h-4 w-4 text-warm-400" />
          <span className="flex-1 truncate">Search students, fees, classes...</span>
          <span className="hidden lg:inline-flex items-center gap-1 rounded-md border border-warm-200 bg-ivory-100 px-1.5 py-0.5 text-[11px] font-bold text-warm-500">
            <Command className="h-2.5 w-2.5" /> K
          </span>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ChildSwitcher />

        <button
          onClick={openCommandPalette}
          className="md:hidden p-2 text-warm-600 hover:bg-sage-100 rounded-xl transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <div className="flex items-center gap-0.5 rounded-lg border border-warm-200 bg-card p-0.5">
          <NotificationCenter />
          <Link
            href="/settings"
            className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg text-warm-500 hover:text-forest-800 hover:bg-sage-100 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-[18px] w-[18px]" />
          </Link>
        </div>

        <div className="w-px h-6 bg-warm-200 mx-0.5 hidden sm:block" />

        <UserMenu />
      </div>
    </header>
  );
}

export default TopBar;
