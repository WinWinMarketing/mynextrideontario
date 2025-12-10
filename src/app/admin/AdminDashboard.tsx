'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Select, Textarea, Modal, StatusPill, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions } from '@/lib/validation';
import { formatDate, formatMonthYear } from '@/lib/utils';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'leads' | 'settings';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [editingNotes, setEditingNotes] = useState<{ id: string; notes: string } | null>(null);
  const [licenseModal, setLicenseModal] = useState<{ url: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  
  // Settings state
  const [emailSettings, setEmailSettings] = useState({
    recipientEmail: '',
    fromName: 'My Next Ride Ontario',
    enabled: true,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setEmailSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchSettings();
  }, [fetchLeads, fetchSettings]);

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMessage(null);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings),
      });

      if (response.ok) {
        setSettingsMessage({ type: 'success', text: '✓ Settings saved successfully!' });
      } else {
        setSettingsMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch {
      setSettingsMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMessage(null), 4000);
    }
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          year: selectedYear,
          month: selectedMonth,
          status,
        }),
      });

      if (response.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, status } : lead
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateLeadDeadReason = async (leadId: string, deadReason: string) => {
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          year: selectedYear,
          month: selectedMonth,
          deadReason,
        }),
      });

      if (response.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, deadReason: deadReason as Lead['deadReason'] } : lead
          )
        );
      }
    } catch (error) {
      console.error('Error updating dead reason:', error);
    }
  };

  const saveNotes = async (leadId: string, notes: string) => {
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          year: selectedYear,
          month: selectedMonth,
          notes,
        }),
      });

      if (response.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, notes } : lead
          )
        );
        setEditingNotes(null);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const viewLicense = async (lead: Lead) => {
    if (!lead.driversLicenseKey) return;

    try {
      const response = await fetch(
        `/api/admin/leads/${lead.id}/license-url?year=${selectedYear}&month=${selectedMonth}`
      );
      if (response.ok) {
        const data = await response.json();
        setLicenseModal({ url: data.url, name: lead.formData.fullName });
      }
    } catch (error) {
      console.error('Error getting license URL:', error);
    }
  };

  // Filter and sort leads
  const filteredLeads = leads
    .filter((lead) => statusFilter === 'all' || lead.status === statusFilter)
    .sort((a, b) => {
      if (a.status === 'dead' && b.status !== 'dead') return 1;
      if (a.status !== 'dead' && b.status === 'dead') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const activeLeads = filteredLeads.filter((l) => l.status !== 'dead');
  const deadLeads = filteredLeads.filter((l) => l.status === 'dead');

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleString('en-CA', { month: 'long' }),
  }));

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Luxurious Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-blue-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-500">My Next Ride Ontario</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'leads'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                📋 Leads
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                ⚙️ Settings
              </button>
            </div>

            <Button variant="ghost" onClick={onLogout} size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'leads' ? (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm">
                <Select
                  options={monthOptions}
                  value={String(selectedMonth)}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-36"
                />
                <Select
                  options={yearOptions}
                  value={String(selectedYear)}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-24"
                />
                <div className="h-8 w-px bg-blue-200" />
                <Select
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    ...leadStatusOptions.map((s) => ({ 
                      value: s, 
                      label: s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                    })),
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                  className="w-40"
                />
                <Button variant="ghost" size="sm" onClick={fetchLeads}>
                  🔄 Refresh
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                  { label: 'Total', value: leads.length, icon: '📊', gradient: 'from-slate-500 to-slate-700' },
                  { label: 'New', value: leads.filter((l) => l.status === 'new').length, icon: '✨', gradient: 'from-blue-500 to-blue-700' },
                  { label: 'Hot', value: leads.filter((l) => l.status === 'hot').length, icon: '🔥', gradient: 'from-red-500 to-red-700' },
                  { label: 'Working', value: leads.filter((l) => l.status === 'working').length, icon: '⚡', gradient: 'from-amber-500 to-amber-700' },
                  { label: 'Approved', value: leads.filter((l) => l.status === 'approved').length, icon: '✅', gradient: 'from-green-500 to-green-700' },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative overflow-hidden"
                  >
                    <Card className="p-5 text-center bg-white/90 backdrop-blur-sm">
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
                      <span className="text-3xl mb-2 block">{stat.icon}</span>
                      <div className="text-4xl font-bold text-slate-800">{stat.value}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Month Header */}
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800">
                <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                {formatMonthYear(new Date(selectedYear, selectedMonth - 1, 1))}
              </h2>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-slate-500 font-medium">Loading leads...</span>
                  </div>
                </div>
              ) : leads.length === 0 ? (
                <Card className="p-16 text-center bg-white/70 backdrop-blur-sm">
                  <div className="text-7xl mb-4">📭</div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No leads this month</h3>
                  <p className="text-slate-500">New applications will appear here automatically</p>
                </Card>
              ) : (
                <div className="space-y-8">
                  {activeLeads.length > 0 && (
                    <div className="space-y-4">
                      {activeLeads.map((lead, index) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          index={index}
                          onStatusChange={updateLeadStatus}
                          onDeadReasonChange={updateLeadDeadReason}
                          onNotesEdit={(id, notes) => setEditingNotes({ id, notes })}
                          onViewLicense={() => viewLicense(lead)}
                          editingNotes={editingNotes}
                          onNotesSave={saveNotes}
                          onNotesCancel={() => setEditingNotes(null)}
                          onNotesChange={(notes) => setEditingNotes((prev) => prev ? { ...prev, notes } : null)}
                        />
                      ))}
                    </div>
                  )}

                  {deadLeads.length > 0 && (
                    <div className="mt-12">
                      <h3 className="text-lg font-semibold text-slate-400 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-300" />
                        Closed Leads ({deadLeads.length})
                      </h3>
                      <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity">
                        {deadLeads.map((lead, index) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            index={index}
                            onStatusChange={updateLeadStatus}
                            onDeadReasonChange={updateLeadDeadReason}
                            onNotesEdit={(id, notes) => setEditingNotes({ id, notes })}
                            onViewLicense={() => viewLicense(lead)}
                            editingNotes={editingNotes}
                            onNotesSave={saveNotes}
                            onNotesCancel={() => setEditingNotes(null)}
                            onNotesChange={(notes) => setEditingNotes((prev) => prev ? { ...prev, notes } : null)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl border-0">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <span className="text-3xl">⚙️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
                    <p className="text-slate-500 text-sm">Configure notifications & preferences</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Email Toggle */}
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">📧 Email Notifications</h3>
                        <p className="text-sm text-slate-500 mt-1">Get notified when new leads come in</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailSettings.enabled}
                          onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                      </label>
                    </div>
                  </div>

                  {/* Email Recipient */}
                  <Input
                    label="📬 Notification Email"
                    type="email"
                    value={emailSettings.recipientEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, recipientEmail: e.target.value })}
                    placeholder="your@email.com"
                    hint="New lead notifications will be sent to this address"
                  />

                  {/* From Name */}
                  <Input
                    label="🏷️ From Name"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                    placeholder="My Next Ride Ontario"
                    hint="Display name shown in notification emails"
                  />

                  {/* Success/Error Message */}
                  {settingsMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 rounded-xl font-medium ${
                        settingsMessage.type === 'success'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {settingsMessage.text}
                    </motion.div>
                  )}

                  {/* Save Button */}
                  <Button
                    variant="primary"
                    onClick={saveSettings}
                    isLoading={settingsSaving}
                    className="w-full py-3 text-lg"
                  >
                    💾 Save Settings
                  </Button>
                </div>

                {/* Info Box */}
                <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-200">
                  <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                    <span>💡</span> How Email Works
                  </h4>
                  <p className="text-sm text-amber-700">
                    All leads are saved automatically and shown in this dashboard. If you want email notifications, 
                    set up a Resend API key in Vercel. Otherwise, just check this dashboard regularly!
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* License Modal */}
      <Modal
        isOpen={!!licenseModal}
        onClose={() => setLicenseModal(null)}
        title={`Driver's License - ${licenseModal?.name}`}
        size="xl"
      >
        {licenseModal && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-lg">
              <img
                src={licenseModal.url}
                alt="Driver's License"
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <a
                href={licenseModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="primary" className="w-full">
                  🔗 Open Full Size
                </Button>
              </a>
              <a href={licenseModal.url} download className="flex-1">
                <Button variant="secondary" className="w-full">
                  ⬇️ Download
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Lead Card Component
interface LeadCardProps {
  lead: Lead;
  index: number;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDeadReasonChange: (id: string, reason: string) => void;
  onNotesEdit: (id: string, notes: string) => void;
  onViewLicense: () => void;
  editingNotes: { id: string; notes: string } | null;
  onNotesSave: (id: string, notes: string) => void;
  onNotesCancel: () => void;
  onNotesChange: (notes: string) => void;
}

function LeadCard({
  lead,
  index,
  onStatusChange,
  onDeadReasonChange,
  onNotesEdit,
  onViewLicense,
  editingNotes,
  onNotesSave,
  onNotesCancel,
  onNotesChange,
}: LeadCardProps) {
  const { formData } = lead;

  const getBudgetDisplay = () => {
    if (formData.paymentType === 'finance') {
      const map: Record<string, string> = {
        '400-or-less': '≤$400/mo',
        '400-500': '$400-500/mo',
        '500-600': '$500-600/mo',
        '600-plus': '$600+/mo',
      };
      return map[formData.financeBudget || ''] || 'N/A';
    } else {
      const map: Record<string, string> = {
        '15k-or-less': '≤$15k',
        '20-30k': '$20-30k',
        '30-45k': '$30-45k',
        '50k-plus': '$50k+',
      };
      return map[formData.cashBudget || ''] || 'N/A';
    }
  };

  const vehicleLabel: Record<string, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    hatchback: 'Hatchback',
    'coupe-convertible': 'Coupe',
    truck: 'Truck',
    minivan: 'Minivan',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 border-0 shadow-lg">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{formData.fullName}</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-2">
              <a href={`tel:${formData.phone}`} className="hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                <span>📞</span> {formData.phone}
              </a>
              <span className="text-slate-300">•</span>
              <a href={`mailto:${formData.email}`} className="hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                <span>✉️</span> {formData.email}
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span>🕐</span>
              {formatDate(lead.createdAt)}
            </p>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap gap-2">
            {leadStatusOptions.map((status) => (
              <StatusPill
                key={status}
                status={status}
                active={lead.status === status}
                onClick={() => onStatusChange(lead.id, status)}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
          <div>
            <span className="text-xs text-slate-400 block mb-1">🚗 Vehicle</span>
            <p className="font-semibold text-slate-700">{vehicleLabel[formData.vehicleType] || formData.vehicleType}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-1">💰 Budget</span>
            <p className="font-semibold text-slate-700">{getBudgetDisplay()}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-1">📊 Credit</span>
            <p className="font-semibold text-slate-700">
              {formData.paymentType === 'finance'
                ? (formData.creditRating || 'N/A').charAt(0).toUpperCase() + (formData.creditRating || '').slice(1)
                : 'Cash Buyer'}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-1">🔄 Trade-In</span>
            <p className="font-semibold text-slate-700">
              {formData.tradeIn === 'yes'
                ? `${formData.tradeInYear} ${formData.tradeInMake}`
                : formData.tradeIn === 'unsure'
                ? 'Maybe'
                : 'No'}
            </p>
          </div>
        </div>

        {/* Dead Reason */}
        {lead.status === 'dead' && (
          <div className="mb-4">
            <Select
              label="Reason Closed"
              options={deadReasonOptions.map((o) => ({ value: o.value, label: o.label }))}
              value={lead.deadReason || ''}
              onChange={(e) => onDeadReasonChange(lead.id, e.target.value)}
              placeholder="Select reason..."
            />
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.cosigner === 'yes' && (
            <span className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium">
              👥 Has Cosigner
            </span>
          )}
          {lead.driversLicenseKey && (
            <button
              onClick={onViewLicense}
              className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium hover:bg-green-200 transition-colors"
            >
              📄 View License
            </button>
          )}
          <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full font-medium">
            🪪 {formData.licenseClass.toUpperCase()}
          </span>
          <span className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-medium">
            ⏰ {formData.bestTimeToReach}
          </span>
        </div>

        {/* Notes */}
        <div className="border-t border-slate-100 pt-4">
          {editingNotes?.id === lead.id ? (
            <div className="space-y-3">
              <Textarea
                label="Notes"
                value={editingNotes.notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={3}
                placeholder="Add notes about this lead..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onNotesSave(lead.id, editingNotes.notes)}
                >
                  💾 Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onNotesCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => onNotesEdit(lead.id, lead.notes)}
              className="cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border-2 border-transparent hover:border-blue-200"
            >
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                <span>📝</span> Notes (click to edit)
              </p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {lead.notes || <span className="text-slate-400 italic">No notes yet...</span>}
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
