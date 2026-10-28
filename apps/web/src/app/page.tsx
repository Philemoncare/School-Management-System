'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CalendarCheck,
  CreditCard,
  Users,
  BookOpenCheck,
  MessageSquare,
  ShieldCheck,
  Layers,
  Lock,
  ClipboardList,
  Library,
  Bus,
  Stethoscope,

  Menu,
  X,
} from 'lucide-react';
import { BrandLockup, BrandMark } from '@/components/brand/schoolma-logo';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory-100 text-charcoal-900 selection:bg-terracotta-200 selection:text-forest-900">
      <header className="sticky top-0 z-50 border-b border-warm-200 bg-ivory-100">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30">
            <BrandLockup markSize={38} />
          </Link>

          <nav className="hidden items-center gap-7 text-[12px] font-semibold text-warm-600 lg:flex">
            <a href="#platform" className="transition-colors hover:text-forest-800">Platform</a>
            <a href="#roles" className="transition-colors hover:text-forest-800">For every role</a>
            <a href="#security" className="transition-colors hover:text-forest-800">Security</a>
            <a href="#plans" className="transition-colors hover:text-forest-800">Plans</a>
            <a href="#questions" className="transition-colors hover:text-forest-800">Questions</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-3 py-2 text-[12px] font-bold text-warm-700 transition-colors hover:bg-sage-100 hover:text-forest-900 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/register-school"
              className="inline-flex items-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-[12px] font-semibold text-ivory-50 transition-colors hover:bg-forest-900"
            >
              <span>Create workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 hover:bg-sage-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-warm-200 bg-ivory-100 px-4 py-4 lg:hidden">
            <div className="grid gap-1 text-sm font-semibold text-warm-700">
              {[
                ['Platform', '#platform'],
                ['For every role', '#roles'],
                ['Security', '#security'],
                ['Plans', '#plans'],
                ['Questions', '#questions'],
                ['Sign in', '/login'],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 hover:bg-sage-100 hover:text-forest-900"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="border-b border-warm-200">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
              School operations, connected
            </p>

            <h1 className="mt-4 max-w-xl text-[42px] font-semibold leading-[1.08] tracking-[-0.03em] text-charcoal-950 sm:text-[54px] lg:text-[60px]">
              Run your school with clarity, not clutter.
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-warm-600">
              SchooMA brings admissions, attendance, fees, examinations and family
              communication into one deliberate workspace — built for the way schools
              actually work.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/register-school"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-800 px-6 py-3.5 text-sm font-semibold text-ivory-50 transition-colors hover:bg-forest-900"
              >
                Create your school workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#platform"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-warm-300 bg-card px-6 py-3.5 text-sm font-semibold text-charcoal-800 transition-colors hover:border-warm-400 hover:bg-warm-50"
              >
                See what is inside
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-warm-200 pt-6 text-[11px] font-bold uppercase tracking-wide text-warm-500">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-forest-600" /> Tenant-isolated</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-forest-600" /> Role-aware</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-forest-600" /> Ghana-ready</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-[520px] lg:ml-auto">
              <div className="relative overflow-hidden rounded-xl border border-warm-200 bg-card shadow-panel">
                <div className="flex items-center justify-between border-b border-warm-200 bg-ivory-50 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <BrandMark size={28} />
                    <div>
                      <p className="text-[11px] font-bold text-charcoal-900">Your school workspace</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">Illustrative view</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-sage-300 bg-sage-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-forest-800">
                    Today
                  </span>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-2xl border border-warm-200 bg-ivory-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">Next in your day</p>
                      <CalendarCheck className="h-4 w-4 text-forest-600" />
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {[
                        ['Mark JHS 2 attendance', '08:30 · Class teacher'],
                        ['Review admission applications', '10:00 · Front office'],
                        ['Publish Term 2 report cards', '13:00 · Academic office'],
                      ].map(([title, meta], index) => (
                        <div key={title} className="flex items-center gap-3 rounded-xl border border-warm-200/80 bg-card px-3 py-2.5">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold ${index === 0 ? 'bg-forest-800 text-ivory-100' : 'bg-sage-100 text-forest-700'}`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-charcoal-900">{title}</p>
                            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-warm-500">{meta}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-sage-300/80 bg-sage-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">Fees</p>
                      <p className="mt-1.5 text-[13px] font-bold text-forest-900">Ledger reconciled</p>
                      <p className="mt-1 text-[11px] font-medium leading-relaxed text-warm-600">Receipts and adjustments stay in one record.</p>
                    </div>
                    <div className="rounded-lg border border-warm-200 bg-warm-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-600">Families</p>
                      <p className="mt-1.5 text-[13px] font-bold text-charcoal-900">Updates delivered</p>
                      <p className="mt-1 text-[11px] font-medium leading-relaxed text-warm-600">Messages grouped by class and guardian.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-forest-900 px-4 py-3.5 text-ivory-100">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-sage-300">Access</p>
                      <p className="mt-0.5 text-[12px] font-semibold">Every role sees only its work</p>
                    </div>
                    <Lock className="h-5 w-5 text-sage-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform */}
      <section id="platform" className="border-b border-warm-200 bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">The platform</p>
              <h2 className="mt-3 max-w-xl text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-charcoal-950 sm:text-[38px]">
                The whole school, arranged in one place.
              </h2>
            </div>
            <p className="max-w-md text-sm font-medium leading-relaxed text-warm-600 lg:col-span-5 lg:justify-self-end">
              Each module has a clear job. Together they remove the spreadsheets,
              paper registers and repeated data entry that slow a school down.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              number="01"
              title="Student records"
              description="Admissions, guardians, class placement, medical notes and the full student journey in one profile."
            />
            <FeatureCard
              icon={<CalendarCheck className="h-5 w-5" />}
              number="02"
              title="Academics and attendance"
              description="Timetables, class registers, assessment entry, grading schemes and generated report cards."
            />
            <FeatureCard
              icon={<CreditCard className="h-5 w-5" />}
              number="03"
              title="Fees and ledger"
              description="Fee structures, invoices, receipts, adjustments and a running balance the bursar can trust."
            />
            <FeatureCard
              icon={<ClipboardList className="h-5 w-5" />}
              number="04"
              title="Admissions"
              description="Public application forms, review queues and a clear hand-off into student enrollment."
            />
            <FeatureCard
              icon={<MessageSquare className="h-5 w-5" />}
              number="05"
              title="Communication"
              description="Announcements and messages organised by audience, with delivery status kept alongside the conversation."
            />
            <FeatureCard
              icon={<Layers className="h-5 w-5" />}
              number="06"
              title="Operations"
              description="Library, transport, health, inventory and procurement modules for the parts of school life outside the classroom."
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [<BookOpenCheck key="b" className="h-4 w-4" />, 'Examinations'],
              [<Library key="l" className="h-4 w-4" />, 'Library'],
              [<Bus key="t" className="h-4 w-4" />, 'Transport'],
              [<Stethoscope key="h" className="h-4 w-4" />, 'Health'],
            ].map(([icon, label]) => (
              <div key={String(label)} className="flex items-center gap-2 rounded-xl border border-warm-200 bg-ivory-100 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-warm-600">
                <span className="text-forest-600">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-b border-warm-200 bg-forest-900 py-20 text-ivory-100 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-300">Every role</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ivory-50 sm:text-[38px]">
              One platform. A different view for each person.
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-sage-300/85">
              Permissions determine what appears in the navigation, what can be edited
              and which records a person can reach.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RoleCard
              title="School administrators"
              description="The complete academic, operational and financial picture, with audit history when something needs tracing."
              items={['Live school overview', 'Staff and user roles', 'Settings and audit logs']}
            />
            <RoleCard
              title="Teachers"
              description="The classes, students and assessments assigned to them — with attendance and score entry kept simple."
              items={['Class registers', 'Assessment entry', 'Student progress']}
            />
            <RoleCard
              title="Bursars and accountants"
              description="Fees, invoices, receipts and reconciliations without leaving the financial record to guesswork."
              items={['Fee structures', 'Invoice and receipt', 'Outstanding balances']}
            />
            <RoleCard
              title="Families"
              description="A guardian portal for the children linked to their account: attendance, results, fees and school notices."
              items={['Child overview', 'Results and attendance', 'Fee statements']}
            />
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-b border-warm-200 bg-ivory-100 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">Security</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-charcoal-950 sm:text-[38px]">
              Isolation is structural, not an afterthought.
            </h2>
            <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-warm-600">
              SchooMA is a multi-tenant platform. Every request carries a school context,
              and the interface only offers the actions a user&apos;s role permits.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-sage-300 bg-sage-50 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-forest-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              School-level data boundaries
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <SecurityCard icon={<Lock className="h-5 w-5" />} title="Tenant isolation" text="Records and users belong to one school context. Cross-school access is rejected, not hidden." />
            <SecurityCard icon={<ShieldCheck className="h-5 w-5" />} title="Role permissions" text="Navigation, actions and API access are filtered by role and entitlement." />
            <SecurityCard icon={<ClipboardList className="h-5 w-5" />} title="Audit history" text="Sensitive actions leave a trace so administrators can review who changed what." />
            <SecurityCard icon={<ArrowUpRight className="h-5 w-5" />} title="Server-side validation" text="Forms are validated in the interface and again by the API before data is stored." />
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="border-b border-warm-200 bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">Plans</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-charcoal-950 sm:text-[38px]">
              Start with the school you have today.
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-warm-600">
              Workspaces are provisioned per school. Choose a starting point and add
              modules as your operation grows.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <PlanCard
              name="Starter school"
              description="For a small school putting its core records in order."
              features={['Student and staff directory', 'Classes and attendance', 'Basic announcements', 'Single administrator']}
            />
            <PlanCard
              highlighted
              name="Growing school"
              description="For a school running academics, fees and family communication together."
              features={['Everything in Starter', 'Fee structures and invoicing', 'Examinations and report cards', 'Guardian portal', 'Multiple staff roles']}
            />
            <PlanCard
              name="School network"
              description="For groups managing several campuses under one administration."
              features={['Everything in Growing', 'Multiple school workspaces', 'Cross-school administration', 'Operational reporting', 'Priority onboarding']}
            />
          </div>

          <p className="mt-8 text-center text-[11px] font-medium text-warm-500">
            Plans and module availability are confirmed during onboarding. No payment is taken on this page.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="questions" className="border-b border-warm-200 bg-ivory-100 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">Questions</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-charcoal-950 sm:text-[38px]">
              A few things schools ask first.
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            <FaqAccordion
              isOpen={activeFaq === 1}
              onToggle={() => setActiveFaq(activeFaq === 1 ? null : 1)}
              question="What happens when I create a school workspace?"
              answer="You provide the school profile, location and an administrator account. The platform provisions a separate school workspace and signs the administrator in so the team can start adding classes, staff and students."
            />
            <FaqAccordion
              isOpen={activeFaq === 2}
              onToggle={() => setActiveFaq(activeFaq === 2 ? null : 2)}
              question="Can different staff roles see different parts of the platform?"
              answer="Yes. Navigation and actions are filtered by the roles assigned to a user. Administrators, teachers, bursars, librarians, front-office staff and families each receive a different workspace."
            />
            <FaqAccordion
              isOpen={activeFaq === 3}
              onToggle={() => setActiveFaq(activeFaq === 3 ? null : 3)}
              question="Do guardians get their own access?"
              answer="Guardian accounts can be linked to their children. The family view covers attendance, results, fee statements and school announcements for the children linked to that account."
            />
            <FaqAccordion
              isOpen={activeFaq === 4}
              onToggle={() => setActiveFaq(activeFaq === 4 ? null : 4)}
              question="Is our school's data separated from other schools?"
              answer="Every school is a separate tenant. Data operations are scoped to the active school, and users only reach records permitted by their membership and role."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-900 py-16 text-ivory-100 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6">
          <BrandMark size={46} />
          <h2 className="mt-6 max-w-2xl text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-ivory-50 sm:text-[38px]">
            Give your school a calmer operating rhythm.
          </h2>
          <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-sage-300/85">
            Set up the workspace, invite your team and bring the school&apos;s daily
            work into one clear system.
          </p>
          <Link
            href="/register-school"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-ivory-100 px-6 py-3.5 text-sm font-semibold text-forest-900 transition-colors hover:bg-white"
          >
            Create your school workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-warm-200 bg-ivory-50 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:px-6 md:flex-row lg:px-8">
          <BrandLockup markSize={32} subtitle="School Operations" />
          <p className="text-[11px] font-medium text-warm-500">
            © {new Date().getFullYear()} SchooMA. Built for schools, not for spreadsheets.
          </p>
          <div className="flex gap-5 text-[11px] font-bold uppercase tracking-wide text-warm-500">
            <Link href="/login" className="transition-colors hover:text-forest-800">Sign in</Link>
            <Link href="/register-school" className="transition-colors hover:text-forest-800">Create workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  number,
  title,
  description,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-warm-200 bg-ivory-50 p-5 transition-colors hover:border-warm-300">
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-sage-200 bg-sage-50 text-forest-700">
          {icon}
        </span>
        <span className="text-sm font-semibold text-warm-400">{number}</span>
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-charcoal-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-warm-600">{description}</p>
    </div>
  );
}

function RoleCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-[15px] font-semibold text-ivory-50">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-sage-300">{description}</p>
      <ul className="mt-4 space-y-2 border-t border-white/10 pt-3.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-[11px] font-medium text-sage-200">
            <span className="h-1 w-1 rounded-full bg-sage-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SecurityCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-warm-200 bg-card p-5 shadow-xs">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-50 text-forest-700">{icon}</span>
      <h3 className="mt-3.5 text-sm font-semibold text-charcoal-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-warm-600">{text}</p>
    </div>
  );
}

function PlanCard({
  name,
  description,
  features,
  highlighted = false,
}: {
  name: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 ${
        highlighted
          ? 'border-forest-700 bg-forest-900 text-ivory-100'
          : 'border-warm-200 bg-ivory-50'
      }`}
    >
      {highlighted && (
        <span className="absolute -top-2.5 left-5 rounded bg-sage-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forest-900">
          Most schools start here
        </span>
      )}
      <h3 className={`text-xl font-semibold ${highlighted ? 'text-ivory-50' : 'text-charcoal-950'}`}>{name}</h3>
      <p className={`mt-1.5 text-xs leading-relaxed ${highlighted ? 'text-sage-300' : 'text-warm-600'}`}>
        {description}
      </p>

      <ul className={`mt-5 flex-1 space-y-2.5 border-t pt-4 ${highlighted ? 'border-white/10' : 'border-warm-200'}`}>
        {features.map((feature) => (
          <li key={feature} className={`flex items-start gap-2.5 text-xs ${highlighted ? 'text-sage-200' : 'text-warm-700'}`}>
            <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${highlighted ? 'text-sage-300' : 'text-forest-600'}`} />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href="/register-school"
        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors ${
          highlighted
            ? 'bg-ivory-100 text-forest-900 hover:bg-white'
            : 'border border-forest-700 bg-card text-forest-800 hover:bg-sage-50'
        }`}
      >
        Start onboarding
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function FaqAccordion({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-warm-200 bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-charcoal-900"
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-warm-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="border-t border-warm-200 px-5 py-4 text-xs font-medium leading-relaxed text-warm-600">
          {answer}
        </div>
      )}
    </div>
  );
}
