import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/brand/schoolma-logo";

export const metadata = {
  title: "Terms of Service — SchooMA",
  description: "The terms that apply when your school uses SchooMA.",
};

const sections = [
  {
    title: "Using SchooMA",
    body: "SchooMA provides a workspace for school administration, academics, finance and family communication. Your school is responsible for the accuracy of the records it enters and for giving the right people access.",
  },
  {
    title: "Accounts and access",
    body: "Each person should use their own account. School administrators control membership, roles and permissions inside their workspace. You are responsible for keeping your sign-in details secure and for telling your administrator if access should change.",
  },
  {
    title: "School data",
    body: "Records belong to your school. We process them to provide the service, keep the workspace secure and support your team. Tenant isolation is applied so one school's records are not shown to another school.",
  },
  {
    title: "Acceptable use",
    body: "Do not use SchooMA to break the law, interfere with the service, attempt to access another school's data, or upload harmful content. Access may be suspended where use puts the service or other schools at risk.",
  },
  {
    title: "Availability and changes",
    body: "We work to keep SchooMA available and to improve it over time. Features may change as the product develops. Where a change materially affects how your school uses the service, we will communicate it through the workspace or the contact your school has provided.",
  },
  {
    title: "Questions",
    body: "If you have a question about these terms, contact your school administrator or the SchooMA team through the support details provided in your workspace.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ivory-100 text-charcoal-900">
      <header className="border-b border-warm-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30">
            <BrandLockup markSize={36} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-warm-600 transition-colors hover:bg-sage-100 hover:text-forest-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to SchooMA
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[11px] font-bold uppercase tracking-wide text-terracotta-600">Legal</p>
        <h1 className="mt-3 font-sans text-4xl leading-tight tracking-tight text-charcoal-950 sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-warm-600">
          These terms describe how schools and their teams use SchooMA. They are written to be read, not to hide the important parts.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="border-t border-warm-200 pt-6">
              <h2 className="font-sans text-xl text-charcoal-950">{section.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-warm-600">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-warm-200 bg-card p-5 text-xs font-medium leading-relaxed text-warm-600 shadow-xs">
          Your school&apos;s administrator remains responsible for local policies, parental consent and statutory record-keeping requirements.
        </div>
      </main>
    </div>
  );
}
