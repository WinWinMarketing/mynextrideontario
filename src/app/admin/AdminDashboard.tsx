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
  const [detailModal, setDetailModal] = useState<Lead | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<{ lead: Lead; template?: EmailTemplate } | null>(null);
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
        
        // Fetch license URLs in parallel
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
      {/* HEADER - Centered Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-16 px-6 flex items-center justify-between">
          {/* Logo */}
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

          {/* CENTERED Navigation */}
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

          {/* Sign Out */}
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
            <DashboardView stats={stats} approvalRate={approvalRate} mood={mood} onViewLeads={() => setActiveTab('leads')} onViewTemplates={() => setActiveTab('templates')} onViewShowcase={() => setActiveTab('showcase')} />
          )}

          {activeTab === 'leads' && (
            <LeadsView
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
              onViewImage={setEnlargedImage}
              onSendEmail={(lead) => setEmailModal({ lead })}
              stats={stats}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesView templates={templates} setTemplates={setTemplates} />
          )}

          {activeTab === 'showcase' && (
            <ShowcaseView vehicles={showcase} onRefresh={fetchShowcase} />
          )}
        </AnimatePresence>
      </div>

      {/* LEAD DETAIL MODAL - Responsive */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="" size="full">
        {detailModal && (
          <LeadDetailPopup
            lead={detailModal}
            licenseUrl={licenseUrls[detailModal.id]}
            onStatusChange={updateStatus}
            onClose={() => setDetailModal(null)}
            onViewImage={setEnlargedImage}
            onSendEmail={() => {
              setDetailModal(null);
              setEmailModal({ lead: detailModal });
            }}
          />
        )}
      </Modal>

      {/* IMAGE MODAL */}
      <Modal isOpen={!!enlargedImage} onClose={() => setEnlargedImage(null)} title="Driver's License" size="xl">
        {enlargedImage && (
          <div className="space-y-4">
            <img src={enlargedImage} alt="License" className="w-full rounded-xl shadow-2xl" />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(enlargedImage)} className="flex-1">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copy URL
              </Button>
              <a href={enlargedImage} download className="flex-1">
                <Button variant="primary" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* EMAIL MODAL */}
      <Modal isOpen={!!emailModal} onClose={() => setEmailModal(null)} title="Send Email" size="xl">
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

// ============ DASHBOARD VIEW ============
function DashboardView({ stats, approvalRate, mood, onViewLeads, onViewTemplates, onViewShowcase }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto px-6">
      {/* Hero Card with Weather */}
      <div className="relative h-56 mb-8 rounded-3xl overflow-hidden shadow-xl">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'New Leads', value: stats.new, icon: <PlusIcon />, color: 'slate' },
          { label: 'Working', value: stats.working, icon: <BoltIcon />, color: 'amber' },
          { label: 'Approved', value: stats.approval, icon: <CheckCircleIcon />, color: 'emerald' },
          { label: 'Dead', value: stats.dead, icon: <XCircleIcon />, color: 'red' },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <QuickActionCard title="View All Leads" desc="Manage your pipeline" icon={<ClipboardIcon />} onClick={onViewLeads} color="primary" />
        <QuickActionCard title="Email Templates" desc="Mail merge system" icon={<MailIcon />} onClick={onViewTemplates} color="amber" />
        <QuickActionCard title="Vehicle Showcase" desc="Manage featured inventory" icon={<ImageIcon />} onClick={onViewShowcase} color="emerald" />
      </div>
    </motion.div>
  );
}

// ============ LEADS VIEW ============
function LeadsView({ leads, isLoading, selectedMonth, selectedYear, statusFilter, licenseUrls, starredLeads, onMonthChange, onYearChange, onFilterChange, onToggleStar, onStatusChange, onViewDetails, onViewImage, onSendEmail, stats }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 px-6 max-w-[1800px] mx-auto">
      {/* LEFT SIDEBAR - Filters */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-5">
          {/* Period Filter */}
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

          {/* Status Filter */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Filter by Status</h3>
            <div className="space-y-2">
              <FilterButton label="All Leads" count={stats.total} active={statusFilter === 'all'} onClick={() => onFilterChange('all')} />
              {leadStatusOptions.map(s => (
                <FilterButton
                  key={s.value}
                  label={s.label}
                  count={leads.filter((l: Lead) => l.status === s.value).length}
                  active={statusFilter === s.value}
                  onClick={() => onFilterChange(s.value)}
                  dot={STATUS_CONFIG[s.value].dot}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT - Cards */}
      <main className="flex-1 min-w-0">
        {/* Mobile Filters */}
        <div className="lg:hidden flex gap-3 mb-6">
          <Select
            options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString('en', { month: 'short' }) }))}
            value={String(selectedMonth)}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
          />
          <Select
            options={[{ value: 'all', label: 'All' }, ...leadStatusOptions.map(s => ({ value: s.value, label: s.label }))]}
            value={statusFilter}
            onChange={(e) => onFilterChange(e.target.value as LeadStatus | 'all')}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{leads.length} Leads</h2>
        </div>

        {/* Cards Grid */}
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
                licenseUrl={licenseUrls[lead.id]}
                isStarred={starredLeads.has(lead.id)}
                onToggleStar={() => onToggleStar(lead.id)}
                onStatusChange={(s: LeadStatus) => onStatusChange(lead.id, s)}
                onViewDetails={() => onViewDetails(lead)}
                onViewImage={() => licenseUrls[lead.id] && onViewImage(licenseUrls[lead.id])}
                onSendEmail={() => onSendEmail(lead)}
              />
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}

// ============ LEAD CARD - Info LEFT, Photo RIGHT ============
function LeadCard({ lead, licenseUrl, isStarred, onToggleStar, onStatusChange, onViewDetails, onViewImage, onSendEmail }: any) {
  const { formData } = lead;
  const config = STATUS_CONFIG[lead.status];

  return (
    <motion.div layout whileHover={{ y: -4 }} className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all ${isStarred ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100 hover:border-slate-200'}`}>
      <div className="flex h-full">
        {/* LEFT - Info */}
        <div className="flex-1 p-5 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-slate-900 truncate">{formData.fullName}</h3>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} border ${config.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {leadStatusOptions.find(s => s.value === lead.status)?.label}
              </div>
            </div>
            <button onClick={onToggleStar} className="text-2xl hover:scale-110 transition-transform flex-shrink-0">
              {isStarred ? '⭐' : '☆'}
            </button>
          </div>

          {/* Contact */}
          <div className="space-y-1.5 mb-4 text-sm">
            <a href={`tel:${formData.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-primary-600">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <span className="font-medium">{formData.phone}</span>
            </a>
            <p className="text-slate-500 truncate text-xs">{formData.email}</p>
          </div>

          {/* Info Grid */}
          <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">Vehicle</span><span className="font-semibold text-slate-800">{formData.vehicleType}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="font-semibold text-slate-800">{formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Credit</span><span className="font-semibold text-slate-800">{formData.creditRating || 'Cash'}</span></div>
          </div>

          {/* Status Buttons - Large */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {leadStatusOptions.slice(0, 3).map(opt => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={`px-2 py-2 text-xs font-bold rounded-lg transition-all ${
                  lead.status === opt.value 
                    ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].text} border ${STATUS_CONFIG[opt.value].border}` 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {opt.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {leadStatusOptions.slice(3).map(opt => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={`px-2 py-2 text-xs font-bold rounded-lg transition-all ${
                  lead.status === opt.value 
                    ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].text} border ${STATUS_CONFIG[opt.value].border}` 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {opt.label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={onViewDetails} className="flex-1 text-xs">
              View Details
            </Button>
            <Button size="sm" variant="secondary" onClick={onSendEmail} className="text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </Button>
          </div>
        </div>

        {/* RIGHT - License Photo */}
        {licenseUrl && (
          <div className="w-36 flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer group relative" onClick={onViewImage}>
            <img src={licenseUrl} alt="License" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl">
                🔍 View
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============ LEAD DETAIL POPUP - Responsive Desktop/Mobile ============
function LeadDetailPopup({ lead, licenseUrl, onStatusChange, onClose, onViewImage, onSendEmail }: any) {
  const { formData } = lead;
  const config = STATUS_CONFIG[lead.status];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-6 md:hidden">
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-lg font-bold">Lead Details</h2>
        <div className="w-6" />
      </div>

      {/* Header */}
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
          <a href={`tel:${formData.phone}`}>
            <Button variant="primary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call
            </Button>
          </a>
          <Button variant="secondary" size="sm" onClick={onSendEmail}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Email
          </Button>
        </div>
      </div>

      {/* License Image */}
      {licenseUrl && (
        <div className="mb-8 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 cursor-pointer" onClick={onViewImage}>
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-bold text-emerald-800">Driver's License Uploaded</span>
            <span className="text-sm text-emerald-600 ml-auto">Click to enlarge →</span>
          </div>
          <img src={licenseUrl} alt="License" className="w-full max-h-64 object-contain rounded-xl" />
        </div>
      )}

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Contact Information</h3>
          <div className="space-y-4">
            <DetailRow label="Phone" value={formData.phone} />
            <DetailRow label="Email" value={formData.email} />
            <DetailRow label="Date of Birth" value={formData.dateOfBirth} />
            <DetailRow label="Best Time" value={formData.bestTimeToReach} />
            <DetailRow label="License Class" value={formData.licenseClass?.toUpperCase()} />
          </div>
        </div>

        {/* Vehicle Preferences */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Vehicle Preferences</h3>
          <div className="space-y-4">
            <DetailRow label="Vehicle Type" value={formData.vehicleType} />
            <DetailRow label="Urgency" value={formData.urgency} />
            <DetailRow label="Payment Type" value={formData.paymentType} />
            <DetailRow label="Budget" value={formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget} />
            {formData.paymentType === 'finance' && <DetailRow label="Credit Rating" value={formData.creditRating} />}
          </div>
        </div>

        {/* Trade-In */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Trade-In Details</h3>
          <div className="space-y-4">
            <DetailRow label="Has Trade-In" value={formData.tradeIn} />
            {(formData.tradeIn === 'yes' || formData.tradeIn === 'unsure') && (
              <>
                <DetailRow label="Year" value={formData.tradeInYear} />
                <DetailRow label="Make" value={formData.tradeInMake} />
                <DetailRow label="Model" value={formData.tradeInModel} />
                <DetailRow label="Mileage" value={formData.tradeInMileage || 'Not provided'} />
                <DetailRow label="VIN" value={formData.tradeInVin || 'Not provided'} />
              </>
            )}
          </div>
        </div>

        {/* Cosigner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Cosigner Information</h3>
          <div className="space-y-4">
            <DetailRow label="Has Cosigner" value={formData.cosigner} />
            {formData.cosigner === 'yes' && (
              <>
                <DetailRow label="Name" value={formData.cosignerFullName} />
                <DetailRow label="Phone" value={formData.cosignerPhone} />
                <DetailRow label="Email" value={formData.cosignerEmail} />
                <DetailRow label="DOB" value={formData.cosignerDateOfBirth || 'Not provided'} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Update */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Update Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {leadStatusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(lead.id, opt.value)}
              className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                lead.status === opt.value 
                  ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].text} border-2 ${STATUS_CONFIG[opt.value].border} scale-105 shadow-md` 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Notes</h3>
        <div className="bg-slate-50 rounded-xl p-4 min-h-24">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.notes || 'No notes yet'}</p>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Email Templates</h2>
          <p className="text-slate-500 mt-1">Mail merge templates for quick communication</p>
        </div>
        <Button variant="primary" onClick={() => setNewTemplate(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Template
        </Button>
      </div>

      {/* Variables Reference */}
      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 mb-8">
        <h3 className="font-bold text-primary-900 mb-3">Available Variables</h3>
        <div className="flex flex-wrap gap-2">
          {['{{name}}', '{{email}}', '{{phone}}', '{{vehicle}}', '{{budget}}', '{{urgency}}', '{{credit}}'].map(v => (
            <code key={v} className="px-3 py-1.5 bg-white rounded-lg text-sm font-mono text-primary-700 border border-primary-200">{v}</code>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{template.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{template.subject}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(template)}>Edit</Button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 max-h-40 overflow-y-auto">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{template.body}</pre>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/New Template Modal */}
      <Modal isOpen={!!editingTemplate || newTemplate} onClose={() => { setEditingTemplate(null); setNewTemplate(false); }} title={editingTemplate ? 'Edit Template' : 'New Template'} size="lg">
        <TemplateEditor
          template={editingTemplate || undefined}
          onSave={saveTemplate}
          onCancel={() => { setEditingTemplate(null); setNewTemplate(false); }}
        />
      </Modal>
    </motion.div>
  );
}

function TemplateEditor({ template, onSave, onCancel }: { template?: EmailTemplate; onSave: (t: EmailTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');

  const handleSave = () => {
    onSave({
      id: template?.id || `template-${Date.now()}`,
      name,
      subject,
      body,
      createdAt: template?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-5">
      <Input label="Template Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Welcome Email" />
      <Input label="Subject Line" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Thanks for your interest, {{name}}!" />
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none font-mono text-sm"
          placeholder="Hi {{name}},&#10;&#10;Thank you for your interest in..."
        />
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Template</Button>
      </div>
    </div>
  );
}

// ============ EMAIL COMPOSER ============
function EmailComposer({ lead, templates, onClose }: { lead: Lead; templates: EmailTemplate[]; onClose: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

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
        subj = subj.replace(new RegExp(k, 'g'), v);
        bod = bod.replace(new RegExp(k, 'g'), v);
      });
      setSubject(subj);
      setBody(bod);
    }
    setSelectedTemplate(templateId);
  };

  const openMailClient = () => {
    const mailtoLink = `mailto:${lead.formData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-600">Sending to: <strong>{lead.formData.fullName}</strong> ({lead.formData.email})</p>
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
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={openMailClient}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          Open in Mail Client
        </Button>
      </div>
    </div>
  );
}

// ============ SHOWCASE VIEW ============
function ShowcaseView({ vehicles, onRefresh }: { vehicles: ShowcaseVehicle[]; onRefresh: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vehicle Showcase</h2>
          <p className="text-slate-500 mt-1">Featured vehicles displayed on homepage carousel</p>
        </div>
        <Button variant="primary" onClick={onRefresh}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="text-xl text-slate-400 mb-4">No vehicles in showcase</p>
          <p className="text-slate-500">Add vehicles to display on your homepage</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              {v.imageUrl ? (
                <div className="aspect-video bg-slate-100">
                  <img src={v.imageUrl} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-slate-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <div className="p-5">
                <h3 className="font-bold text-lg text-slate-900">{v.year} {v.make} {v.model}</h3>
                {v.trim && <p className="text-slate-500 text-sm">{v.trim}</p>}
                <div className="flex items-center gap-4 mt-3 text-sm">
                  {v.price && <span className="font-bold text-primary-600">${v.price}</span>}
                  {v.mileage && <span className="text-slate-500">{v.mileage} km</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============ HELPER COMPONENTS ============
function FilterButton({ label, count, active, onClick, dot }: { label: string; count?: number; active: boolean; onClick: () => void; dot?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-between ${
        active ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span className="flex items-center gap-2">
        {dot && <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : dot}`} />}
        {label}
      </span>
      {count !== undefined && (
        <span className={`text-xs font-bold ${active ? 'text-white/80' : 'text-slate-400'}`}>{count}</span>
      )}
    </button>
  );
}

function QuickActionCard({ title, desc, icon, onClick, color }: any) {
  const bgColors: Record<string, string> = {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-700 text-white',
    amber: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
    emerald: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white',
  };
  return (
    <motion.button whileHover={{ scale: 1.02, y: -4 }} onClick={onClick} className={`${bgColors[color]} rounded-2xl p-6 text-left shadow-xl hover:shadow-2xl transition-shadow`}>
      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm opacity-80">{desc}</p>
    </motion.button>
  );
}

// Weather Backgrounds
function SunshineBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-400">
      {[...Array(15)].map((_, i) => (
        <motion.div key={i} className="absolute w-2 h-2 bg-yellow-200/50 rounded-full" style={{ top: `${20 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%` }} animate={{ y: [0, -20, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }} />
      ))}
    </div>
  );
}

function CloudyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700">
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="absolute bg-white/10 rounded-full blur-2xl" style={{ width: `${100 + Math.random() * 80}px`, height: `${40 + Math.random() * 30}px`, top: `${25 + i * 10}%`, left: `${i * 15}%` }} animate={{ x: [0, 40, 0] }} transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, ease: 'linear' }} />
      ))}
    </div>
  );
}

function RainyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
      {[...Array(30)].map((_, i) => (
        <motion.div key={i} className="absolute w-0.5 bg-blue-300/40" style={{ left: `${Math.random() * 100}%`, height: `${20 + Math.random() * 30}px` }} animate={{ y: ['0vh', '100vh'], opacity: [0, 1, 0] }} transition={{ duration: 0.8 + Math.random() * 0.3, repeat: Infinity, delay: Math.random() * 2, ease: 'linear' }} />
      ))}
    </div>
  );
}

// Icons
const PlusIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const BoltIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const CheckCircleIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClipboardIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const MailIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ImageIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
