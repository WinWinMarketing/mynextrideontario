'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Select, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions, ShowcaseVehicle, LeadInteractionType } from '@/lib/validation';
import { formatDate, formatMonthYear } from '@/lib/utils';
import { DEFAULT_TEMPLATES, EmailTemplate } from '@/lib/email';
import { Logo } from '@/components/Logo';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'leads' | 'templates' | 'showcase' | 'analytics';

type EmailAlert = {
  id: string;
  to: string;
  subject: string;
  timestamp: string;
  error?: string;
  type: 'admin-notification' | 'client';
};

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analyticsLeads, setAnalyticsLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [analyticsRangeMonths, setAnalyticsRangeMonths] = useState(3);
  const [analyticsGrouping, setAnalyticsGrouping] = useState<'weekly' | 'monthly'>('weekly');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [starredLeads, setStarredLeads] = useState<Set<string>>(new Set());
  const [licenseUrls, setLicenseUrls] = useState<Record<string, string>>({});
  const [detailModal, setDetailModal] = useState<Lead | null>(null);
  const [emailModal, setEmailModal] = useState<{ lead: Lead } | null>(null);
  const [emailAlerts, setEmailAlerts] = useState<EmailAlert[]>([]);
  const [templates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [showcase, setShowcase] = useState<ShowcaseVehicle[]>([]);
  const [showcaseEnabled, setShowcaseEnabled] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const fetchedLeads = data.leads || [];
        setLeads(fetchedLeads);
        setIsLoading(false);
        
        const urlPromises = fetchedLeads
          .filter((l: Lead) => l.driversLicenseKey)
          .map(async (l: Lead) => {
            try {
              const res = await fetch(`/api/admin/leads/${l.id}/license-url?key=${encodeURIComponent(l.driversLicenseKey!)}`);
              if (res.ok) {
                const { url } = await res.json();
                return { id: l.id, url };
              }
            } catch (e) { console.error(e); }
            return null;
          });
        const results = await Promise.all(urlPromises);
        const urlMap: Record<string, string> = {};
        results.forEach(r => r && (urlMap[r.id] = r.url));
        setLicenseUrls(urlMap);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  const fetchShowcase = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/showcase');
      if (res.ok) {
        const data = await res.json();
        setShowcase(data.vehicles || []);
        setShowcaseEnabled(data.settings?.enabled !== false);
      }
    } catch (e) { console.error('Error fetching showcase:', e); }
  }, []);

  const fetchEmailAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/email-logs?limit=20');
      if (res.ok) {
        const data = await res.json();
        setEmailAlerts(data.failures || []);
      }
    } catch (e) {
      console.error('Error fetching email alerts:', e);
    }
  }, []);

  const fetchAnalyticsLeads = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}&rangeMonths=${analyticsRangeMonths}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsLeads(data.leads || []);
      }
    } catch (e) {
      console.error('Error fetching analytics leads:', e);
    }
  }, [selectedYear, selectedMonth, analyticsRangeMonths]);

  useEffect(() => {
    fetchLeads();
    fetchShowcase();
    fetchEmailAlerts();
    
    // Industry-standard polling - 30 seconds to balance real-time with bandwidth
    const pollInterval = setInterval(() => {
      fetchLeads();
      fetchEmailAlerts();
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, [fetchLeads, fetchShowcase, fetchEmailAlerts]);
  
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsLeads();
    }
  }, [activeTab, fetchAnalyticsLeads, selectedYear, selectedMonth, analyticsRangeMonths]);

  const updateStatus = async (leadId: string, status: LeadStatus, deadReason?: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status, deadReason: deadReason as any } : l));
    setDetailModal(prev => prev && prev.id === leadId ? { ...prev, status, deadReason: deadReason as any } : prev);
    
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, status, deadReason }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
          setDetailModal(prev => prev && prev.id === leadId ? data.lead : prev);
        }
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const saveNotes = async (leadId: string, notes: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l));
    setDetailModal(prev => prev && prev.id === leadId ? { ...prev, notes } : prev);
    
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
          setDetailModal(prev => prev && prev.id === leadId ? data.lead : prev);
        }
      }
    } catch (e) { console.error('Error saving notes:', e); }
  };

  const logInteraction = async (leadId: string, type: LeadInteractionType, note?: string) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, interaction: { type, note } }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
          setDetailModal(prev => prev && prev.id === leadId ? data.lead : prev);
        }
      }
    } catch (e) { console.error('Error logging interaction:', e); }
  };

  const toggleStar = (id: string) => {
    setStarredLeads(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const deleteShowcaseVehicle = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/showcase?id=${id}`, { method: 'DELETE' });
      if (res.ok) setShowcase(prev => prev.filter(v => v.id !== id));
    } catch (e) { console.error('Error deleting vehicle:', e); }
  };

  const toggleShowcaseEnabled = async () => {
    const newEnabled = !showcaseEnabled;
    try {
      const res = await fetch('/api/admin/showcase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (res.ok) setShowcaseEnabled(newEnabled);
    } catch (e) { console.error('Error toggling showcase:', e); }
  };

  const filteredLeads = leads
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .sort((a, b) => {
      if (starredLeads.has(a.id) && !starredLeads.has(b.id)) return -1;
      if (!starredLeads.has(a.id) && starredLeads.has(b.id)) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    working: leads.filter(l => l.status === 'working').length,
    circleBack: leads.filter(l => l.status === 'circle-back').length,
    approval: leads.filter(l => l.status === 'approval').length,
    dead: leads.filter(l => l.status === 'dead').length,
  };

  const analytics = {
    conversionRate: stats.total > 0 ? Math.round((stats.approval / stats.total) * 100) : 0,
    deadRate: stats.total > 0 ? Math.round((stats.dead / stats.total) * 100) : 0,
    activeRate: stats.total > 0 ? Math.round(((stats.working + stats.circleBack) / stats.total) * 100) : 0,
    deadReasons: deadReasonOptions.map(r => ({
      ...r,
      count: leads.filter(l => l.status === 'dead' && l.deadReason === r.value).length,
    })).filter(r => r.count > 0),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50">
        <div className="p-6 border-b border-slate-200">
          <Logo size="sm" />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">Admin Dashboard</p>
            <div className="flex items-center gap-1.5" title="Auto-refresh every 30 seconds">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Overview', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { id: 'leads', label: 'Leads', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
            { id: 'analytics', label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
            { id: 'templates', label: 'Email Templates', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
            { id: 'showcase', label: 'Vehicle Showcase', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <DashboardView key="dash" stats={stats} analytics={analytics} emailAlerts={emailAlerts} onNav={setActiveTab} />}
          {activeTab === 'leads' && (
            <LeadsView
              key="leads"
              leads={filteredLeads}
              isLoading={isLoading}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              statusFilter={statusFilter}
              licenseUrls={licenseUrls}
              starredLeads={starredLeads}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              onFilterChange={setStatusFilter}
              onToggleStar={toggleStar}
              onStatusChange={updateStatus}
              onViewDetails={setDetailModal}
              onSendEmail={(lead: Lead) => setEmailModal({ lead })}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsView
              key="analytics"
              leads={analyticsLeads.length ? analyticsLeads : leads}
              rangeMonths={analyticsRangeMonths}
              grouping={analyticsGrouping}
              onRangeChange={setAnalyticsRangeMonths}
              onGroupingChange={setAnalyticsGrouping}
            />
          )}
          {activeTab === 'templates' && <TemplatesView key="templates" templates={templates} />}
          {activeTab === 'showcase' && (
            <ShowcaseView
              key="showcase"
              vehicles={showcase}
              enabled={showcaseEnabled}
              onToggle={toggleShowcaseEnabled}
              onDelete={deleteShowcaseVehicle}
            />
          )}
        </AnimatePresence>
      </main>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="" size="full">
        {detailModal && (
          <LeadDetailPopup
            lead={detailModal}
            licenseUrl={licenseUrls[detailModal.id]}
            onStatusChange={updateStatus}
            onSaveNotes={saveNotes}
            onClose={() => setDetailModal(null)}
            onSendEmail={() => { setDetailModal(null); setEmailModal({ lead: detailModal }); }}
            onLogInteraction={(type: LeadInteractionType, note?: string) => logInteraction(detailModal.id, type, note)}
          />
        )}
      </Modal>

      <Modal isOpen={!!emailModal} onClose={() => setEmailModal(null)} title="Send Email" size="lg">
        {emailModal && (
          <EmailComposer lead={emailModal.lead} templates={templates} onClose={() => setEmailModal(null)} />
        )}
      </Modal>
    </div>
  );
}

function DashboardView({ stats, analytics, emailAlerts, onNav }: { stats: any; analytics: any; emailAlerts: EmailAlert[]; onNav: (tab: TabType) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Dashboard Overview</h1>
          <p className="text-base text-slate-600">Current month lead statistics and performance metrics</p>
        </div>

        {emailAlerts.length > 0 && (
          <div className="mb-10 bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Email Delivery Issues</h3>
                <p className="text-sm text-red-700 mb-4">{emailAlerts.length} email{emailAlerts.length > 1 ? 's' : ''} failed to send. Check AWS SES permissions.</p>
                <Button size="sm" variant="secondary" onClick={() => onNav('analytics')}>View Details</Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-10">
          {[
            { label: 'Total', value: stats.total, color: 'bg-slate-600' },
            { label: 'New', value: stats.new, color: 'bg-blue-500' },
            { label: 'Working', value: stats.working, color: 'bg-yellow-500' },
            { label: 'Follow Up', value: stats.circleBack, color: 'bg-cyan-500' },
            { label: 'Approved', value: stats.approval, color: 'bg-green-500' },
            { label: 'Dead', value: stats.dead, color: 'bg-red-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${s.color}`} />
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
              </div>
              <p className="text-4xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl p-7 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Conversion Rate</h3>
            <div className="flex items-center gap-6 mb-3">
              <p className="text-5xl font-bold text-primary-600">{analytics.conversionRate}%</p>
              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analytics.conversionRate}%` }} transition={{ duration: 1 }} className="h-full bg-primary-600 rounded-full" />
              </div>
            </div>
            <p className="text-sm text-slate-500">Leads approved for financing</p>
          </div>

          <div className="bg-white rounded-xl p-7 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Active Pipeline</h3>
            <p className="text-5xl font-bold text-emerald-600 mb-3">{analytics.activeRate}%</p>
            <p className="text-sm text-slate-500">Leads currently being worked</p>
          </div>

          <div className="bg-white rounded-xl p-7 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Dead Lead Rate</h3>
            <p className="text-5xl font-bold text-red-500 mb-3">{analytics.deadRate}%</p>
            <p className="text-sm text-slate-500">Closed without conversion</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LeadsView({ leads, isLoading, selectedMonth, selectedYear, statusFilter, licenseUrls, starredLeads, onMonthChange, onYearChange, onFilterChange, onToggleStar, onStatusChange, onViewDetails, onSendEmail }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Lead Management</h1>
            <p className="text-base text-slate-600">{leads.length} leads for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-3">
            <Select
              value={String(selectedMonth)}
              onChange={(e) => onMonthChange(parseInt(e.target.value))}
              options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString('en', { month: 'long' }) }))}
            />
            <Select
              value={String(selectedYear)}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              options={[{ value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) }]}
            />
            <Select
              value={statusFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              options={[{ value: 'all', label: 'All Statuses' }, ...leadStatusOptions]}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No leads found for this period</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {leads.map((lead: Lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                hasLicense={!!licenseUrls[lead.id]}
                isStarred={starredLeads.has(lead.id)}
                onToggleStar={() => onToggleStar(lead.id)}
                onViewDetails={() => onViewDetails(lead)}
                onSendEmail={() => onSendEmail(lead)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LeadCard({ lead, hasLicense, isStarred, onToggleStar, onViewDetails, onSendEmail }: any) {
  const { formData } = lead;
  const statusColors: Record<string, string> = {
    'new': 'bg-blue-100 text-blue-700 border-blue-200',
    'working': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'circle-back': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'approval': 'bg-green-100 text-green-700 border-green-200',
    'dead': 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className={`bg-white rounded-lg p-5 border-2 shadow-sm hover:shadow-md transition-all ${isStarred ? 'border-yellow-400' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate mb-2">{formData.fullName}</h3>
          <span className={`inline-block text-xs font-medium px-3 py-1 rounded border ${statusColors[lead.status]}`}>
            {leadStatusOptions.find(s => s.value === lead.status)?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasLicense && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">License</span>
          )}
          <button onClick={onToggleStar} className="text-xl hover:scale-110 transition-transform">
            {isStarred ? '★' : '☆'}
          </button>
        </div>
      </div>
      
      <div className="space-y-2 mb-4 text-sm text-slate-600">
        <p className="truncate">{formData.phone}</p>
        <p className="truncate">{formData.email}</p>
        <p className="text-xs text-slate-500 mt-2">{formData.vehicleType} • {formData.paymentType}</p>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={onViewDetails} className="flex-1">
          View Details
        </Button>
        <Button size="sm" variant="secondary" onClick={onSendEmail}>
          Email
        </Button>
      </div>
    </div>
  );
}

function AnalyticsView({ leads, rangeMonths, grouping, onRangeChange, onGroupingChange }: any) {
  const stats = {
    total: leads.length,
    new: leads.filter((l: Lead) => l.status === 'new').length,
    working: leads.filter((l: Lead) => l.status === 'working').length,
    circleBack: leads.filter((l: Lead) => l.status === 'circle-back').length,
    approval: leads.filter((l: Lead) => l.status === 'approval').length,
    dead: leads.filter((l: Lead) => l.status === 'dead').length,
  };

  const getWeekKey = (d: Date) => {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const dayOfYear = ((d.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1;
    const week = Math.ceil(dayOfYear / 7);
    return `W${String(week).padStart(2, '0')}`;
  };

  const buildBuckets = (list: Lead[], mode: 'weekly' | 'monthly') => {
    const map = new Map<string, { count: number; label: string; date: Date }>();
    list.forEach((lead) => {
      const d = new Date(lead.createdAt);
      const key = mode === 'monthly'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : getWeekKey(d);
      const label = mode === 'monthly'
        ? d.toLocaleDateString('en', { month: 'short' })
        : key;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { count: 1, label, date: d });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const buckets = buildBuckets(leads, grouping);
  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  const totals = leads.reduce((acc: any, lead: Lead) => {
    const interactions = lead.interactions || [];
    acc.totalInteractions += interactions.length;
    interactions.forEach((i) => {
      if (i.type === 'call') acc.calls += 1;
      if (i.type === 'message') acc.messages += 1;
      if (i.type === 'email') acc.emails += 1;
      if (i.type === 'follow-up') acc.followUps += 1;
    });
    if (lead.closedAt) {
      const days = (new Date(lead.closedAt).getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      acc.closures.push(days);
    }
    const firstInt = interactions[0];
    if (firstInt) {
      const hours = (new Date(firstInt.createdAt).getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
      acc.firstResponse.push(hours);
    }
    return acc;
  }, { calls: 0, messages: 0, emails: 0, followUps: 0, totalInteractions: 0, closures: [], firstResponse: [] });

  const avgInteractions = leads.length ? (totals.totalInteractions / leads.length).toFixed(1) : '0';
  const avgDaysToClose = totals.closures.length ? Math.round(totals.closures.reduce((a: number, b: number) => a + b, 0) / totals.closures.length) : 0;
  const avgResponseHours = totals.firstResponse.length ? (totals.firstResponse.reduce((a: number, b: number) => a + b, 0) / totals.firstResponse.length).toFixed(1) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Analytics & Insights</h1>
            <p className="text-base text-slate-600">Performance metrics and lead trends</p>
          </div>
          <div className="flex gap-3">
            <Select
              value={String(rangeMonths)}
              onChange={(e) => onRangeChange(parseInt(e.target.value))}
              options={[
                { value: '1', label: 'Current Month' },
                { value: '3', label: 'Last 3 Months' },
                { value: '6', label: 'Last 6 Months' },
                { value: '12', label: 'Last 12 Months' },
              ]}
            />
            <Select
              value={grouping}
              onChange={(e) => onGroupingChange(e.target.value)}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-7 text-white shadow-sm">
            <p className="text-blue-100 text-sm mb-3">Total Leads</p>
            <p className="text-5xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-7 text-white shadow-sm">
            <p className="text-emerald-100 text-sm mb-3">Avg Interactions</p>
            <p className="text-5xl font-bold">{avgInteractions}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-7 text-white shadow-sm">
            <p className="text-indigo-100 text-sm mb-3">Avg Days to Close</p>
            <p className="text-5xl font-bold">{avgDaysToClose}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-7 text-white shadow-sm">
            <p className="text-orange-100 text-sm mb-3">First Response</p>
            <p className="text-5xl font-bold">{avgResponseHours !== null ? `${avgResponseHours}h` : '—'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-10 border border-slate-200 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Lead Volume</h3>
              <p className="text-sm text-slate-500">{grouping === 'weekly' ? 'Weekly' : 'Monthly'} breakdown</p>
            </div>
            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded">Peak: {maxCount}</span>
          </div>
          
          {buckets.length === 0 ? (
            <p className="text-center text-slate-400 py-12">No data available for selected range</p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-end gap-2 h-64">
                {buckets.map((bucket) => (
                  <div key={bucket.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-full flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-primary-600 to-primary-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${(bucket.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{bucket.label}</span>
                    <span className="text-sm font-bold text-slate-900">{bucket.count}</span>
                  </div>
                ))}
              </div>
              
              {buckets.length > 1 && (
                <div className="pt-4 border-t border-slate-200">
                  <svg viewBox="0 0 100 40" className="w-full h-20" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={buckets.map((b, idx) => {
                        const x = (idx / (buckets.length - 1)) * 100;
                        const y = 40 - (b.count / maxCount) * 35;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {buckets.map((b, idx) => {
                      const x = (idx / (buckets.length - 1)) * 100;
                      const y = 40 - (b.count / maxCount) * 35;
                      return <circle key={idx} cx={x} cy={y} r="3" fill="#3b82f6" stroke="#fff" strokeWidth="2" />;
                    })}
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: 'Calls Logged', value: totals.calls },
            { label: 'Messages Sent', value: totals.messages },
            { label: 'Emails Sent', value: totals.emails },
            { label: 'Follow Ups', value: totals.followUps },
          ].map(metric => (
            <div key={metric.label} className="bg-white rounded-xl p-7 border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 mb-3 font-medium">{metric.label}</p>
              <p className="text-4xl font-bold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TemplatesView({ templates }: { templates: EmailTemplate[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">Email Templates</h1>
          <p className="text-base text-slate-600">{templates.length} pre-built templates available for quick responses</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Template List */}
          <div className="lg:col-span-1 space-y-3">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                  selectedTemplate?.id === t.id
                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <h3 className="font-semibold text-slate-900 mb-1">{t.name}</h3>
                <p className="text-xs text-slate-500">{t.category}</p>
              </button>
            ))}
          </div>

          {/* Template Preview */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedTemplate.name}</h2>
                  <p className="text-sm text-slate-500 uppercase tracking-wide">{selectedTemplate.category} Template</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Subject Line</label>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-medium text-slate-900">{selectedTemplate.subject}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Message Body</label>
                    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selectedTemplate.body}</pre>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800">
                      <strong>Available variables:</strong> {'{'}name{'}'}, {'{'}vehicle{'}'}, {'{'}budget{'}'}, {'{'}credit{'}'}, {'{'}urgency{'}'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-20 text-center">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-500">Select a template to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ShowcaseView({ vehicles, enabled, onToggle, onDelete }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3">Vehicle Showcase</h1>
            <p className="text-base text-slate-600">{vehicles.length} vehicles • Auto-updates every 30 seconds</p>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium text-slate-600">Visible on Homepage</span>
              <button onClick={onToggle} className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
        
        {!enabled && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded p-4 mb-8">
            <p className="text-sm text-amber-800 font-medium">Showcase is currently hidden from the homepage</p>
          </div>
        )}
        
        {vehicles.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No vehicles in showcase</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map((v: ShowcaseVehicle) => (
              <div key={v.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-slate-100">
                  {v.imageUrl ? (
                    <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{v.year} {v.make} {v.model}</h3>
                  {v.price && <p className="text-md font-semibold text-primary-600 mb-3">{v.price}</p>}
                  <button onClick={() => onDelete(v.id)} className="text-sm text-red-600 hover:text-red-800 font-medium">
                    Remove from showcase
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LeadDetailPopup({ lead, licenseUrl, onStatusChange, onSaveNotes, onClose, onSendEmail, onLogInteraction }: any) {
  const { formData } = lead;
  const [notes, setNotes] = useState(lead.notes || '');
  const [deadReason, setDeadReason] = useState(lead.deadReason || '');
  
  const defaultFollowUp = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };
  const [followUpAt, setFollowUpAt] = useState(defaultFollowUp());
  const [interactionNote, setInteractionNote] = useState('');

  const followUpDate = followUpAt ? new Date(followUpAt) : null;
  const formatCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const googleCalLink = followUpDate
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Follow up with ${formData.fullName}`)}&dates=${formatCalDate(followUpDate)}/${formatCalDate(new Date(followUpDate.getTime() + 30 * 60000))}&details=${encodeURIComponent(`Phone: ${formData.phone}\nEmail: ${formData.email}`)}`
    : '#';

  const downloadAppleCal = () => {
    if (!followUpDate) return;
    const end = new Date(followUpDate.getTime() + 30 * 60000);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatCalDate(followUpDate)}`,
      `DTEND:${formatCalDate(end)}`,
      `SUMMARY:Follow up with ${formData.fullName}`,
      `DESCRIPTION:Phone: ${formData.phone}\\nEmail: ${formData.email}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `follow-up-${lead.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeline = [
    ...(lead.statusHistory || []).map((s: any) => ({
      at: s.changedAt,
      label: `Status changed to ${leadStatusOptions.find(l => l.value === s.status)?.label || s.status}`,
      note: s.deadReason || s.note,
      type: 'status',
    })),
    ...(lead.interactions || []).map((i: any) => ({
      at: i.createdAt,
      label: i.type.charAt(0).toUpperCase() + i.type.slice(1).replace('-', ' '),
      note: i.note,
      type: i.type,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{formData.fullName}</h1>
          <p className="text-sm text-slate-500">{formatDate(lead.createdAt)}</p>
        </div>
        <div className="flex gap-3">
          <a href={`tel:${formData.phone}`}>
            <Button size="md">Call</Button>
          </a>
          <Button size="md" variant="secondary" onClick={onSendEmail}>Email</Button>
          <Button size="md" variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50 rounded-lg p-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Contact Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Phone</span>
              <span className="font-semibold text-slate-900">{formData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-900 truncate ml-4">{formData.email}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Vehicle Preferences</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="font-semibold text-slate-900 capitalize">{formData.vehicleType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Budget</span>
              <span className="font-semibold text-slate-900">{formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}</span>
            </div>
          </div>
        </div>
      </div>

      {licenseUrl && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Driver's License</h3>
          <img src={licenseUrl} alt="License" className="w-full max-w-lg rounded-lg shadow-lg border border-slate-200" />
        </div>
      )}

      <div className="bg-slate-50 rounded-lg p-6 mb-8">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Status</h3>
        <div className="grid grid-cols-5 gap-3 mb-5">
          {leadStatusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(lead.id, opt.value)}
              className={`py-3 px-3 rounded-lg text-sm font-medium transition-all ${
                lead.status === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {lead.status === 'dead' && (
          <Select
            label="Reason"
            value={deadReason}
            onChange={(e) => { setDeadReason(e.target.value); onStatusChange(lead.id, 'dead', e.target.value); }}
            options={[{ value: '', label: 'Select reason...' }, ...deadReasonOptions]}
          />
        )}
      </div>

      <div className="bg-white rounded-lg p-6 border border-slate-200 mb-8">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Calendar Follow-Up</h3>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <Input
              label="Follow-up time"
              type="datetime-local"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
            />
          </div>
          <Button
            size="md"
            variant="secondary"
            disabled={!followUpDate}
            onClick={() => followUpDate && window.open(googleCalLink, '_blank')}
            className="w-full h-[46px]"
          >
            Add to Google
          </Button>
          <Button
            size="md"
            variant="primary"
            disabled={!followUpDate}
            onClick={downloadAppleCal}
            className="w-full h-[46px]"
          >
            Add to Apple/iCal
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-4">Automatically includes lead name, phone, and email</p>
      </div>

      <div className="bg-slate-50 rounded-lg p-6 mb-8">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Activity Timeline</h3>
        <div className="flex gap-3 mb-5 flex-wrap">
          {[
            { label: 'Call', type: 'call' },
            { label: 'Message', type: 'message' },
            { label: 'Email', type: 'email' },
            { label: 'Follow Up', type: 'follow-up' },
          ].map(btn => (
            <Button
              key={btn.type}
              size="sm"
              variant="secondary"
              onClick={() => {
                onLogInteraction?.(btn.type, interactionNote || undefined);
                setInteractionNote('');
              }}
            >
              Log {btn.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-3 mb-5">
          <textarea
            value={interactionNote}
            onChange={(e) => setInteractionNote(e.target.value)}
            placeholder="Add note for this interaction..."
            className="flex-1 p-4 rounded-lg border border-slate-200 focus:border-primary-500 outline-none resize-none text-sm"
            rows={3}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!interactionNote.trim()) return;
              onLogInteraction?.('note', interactionNote.trim());
              setInteractionNote('');
            }}
            className="self-end"
          >
            Add Note
          </Button>
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No activity logged</p>
          ) : timeline.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 mb-1">{item.label}</p>
                {item.note && <p className="text-xs text-slate-500">{item.note}</p>}
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(item.at)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">Internal Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add internal notes about this lead..."
          className="w-full h-32 p-4 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none text-sm"
        />
        <div className="mt-4 flex justify-end">
          <Button size="md" onClick={() => onSaveNotes(lead.id, notes)}>
            Save Notes
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmailComposer({ lead, templates, onClose }: { lead: Lead; templates: EmailTemplate[]; onClose: () => void }) {
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const applyTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) {
      const formattedVehicle = lead.formData.vehicleType || 'vehicle';
      const formattedBudget = lead.formData.paymentType === 'finance'
        ? (lead.formData.financeBudget || '[budget not specified]')
        : (lead.formData.cashBudget || '[budget not specified]');
      const formattedCredit = lead.formData.creditRating || '[not provided]';
      const formattedUrgency = lead.formData.urgency || '[timing not specified]';
      
      const vars: Record<string, string> = {
        '{{name}}': lead.formData.fullName || '[name]',
        '{{vehicle}}': formattedVehicle,
        '{{budget}}': formattedBudget,
        '{{credit}}': formattedCredit,
        '{{urgency}}': formattedUrgency,
      };
      
      let s = t.subject, b = t.body;
      Object.entries(vars).forEach(([k, v]) => {
        const pattern = new RegExp(k.replace(/[{}]/g, '\\$&'), 'g');
        s = s.replace(pattern, v);
        b = b.replace(pattern, v);
      });
      setSubject(s);
      setBody(b);
    }
    setTemplateId(id);
  };

  const send = async () => {
    if (!subject || !body) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: lead.formData.email, toName: lead.formData.fullName, subject, body, leadId: lead.id }),
      });
      if (res.ok) setSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (sent) return (
    <div className="text-center py-16">
      <svg className="w-20 h-20 text-green-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">Email Sent Successfully</h3>
      <p className="text-base text-slate-600 mb-8">Your message has been delivered to the lead.</p>
      <Button size="md" onClick={onClose}>Close</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-lg p-5">
        <p className="text-sm">
          <span className="text-slate-500">To:</span> <strong className="text-slate-900">{lead.formData.fullName}</strong> <span className="text-slate-400">({lead.formData.email})</span>
        </p>
      </div>
      <Select
        label="Email Template"
        options={[{ value: '', label: 'Choose a template...' }, ...templates.map((t: EmailTemplate) => ({ value: t.id, label: t.name }))]}
        value={templateId}
        onChange={(e) => applyTemplate(e.target.value)}
      />
      <Input label="Subject Line" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">Message Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full p-4 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none text-sm"
          placeholder="Type your message here..."
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button size="md" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="md" onClick={send} isLoading={sending} disabled={!subject || !body}>Send Email</Button>
      </div>
    </div>
  );
}

