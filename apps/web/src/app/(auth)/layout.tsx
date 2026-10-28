"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "@/components/brand/schoolma-logo";

const PLATFORM_POINTS = [
  {
    title: "One record for every learner",
    text: "Admissions, guardians, attendance and academic history stay connected.",
  },
  {
    title: "The right work for each role",
    text: "Administrators, teachers, finance and families each see their own workspace.",
  },
  {
    title: "School data kept separate",
    text: "Every record and permission remains inside the school it belongs to.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWidePage = pathname?.includes("/register");

  return (
    <div className="min-h-screen bg-ivory-100 text-charcoal-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        <aside className="relative hidden w-[42%] max-w-[660px] shrink-0 flex-col justify-between bg-forest-900 px-10 py-10 text-ivory-100 lg:flex xl:px-14 xl:py-12">
          <Link
            href="/"
            className="inline-flex w-fit rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
          >
            <BrandLockup inverted markSize={40} subtitle="School Operations" />
          </Link>

          <div className="max-w-md py-10">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-300">
              School operations platform
            </p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.15] text-ivory-50 xl:text-[40px]">
              Run the school day from one dependable workspace.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-sage-200">
              SchooMA brings admissions, attendance, fees and communication together
              without burying your team in extra administration.
            </p>

            <div className="mt-9 border-t border-white/10">
              {PLATFORM_POINTS.map((point, index) => (
                <div
                  key={point.title}
                  className="flex gap-4 border-b border-white/10 py-4"
                >
                  <span className="pt-0.5 text-[11px] font-semibold tracking-wide text-sage-400">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ivory-100">{point.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-sage-300">
                      {point.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-sage-300/70">
            <span>Secure multi-tenant platform</span>
            <span>SchooMA</span>
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-8 sm:py-9 lg:px-12 xl:px-16">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex">
              <BrandLockup markSize={34} />
            </Link>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">
              School operations
            </span>
          </div>

          <div
            className={`mx-auto my-auto w-full ${
              isWidePage ? "max-w-3xl" : "max-w-[420px]"
            }`}
          >
            <div className="rounded-xl border border-warm-200 bg-card p-4 shadow-xs sm:p-6 md:p-7">
              {children}
            </div>

            <div className="mt-5 space-y-2 text-center">
              <p className="px-2 text-[11px] leading-relaxed text-warm-500">
                By continuing, you agree to SchooMA&apos;s{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-forest-800 underline decoration-warm-300 underline-offset-2 hover:text-forest-950"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-forest-800 underline decoration-warm-300 underline-offset-2 hover:text-forest-950"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                © {new Date().getFullYear()} SchooMA
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
