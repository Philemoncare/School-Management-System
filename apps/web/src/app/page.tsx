'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ShieldCheck,
  Users,
  CreditCard,
  BarChart3,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <BookOpen className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">EduFlow SaaS</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-blue-600">
                Sign in
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Manage your school <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                with total confidence.
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The all-in-one Education ERP for modern schools. From student management and academics to finance and communication—all in one secure, multi-tenant platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-200">
                Start Free Trial <ArrowRight size={20} />
              </Link>
              <button className="bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all">
                Book a Demo
              </button>
            </div>
          </div>
        </div>

        {/* Background blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything your school needs</h2>
            <p className="mt-4 text-lg text-gray-600">Built for administrators, teachers, parents and students.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="text-blue-600" />}
              title="Student Management"
              description="Complete student lifecycle from application to graduation. Detailed profiles, enrollment and history."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-green-600" />}
              title="Multi-Tenant Security"
              description="Enterprise-grade isolation. Each school operates in its own secure environment with private data."
            />
            <FeatureCard
              icon={<CreditCard className="text-purple-600" />}
              title="Financial Control"
              description="Manage fee structures, invoices, online payments, and collections with automated reconciliations."
            />
            <FeatureCard
              icon={<BarChart3 className="text-orange-600" />}
              title="Academic Insights"
              description="Real-time attendance, examination management, grade calculations and professional report cards."
            />
            <FeatureCard
              icon={<BookOpen className="text-indigo-600" />}
              title="School Operations"
              description="Library inventory, transport tracking, staff management and school-wide announcements."
            />
            <FeatureCard
              icon={<CheckCircle2 className="text-red-600" />}
              title="Real-time Notifications"
              description="Keep everyone informed with instant SMS, email, and in-app alerts for attendance and results."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Transparent, predictable pricing</h2>
            <p className="mt-4 text-lg text-gray-600">Choose the plan that fits your school's size and needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              name="Starter"
              price="$0"
              description="Perfect for small schools just starting their digital journey."
              features={["Up to 50 students", "Basic Academics", "In-app notifications"]}
            />
            <PricingCard
              name="Professional"
              price="$49"
              highlight={true}
              description="Our most popular plan for established private academies."
              features={["Up to 500 students", "Full Finance & Billing", "SMS & Email Alerts", "Library Module"]}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              description="For large institutions requiring maximum scale and support."
              features={["Unlimited students", "Advanced Analytics", "Priority Support", "Custom Integrations"]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <BookOpen className="text-blue-400" size={32} />
            <span className="text-2xl font-bold tracking-tight">EduFlow SaaS</span>
          </div>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">The world's leading multi-tenant school management platform. Trusted by thousands of institutions globally.</p>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-gray-500">© 2026 EduFlow ERP. All rights reserved.</span>
            <div className="flex gap-8 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-400 transition-all hover:shadow-xl group">
      <div className="mb-4 bg-gray-50 w-12 h-12 flex items-center justify-center rounded-xl group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, description, features, highlight = false }: any) {
  return (
    <div className={`p-8 rounded-3xl border-2 flex flex-col ${highlight ? 'border-blue-600 bg-blue-50/30 shadow-2xl relative' : 'border-gray-100 bg-white'}`}>
      {highlight && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Most Popular</span>}
      <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
      <p className="mt-2 text-gray-500">{description}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-gray-900">{price}</span>
        {price !== 'Custom' && <span className="text-gray-500 font-medium">/month</span>}
      </div>
      <ul className="mt-8 space-y-4 flex-grow">
        {features.map((f: any) => (
          <li key={f} className="flex items-center gap-3 text-gray-700">
            <CheckCircle2 className="text-green-500 shrink-0" size={18} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/register" className={`mt-10 w-full py-4 rounded-xl font-bold text-center transition-all ${highlight ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-gray-900 text-white hover:bg-black'}`}>
        Choose {name}
      </Link>
    </div>
  );
}
