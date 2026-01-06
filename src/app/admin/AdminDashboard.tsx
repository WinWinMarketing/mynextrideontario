'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Select, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions, LeadInteractionType } from '@/lib/validation';
import { formatDate } from '@/lib/utils';
import { DEFAULT_TEMPLATES, EmailTemplate } from '@/lib/email';
import { Logo } from '@/components/Logo';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'leads' | 'templates' | 'analytics';

type EmailAlert = {
  id: string;
  to: string;
  subject: string;
  timestamp: string;
  error?: string;
  type: 'admin-notification' | 'client';
};

// Data refresh timing

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

  // Consolidated fetch function - avoids duplicate code
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

  // Industry-standard polling with abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWithAbort = useCallback(async (signal: AbortSignal) => {
    try {
      setIsRefreshing(true);
      const [leadsRes, alertsRes] = await Promise.all([
        fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}`, { signal, cache: 'no-store' }),
        fetch('/api/admin/email-logs?limit=20', { signal }),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        const fetchedLeads = data.leads || [];
        setLeads(fetchedLeads);
        setLastUpdated(new Date());
        
        // Fetch license URLs in parallel
        const urlPromises = fetchedLeads
          .filter((l: Lead) => l.driversLicenseKey)
          .map(async (l: Lead) => {
            try {
              const res = await fetch(`/api/admin/leads/${l.id}/license-url?key=${encodeURIComponent(l.driversLicenseKey!)}`, { signal });
              if (res.ok) {
                const { url } = await res.json();
                return { id: l.id, url };
              }
            } catch { /* ignore */ }
            return null;
          });
        const results = await Promise.all(urlPromises);
        const urlMap: Record<string, string> = {};
        results.forEach(r => r && (urlMap[r.id] = r.url));
        setLicenseUrls(urlMap);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setEmailAlerts(data.failures || []);
      }
      
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Fetch error:', err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedYear, selectedMonth]);

  // Smart visibility-based refresh - industry standard approach
  // Fetches when: tab becomes visible, initial load, or manual refresh
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    fetchWithAbort(abortControllerRef.current.signal);

    // Visibility change handler - fetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refetch if data is stale (more than 30 seconds old)
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        if (timeSinceLastFetch > 30000) {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          abortControllerRef.current = new AbortController();
          fetchWithAbort(abortControllerRef.current.signal);
        }
      }
    };

    // Window focus handler - also triggers refresh on focus
    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (timeSinceLastFetch > 30000) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        fetchWithAbort(abortControllerRef.current.signal);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Background polling as fallback (every 60 seconds when tab is visible)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        fetchWithAbort(abortControllerRef.current.signal);
      }
    }, 60000);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWithAbort]);

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    fetchWithAbort(abortControllerRef.current.signal);
  }, [fetchWithAbort]);
  
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
            <button 
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 hover:bg-slate-50 px-2 py-1 rounded transition-colors"
              title="Auto-syncs when you return to this tab • Click to refresh now"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className={`text-xs font-medium ${isRefreshing ? 'text-yellow-600' : 'text-green-600'}`}>
                {isRefreshing ? 'Syncing...' : 'Auto-sync'}
              </span>
            </button>
          </div>
          {lastUpdated && (
            <p className="text-[10px] text-slate-400 mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Overview', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { id: 'leads', label: 'Leads', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
            { id: 'analytics', label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
            { id: 'templates', label: 'Email Templates', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
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
              options={Array.from({ length: new Date().getFullYear() - 2024 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { value: String(year), label: String(year) };
              })}
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

// Interactive Chart Component with View Switcher
function ChartWithViews({ buckets, maxCount, growthRate, grouping, statusColors, stats }: {
  buckets: { count: number; label: string; date: Date; statuses: Record<string, number> }[];
  maxCount: number;
  growthRate: string | null;
  grouping: string;
  statusColors: Record<string, string>;
  stats: { total: number; new: number; working: number; circleBack: number; approval: number; dead: number };
}) {
  const [chartView, setChartView] = useState<'volume' | 'stacked' | 'trend'>('volume');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const viewOptions = [
    { id: 'volume', label: 'Volume', icon: '📊' },
    { id: 'stacked', label: 'By Status', icon: '📈' },
    { id: 'trend', label: 'Trend', icon: '📉' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
      {/* Header with View Switcher */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Lead Analytics</h3>
          <p className="text-xs text-slate-500 mt-1">{grouping === 'weekly' ? 'Weekly' : 'Monthly'} breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Switcher Buttons */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            {viewOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setChartView(opt.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  chartView === opt.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{opt.icon}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>
          {growthRate !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              Number(growthRate) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <svg className={`w-3.5 h-3.5 ${Number(growthRate) < 0 ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {Math.abs(Number(growthRate))}%
            </div>
          )}
        </div>
      </div>
      
      {buckets.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No data for selected period</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Volume View - Simple Bar Chart */}
          {chartView === 'volume' && (
            <motion.div 
              key="volume"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-end gap-2 h-48">
                {buckets.map((bucket, idx) => {
                  const heightPercent = (bucket.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}>
                      <div className="relative w-full flex justify-center mb-2">
                        <motion.span 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: hoveredPoint === idx ? 1 : 0, y: hoveredPoint === idx ? 0 : 5 }}
                          className="text-xs font-bold text-slate-700"
                        >
                          {bucket.count}
                        </motion.span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '160px' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.05 }}
                          className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-colors ${
                            hoveredPoint === idx 
                              ? 'bg-gradient-to-t from-primary-500 to-primary-300' 
                              : 'bg-gradient-to-t from-primary-600 to-primary-400'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 mt-2 truncate max-w-full">{bucket.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 px-2">
                <span>Peak: {maxCount} leads</span>
                <span>Total: {stats.total}</span>
              </div>
            </motion.div>
          )}

          {/* Stacked View - Status Breakdown */}
          {chartView === 'stacked' && (
            <motion.div 
              key="stacked"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-end gap-2 h-48">
                {buckets.map((bucket, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}>
                    <div className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden" style={{ height: '160px' }}>
                      {['new', 'working', 'circle-back', 'approval', 'dead'].map((status) => {
                        const statusCount = bucket.statuses[status] || 0;
                        const statusPercent = (statusCount / maxCount) * 100;
                        if (statusCount === 0) return null;
                        return (
                          <motion.div
                            key={status}
                            initial={{ height: 0 }}
                            animate={{ height: `${statusPercent}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.03 }}
                            className={`w-full transition-opacity ${hoveredPoint === idx ? 'opacity-90' : ''}`}
                            style={{ backgroundColor: statusColors[status], minHeight: statusCount > 0 ? '2px' : 0 }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 mt-2 truncate max-w-full">{bucket.label}</span>
                    
                    {/* Tooltip */}
                    {hoveredPoint === idx && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg z-10 whitespace-nowrap"
                      >
                        <p className="font-bold mb-1">{bucket.label}: {bucket.count} leads</p>
                        {Object.entries(bucket.statuses).map(([s, c]) => (
                          <div key={s} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[s] }} />
                            <span className="capitalize">{s}: {c as number}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-4 text-xs">
                {[
                  { status: 'new', label: 'New' },
                  { status: 'working', label: 'Working' },
                  { status: 'circle-back', label: 'Circle Back' },
                  { status: 'approval', label: 'Approved' },
                  { status: 'dead', label: 'Dead' },
                ].map(item => (
                  <div key={item.status} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[item.status] }} />
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Trend View - Interactive Line Chart */}
          {chartView === 'trend' && buckets.length > 1 && (
            <motion.div 
              key="trend"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative"
            >
              <svg viewBox="0 0 100 50" className="w-full h-56" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="trendFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                {[10, 20, 30, 40].map(y => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e2e8f0" strokeWidth="0.3" />
                ))}
                
                {/* Area fill */}
                <polygon
                  fill="url(#trendFillGrad)"
                  points={`0,50 ${buckets.map((b, i) => {
                    const x = (i / (buckets.length - 1)) * 100;
                    const y = 50 - (b.count / maxCount) * 40;
                    return `${x},${y}`;
                  }).join(' ')} 100,50`}
                />
                
                {/* Trend line */}
                <polyline
                  fill="none"
                  stroke="url(#trendLineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={buckets.map((b, i) => {
                    const x = (i / (buckets.length - 1)) * 100;
                    const y = 50 - (b.count / maxCount) * 40;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                
                {/* Interactive data points */}
                {buckets.map((b, i) => {
                  const x = (i / (buckets.length - 1)) * 100;
                  const y = 50 - (b.count / maxCount) * 40;
                  return (
                    <g key={i} 
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Larger hitbox */}
                      <circle cx={x} cy={y} r="8" fill="transparent" />
                      {/* Glow effect on hover */}
                      {hoveredPoint === i && (
                        <circle cx={x} cy={y} r="8" fill="#3b82f6" fillOpacity="0.2" />
                      )}
                      {/* Main point */}
                      <circle 
                        cx={x} cy={y} 
                        r={hoveredPoint === i ? "5" : "4"} 
                        fill="#fff" 
                        stroke={hoveredPoint === i ? "#8b5cf6" : "#3b82f6"} 
                        strokeWidth="2.5"
                      />
                    </g>
                  );
                })}
              </svg>
              
              {/* Labels */}
              <div className="flex justify-between px-1 mt-2">
                {buckets.map((b, i) => (
                  <span key={i} className={`text-[10px] font-medium transition-colors ${
                    hoveredPoint === i ? 'text-primary-600' : 'text-slate-400'
                  }`}>
                    {b.label}
                  </span>
                ))}
              </div>
              
              {/* Hover tooltip */}
              {hoveredPoint !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl"
                >
                  <p className="font-bold">{buckets[hoveredPoint].label}</p>
                  <p className="text-slate-300">{buckets[hoveredPoint].count} leads</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function AnalyticsView({ leads, rangeMonths, grouping, onRangeChange, onGroupingChange }: any) {
  // Core statistics
  const stats = {
    total: leads.length,
    new: leads.filter((l: Lead) => l.status === 'new').length,
    working: leads.filter((l: Lead) => l.status === 'working').length,
    circleBack: leads.filter((l: Lead) => l.status === 'circle-back').length,
    approval: leads.filter((l: Lead) => l.status === 'approval').length,
    dead: leads.filter((l: Lead) => l.status === 'dead').length,
  };

  // Conversion and performance rates
  const conversionRate = stats.total > 0 ? ((stats.approval / stats.total) * 100).toFixed(1) : '0';
  const deadRate = stats.total > 0 ? ((stats.dead / stats.total) * 100).toFixed(1) : '0';
  const activeRate = stats.total > 0 ? (((stats.working + stats.circleBack) / stats.total) * 100).toFixed(1) : '0';
  const newRate = stats.total > 0 ? ((stats.new / stats.total) * 100).toFixed(1) : '0';

  // Time-based bucketing
  const getWeekKey = (d: Date) => {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const dayOfYear = ((d.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1;
    const week = Math.ceil(dayOfYear / 7);
    return `W${String(week).padStart(2, '0')}`;
  };

  const getDayKey = (d: Date) => {
    return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const buildBuckets = (list: Lead[], mode: 'weekly' | 'monthly' | 'daily') => {
    const map = new Map<string, { count: number; label: string; date: Date; statuses: Record<string, number> }>();
    list.forEach((lead) => {
      const d = new Date(lead.createdAt);
      let key: string, label: string;
      if (mode === 'monthly') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      } else if (mode === 'daily') {
        key = d.toISOString().split('T')[0];
        label = getDayKey(d);
      } else {
        key = `${d.getFullYear()}-${getWeekKey(d)}`;
        label = getWeekKey(d);
      }
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.statuses[lead.status] = (existing.statuses[lead.status] || 0) + 1;
      } else {
        map.set(key, { count: 1, label, date: d, statuses: { [lead.status]: 1 } });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const buckets = buildBuckets(leads, grouping);
  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  
  // Calculate growth rate
  const calculateGrowth = () => {
    if (buckets.length < 2) return null;
    const latest = buckets[buckets.length - 1].count;
    const previous = buckets[buckets.length - 2].count;
    if (previous === 0) return latest > 0 ? 100 : 0;
    return ((latest - previous) / previous * 100).toFixed(0);
  };
  const growthRate = calculateGrowth();

  // Calculate totals and metrics
  const totals = leads.reduce((acc: any, lead: Lead) => {
    const interactions = lead.interactions || [];
    acc.totalInteractions += interactions.length;
    interactions.forEach((i) => {
      if (i.type === 'call') acc.calls += 1;
      if (i.type === 'message') acc.messages += 1;
      if (i.type === 'email') acc.emails += 1;
      if (i.type === 'follow-up') acc.followUps += 1;
      if (i.type === 'note') acc.notes += 1;
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
    // Vehicle type distribution
    acc.vehicleTypes[lead.formData.vehicleType] = (acc.vehicleTypes[lead.formData.vehicleType] || 0) + 1;
    // Payment type distribution
    acc.paymentTypes[lead.formData.paymentType] = (acc.paymentTypes[lead.formData.paymentType] || 0) + 1;
    // Credit rating distribution (for finance)
    if (lead.formData.creditRating) {
      acc.creditRatings[lead.formData.creditRating] = (acc.creditRatings[lead.formData.creditRating] || 0) + 1;
    }
    // Dead reasons
    if (lead.status === 'dead' && lead.deadReason) {
      acc.deadReasons[lead.deadReason] = (acc.deadReasons[lead.deadReason] || 0) + 1;
    }
    return acc;
  }, { 
    calls: 0, messages: 0, emails: 0, followUps: 0, notes: 0, totalInteractions: 0, 
    closures: [] as number[], firstResponse: [] as number[],
    vehicleTypes: {} as Record<string, number>,
    paymentTypes: {} as Record<string, number>,
    creditRatings: {} as Record<string, number>,
    deadReasons: {} as Record<string, number>,
  });

  const avgInteractions = leads.length ? (totals.totalInteractions / leads.length).toFixed(1) : '0';
  const avgDaysToClose = totals.closures.length ? Math.round(totals.closures.reduce((a: number, b: number) => a + b, 0) / totals.closures.length) : 0;
  const avgResponseHours = totals.firstResponse.length ? (totals.firstResponse.reduce((a: number, b: number) => a + b, 0) / totals.firstResponse.length).toFixed(1) : null;

  // Status colors for charts
  const statusColors: Record<string, string> = {
    'new': '#3b82f6',
    'working': '#eab308',
    'circle-back': '#06b6d4',
    'approval': '#22c55e',
    'dead': '#ef4444',
  };

  // Vehicle type labels
  const vehicleLabels: Record<string, string> = {
    sedan: 'Sedan', suv: 'SUV', hatchback: 'Hatchback',
    'coupe-convertible': 'Coupe/Conv', truck: 'Truck', minivan: 'Minivan',
  };

  // Credit labels
  const creditLabels: Record<string, string> = {
    poor: 'Poor', fair: 'Fair', good: 'Good', excellent: 'Excellent',
  };

  // Dead reason labels
  const deadReasonLabels: Record<string, string> = {
    'declined': 'Declined',
    'negative-equity': 'Negative Equity',
    'no-longer-interested': 'No Interest',
    'already-purchased': 'Already Purchased',
    'no-vehicle-of-interest': 'No Vehicle',
    'cannot-afford-payment': "Can't Afford",
    'too-far-to-visit': 'Too Far',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Analytics & Insights</h1>
            <p className="text-base text-slate-600">
              {leads.length} leads • {rangeMonths === 1 ? 'Current month' : `Last ${rangeMonths} months`}
            </p>
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

        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 text-white">
            <p className="text-slate-300 text-xs font-medium mb-2">Total Leads</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
            <p className="text-blue-100 text-xs font-medium mb-2">New</p>
            <p className="text-3xl font-bold">{stats.new}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl p-5 text-white">
            <p className="text-yellow-100 text-xs font-medium mb-2">Working</p>
            <p className="text-3xl font-bold">{stats.working}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-5 text-white">
            <p className="text-cyan-100 text-xs font-medium mb-2">Circle Back</p>
            <p className="text-3xl font-bold">{stats.circleBack}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white">
            <p className="text-emerald-100 text-xs font-medium mb-2">Approved</p>
            <p className="text-3xl font-bold">{stats.approval}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 text-white">
            <p className="text-red-100 text-xs font-medium mb-2">Dead</p>
            <p className="text-3xl font-bold">{stats.dead}</p>
          </div>
        </div>

        {/* KPI Cards Row 2 - Performance Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">{conversionRate}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${conversionRate}%` }} 
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" 
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{stats.approval} of {stats.total} approved</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Active Pipeline</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">{activeRate}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${activeRate}%` }} 
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" 
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{stats.working + stats.circleBack} leads in progress</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Dead Rate</p>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">{deadRate}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${deadRate}%` }} 
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full" 
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{stats.dead} leads closed</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Avg Response Time</p>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">
                {avgResponseHours ? `${avgResponseHours}h` : 'N/A'}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {avgResponseHours ? `${avgResponseHours} hrs` : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1">First contact time</p>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Lead Volume Chart - With View Switcher */}
          <ChartWithViews
            buckets={buckets}
            maxCount={maxCount}
            growthRate={growthRate}
            grouping={grouping}
            statusColors={statusColors}
            stats={stats}
          />

          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Status Distribution</h3>
            <div className="flex items-center gap-8">
              {/* Donut Chart */}
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const total = stats.total || 1;
                    const data = [
                      { status: 'new', count: stats.new },
                      { status: 'working', count: stats.working },
                      { status: 'circle-back', count: stats.circleBack },
                      { status: 'approval', count: stats.approval },
                      { status: 'dead', count: stats.dead },
                    ];
                    let cumulativePercent = 0;
                    return data.map((item, idx) => {
                      const percent = (item.count / total) * 100;
                      const offset = cumulativePercent;
                      cumulativePercent += percent;
                      const circumference = 2 * Math.PI * 35;
                      const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -(offset / 100) * circumference;
                      return (
                        <circle
                          key={item.status}
                          cx="50"
                          cy="50"
                          r="35"
                          fill="none"
                          stroke={statusColors[item.status]}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-3">
                {[
                  { label: 'New', value: stats.new, color: statusColors['new'] },
                  { label: 'Working', value: stats.working, color: statusColors['working'] },
                  { label: 'Circle Back', value: stats.circleBack, color: statusColors['circle-back'] },
                  { label: 'Approved', value: stats.approval, color: statusColors['approval'] },
                  { label: 'Dead', value: stats.dead, color: statusColors['dead'] },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-600">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                      <span className="text-xs text-slate-400">
                        ({stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Vehicle Type Distribution */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Vehicle Types</h3>
            <div className="space-y-3">
              {Object.entries(totals.vehicleTypes)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([type, count]) => {
                  const percent = stats.total > 0 ? ((count as number) / stats.total) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{vehicleLabels[type] || type}</span>
                        <span className="font-medium text-slate-900">{count as number}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(totals.vehicleTypes).length === 0 && (
                <p className="text-center text-slate-400 py-4">No data</p>
              )}
            </div>
          </div>

          {/* Payment Type Distribution - Clean Version */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Payment Type</h3>
            {Object.keys(totals.paymentTypes).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(totals.paymentTypes)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([type, count]) => {
                    const total = Object.values(totals.paymentTypes).reduce((a, b) => (a as number) + (b as number), 0) as number;
                    const percent = total > 0 ? ((count as number) / total) * 100 : 0;
                    const isFinance = type === 'finance';
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isFinance ? 'bg-blue-100' : 'bg-emerald-100'
                            }`}>
                              {isFinance ? (
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 capitalize">{type}</p>
                              <p className="text-xs text-slate-500">{percent.toFixed(0)}% of leads</p>
                            </div>
                          </div>
                          <span className="text-3xl font-bold text-slate-900">{count as number}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6 }}
                            className={`h-full rounded-full ${
                              isFinance 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400">
                <p>No payment data</p>
              </div>
            )}
          </div>

          {/* Credit Rating Distribution */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Credit Profiles</h3>
            <div className="space-y-3">
              {['poor', 'fair', 'good', 'excellent'].map((rating) => {
                const count = (totals.creditRatings[rating] as number) || 0;
                const financeTotal = totals.paymentTypes['finance'] as number || 1;
                const percent = (count / financeTotal) * 100;
                const colors: Record<string, string> = {
                  poor: 'from-red-500 to-orange-500',
                  fair: 'from-orange-500 to-yellow-500',
                  good: 'from-yellow-500 to-green-500',
                  excellent: 'from-green-500 to-emerald-500',
                };
                return (
                  <div key={rating}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{creditLabels[rating]}</span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${colors[rating]} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity & Performance Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Interaction Activity */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Activity Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Calls', value: totals.calls, icon: '📞', color: 'from-blue-500 to-blue-600' },
                { label: 'Messages', value: totals.messages, icon: '💬', color: 'from-green-500 to-emerald-600' },
                { label: 'Emails', value: totals.emails, icon: '📧', color: 'from-purple-500 to-violet-600' },
                { label: 'Follow-ups', value: totals.followUps, icon: '🔄', color: 'from-orange-500 to-amber-600' },
              ].map(item => (
                <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-xl p-4 text-white`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium opacity-90">{item.label}</span>
                  </div>
                  <p className="text-3xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Avg interactions per lead</span>
                <span className="text-lg font-bold text-slate-900">{avgInteractions}</span>
              </div>
            </div>
          </div>

          {/* Dead Lead Reasons */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Dead Lead Reasons</h3>
            {stats.dead === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <span className="text-4xl mb-2 block">🎉</span>
                  <p>No dead leads!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(totals.deadReasons)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 6)
                  .map(([reason, count]) => {
                    const percent = stats.dead > 0 ? ((count as number) / stats.dead) * 100 : 0;
                    return (
                      <div key={reason}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{deadReasonLabels[reason] || reason}</span>
                          <span className="font-medium text-slate-900">{count as number} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(totals.deadReasons).length === 0 && stats.dead > 0 && (
                  <p className="text-center text-slate-400 py-4">No reasons recorded</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 text-white">
          <h3 className="text-xl font-bold mb-6">Performance Summary</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-slate-300 text-sm mb-1">Total Interactions</p>
              <p className="text-4xl font-bold">{totals.totalInteractions}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-slate-300 text-sm mb-1">Avg Days to Close</p>
              <p className="text-4xl font-bold">{avgDaysToClose}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-slate-300 text-sm mb-1">Conversion Rate</p>
              <p className="text-4xl font-bold">{conversionRate}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-slate-300 text-sm mb-1">Success Ratio</p>
              <p className="text-4xl font-bold">
                {stats.total > 0 ? `${stats.approval}:${stats.dead}` : '0:0'}
              </p>
            </div>
          </div>
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

