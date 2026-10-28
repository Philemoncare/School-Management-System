"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  Loader2,
  Save,
  Search,
  User,
  UserCheck,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewStudentCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [formData, setFormData] = useState({
    guardianName: "",
    reason: "",
  });

  async function handleSearch(query: string) {
    if (query.length < 3) return;
    setSearching(true);
    try {
      const results = await apiFetch(`/front-office/students/search?q=${query}`);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return toast.error("Please select a student first.");

    setLoading(true);
    try {
      await apiFetch("/front-office/students/checkout", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          studentId: selectedStudent.id,
        }),
      });
      toast.success("Student departure recorded successfully!");
      router.push("/receptionist/student-checkout");
    } catch (error: any) {
      toast.error(error.message || "Failed to record checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/receptionist/student-checkout"
          className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Process Early Departure</h1>
          <p className="text-warm-500 text-sm">Verify guardian authorization and record student exit.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Step 1: Student Lookup */}
        <div className="lg:col-span-2 space-y-6">
           <section className="bg-card rounded-3xl border border-warm-100 shadow-sm p-6">
              <h3 className="font-bold text-charcoal-900 mb-4 flex items-center gap-2">
                <Search size={18} className="text-forest-700" />
                1. Identify Student
              </h3>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Student name or #"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500"
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <Search className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                 {searching ? <div className="p-4 text-center text-xs text-warm-400">Searching Registry...</div> : null}
                 {searchResults.map(student => (
                   <button
                     key={student.id}
                     onClick={() => setSelectedStudent(student)}
                     className={`w-full text-left p-3 rounded-xl border transition-all ${
                       selectedStudent?.id === student.id ? "bg-sage-50 border-sage-200 shadow-sm" : "bg-ivory-50 border-warm-100 hover:border-warm-200"
                     }`}
                   >
                     <p className="text-sm font-bold text-charcoal-900">{student.firstName} {student.lastName}</p>
                     <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider">{student.studentNumber} • {student.enrollments[0]?.class.name}</p>
                   </button>
                 ))}
                 {!searching && searchResults.length === 0 && <p className="text-center py-8 text-xs text-warm-400 italic">Enter at least 3 chars to search...</p>}
              </div>
           </section>

           {selectedStudent && (
             <section className="bg-forest-700 text-white rounded-3xl p-6 shadow-xs animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold flex items-center gap-2 uppercase tracking-wide text-[11px]">Authorized Guardians</h3>
                   <ShieldCheck size={16} className="text-sage-200" />
                </div>
                <div className="space-y-3">
                   {selectedStudent.guardians.map((g: any) => (
                     <div key={g.guardian.id} className="bg-card/10 p-3 rounded-xl border border-white/10">
                        <p className="text-xs font-bold">{g.guardian.firstName} {g.guardian.lastName}</p>
                        <p className="text-[11px] opacity-70 uppercase font-semibold">{g.relation}</p>
                     </div>
                   ))}
                </div>
             </section>
           )}
        </div>

        {/* Step 2: Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden h-full flex flex-col">
             <div className="p-8 space-y-6 flex-1">
                <h3 className="font-bold text-charcoal-900 flex items-center gap-2 mb-4">
                  <UserCheck size={18} className="text-success-600" />
                  2. Verify & Record
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Guardian / Pickup Person Name</label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        placeholder="Person taking the student..."
                        className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      />
                      <User className="absolute left-3.5 top-3 text-warm-400" size={16} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Reason for Departure</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="e.g. Medical appointment, Family emergency..."
                      className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-forest-500 resize-none"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                </div>

                {!selectedStudent && (
                  <div className="bg-warning-50 border border-warning-100 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-warning-600 mt-0.5" />
                    <p className="text-xs text-warning-800 font-medium leading-relaxed">
                      You must select a student from the registry on the left before you can process a checkout request.
                    </p>
                  </div>
                )}
             </div>

             <div className="p-6 bg-ivory-50 border-t border-warm-100 flex justify-end">
               <button
                 type="submit"
                 disabled={loading || !selectedStudent}
                 className="bg-forest-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100 disabled:opacity-50"
               >
                 {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                 Complete Departure Record
               </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
}
