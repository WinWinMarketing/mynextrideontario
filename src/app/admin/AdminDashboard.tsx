'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Select, Textarea, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions } from '@/lib/validation';
import { formatDate, formatMonthYear } from '@/lib/utils';

interface AdminDashboardProps {
  onLogout: () => void;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  working: { label: 'Working', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  hot: { label: 'Hot', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  'circle-back': { label: 'Circle Back', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  'no-contact': { label: 'No Contact', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  dead: { label: 'Closed', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-300' },
};

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<'leads' | 'settings'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [licenseModal, setLicenseModal] = useState<{ url: string; name: string } | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  
  // Settings
  const [emailSettings, setEmailSettings] = useState({
    recipientEmail: '',
    fromName: 'My Next Ride Ontario',
    enabled: true,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

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
        if (data.settings) setEmailSettings(data.settings);
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
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings),
      });
      setSettingsMessage(response.ok ? 'Settings saved' : 'Failed to save');
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch {
      setSettingsMessage('Error saving settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, status }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateDeadReason = async (leadId: string, deadReason: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, deadReason }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deadReason: deadReason as Lead['deadReason'] } : l));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveNotes = async (leadId: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, notes: notesValue }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: notesValue } : l));
      setEditingNotes(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const viewLicense = async (lead: Lead) => {
    if (!lead.driversLicenseKey) return;
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}/license-url?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setLicenseModal({ url: data.url, name: lead.formData.fullName });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredLeads = leads
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .sort((a, b) => {
      if (a.status === 'dead' && b.status !== 'dead') return 1;
      if (a.status !== 'dead' && b.status === 'dead') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    hot: leads.filter(l => l.status === 'hot').length,
    working: leads.filter(l => l.status === 'working').length,
    approved: leads.filter(l => l.status === 'approved').length,
  };

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
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Lead Management</h1>
              <p className="text-xs text-slate-500">My Next Ride Ontario</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('leads')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'leads' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leads
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Settings
            </button>
          </nav>

          <button
            onClick={onLogout}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 flex">
        {activeView === 'leads' && (
          /* Sidebar Filters */
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 p-5 overflow-y-auto">
            <div className="space-y-6">
              {/* Date Filters */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Time Period
                </label>
                <div className="space-y-2">
                  <Select
                    options={monthOptions}
                    value={String(selectedMonth)}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  />
                  <Select
                    options={yearOptions}
                    value={String(selectedYear)}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Status Filter
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      statusFilter === 'all' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Leads ({stats.total})
                  </button>
                  {leadStatusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                        statusFilter === status ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{STATUS_CONFIG[status].label}</span>
                      <span className="text-xs text-slate-400">
                        {leads.filter(l => l.status === status).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Quick Stats
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'New', value: stats.new, color: 'bg-blue-500' },
                    { label: 'Hot', value: stats.hot, color: 'bg-red-500' },
                    { label: 'Working', value: stats.working, color: 'bg-amber-500' },
                    { label: 'Approved', value: stats.approved, color: 'bg-green-500' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchLeads}
                className="w-full py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </aside>
        )}

        {/* Main Area */}
        <main className={`flex-1 ${activeView === 'leads' ? 'ml-64' : ''} p-6`}>
          <AnimatePresence mode="wait">
            {activeView === 'leads' ? (
              <motion.div
                key="leads"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {formatMonthYear(new Date(selectedYear, selectedMonth - 1, 1))}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} 
                      {statusFilter !== 'all' && ` · Filtered by ${STATUS_CONFIG[statusFilter].label}`}
                    </p>
                  </div>
                </div>

                {/* Leads List */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                    <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-700 mb-1">No leads found</h3>
                    <p className="text-slate-500">New applications will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLeads.map((lead) => (
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        isExpanded={expandedLead === lead.id}
                        onToggle={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                        onStatusChange={updateLeadStatus}
                        onDeadReasonChange={updateDeadReason}
                        onViewLicense={() => viewLicense(lead)}
                        editingNotes={editingNotes}
                        notesValue={notesValue}
                        onStartEditNotes={(id, notes) => { setEditingNotes(id); setNotesValue(notes); }}
                        onNotesChange={setNotesValue}
                        onSaveNotes={saveNotes}
                        onCancelNotes={() => setEditingNotes(null)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">Email Notifications</h2>
                  
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Enable Notifications</p>
                        <p className="text-sm text-slate-500">Receive email when new leads come in</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailSettings.enabled}
                          onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <Input
                      label="Notification Email"
                      type="email"
                      value={emailSettings.recipientEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, recipientEmail: e.target.value })}
                      placeholder="your@email.com"
                    />

                    <Input
                      label="From Name"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                      placeholder="My Next Ride Ontario"
                    />

                    {settingsMessage && (
                      <p className={`text-sm ${settingsMessage.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>
                        {settingsMessage}
                      </p>
                    )}

                    <Button
                      variant="primary"
                      onClick={saveSettings}
                      isLoading={settingsSaving}
                      className="w-full"
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* License Modal */}
      <Modal
        isOpen={!!licenseModal}
        onClose={() => setLicenseModal(null)}
        title={`License - ${licenseModal?.name}`}
        size="lg"
      >
        {licenseModal && (
          <div className="space-y-4">
            <img src={licenseModal.url} alt="Driver's License" className="w-full rounded-lg" />
            <div className="flex gap-3">
              <a href={licenseModal.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="primary" className="w-full">Open Full Size</Button>
              </a>
              <a href={licenseModal.url} download className="flex-1">
                <Button variant="secondary" className="w-full">Download</Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Lead Row Component
interface LeadRowProps {
  lead: Lead;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDeadReasonChange: (id: string, reason: string) => void;
  onViewLicense: () => void;
  editingNotes: string | null;
  notesValue: string;
  onStartEditNotes: (id: string, notes: string) => void;
  onNotesChange: (notes: string) => void;
  onSaveNotes: (id: string) => void;
  onCancelNotes: () => void;
}

function LeadRow({
  lead,
  isExpanded,
  onToggle,
  onStatusChange,
  onDeadReasonChange,
  onViewLicense,
  editingNotes,
  notesValue,
  onStartEditNotes,
  onNotesChange,
  onSaveNotes,
  onCancelNotes,
}: LeadRowProps) {
  const { formData } = lead;
  const config = STATUS_CONFIG[lead.status];

  const getBudget = () => {
    if (formData.paymentType === 'finance') {
      const map: Record<string, string> = { '400-or-less': '≤$400/mo', '400-500': '$400-500/mo', '500-600': '$500-600/mo', '600-plus': '$600+/mo' };
      return map[formData.financeBudget || ''] || 'N/A';
    }
    const map: Record<string, string> = { '15k-or-less': '≤$15k', '20-30k': '$20-30k', '30-45k': '$30-45k', '50k-plus': '$50k+' };
    return map[formData.cashBudget || ''] || 'N/A';
  };

  const vehicleTypes: Record<string, string> = {
    sedan: 'Sedan', suv: 'SUV', hatchback: 'Hatchback', 'coupe-convertible': 'Coupe', truck: 'Truck', minivan: 'Minivan'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Main Row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900 truncate">{formData.fullName}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${config.bg} ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
            <span>{formData.phone}</span>
            <span className="text-slate-300">·</span>
            <span>{vehicleTypes[formData.vehicleType]} · {getBudget()}</span>
            <span className="text-slate-300">·</span>
            <span>{formatDate(lead.createdAt)}</span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 p-4 bg-slate-50">
              {/* Status Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {leadStatusOptions.map(status => (
                  <button
                    key={status}
                    onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, status); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                      lead.status === status
                        ? `${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color}`
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {STATUS_CONFIG[status].label}
                  </button>
                ))}
              </div>

              {/* Dead Reason */}
              {lead.status === 'dead' && (
                <div className="mb-4">
                  <Select
                    label="Closed Reason"
                    options={deadReasonOptions.map(o => ({ value: o.value, label: o.label }))}
                    value={lead.deadReason || ''}
                    onChange={(e) => onDeadReasonChange(lead.id, e.target.value)}
                    placeholder="Select reason..."
                  />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <a href={`mailto:${formData.email}`} className="text-sm text-primary-600 hover:underline">{formData.email}</a>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Credit</p>
                  <p className="text-sm text-slate-800">
                    {formData.paymentType === 'finance' ? (formData.creditRating || 'N/A').charAt(0).toUpperCase() + (formData.creditRating || '').slice(1) : 'Cash Buyer'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Trade-In</p>
                  <p className="text-sm text-slate-800">
                    {formData.tradeIn === 'yes' ? `${formData.tradeInYear} ${formData.tradeInMake}` : formData.tradeIn === 'unsure' ? 'Maybe' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">License</p>
                  <p className="text-sm text-slate-800">{formData.licenseClass.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Best Time</p>
                  <p className="text-sm text-slate-800">{formData.bestTimeToReach}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">DOB</p>
                  <p className="text-sm text-slate-800">{formData.dateOfBirth}</p>
                </div>
                {formData.cosigner === 'yes' && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Cosigner</p>
                    <p className="text-sm text-slate-800">{formData.cosignerFullName} · {formData.cosignerPhone}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mb-4">
                {lead.driversLicenseKey && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewLicense(); }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View License
                  </button>
                )}
                <a href={`tel:${formData.phone}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Call
                </a>
                <a href={`mailto:${formData.email}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Email
                </a>
              </div>

              {/* Notes */}
              <div className="border-t border-slate-200 pt-4">
                {editingNotes === lead.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => onNotesChange(e.target.value)}
                      rows={3}
                      placeholder="Add notes..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => onSaveNotes(lead.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={onCancelNotes}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={(e) => { e.stopPropagation(); onStartEditNotes(lead.id, lead.notes); }}
                    className="p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
                  >
                    <p className="text-xs text-slate-500 mb-1">Notes (click to edit)</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {lead.notes || <span className="text-slate-400 italic">No notes</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
