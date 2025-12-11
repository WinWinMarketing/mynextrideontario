'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Select, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions, ShowcaseVehicle } from '@/lib/validation';
import { formatDate } from '@/lib/utils';
import { DEFAULT_TEMPLATES, EmailTemplate } from '@/lib/email';
import { Logo, LogoIcon } from '@/components/Logo';
import { FuturisticPipeline } from './FuturisticPipeline';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'leads' | 'pipeline' | 'templates' | 'showcase' | 'analytics' | 'settings';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [starredLeads, setStarredLeads] = useState<Set<string>>(new Set());
  const [licenseUrls, setLicenseUrls] = useState<Record<string, string>>({});
  const [detailModal, setDetailModal] = useState<Lead | null>(null);
  const [emailModal, setEmailModal] = useState<{ lead: Lead } | null>(null);
  const [templates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [showcase, setShowcase] = useState<ShowcaseVehicle[]>([]);
  const [showcaseEnabled, setShowcaseEnabled] = useState(true);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        const fetchedLeads = data.leads || [];
        setLeads(fetchedLeads);
        
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
      }
    } catch (error) { console.error('Error fetching leads:', error); }
    finally { setIsLoading(false); }
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

  useEffect(() => { fetchLeads(); fetchShowcase(); }, [fetchLeads, fetchShowcase]);

  const updateStatus = async (leadId: string, status: LeadStatus, deadReason?: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, status, deadReason }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status, deadReason: deadReason as any } : l));
    } catch (e) { console.error('Error updating status:', e); }
  };

  const saveNotes = async (leadId: string, notes: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, notes }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l));
    } catch (e) { console.error('Error saving notes:', e); }
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

  // Calculate advanced analytics
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
    <div className="min-h-screen bg-slate-50">
      {/* Header - LARGER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">
        <div className="h-16 px-8 flex items-center justify-between max-w-[2200px] mx-auto">
          <Logo size="sm" />

          <nav className="flex gap-1 bg-slate-100 p-1.5 rounded-xl">
            {(['dashboard', 'leads', 'pipeline', 'analytics', 'templates', 'showcase'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-base font-semibold rounded-lg capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-primary-600 shadow-md' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                {tab === 'dashboard' && '🏠 '}
                {tab === 'leads' && '👥 '}
                {tab === 'pipeline' && '🚀 '}
                {tab === 'analytics' && '📊 '}
                {tab === 'templates' && '✉️ '}
                {tab === 'showcase' && '🚗 '}
                {tab}
              </button>
            ))}
          </nav>

          <button onClick={onLogout} className="text-base text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition-all">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <DashboardView key="dash" stats={stats} analytics={analytics} leads={leads} onNav={setActiveTab} />}
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
              onSendEmail={(lead) => setEmailModal({ lead })}
              stats={stats}
            />
          )}
          {activeTab === 'pipeline' && (
            <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-64px)]">
              <FuturisticPipeline
                leads={leads}
                onStatusChange={updateStatus}
                onViewDetails={setDetailModal}
                starredLeads={starredLeads}
                onToggleStar={toggleStar}
              />
            </motion.div>
          )}
          {activeTab === 'analytics' && <AnalyticsView key="analytics" stats={stats} analytics={analytics} leads={leads} />}
          {activeTab === 'templates' && <TemplatesView key="templates" templates={templates} />}
          {activeTab === 'showcase' && (
            <ShowcaseView
              key="showcase"
              vehicles={showcase}
              enabled={showcaseEnabled}
              onToggle={toggleShowcaseEnabled}
              onDelete={deleteShowcaseVehicle}
              onRefresh={fetchShowcase}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="" size="full">
        {detailModal && (
          <LeadDetailPopup
            lead={detailModal}
            licenseUrl={licenseUrls[detailModal.id]}
            onStatusChange={updateStatus}
            onSaveNotes={saveNotes}
            onClose={() => setDetailModal(null)}
            onSendEmail={() => { setDetailModal(null); setEmailModal({ lead: detailModal }); }}
          />
        )}
      </Modal>

      {/* Email Modal */}
      <Modal isOpen={!!emailModal} onClose={() => setEmailModal(null)} title="Send Email" size="lg">
        {emailModal && (
          <EmailComposer lead={emailModal.lead} templates={templates} onClose={() => setEmailModal(null)} />
        )}
      </Modal>
    </div>
  );
}

// Dashboard View - LARGER TEXT
function DashboardView({ stats, analytics, leads, onNav }: { stats: any; analytics: any; leads: Lead[]; onNav: (tab: TabType) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome Back 👋</h1>
          <p className="text-xl text-slate-500">Here's what's happening with your leads today.</p>
        </div>

        {/* Stats Grid - LARGER */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-10">
          {[
            { label: 'Total Leads', value: stats.total, icon: '📊', color: 'bg-slate-600' },
            { label: 'New', value: stats.new, icon: '🆕', color: 'bg-blue-500' },
            { label: 'Working', value: stats.working, icon: '⚙️', color: 'bg-yellow-500' },
            { label: 'Follow Up', value: stats.circleBack, icon: '🔄', color: 'bg-cyan-500' },
            { label: 'Approved', value: stats.approval, icon: '✅', color: 'bg-green-500' },
            { label: 'Dead', value: stats.dead, icon: '💀', color: 'bg-red-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{s.icon}</span>
                <div className={`w-3 h-3 rounded-full ${s.color}`} />
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-1">{s.value}</p>
              <p className="text-base text-slate-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions - LARGER */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <button onClick={() => onNav('leads')} className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-lg text-left hover:border-primary-400 hover:shadow-xl transition-all">
            <span className="text-4xl block mb-4">👥</span>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">View All Leads</h3>
            <p className="text-base text-slate-500">Manage and filter your pipeline</p>
          </button>
          <button onClick={() => onNav('pipeline')} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-left hover:from-slate-800 hover:to-slate-700 transition-colors shadow-lg">
            <span className="text-4xl block mb-4">🚀</span>
            <h3 className="text-2xl font-bold text-white mb-2">Visual Pipeline</h3>
            <p className="text-base text-slate-400">Interactive funnel builder</p>
          </button>
          <button onClick={() => onNav('analytics')} className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-left hover:from-blue-500 hover:to-blue-600 transition-colors shadow-lg">
            <span className="text-4xl block mb-4">📊</span>
            <h3 className="text-2xl font-bold text-white mb-2">View Analytics</h3>
            <p className="text-base text-blue-200">Detailed performance metrics</p>
          </button>
        </div>

        {/* Performance Cards - LARGER */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-lg">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Conversion Rate</h3>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-6xl font-bold text-primary-600">{analytics.conversionRate}%</p>
                <p className="text-base text-slate-500 mt-2">Of leads approved</p>
              </div>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analytics.conversionRate}%` }} transition={{ duration: 1 }} className="h-full bg-primary-600 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-lg">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Pipeline Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base text-slate-600">Active Rate</span>
                <span className="text-xl font-bold text-emerald-600">{analytics.activeRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-slate-600">Dead Lead Rate</span>
                <span className="text-xl font-bold text-red-500">{analytics.deadRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-slate-600">Pending Follow-ups</span>
                <span className="text-xl font-bold text-amber-600">{stats.circleBack}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Analytics View - NEW
function AnalyticsView({ stats, analytics, leads }: { stats: any; analytics: any; leads: Lead[] }) {
  const monthlyData = leads.reduce((acc, lead) => {
    const date = new Date(lead.createdAt);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 Analytics Dashboard</h1>
          <p className="text-xl text-slate-500">Deep insights into your lead performance</p>
        </div>

        {/* Key Metrics - LARGE */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
            <p className="text-blue-100 text-lg mb-2">Total Leads</p>
            <p className="text-5xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
            <p className="text-emerald-100 text-lg mb-2">Conversion Rate</p>
            <p className="text-5xl font-bold">{analytics.conversionRate}%</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-lg">
            <p className="text-red-100 text-lg mb-2">Dead Lead Rate</p>
            <p className="text-5xl font-bold">{analytics.deadRate}%</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-8 text-white shadow-lg">
            <p className="text-amber-100 text-lg mb-2">Active Pipeline</p>
            <p className="text-5xl font-bold">{analytics.activeRate}%</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          {/* Dead Lead Breakdown */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-lg">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">💀 Dead Lead Breakdown</h3>
            {analytics.deadReasons.length > 0 ? (
              <div className="space-y-4">
                {analytics.deadReasons.map((r: any) => (
                  <div key={r.value} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-medium text-slate-700">{r.label}</span>
                        <span className="text-lg font-bold text-slate-900">{r.count}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${(r.count / stats.dead) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-lg text-center py-8">No dead leads to analyze</p>
            )}
          </div>

          {/* Pipeline Distribution */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-lg">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">📈 Pipeline Distribution</h3>
            <div className="space-y-4">
              {[
                { label: 'New Leads', value: stats.new, color: 'bg-blue-500', total: stats.total },
                { label: 'Working', value: stats.working, color: 'bg-yellow-500', total: stats.total },
                { label: 'Follow Up', value: stats.circleBack, color: 'bg-cyan-500', total: stats.total },
                { label: 'Approved', value: stats.approval, color: 'bg-emerald-500', total: stats.total },
                { label: 'Dead', value: stats.dead, color: 'bg-red-500', total: stats.total },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-medium text-slate-700">{item.label}</span>
                    <span className="text-lg font-bold text-slate-900">{item.value} ({item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-lg">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">📋 Performance Summary</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-6xl font-bold text-slate-900 mb-2">{stats.new}</p>
              <p className="text-lg text-slate-500">Leads waiting for first contact</p>
            </div>
            <div className="text-center">
              <p className="text-6xl font-bold text-slate-900 mb-2">{stats.circleBack}</p>
              <p className="text-lg text-slate-500">Leads requiring follow-up</p>
            </div>
            <div className="text-center">
              <p className="text-6xl font-bold text-slate-900 mb-2">{stats.approval}</p>
              <p className="text-lg text-slate-500">Successfully converted</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Leads View - LARGER TEXT
function LeadsView({ leads, isLoading, selectedMonth, selectedYear, statusFilter, licenseUrls, starredLeads, onMonthChange, onYearChange, onFilterChange, onToggleStar, onStatusChange, onViewDetails, onSendEmail, stats }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-[calc(100vh-64px)]">
      <aside className="w-72 bg-white border-r border-slate-200/80 p-6 flex-shrink-0 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Time Period</label>
            <div className="mt-3 space-y-3">
              <Select options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString('en', { month: 'long' }) }))} value={String(selectedMonth)} onChange={(e) => onMonthChange(parseInt(e.target.value))} />
              <Select options={[{ value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) }]} value={String(selectedYear)} onChange={(e) => onYearChange(parseInt(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Filter by Status</label>
            <div className="mt-3 space-y-2">
              {[{ value: 'all', label: 'All Leads' }, ...leadStatusOptions].map(s => (
                <button key={s.value} onClick={() => onFilterChange(s.value)} 
                  className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all ${statusFilter === s.value ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{leads.length} Leads Found</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin" /></div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xl">No leads found</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {leads.map((lead: Lead) => (
              <LeadCard key={lead.id} lead={lead} hasLicense={!!licenseUrls[lead.id]} isStarred={starredLeads.has(lead.id)} onToggleStar={() => onToggleStar(lead.id)} onViewDetails={() => onViewDetails(lead)} onSendEmail={() => onSendEmail(lead)} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Lead Card - LARGER
function LeadCard({ lead, hasLicense, isStarred, onToggleStar, onViewDetails, onSendEmail }: any) {
  const { formData } = lead;
  const colors: Record<string, string> = { 'new': 'bg-blue-100 text-blue-700', 'working': 'bg-yellow-100 text-yellow-700', 'circle-back': 'bg-cyan-100 text-cyan-700', 'approval': 'bg-green-100 text-green-700', 'dead': 'bg-red-100 text-red-700' };

  return (
    <div className={`bg-white rounded-2xl p-6 border-2 shadow-md hover:shadow-lg transition-all ${isStarred ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-slate-200/80'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
              {formData.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-slate-900 truncate">{formData.fullName}</h3>
              <span className={`inline-block mt-1 text-sm font-semibold px-3 py-1 rounded-full ${colors[lead.status]}`}>
                {leadStatusOptions.find(s => s.value === lead.status)?.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasLicense && <span className="text-2xl">🪪</span>}
          <button onClick={onToggleStar} className="text-2xl hover:scale-110 transition-transform">{isStarred ? '⭐' : '☆'}</button>
        </div>
      </div>
      
      {lead.status === 'dead' && lead.deadReason && (
        <div className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 font-medium capitalize">{lead.deadReason.replace(/-/g, ' ')}</div>
      )}
      
      <div className="space-y-2 mb-4">
        <p className="text-base text-slate-700 flex items-center gap-2">📞 {formData.phone}</p>
        <p className="text-base text-slate-500 truncate flex items-center gap-2">✉️ {formData.email}</p>
      </div>
      
      <div className="flex gap-3">
        <Button size="sm" variant="primary" onClick={onViewDetails} className="flex-1 text-base py-3 font-semibold">View Details</Button>
        <Button size="sm" variant="secondary" onClick={onSendEmail} className="text-base py-3 px-4">✉️</Button>
      </div>
    </div>
  );
}

function LeadDetailPopup({ lead, licenseUrl, onStatusChange, onSaveNotes, onClose, onSendEmail }: any) {
  const { formData } = lead;
  const [notes, setNotes] = useState(lead.notes || '');
  const [deadReason, setDeadReason] = useState(lead.deadReason || '');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
            {formData.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{formData.fullName}</h1>
            <p className="text-lg text-slate-500">{formatDate(lead.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <a href={`tel:${formData.phone}`}><Button size="lg" className="text-lg">📞 Call</Button></a>
          <Button size="lg" variant="secondary" onClick={onSendEmail} className="text-lg">✉️ Email</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Contact Information</h3>
          <div className="space-y-4 text-lg">
            <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium text-slate-800">{formData.phone}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-800 truncate ml-4">{formData.email}</span></div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Vehicle Preferences</h3>
          <div className="space-y-4 text-lg">
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium text-slate-800">{formData.vehicleType}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="font-medium text-slate-800">{formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}</span></div>
          </div>
        </div>
      </div>

      {licenseUrl && <div className="mb-8"><img src={licenseUrl} alt="License" className="w-full max-w-lg rounded-2xl shadow-lg" /></div>}

      <div className="bg-slate-50 rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Update Status</h3>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {leadStatusOptions.map(opt => (
            <button key={opt.value} onClick={() => onStatusChange(lead.id, opt.value)} 
              className={`py-4 rounded-xl text-base font-semibold transition-all ${lead.status === opt.value ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border-2 border-slate-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {lead.status === 'dead' && (
          <Select label="Dead Lead Reason" value={deadReason} onChange={(e) => { setDeadReason(e.target.value); onStatusChange(lead.id, 'dead', e.target.value); }} 
            options={[{ value: '', label: 'Select a reason...' }, ...deadReasonOptions]} />
        )}
      </div>

      <div className="bg-slate-50 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Notes</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this lead..." 
          className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-primary-500 outline-none resize-none text-lg" />
        <div className="mt-4 flex justify-end">
          <Button size="lg" onClick={() => onSaveNotes(lead.id, notes)} className="text-lg">Save Notes</Button>
        </div>
      </div>
    </div>
  );
}

function TemplatesView({ templates }: { templates: EmailTemplate[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">✉️ Email Templates</h1>
          <p className="text-lg text-slate-500">Pre-built templates for common scenarios</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.name}</h3>
              <p className="text-base text-slate-500 mb-4">{t.subject}</p>
              <div className="bg-slate-50 rounded-xl p-4 max-h-40 overflow-y-auto">
                <pre className="text-base text-slate-600 whitespace-pre-wrap font-sans">{t.body}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
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
      const vars: Record<string, string> = { '{{name}}': lead.formData.fullName, '{{vehicle}}': lead.formData.vehicleType, '{{budget}}': lead.formData.paymentType === 'finance' ? lead.formData.financeBudget || '' : lead.formData.cashBudget || '' };
      let s = t.subject, b = t.body;
      Object.entries(vars).forEach(([k, v]) => { s = s.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v); b = b.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v); });
      setSubject(s); setBody(b);
    }
    setTemplateId(id);
  };

  const send = async () => {
    if (!subject || !body) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toEmail: lead.formData.email, toName: lead.formData.fullName, subject, body }) });
      if (res.ok) setSent(true);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  if (sent) return (
    <div className="text-center py-12">
      <div className="text-6xl mb-6">✅</div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">Email Sent!</h3>
      <p className="text-lg text-slate-500 mb-6">Your message has been delivered.</p>
      <Button size="lg" onClick={onClose}>Close</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-lg">To: <strong className="text-slate-900">{lead.formData.fullName}</strong> ({lead.formData.email})</p>
      </div>
      <Select label="Choose Template" options={[{ value: '', label: 'Select a template...' }, ...templates.map(t => ({ value: t.id, label: t.name }))]} value={templateId} onChange={(e) => applyTemplate(e.target.value)} />
      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div>
        <label className="block text-base font-semibold text-slate-700 mb-2">Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-primary-500 outline-none resize-none text-base" />
      </div>
      <div className="flex gap-3 justify-end">
        <Button size="lg" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="lg" onClick={send} isLoading={sending} disabled={!subject || !body}>Send Email</Button>
      </div>
    </div>
  );
}

function ShowcaseView({ vehicles, enabled, onToggle, onDelete, onRefresh }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">🚗 Vehicle Showcase</h1>
            <p className="text-lg text-slate-500">{vehicles.length} vehicles in showcase</p>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-lg text-slate-600 font-medium">Show on Homepage</span>
              <button onClick={onToggle} className={`w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-slate-300'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <Button variant="secondary" size="lg" onClick={onRefresh}>Refresh</Button>
          </div>
        </div>
        {!enabled && <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8"><p className="text-lg text-amber-800 font-medium">⚠️ Showcase is currently hidden from the homepage</p></div>}
        {vehicles.length === 0 ? <div className="text-center py-20 text-slate-400 text-xl">No vehicles in showcase</div> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v: ShowcaseVehicle) => (
              <div key={v.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-slate-100">{v.imageUrl ? <img src={v.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl">🚗</div>}</div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{v.year} {v.make} {v.model}</h3>
                  {v.price && <p className="text-lg font-semibold text-primary-600 mb-3">{v.price}</p>}
                  <button onClick={() => onDelete(v.id)} className="text-base text-red-600 hover:text-red-800 font-medium">Remove from showcase</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
