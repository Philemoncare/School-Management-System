'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { ClipboardList, Loader2, FileText, CheckCircle } from 'lucide-react';

export default function StudentAssignments() {
  const { activeSchoolId } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (!activeSchoolId) return;
    fetchAssignments();
  }, [activeSchoolId]);

  function fetchAssignments() {
    apiFetch('/student/assignments')
      .then(setAssignments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function handleSubmit(assignmentId: string) {
    try {
      await apiFetch(`/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          content: submissionContent,
          fileUrl: fileUrl || 'https://storage.schoolplatform.example/submissions/doc.pdf'
        }),
      });
      showFeedback('SUCCESS', 'Assignment submission recorded successfully!');
      setSubmittingId(null);
      setSubmissionContent('');
      setFileUrl('');
      fetchAssignments();
    } catch (error: any) {
      showFeedback('ERROR', error.message || 'Submission failed');
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-xs">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="text-forest-700" />
          My Learning Assignments
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-0.5">View current coursework briefs, check due deadlines, and submit your entries directly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((item) => {
          const submission = item.submissions?.[0];
          return (
            <div key={item.id} className="bg-card rounded-2xl p-6 border border-border shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2.5 py-0.5 bg-sage-50 text-forest-800 font-semibold text-[11px] rounded-md uppercase border border-sage-200">{item.subject?.name}</span>
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md uppercase ${
                    submission ? 'bg-sage-50 text-forest-800 border border-sage-200' : 'bg-warning-50 text-warning-800 border border-warning-200'
                  }`}>
                    {submission ? `Submitted (${submission.status})` : 'Pending'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed font-medium">{item.description}</p>
                <p className="text-[11px] text-muted-foreground/80 font-bold uppercase mt-3">Due Date: {new Date(item.dueDate).toLocaleDateString()}</p>

                {submission?.grade && (
                  <div className="mt-3 bg-muted/40 p-3 rounded-xl border border-border/60">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1"><CheckCircle size={14} className="text-forest-600" /> Grade: <span className="text-forest-700 font-semibold">{submission.grade}</span></p>
                    {submission.feedback && <p className="text-[11px] text-muted-foreground mt-1 italic font-medium">Feedback: "{submission.feedback}"</p>}
                  </div>
                )}
              </div>

              {!submission && submittingId !== item.id && (
                <button
                  onClick={() => setSubmittingId(item.id)}
                  className="w-full text-center py-2.5 bg-forest-700 text-white font-semibold rounded-xl text-xs hover:bg-forest-800 transition-colors shadow-xs"
                >
                  Open Submission Panel
                </button>
              )}

              {submittingId === item.id && (
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Submission Notes / Text Content</label>
                    <textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="Type your notes or solution text here..."
                      className="w-full text-xs font-medium p-2.5 bg-muted/30 border border-border rounded-xl focus:outline-none focus:border-forest-600"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Attachment File URL (Optional)</label>
                    <input
                      type="text"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://link-to-your-work.com/pdf"
                      className="w-full text-xs font-medium p-2.5 bg-muted/30 border border-border rounded-xl focus:outline-none focus:border-forest-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSubmit(item.id)}
                      className="flex-1 py-2 bg-forest-700 text-white font-semibold rounded-xl text-xs hover:bg-forest-800 transition-colors"
                    >
                      Submit Now
                    </button>
                    <button
                      onClick={() => setSubmittingId(null)}
                      className="px-3 py-2 bg-muted text-foreground font-bold rounded-xl text-xs hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

          {assignments.length === 0 && (
            <div className="md:col-span-2 bg-card rounded-2xl p-12 text-center border border-border shadow-xs text-muted-foreground italic font-medium">
              <FileText className="mx-auto text-muted-foreground/40 mb-2" size={40} />
              No assignments found for your active course modules.
            </div>
          )}
      </div>
    </div>
  );
}
