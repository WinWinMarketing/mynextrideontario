'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Select, Textarea, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions, ShowcaseVehicle } from '@/lib/validation';
import { formatDate } from '@/lib/utils';
import { DEFAULT_TEMPLATES, EmailTemplate } from '@/lib/email';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'leads' | 'templates' | 'showcase';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'new': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  'working': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  'circle-back': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  'approval': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'dead': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' },
};

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [starredLeads, setStarredLeads] = useState<Set<string>>(new Set());
  const [licenseUrls, setLicenseUrls] = useState<Record<string, string>>({});
  const [licenseModal, setLicenseModal] = useState<{ url: string; name: string } | null>(null);
  const [detailModal, setDetailModal] = useState<Lead | null>(null);
  const [emailModal, setEmailModal] = useState<{ lead: Lead } | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [showcase, setShowcase] = useState<ShowcaseVehicle[]>([]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        const fetchedLeads = data.leads || [];
        setLeads(fetchedLeads);
        
        // Fetch license URLs
        const urlPromises = fetchedLeads
          .filter((l: Lead) => l.driversLicenseKey)
          .map(async (l: Lead) => {
            try {
              const res = await fetch(`/api/admin/leads/${l.id}/license-url?key=${encodeURIComponent(l.driversLicenseKey!)}`);
              if (res.ok) {
                const { url } = await res.json();
                return { id: l.id, url };
              }
            } catch (e) {
              console.error(`License URL fetch failed for ${l.id}:`, e);
            }
            return null;
          });

        const results = await Promise.all(urlPromises);
        const urlMap: Record<string, string> = {};
        results.forEach(r => r && (urlMap[r.id] = r.url));
        setLicenseUrls(urlMap);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Fetch showcase
  const fetchShowcase = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/showcase');
      if (res.ok) {
        const data = await res.json();
        setShowcase(data.vehicles || []);
      }
    } catch (e) {
      console.error('Error fetching showcase:', e);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchShowcase();
  }, [fetchLeads, fetchShowcase]);

  // Update status
  const updateStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, status }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      if (detailModal?.id === leadId) setDetailModal({ ...detailModal, status });
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  // Toggle star
  const toggleStar = (id: string) => {
    setStarredLeads(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  // Open license immediately
  const openLicense = (leadId: string, leadName: string) => {
    const url = licenseUrls[leadId];
    if (url) {
      setLicenseModal({ url, name: leadName });
    }
  };

  // Filter and sort leads
  const filteredLeads = leads
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .sort((a, b) => {
      if (starredLeads.has(a.id) && !starredLeads.has(b.id)) return -1;
      if (!starredLeads.has(a.id) && starredLeads.has(b.id)) return 1;
      if (a.status === 'dead' && b.status !== 'dead') return 1;
      if (a.status !== 'dead' && b.status === 'dead') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    working: leads.filter(l => l.status === 'working').length,
    approval: leads.filter(l => l.status === 'approval').length,
    dead: leads.filter(l => l.status === 'dead').length,
  };
  const approvalRate = stats.total > 0 ? Math.round((stats.approval / stats.total) * 100) : 0;
  const mood = approvalRate >= 50 ? 'great' : approvalRate >= 20 ? 'good' : 'poor';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900">My Next Ride Ontario</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
            </div>
          </div>

          <nav className="absolute left-1/2 -translate-x-1/2 flex gap-1 bg-slate-100 p-1 rounded-xl">
            {(['dashboard', 'leads', 'templates', 'showcase'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="pt-20 pb-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardView key="dashboard" stats={stats} approvalRate={approvalRate} mood={mood} onViewLeads={() => setActiveTab('leads')} onViewTemplates={() => setActiveTab('templates')} onViewShowcase={() => setActiveTab('showcase')} />
          )}

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
              onViewLicense={openLicense}
              onSendEmail={(lead) => setEmailModal({ lead })}
              stats={stats}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesView key="templates" templates={templates} setTemplates={setTemplates} />
          )}

          {activeTab === 'showcase' && (
            <ShowcaseView key="showcase" vehicles={showcase} onRefresh={fetchShowcase} />
          )}
        </AnimatePresence>
      </div>

      {/* LICENSE MODAL - Opens immediately on click */}
      <Modal isOpen={!!licenseModal} onClose={() => setLicenseModal(null)} title={`License: ${licenseModal?.name}`} size="xl">
        {licenseModal && (
          <div className="space-y-4">
            <img src={licenseModal.url} alt="License" className="w-full rounded-xl shadow-lg" />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(licenseModal.url)} className="flex-1">
                📋 Copy URL
              </Button>
              <a href={licenseModal.url} download className="flex-1">
                <Button variant="primary" className="w-full">⬇️ Download</Button>
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* DETAIL MODAL */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="" size="full">
        {detailModal && (
          <LeadDetailPopup
            lead={detailModal}
            licenseUrl={licenseUrls[detailModal.id]}
            onStatusChange={updateStatus}
            onClose={() => setDetailModal(null)}
            onViewLicense={() => openLicense(detailModal.id, detailModal.formData.fullName)}
            onSendEmail={() => { setDetailModal(null); setEmailModal({ lead: detailModal }); }}
          />
        )}
      </Modal>

      {/* EMAIL MODAL */}
      <Modal isOpen={!!emailModal} onClose={() => setEmailModal(null)} title="Send Email to Client" size="xl">
        {emailModal && (
          <EmailComposer
            lead={emailModal.lead}
            templates={templates}
            onClose={() => setEmailModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

// ============ DASHBOARD VIEW - BIGGER STATS ============
function DashboardView({ stats, approvalRate, mood, onViewLeads, onViewTemplates, onViewShowcase }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-6">
      {/* Hero Card */}
      <div className="relative h-48 mb-8 rounded-3xl overflow-hidden shadow-xl">
        {mood === 'great' && <SunshineBackground />}
        {mood === 'good' && <CloudyBackground />}
        {mood === 'poor' && <RainyBackground />}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
          <motion.h2 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl md:text-6xl font-bold mb-2">
            {stats.total} Total Leads
          </motion.h2>
          <p className="text-xl text-white/80">{approvalRate}% Approval Rate</p>
        </div>
      </div>

      {/* Stats Grid - BIGGER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'New Leads', value: stats.new, icon: <PlusIcon />, bg: 'from-slate-500 to-slate-700', color: 'slate' },
          { label: 'Working', value: stats.working, icon: <BoltIcon />, bg: 'from-amber-500 to-amber-600', color: 'amber' },
          { label: 'Approved', value: stats.approval, icon: <CheckCircleIcon />, bg: 'from-emerald-500 to-emerald-600', color: 'emerald' },
          { label: 'Dead', value: stats.dead, icon: <XCircleIcon />, bg: 'from-red-500 to-red-600', color: 'red' },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -6, scale: 1.02 }} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 overflow-hidden relative">
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.bg}`} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.bg} text-white flex items-center justify-center shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions - WIDER */}
      <div className="grid md:grid-cols-3 gap-5">
        <QuickActionCard title="View All Leads" desc="Manage your pipeline" icon={<ClipboardIcon />} onClick={onViewLeads} bg="from-primary-500 to-primary-700" />
        <QuickActionCard title="Email Templates" desc="Send to clients" icon={<MailIcon />} onClick={onViewTemplates} bg="from-amber-400 to-amber-600" />
        <QuickActionCard title="Vehicle Showcase" desc="Manage inventory" icon={<ImageIcon />} onClick={onViewShowcase} bg="from-emerald-400 to-emerald-600" />
      </div>
    </motion.div>
  );
}

// ============ LEADS VIEW ============
function LeadsView({ leads, isLoading, selectedMonth, selectedYear, statusFilter, licenseUrls, starredLeads, onMonthChange, onYearChange, onFilterChange, onToggleStar, onStatusChange, onViewDetails, onViewLicense, onSendEmail, stats }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-6 px-6 max-w-[1800px] mx-auto">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Time Period</h3>
            <div className="space-y-3">
              <Select
                options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString('en', { month: 'long' }) }))}
                value={String(selectedMonth)}
                onChange={(e) => onMonthChange(parseInt(e.target.value))}
              />
              <Select
                options={[{ value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) }]}
                value={String(selectedYear)}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Status</h3>
            <div className="space-y-2">
              <FilterButton label="All Leads" count={stats.total} active={statusFilter === 'all'} onClick={() => onFilterChange('all')} />
              {leadStatusOptions.map(s => (
                <FilterButton key={s.value} label={s.label} count={leads.filter((l: Lead) => l.status === s.value).length} active={statusFilter === s.value} onClick={() => onFilterChange(s.value)} dot={STATUS_CONFIG[s.value].dot} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{leads.length} Leads</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <p className="text-xl text-slate-400">No leads found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {leads.map((lead: Lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                hasLicense={!!licenseUrls[lead.id]}
                isStarred={starredLeads.has(lead.id)}
                onToggleStar={() => onToggleStar(lead.id)}
                onStatusChange={(s: LeadStatus) => onStatusChange(lead.id, s)}
                onViewDetails={() => onViewDetails(lead)}
                onViewLicense={() => onViewLicense(lead.id, lead.formData.fullName)}
                onSendEmail={() => onSendEmail(lead)}
              />
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}

// ============ LEAD CARD ============
function LeadCard({ lead, hasLicense, isStarred, onToggleStar, onStatusChange, onViewDetails, onViewLicense, onSendEmail }: any) {
  const { formData } = lead;
  const config = STATUS_CONFIG[lead.status];

  return (
    <motion.div layout whileHover={{ y: -4 }} className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all ${isStarred ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100 hover:border-slate-200'}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-slate-900 truncate">{formData.fullName}</h3>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} border ${config.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {leadStatusOptions.find(s => s.value === lead.status)?.label}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* License button - opens immediately */}
            {hasLicense && (
              <button
                onClick={onViewLicense}
                className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                title="View License"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            <button onClick={onToggleStar} className="text-2xl hover:scale-110 transition-transform">
              {isStarred ? '⭐' : '☆'}
            </button>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1.5 mb-4 text-sm">
          <a href={`tel:${formData.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-primary-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span className="font-medium">{formData.phone}</span>
          </a>
          <p className="text-slate-500 truncate text-xs">{formData.email}</p>
        </div>

        {/* Info */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">Vehicle</span><span className="font-semibold text-slate-800">{formData.vehicleType}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="font-semibold text-slate-800">{formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Credit</span><span className="font-semibold text-slate-800">{formData.creditRating || 'Cash'}</span></div>
        </div>

        {/* Status buttons */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {leadStatusOptions.slice(0, 3).map(opt => (
            <button key={opt.value} onClick={() => onStatusChange(opt.value)} className={`px-2 py-2 text-xs font-bold rounded-lg transition-all ${lead.status === opt.value ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].text} border ${STATUS_CONFIG[opt.value].border}` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {opt.label.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {leadStatusOptions.slice(3).map(opt => (
            <button key={opt.value} onClick={() => onStatusChange(opt.value)} className={`px-2 py-2 text-xs font-bold rounded-lg transition-all ${lead.status === opt.value ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].text} border ${STATUS_CONFIG[opt.value].border}` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {opt.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={onViewDetails} className="flex-1 text-xs">
            Details
          </Button>
          <Button size="sm" variant="secondary" onClick={onSendEmail} className="text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============ LEAD DETAIL POPUP ============
function LeadDetailPopup({ lead, licenseUrl, onStatusChange, onClose, onViewLicense, onSendEmail }: any) {
  const { formData } = lead;
  const config = STATUS_CONFIG[lead.status];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{formData.fullName}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full ${config.bg} ${config.text} border ${config.border}`}>
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              {leadStatusOptions.find(s => s.value === lead.status)?.label}
            </span>
            <span className="text-sm text-slate-500">{formatDate(lead.createdAt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${formData.phone}`}><Button variant="primary" size="sm">📞 Call</Button></a>
          <Button variant="secondary" size="sm" onClick={onSendEmail}>📧 Email</Button>
          {licenseUrl && <Button variant="secondary" size="sm" onClick={onViewLicense}>🪪 License</Button>}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Contact</h3>
          <div className="space-y-3">
            <DetailRow label="Phone" value={formData.phone} />
            <DetailRow label="Email" value={formData.email} />
            <DetailRow label="DOB" value={formData.dateOfBirth} />
            <DetailRow label="Best Time" value={formData.bestTimeToReach} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Vehicle</h3>
          <div className="space-y-3">
            <DetailRow label="Type" value={formData.vehicleType} />
            <DetailRow label="Payment" value={formData.paymentType} />
            <DetailRow label="Budget" value={formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget} />
            {formData.creditRating && <DetailRow label="Credit" value={formData.creditRating} />}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Update Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {leadStatusOptions.map(opt => (
            <button key={opt.value} onClick={() => onStatusChange(lead.id, opt.value)} className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${lead.status === opt.value ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].text} border-2 ${STATUS_CONFIG[opt.value].border} scale-105 shadow-md` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value || '-'}</span>
    </div>
  );
}

// ============ TEMPLATES VIEW ============
function TemplatesView({ templates, setTemplates }: { templates: EmailTemplate[]; setTemplates: (t: EmailTemplate[]) => void }) {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState(false);

  const saveTemplate = (template: EmailTemplate) => {
    if (templates.find(t => t.id === template.id)) {
      setTemplates(templates.map(t => t.id === template.id ? template : t));
    } else {
      setTemplates([...templates, template]);
    }
    setEditingTemplate(null);
    setNewTemplate(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Email Templates</h2>
          <p className="text-slate-500 mt-1">Send emails directly to clients</p>
        </div>
        <Button variant="primary" onClick={() => setNewTemplate(true)}>+ New Template</Button>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 mb-8">
        <h3 className="font-bold text-primary-900 mb-3">Variables</h3>
        <div className="flex flex-wrap gap-2">
          {['{{name}}', '{{email}}', '{{phone}}', '{{vehicle}}', '{{budget}}', '{{urgency}}', '{{credit}}'].map(v => (
            <code key={v} className="px-3 py-1.5 bg-white rounded-lg text-sm font-mono text-primary-700 border border-primary-200">{v}</code>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full mb-2 ${t.category === 'approval' ? 'bg-emerald-100 text-emerald-700' : t.category === 'reminder' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{t.category}</span>
                <h3 className="font-bold text-slate-900 text-lg">{t.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{t.subject}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(t)}>Edit</Button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 max-h-32 overflow-y-auto">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{t.body}</pre>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!editingTemplate || newTemplate} onClose={() => { setEditingTemplate(null); setNewTemplate(false); }} title={editingTemplate ? 'Edit Template' : 'New Template'} size="lg">
        <TemplateEditor template={editingTemplate || undefined} onSave={saveTemplate} onCancel={() => { setEditingTemplate(null); setNewTemplate(false); }} />
      </Modal>
    </motion.div>
  );
}

function TemplateEditor({ template, onSave, onCancel }: { template?: EmailTemplate; onSave: (t: EmailTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [category, setCategory] = useState(template?.category || 'custom');

  const handleSave = () => {
    onSave({
      id: template?.id || `template-${Date.now()}`,
      name, subject, body,
      category: category as any,
      createdAt: template?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-5">
      <Input label="Template Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Welcome Email" />
      <Select label="Category" options={[{ value: 'follow-up', label: 'Follow-up' }, { value: 'approval', label: 'Approval' }, { value: 'reminder', label: 'Reminder' }, { value: 'custom', label: 'Custom' }]} value={category} onChange={(e) => setCategory(e.target.value)} />
      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Thanks for your interest, {{name}}!" />
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Body</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none" />
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}

// ============ EMAIL COMPOSER ============
function EmailComposer({ lead, templates, onClose }: { lead: Lead; templates: EmailTemplate[]; onClose: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const vars: Record<string, string> = {
        '{{name}}': lead.formData.fullName,
        '{{email}}': lead.formData.email,
        '{{phone}}': lead.formData.phone,
        '{{vehicle}}': lead.formData.vehicleType,
        '{{budget}}': lead.formData.paymentType === 'finance' ? lead.formData.financeBudget || '' : lead.formData.cashBudget || '',
        '{{urgency}}': lead.formData.urgency,
        '{{credit}}': lead.formData.creditRating || 'N/A',
      };
      let subj = template.subject;
      let bod = template.body;
      Object.entries(vars).forEach(([k, v]) => {
        subj = subj.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v);
        bod = bod.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v);
      });
      setSubject(subj);
      setBody(bod);
    }
    setSelectedTemplate(templateId);
  };

  const sendEmail = async () => {
    if (!subject || !body) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: lead.formData.email,
          toName: lead.formData.fullName,
          subject,
          body,
        }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(onClose, 2000);
      } else {
        alert('Failed to send email. Check console.');
      }
    } catch (e) {
      console.error(e);
      alert('Error sending email');
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900">Email Sent!</h3>
        <p className="text-slate-500 mt-2">Email sent to {lead.formData.email}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-600">To: <strong>{lead.formData.fullName}</strong> ({lead.formData.email})</p>
      </div>

      <Select
        label="Choose Template"
        options={[{ value: '', label: 'Select a template...' }, ...templates.map(t => ({ value: t.id, label: t.name }))]}
        value={selectedTemplate}
        onChange={(e) => applyTemplate(e.target.value)}
      />

      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none" />
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={sendEmail} isLoading={isSending} disabled={!subject || !body}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          Send Email
        </Button>
      </div>
    </div>
  );
}

// ============ SHOWCASE VIEW ============
function ShowcaseView({ vehicles, onRefresh }: { vehicles: ShowcaseVehicle[]; onRefresh: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vehicle Showcase</h2>
          <p className="text-slate-500 mt-1">Featured vehicles on homepage</p>
        </div>
        <Button variant="primary" onClick={onRefresh}>Refresh</Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <p className="text-xl text-slate-400">No vehicles</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="aspect-video bg-slate-100">
                {v.imageUrl ? <img src={v.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-slate-900">{v.year} {v.make} {v.model}</h3>
                {v.price && <p className="text-primary-600 font-bold">{v.price}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============ HELPERS ============
function FilterButton({ label, count, active, onClick, dot }: { label: string; count?: number; active: boolean; onClick: () => void; dot?: string }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-between ${active ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
      <span className="flex items-center gap-2">
        {dot && <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : dot}`} />}
        {label}
      </span>
      {count !== undefined && <span className={`text-xs font-bold ${active ? 'text-white/80' : 'text-slate-400'}`}>{count}</span>}
    </button>
  );
}

function QuickActionCard({ title, desc, icon, onClick, bg }: any) {
  return (
    <motion.button whileHover={{ scale: 1.02, y: -4 }} onClick={onClick} className={`bg-gradient-to-br ${bg} text-white rounded-2xl p-6 text-left shadow-xl hover:shadow-2xl transition-shadow w-full`}>
      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="font-bold text-xl mb-1">{title}</h3>
      <p className="text-sm opacity-80">{desc}</p>
    </motion.button>
  );
}

// Weather Backgrounds
function SunshineBackground() {
  return <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-400" />;
}
function CloudyBackground() {
  return <div className="absolute inset-0 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700" />;
}
function RainyBackground() {
  return <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />;
}

// Icons
const PlusIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const BoltIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const CheckCircleIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClipboardIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const MailIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ImageIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
