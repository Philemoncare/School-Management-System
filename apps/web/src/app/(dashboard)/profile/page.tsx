"use client";

import { Select } from '@/components/ui/input';
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api/client";
import {
  User,
  Shield,
  Sliders,
  Bell,
  Activity,
  LogOut,
  Building,
  CheckCircle,
  Lock,
  Globe,
  Smartphone,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type TabType = "profile" | "security" | "preferences" | "notifications" | "sessions" | "memberships";

export default function GlobalProfilePage() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [sessions, setSessions] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);

  // Preferences & Notifications states
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError("");
    try {
      const me = await apiFetch("/users/me");
      setProfileData(me);
      setFirstName(me.firstName || "");
      setLastName(me.lastName || "");
      setPhone(me.phone || "");

      const sess = await apiFetch("/users/me/sessions");
      setSessions(sess || []);

      const logs = await apiFetch("/users/me/security/activity");
      setActivityLogs(logs || []);

      const mems = await apiFetch("/users/me/memberships");
      setMemberships(mems || []);
    } catch (err: any) {
      setError(err.message || "Failed to load account data");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      const res = await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      setProfileData(res);
      setSuccessMsg("Profile information updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await apiFetch("/users/me/password/change", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccessMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    }
  };

  const handleRevokeSession = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) return;
    try {
      await apiFetch(`/users/me/sessions/${id}`, { method: "DELETE" });
      setSessions(sessions.filter((s) => s.id !== id));
      setSuccessMsg("Session revoked successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to revoke session");
    }
  };

  const handleRevokeOthers = async () => {
    if (!confirm("Revoke all other active sessions?")) return;
    try {
      await apiFetch("/users/me/sessions/revoke-others", { method: "POST" });
      const current = sessions.find((s) => s.tokenHash === authUser?.sessionId) || sessions[0];
      setSessions(current ? [current] : []);
      setSuccessMsg("Other sessions revoked successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to revoke other sessions");
    }
  };

  const handleRequestDeactivation = async () => {
    const reason = prompt("Please provide a reason for account deactivation:");
    if (reason === null) return;
    try {
      await apiFetch("/users/me/deactivation-request", {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      alert("Deactivation request submitted successfully to administrator.");
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-card rounded-3xl border border-warm-100 shadow-sm">
        <RefreshCw size={32} className="animate-spin text-forest-700 mb-4" />
        <p className="text-warm-500 font-bold uppercase tracking-wide text-xs">Loading Settings Context...</p>
      </div>
    );
  }

  const initials = profileData
    ? `${profileData.firstName?.[0] || ""}${profileData.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  // Authoritative calculation of profile completion percentage
  const completionFields = [profileData?.firstName, profileData?.lastName, profileData?.phone, profileData?.emailVerified];
  const completedCount = completionFields.filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / completionFields.length) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Profile Hero Card */}
      <div className="bg-card border border-warm-200 rounded-xl p-6 md:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-2xl bg-forest-700 text-white flex items-center justify-center font-semibold text-3xl shadow-xs shadow-sage-200 shrink-0">
          {initials}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl font-semibold text-charcoal-900 tracking-tight">
              {profileData?.firstName} {profileData?.lastName}
            </h1>
            <span className="inline-flex mx-auto sm:mx-0 items-center px-2.5 py-0.5 rounded-full bg-success-100 text-success-800 text-[11px] font-bold uppercase tracking-wider">
              {profileData?.accountState || "ACTIVE"}
            </span>
          </div>
          <p className="text-sm font-medium text-warm-500 mt-1">{profileData?.email}</p>
          <div className="mt-4 flex flex-wrap gap-4 items-center justify-center sm:justify-start text-xs font-bold text-warm-400 uppercase tracking-wider">
            <div>Verification: <span className="text-charcoal-900">{profileData?.emailVerified ? "Verified" : "Pending"}</span></div>
            <div className="hidden sm:block text-warm-200">|</div>
            <div>Completion: <span className="text-forest-700 font-semibold">{completionPercentage}%</span></div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-100 text-danger-700 rounded-xl font-semibold text-sm flex items-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-success-50 border border-success-100 text-success-700 rounded-xl font-semibold text-sm flex items-center gap-2">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Main Settings Navigation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar Tabs */}
        <aside className="space-y-1">
          <TabButton id="profile" label="Personal Profile" icon={User} current={activeTab} set={setActiveTab} />
          <TabButton id="security" label="Security & Password" icon={Shield} current={activeTab} set={setActiveTab} />
          <TabButton id="preferences" label="Account Preferences" icon={Sliders} current={activeTab} set={setActiveTab} />
          <TabButton id="notifications" label="Notifications" icon={Bell} current={activeTab} set={setActiveTab} />
          <TabButton id="sessions" label="Active Sessions" icon={Activity} current={activeTab} set={setActiveTab} />
          <TabButton id="memberships" label="School Memberships" icon={Building} current={activeTab} set={setActiveTab} />

          <div className="pt-6 border-t border-warm-200 mt-6">
            <button
              onClick={handleRequestDeactivation}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-danger-600 hover:bg-danger-50 transition-all text-left uppercase tracking-wider"
            >
              Request Deactivation
            </button>
          </div>
        </aside>

        {/* Workspace Active Area Container */}
        <div className="lg:col-span-3 bg-card border border-warm-200 rounded-xl p-6 md:p-8 shadow-sm">
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-charcoal-900">Personal Information</h3>
                <p className="text-xs text-warm-500 font-medium">Update your profile information and verified touchpoints.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-forest-700 focus:border-transparent transition-all"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-forest-700 focus:border-transparent transition-all"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="text"
                  className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-forest-700 focus:border-transparent transition-all"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-sage-100 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <div className="space-y-8">
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-charcoal-900">Change Account Password</h3>
                  <p className="text-xs text-warm-500 font-medium">Ensure your account uses a strong, secure passphrase.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-forest-700 focus:border-transparent transition-all"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-forest-700 focus:border-transparent transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-forest-700 focus:border-transparent transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-sage-100 transition-all"
                  >
                    Update Password
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-warm-100">
                <h4 className="text-sm font-bold text-charcoal-900 mb-4 uppercase tracking-wider">Recent Security Activity Logs</h4>
                <div className="space-y-3">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-warm-400">No recent security events registered.</p>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="flex justify-between items-center text-xs p-3 bg-ivory-50 rounded-xl border border-warm-100">
                        <div>
                          <p className="font-bold text-charcoal-900 uppercase">{log.eventType}</p>
                          <p className="text-warm-500 font-medium">IP: {log.ipAddress || "Unknown"}</p>
                        </div>
                        <span className="text-warm-400 font-semibold">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-charcoal-900">Regional & System Preferences</h3>
                <p className="text-xs text-warm-500 font-medium">Configure explicit localizations for presentation layer.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Preferred Language</label>
                  <Select
                    className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm bg-transparent"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option>English</option>
                    <option>Français</option>
                    <option>Español</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Explicit Timezone Context</label>
                  <Select
                    className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm bg-transparent"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option>UTC</option>
                    <option>GMT</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Africa/Accra</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Display Mode Theme</label>
                  <div className="flex gap-4">
                    {["light", "dark", "system"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`flex-1 p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-center ${
                          theme === t ? "border-forest-700 bg-sage-50 text-forest-800" : "border-warm-200 text-warm-600 hover:bg-ivory-50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-charcoal-900">Notification Channels Setup</h3>
                <p className="text-xs text-warm-500 font-medium">Subscribe or configure system communication hooks.</p>
              </div>

              <div className="space-y-3">
                {["Security Alerts (Mandatory)", "Academic & Results Reports", "Financial Notices & Invoices", "General School Announcements"].map((item, idx) => (
                  <div key={item} className="flex justify-between items-center p-4 bg-ivory-50 rounded-xl border border-warm-100">
                    <span className="text-sm font-bold text-charcoal-800">{item}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" disabled={idx === 0} />
                      <div className="w-9 h-5 bg-warm-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-warm-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest-700"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-bold text-charcoal-900">Authoritative Active Sessions</h3>
                  <p className="text-xs text-warm-500 font-medium">Monitor or sign out of other devices currently running your identity.</p>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={handleRevokeOthers}
                    className="px-3 py-1.5 bg-danger-50 hover:bg-danger-100 text-danger-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                  >
                    Sign Out Everywhere Else
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 bg-ivory-50 rounded-xl border border-warm-200 flex justify-between items-center gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-charcoal-900 truncate">
                          {sess.browser || "Browser"} on {sess.os || "Operating System"}
                        </p>
                        {sess.tokenHash === authUser?.sessionId && (
                          <span className="px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-sage-100 text-forest-800 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-warm-500 font-semibold mt-1">IP Address: {sess.ipAddress || "Unknown"}</p>
                      <p className="text-[11px] text-warm-400 font-medium uppercase tracking-tight mt-0.5">
                        Last Active: {new Date(sess.lastSeenAt).toLocaleString()}
                      </p>
                    </div>
                    {sess.tokenHash !== authUser?.sessionId && (
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        className="p-2 hover:bg-danger-50 text-danger-500 rounded-lg transition-colors"
                        title="Revoke Session"
                      >
                        <LogOut size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "memberships" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-charcoal-900">Valid School Memberships</h3>
                <p className="text-xs text-warm-500 font-medium">All enterprise tenants currently associated with your account state.</p>
              </div>

              <div className="space-y-3">
                {memberships.length === 0 ? (
                  <p className="text-xs text-warm-400">No active school memberships mapped.</p>
                ) : (
                  memberships.map((m) => (
                    <div key={m.id} className="p-4 bg-ivory-50 rounded-xl border border-warm-100 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-charcoal-900">{m.school?.name}</p>
                        <p className="text-xs text-warm-500 font-medium">Code: {m.school?.code}</p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-forest-700 bg-sage-50 px-2.5 py-1 rounded-full">
                        {m.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  id: TabType;
  label: string;
  icon: any;
  current: TabType;
  set: (id: TabType) => void;
}

function TabButton({ id, label, icon: Icon, current, set }: TabButtonProps) {
  const isSelected = current === id;
  return (
    <button
      onClick={() => set(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
        isSelected
          ? "bg-forest-700 text-white shadow-lg shadow-sage-100 scale-[1.01]"
          : "text-warm-600 hover:bg-warm-100 text-warm-700"
      }`}
    >
      <Icon size={18} className={isSelected ? "text-white" : "text-warm-400"} />
      <span>{label}</span>
    </button>
  );
}

