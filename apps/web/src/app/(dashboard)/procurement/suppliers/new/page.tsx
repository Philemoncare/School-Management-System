'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    categories: [] as string[],
    contactName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/procurement/suppliers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success('Supplier registered successfully');
      router.push('/procurement/suppliers');
    } catch (error: any) {
      toast.error(error.message || 'Failed to register supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/procurement/suppliers" className="p-2 hover:bg-warm-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Add New Supplier</h1>
          <p className="text-warm-500 text-sm">Register a new vendor or service provider.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <h3 className="font-bold text-charcoal-900 flex items-center gap-2 border-b border-ivory-50 pb-4">
                    <Building2 size={18} className="text-forest-700" /> Company Identity
                 </h3>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Company Legal Name</label>
                       <input
                         required
                         type="text"
                         placeholder="e.g. Modern Office Supplies Ltd"
                         className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium outline-none focus:border-forest-500"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Supplier Code</label>
                       <input
                         required
                         type="text"
                         placeholder="e.g. SUP-001"
                         className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium outline-none focus:border-forest-500"
                         value={formData.code}
                         onChange={e => setFormData({...formData, code: e.target.value})}
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="font-bold text-charcoal-900 flex items-center gap-2 border-b border-ivory-50 pb-4">
                    <Phone size={18} className="text-forest-700" /> Contact Details
                 </h3>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Primary Email</label>
                       <input
                         required
                         type="email"
                         placeholder="sales@company.com"
                         className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium outline-none focus:border-forest-500"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Phone Number</label>
                       <input
                         required
                         type="tel"
                         placeholder="+233..."
                         className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium outline-none focus:border-forest-500"
                         value={formData.phone}
                         onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Physical Office Address</label>
              <textarea
                rows={3}
                placeholder="Full business address..."
                className="w-full p-4 bg-ivory-50 border border-warm-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-forest-500 resize-none"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
           </div>
        </div>

        <div className="p-6 bg-ivory-50 border-t border-warm-100 flex justify-end">
           <button
             type="submit"
             disabled={loading}
             className="bg-forest-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             Record Supplier
           </button>
        </div>
      </form>
    </div>
  );
}
