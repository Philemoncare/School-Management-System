'use client';

import { Select } from '@/components/ui/input';
import React, { useState } from 'react';
import {
  Send,
  Users,
  MessageSquare,
  Mail,
  Smartphone,
  Calendar,
  Save,
  Eye,
  X,
  Plus,
  Target,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/client';

interface AudienceOption {
  type: string;
  label: string;
}

export function CommunicationComposer({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    content: '',
    priority: 'NORMAL',
    channels: ['IN_APP'] as string[],
    audienceConfig: { type: 'ALL' } as any,
    scheduledFor: '',
  });

  const channels = [
    { id: 'IN_APP', label: 'In-App', icon: MessageSquare },
    { id: 'EMAIL', label: 'Email', icon: Mail },
    { id: 'SMS', label: 'SMS', icon: Smartphone },
    { id: 'WEBSOCKET', label: 'Realtime (Push)', icon: Send },
  ];

  const handleChannelToggle = (channelId: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter(c => c !== channelId)
        : [...prev.channels, channelId]
    }));
  };

  const handleSend = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }
    setSending(true);
    try {
      const comm = await apiFetch('/communications', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      await apiFetch(`/communications/${comm.id}/send`, {
        method: 'POST'
      });

      toast.success('Communication initiated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send communication');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card rounded-3xl shadow-xs border border-warm-100 flex flex-col h-[85vh] max-w-5xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sage-200">
            <Plus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-charcoal-900 leading-tight">New Broadcast</h2>
            <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Step {step} of 3 • Draft Mode</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-warm-200 rounded-full transition-colors">
          <X size={20} className="text-warm-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 ml-1">Internal Reference Title</label>
                  <input
                    type="text"
                    placeholder="e.g. June Fee Reminder"
                    className="w-full px-5 py-3 rounded-2xl bg-ivory-50 border border-warm-100 focus:border-forest-500 focus:ring-4 focus:ring-sage-50 outline-none transition-all font-bold text-charcoal-900"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 ml-1">Email Subject (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Important Notice: Term 2 Fees"
                    className="w-full px-5 py-3 rounded-2xl bg-ivory-50 border border-warm-100 focus:border-forest-500 focus:ring-4 focus:ring-sage-50 outline-none transition-all font-bold text-charcoal-900"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 ml-1">Delivery Channels</label>
                <div className="grid grid-cols-2 gap-3">
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelToggle(channel.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        formData.channels.includes(channel.id)
                          ? 'bg-forest-700 border-forest-700 text-white shadow-lg shadow-sage-100'
                          : 'bg-card border-warm-100 text-warm-500 hover:border-sage-200'
                      }`}
                    >
                      <channel.icon size={20} />
                      <span className="text-sm font-semibold uppercase tracking-wider">{channel.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 ml-1">Message Content</label>
              <textarea
                rows={10}
                placeholder="Type your message here... You can use variables like {{student_name}} or {{guardian_name}}."
                className="w-full px-6 py-5 rounded-xl bg-ivory-50 border border-warm-100 focus:border-forest-500 focus:ring-4 focus:ring-sage-50 outline-none transition-all font-medium text-charcoal-900 leading-relaxed resize-none"
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="bg-sage-50 border border-sage-100 rounded-3xl p-8 flex items-start gap-6">
                <div className="w-12 h-12 bg-forest-700 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-sage-200">
                   <Target size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-semibold text-forest-950 leading-tight">Audience Targeting</h3>
                   <p className="text-sm text-forest-800/60 font-bold mt-1">Select precisely who should receive this communication.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AudienceCard
                  title="Students"
                  description="All active enrolled students"
                  active={formData.audienceConfig.type === 'STUDENTS'}
                  onClick={() => setFormData({...formData, audienceConfig: { type: 'STUDENTS' }})}
                />
                <AudienceCard
                  title="Guardians"
                  description="Primary parent/guardian contacts"
                  active={formData.audienceConfig.type === 'PARENTS'}
                  onClick={() => setFormData({...formData, audienceConfig: { type: 'PARENTS' }})}
                />
                <AudienceCard
                  title="Teachers"
                  description="Active faculty members"
                  active={formData.audienceConfig.type === 'TEACHERS'}
                  onClick={() => setFormData({...formData, audienceConfig: { type: 'TEACHERS' }})}
                />
                <AudienceCard
                  title="All Community"
                  description="Everyone in the school directory"
                  active={formData.audienceConfig.type === 'ALL'}
                  onClick={() => setFormData({...formData, audienceConfig: { type: 'ALL' }})}
                />
                <AudienceCard
                  title="Class / Grade"
                  description="Target specific class or section"
                  active={formData.audienceConfig.type === 'CLASS'}
                  onClick={() => setFormData({...formData, audienceConfig: { type: 'CLASS', classId: '' }})}
                />
             </div>

             {formData.audienceConfig.type === 'CLASS' && (
               <div className="p-8 bg-ivory-50 rounded-3xl border border-warm-100 flex gap-6 items-end">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 ml-1">Select Class</label>
                    <Select className="w-full px-5 py-3 rounded-xl bg-card border border-warm-200 outline-none font-bold">
                       <option>Grade 10 - Blue</option>
                       <option>Grade 11 - Gold</option>
                       <option>Grade 12 - Elite</option>
                    </Select>
                  </div>
                  <div className="flex-1 text-[11px] font-bold text-warm-400 uppercase">
                    Resolving ~ 124 Recipients
                  </div>
               </div>
             )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
             <div className="bg-sage-50 border border-sage-100 rounded-3xl p-8 flex items-start gap-6">
                <div className="w-12 h-12 bg-forest-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-sage-200">
                   <Eye size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-semibold text-forest-900 leading-tight">Review & Dispatch</h3>
                   <p className="text-sm text-forest-700/60 font-bold mt-1">Verify all details before finalizing this broadcast.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <SummaryItem label="Campaign Title" value={formData.title} />
                   <SummaryItem label="Target Audience" value={formData.audienceConfig.type} />
                   <div className="flex gap-2">
                     {formData.channels.map(c => (
                       <span key={c} className="px-3 py-1 bg-warm-100 rounded-lg text-[11px] font-semibold uppercase text-warm-500 tracking-wider border border-warm-200">{c}</span>
                     ))}
                   </div>
                </div>

                <div className="bg-ivory-50 rounded-xl border border-warm-100 p-8">
                   <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-4">Live Preview</p>
                   <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-charcoal-900">{formData.subject || formData.title}</h4>
                      <p className="text-sm text-warm-600 font-medium leading-relaxed whitespace-pre-wrap">{formData.content}</p>
                   </div>
                </div>
             </div>

             <div className="pt-6 border-t border-warm-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded-lg border-warm-300 text-forest-700 focus:ring-forest-500" />
                  <span className="text-xs font-bold text-warm-500 group-hover:text-charcoal-900 transition-colors">Schedule for future delivery</span>
                </label>
             </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-warm-100 bg-ivory-50/50 flex justify-between items-center">
        <div className="flex gap-2">
           <button
             onClick={() => setStep(prev => Math.max(1, prev - 1))}
             disabled={step === 1}
             className="px-6 py-3 bg-card text-warm-400 font-semibold text-[11px] uppercase tracking-wide rounded-2xl border border-warm-200 hover:bg-ivory-50 disabled:opacity-30 transition-all"
           >
             Back
           </button>
           <button className="px-6 py-3 bg-card text-warm-600 font-semibold text-[11px] uppercase tracking-wide rounded-2xl border border-warm-200 hover:bg-ivory-50 transition-all flex items-center gap-2">
             <Save size={16} /> Save Draft
           </button>
        </div>

        {step < 3 ? (
          <button
            onClick={() => setStep(prev => prev + 1)}
            className="px-8 py-3 bg-charcoal-900 text-white font-semibold text-[11px] uppercase tracking-wide rounded-2xl shadow-xs hover:bg-charcoal-950 transition-all"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-10 py-4 bg-forest-700 text-white font-semibold text-[11px] uppercase tracking-wide rounded-2xl shadow-xs shadow-sage-200 hover:bg-forest-800 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {sending ? 'Processing...' : <><Send size={18} /> Send Broadcast Now</>}
          </button>
        )}
      </div>
    </div>
  );
}

function AudienceCard({ title, description, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-3xl border text-left transition-all ${
        active
          ? 'bg-sage-50 border-forest-700 shadow-xs shadow-sage-50'
          : 'bg-card border-warm-100 hover:border-sage-200'
      }`}
    >
       <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 ${active ? 'bg-forest-700 text-white' : 'bg-warm-100 text-warm-400'}`}>
          <Users size={16} />
       </div>
       <h4 className={`text-sm font-semibold uppercase tracking-wider mb-1 ${active ? 'text-forest-950' : 'text-charcoal-900'}`}>{title}</h4>
       <p className={`text-[11px] font-bold leading-tight ${active ? 'text-forest-800/60' : 'text-warm-400'}`}>{description}</p>
    </button>
  );
}

function SummaryItem({ label, value }: any) {
  return (
    <div>
       <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">{label}</p>
       <p className="text-base font-semibold text-charcoal-900">{value}</p>
    </div>
  );
}
