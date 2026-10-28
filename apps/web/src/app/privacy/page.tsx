import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/brand/schoolma-logo";

export const metadata = {
  title: "Privacy Policy — SchooMA",
  description: "How SchooMA handles school and account information.",
};

const sections = [
  {
    title: "Information we process",
    body: "SchooMA processes the account details you provide and the school records your team enters, such as student, staff, academic, attendance and fee information. Your school decides what is entered and who can see it.",
  },
  {
    title: "Why we process it",
    body: "We use information to run your workspace, authenticate users, keep records isolated by school, provide support, maintain security and meet the operational needs of the service.",
  },
  {
    title: "Tenant isolation",
    body: "Each school workspace is separated from every other school workspace. Access is limited by membership, role and permission, and requests are checked against the active school.",
  },
  {
    title: "Sharing",
    body: "We do not sell school data. Information is shared only with service providers needed to operate SchooMA, or where required by law. Schools control the communication channels connected to their workspace.",
  },
  {
    title: "Retention",
    body: "Records are kept for as long as the school's workspace is active, subject to the school's own retention requirements and applicable law. Administrators can request changes to workspace membership and access.",
  },
  {
    title: "Your choices",
    body: "You can review and update your profile from your account settings. For questions about school records, contact your school administrator. For platform questions, use the support details in your workspace.",
  },
];

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-warm-600">
          A plain-language summary of the information SchooMA handles and the controls schools have over it.
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
          This summary does not replace your school&apos;s own privacy notices or agreements with families and staff.
        </div>
      </main>
    </div>
  );
}
