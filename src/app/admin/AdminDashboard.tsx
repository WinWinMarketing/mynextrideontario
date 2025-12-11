'use client';

import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Select, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions, ShowcaseVehicle } from '@/lib/validation';
import { formatDate } from '@/lib/utils';
import { DEFAULT_TEMPLATES, EmailTemplate } from '@/lib/email';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'leads' | 'schedule' | 'templates' | 'analytics' | 'showcase';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; gradient: string }> = {
  'new': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400', gradient: 'from-slate-400 to-slate-600' },
  'working': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600' },
  'circle-back': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-500', gradient: 'from-cyan-400 to-cyan-600' },
  'approval': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500', gradient: 'from-emerald-400 to-emerald-600' },
  'dead': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500', gradient: 'from-red-400 to-red-600' },
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
  const [licenseModal, setLicenseModal] = useState<{ url: string; name: string; leadId: string } | null>(null);
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

  // Update lead status
  const updateStatus = async (leadId: string, status: LeadStatus, deadReason?: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, status, deadReason }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status, deadReason: deadReason as any } : l));
      if (detailModal?.id === leadId) setDetailModal({ ...detailModal, status, deadReason: deadReason as any });
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  // Save notes
  const saveNotes = async (leadId: string, notes: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, notes }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l));
      if (detailModal?.id === leadId) setDetailModal({ ...detailModal, notes });
    } catch (e) {
      console.error('Error saving notes:', e);
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

  // Delete showcase vehicle
  const deleteShowcaseVehicle = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/showcase?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShowcase(prev => prev.filter(v => v.id !== id));
      }
    } catch (e) {
      console.error('Error deleting vehicle:', e);
    }
  };

  // Open license - friendly URL
  const openLicense = (leadId: string, leadName: string) => {
    const url = licenseUrls[leadId];
    if (url) {
      setLicenseModal({ url, name: leadName, leadId });
    }
  };

  // Generate friendly license URL
  const getFriendlyLicenseUrl = (leadId: string, leadName: string) => {
    const safeName = leadName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `${window.location.origin}/api/admin/leads/${leadId}/license?name=${safeName}`;
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
    circleBack: leads.filter(l => l.status === 'circle-back').length,
    approval: leads.filter(l => l.status === 'approval').length,
    dead: leads.filter(l => l.status === 'dead').length,
  };
  const approvalRate = stats.total > 0 ? Math.round((stats.approval / stats.total) * 100) : 0;
  const mood = approvalRate >= 50 ? 'great' : approvalRate >= 20 ? 'good' : 'poor';

  return (
    <div className="min-h-screen bg-slate-100">
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
            {(['dashboard', 'leads', 'schedule', 'templates', 'analytics', 'showcase'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
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
            <DashboardView key="dashboard" stats={stats} approvalRate={approvalRate} mood={mood} onViewLeads={() => setActiveTab('leads')} onViewSchedule={() => setActiveTab('schedule')} onViewAnalytics={() => setActiveTab('analytics')} />
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

          {activeTab === 'schedule' && (
            <ScheduleView
              key="schedule"
              leads={leads}
              onStatusChange={updateStatus}
              onViewDetails={setDetailModal}
              onToggleStar={toggleStar}
              starredLeads={starredLeads}
              templates={templates}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesView key="templates" templates={templates} setTemplates={setTemplates} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView key="analytics" leads={leads} stats={stats} approvalRate={approvalRate} />
          )}

          {activeTab === 'showcase' && (
            <ShowcaseView key="showcase" vehicles={showcase} onRefresh={fetchShowcase} onDelete={deleteShowcaseVehicle} />
          )}
        </AnimatePresence>
      </div>

      {/* LICENSE MODAL */}
      <Modal isOpen={!!licenseModal} onClose={() => setLicenseModal(null)} title={`License: ${licenseModal?.name}`} size="xl">
        {licenseModal && (
          <div className="space-y-4">
            <img src={licenseModal.url} alt="License" className="w-full rounded-xl shadow-lg" />
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">Shareable URL:</p>
              <code className="text-sm text-slate-700 break-all">{getFriendlyLicenseUrl(licenseModal.leadId, licenseModal.name)}</code>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(getFriendlyLicenseUrl(licenseModal.leadId, licenseModal.name))} className="flex-1">
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
            onSaveNotes={saveNotes}
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

// ============ DASHBOARD VIEW ============
function DashboardView({ stats, approvalRate, mood, onViewLeads, onViewSchedule, onViewAnalytics }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-6">
      {/* Hero Card with Weather Animation */}
      <div className="relative h-52 mb-8 rounded-3xl overflow-hidden shadow-2xl">
        {mood === 'great' && <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500" />}
        {mood === 'good' && <div className="absolute inset-0 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600" />}
        {mood === 'poor' && <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800" />}
        
        {/* Animated elements */}
        {mood === 'great' && (
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-8 right-12 w-20 h-20 rounded-full bg-yellow-300 shadow-lg shadow-yellow-400/50" />
        )}
        {mood === 'poor' && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-8 bg-slate-400/30 rounded-full"
                style={{ left: `${5 + i * 5}%`, top: -32 }}
                animate={{ y: [0, 300], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
          <motion.h2 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl md:text-6xl font-bold mb-2">
            {stats.total} Total Leads
          </motion.h2>
          <p className="text-xl text-white/80">{approvalRate}% Approval Rate</p>
          <p className="text-sm text-white/60 mt-2">
            {mood === 'great' ? '☀️ Excellent performance!' : mood === 'good' ? '⛅ Good progress' : '🌧️ Room for improvement'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'New', value: stats.new, color: 'slate' },
          { label: 'Working', value: stats.working, color: 'amber' },
          { label: 'Circle Back', value: stats.circleBack, color: 'cyan' },
          { label: 'Approved', value: stats.approval, color: 'emerald' },
          { label: 'Dead', value: stats.dead, color: 'red' },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -4, scale: 1.02 }} className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-5">
        <QuickActionCard title="View Leads" desc="Manage your pipeline" icon="📋" onClick={onViewLeads} bg="from-primary-500 to-primary-700" />
        <QuickActionCard title="Lead Schedule" desc="Visual pipeline flow" icon="📊" onClick={onViewSchedule} bg="from-cyan-500 to-cyan-700" />
        <QuickActionCard title="Analytics" desc="Performance insights" icon="📈" onClick={onViewAnalytics} bg="from-emerald-500 to-emerald-700" />
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Filter by Status</h3>
            <div className="space-y-2">
              <FilterButton label="All Leads" count={stats.total} active={statusFilter === 'all'} onClick={() => onFilterChange('all')} />
              {leadStatusOptions.map(s => (
                <FilterButton key={s.value} label={s.label} active={statusFilter === s.value} onClick={() => onFilterChange(s.value)} dot={STATUS_CONFIG[s.value].dot} />
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

// ============ SCHEDULE VIEW - KANBAN ============
function ScheduleView({ leads, onStatusChange, onViewDetails, onToggleStar, starredLeads, templates }: any) {
  const columns: { status: LeadStatus; title: string; color: string }[] = [
    { status: 'new', title: 'New Leads', color: 'slate' },
    { status: 'working', title: 'Working', color: 'amber' },
    { status: 'circle-back', title: 'Circle Back', color: 'cyan' },
    { status: 'approval', title: 'Approved', color: 'emerald' },
    { status: 'dead', title: 'Dead', color: 'red' },
  ];

  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const handleDragStart = (lead: Lead) => setDraggedLead(lead);
  const handleDragEnd = () => setDraggedLead(null);

  const handleDrop = (status: LeadStatus) => {
    if (draggedLead && draggedLead.status !== status) {
      onStatusChange(draggedLead.id, status);
    }
    setDraggedLead(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Lead Schedule</h2>
        <p className="text-slate-500">Drag and drop leads between columns to update their status</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {columns.map((col) => {
          const colLeads = leads.filter((l: Lead) => l.status === col.status);
          
          return (
            <div
              key={col.status}
              className={`flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.status)}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 bg-gradient-to-r ${STATUS_CONFIG[col.status].gradient} text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{col.title}</h3>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-medium">{colLeads.length}</span>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                {colLeads.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Drop leads here
                  </div>
                ) : (
                  colLeads.map((lead: Lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      onDragEnd={handleDragEnd}
                      className={`bg-slate-50 rounded-xl p-3 cursor-grab active:cursor-grabbing border border-slate-200 hover:border-slate-300 transition-all ${
                        draggedLead?.id === lead.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{lead.formData.fullName}</h4>
                        <button onClick={() => onToggleStar(lead.id)} className="text-lg flex-shrink-0">
                          {starredLeads.has(lead.id) ? '⭐' : '☆'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{lead.formData.vehicleType} • {lead.formData.phone}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewDetails(lead)}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============ ANALYTICS VIEW ============
function AnalyticsView({ leads, stats, approvalRate }: any) {
  const conversionRate = stats.total > 0 ? Math.round(((stats.approval + stats.working) / stats.total) * 100) : 0;
  const deadRate = stats.total > 0 ? Math.round((stats.dead / stats.total) * 100) : 0;

  const deadReasons = leads
    .filter((l: Lead) => l.status === 'dead' && l.deadReason)
    .reduce((acc: Record<string, number>, l: Lead) => {
      acc[l.deadReason!] = (acc[l.deadReason!] || 0) + 1;
      return acc;
    }, {});

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-500">Performance insights for your leads</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Leads', value: stats.total, icon: '📊', color: 'primary' },
          { label: 'Approval Rate', value: `${approvalRate}%`, icon: '✅', color: 'emerald' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: '📈', color: 'amber' },
          { label: 'Dead Rate', value: `${deadRate}%`, icon: '❌', color: 'red' },
        ].map((metric) => (
          <motion.div
            key={metric.label}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{metric.icon}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{metric.value}</p>
            <p className="text-sm text-slate-500">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-4">Pipeline Distribution</h3>
          <div className="space-y-3">
            {leadStatusOptions.map((s) => {
              const count = leads.filter((l: Lead) => l.status === s.value).length;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              
              return (
                <div key={s.value}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">{s.label}</span>
                    <span className="text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full bg-gradient-to-r ${STATUS_CONFIG[s.value].gradient}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-4">Dead Lead Reasons</h3>
          {Object.keys(deadReasons).length === 0 ? (
            <p className="text-slate-400 text-center py-8">No dead lead data yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(deadReasons).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <span className="text-sm text-red-800 capitalize">{reason.replace(/-/g, ' ')}</span>
                  <span className="text-sm font-bold text-red-600">{count as number}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
            {hasLicense && (
              <button
                onClick={onViewLicense}
                className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                title="View License"
              >
                🪪
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
            📞 <span className="font-medium">{formData.phone}</span>
          </a>
          <p className="text-slate-500 truncate text-xs">✉️ {formData.email}</p>
        </div>

        {/* Info */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">Vehicle</span><span className="font-semibold text-slate-800">{formData.vehicleType}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="font-semibold text-slate-800">{formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}</span></div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={onViewDetails} className="flex-1 text-xs">
            Details
          </Button>
          <Button size="sm" variant="secondary" onClick={onSendEmail} className="text-xs">
            ✉️
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============ LEAD DETAIL POPUP ============
function LeadDetailPopup({ lead, licenseUrl, onStatusChange, onSaveNotes, onClose, onViewLicense, onSendEmail }: any) {
  const { formData } = lead;
  const [notes, setNotes] = useState(lead.notes || '');
  const [selectedDeadReason, setSelectedDeadReason] = useState(lead.deadReason || '');
  const config = STATUS_CONFIG[lead.status];

  const handleSaveNotes = () => {
    onSaveNotes(lead.id, notes);
  };

  const handleDeadReasonChange = (reason: string) => {
    setSelectedDeadReason(reason);
    onStatusChange(lead.id, 'dead', reason);
  };

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
          <Button variant="secondary" size="sm" onClick={onSendEmail}>✉️ Email</Button>
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

      {/* Status Update */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Update Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {leadStatusOptions.map(opt => (
            <button key={opt.value} onClick={() => onStatusChange(lead.id, opt.value)} className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${lead.status === opt.value ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].text} border-2 ${STATUS_CONFIG[opt.value].border} scale-105 shadow-md` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Dead Reason Selector */}
        {lead.status === 'dead' && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl">
            <label className="block text-sm font-semibold text-red-800 mb-2">Dead Lead Reason</label>
            <Select
              value={selectedDeadReason}
              onChange={(e) => handleDeadReasonChange(e.target.value)}
              options={[{ value: '', label: 'Select reason...' }, ...deadReasonOptions]}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this lead..."
          className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
        />
        <div className="mt-3 flex justify-end">
          <Button variant="primary" size="sm" onClick={handleSaveNotes}>
            💾 Save Notes
          </Button>
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
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Email Templates</h2>
          <p className="text-slate-500 mt-1">Send emails directly to clients</p>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 mb-8">
        <h3 className="font-bold text-primary-900 mb-3">Available Variables</h3>
        <div className="flex flex-wrap gap-2">
          {['{{name}}', '{{email}}', '{{phone}}', '{{vehicle}}', '{{budget}}'].map(v => (
            <code key={v} className="px-3 py-1.5 bg-white rounded-lg text-sm font-mono text-primary-700 border border-primary-200">{v}</code>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2">{t.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{t.subject}</p>
            <div className="bg-slate-50 rounded-xl p-4 max-h-32 overflow-y-auto">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{t.body}</pre>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
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
        body: JSON.stringify({ toEmail: lead.formData.email, toName: lead.formData.fullName, subject, body }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(onClose, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
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
          ✉️ Send Email
        </Button>
      </div>
    </div>
  );
}

// ============ SHOWCASE VIEW ============
function ShowcaseView({ vehicles, onRefresh, onDelete }: { vehicles: ShowcaseVehicle[]; onRefresh: () => void; onDelete: (id: string) => void }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    await onDelete(id);
    setIsDeleting(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vehicle Showcase</h2>
          <p className="text-slate-500 mt-1">Featured vehicles on homepage ({vehicles.length} vehicles)</p>
        </div>
        <Button variant="secondary" onClick={onRefresh}>🔄 Refresh</Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <p className="text-xl text-slate-400 mb-4">No vehicles in showcase</p>
          <p className="text-slate-500">The showcase section will be hidden on the homepage until you add vehicles.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
              <div className="aspect-video bg-slate-100">
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🚗</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-slate-900">{v.year} {v.make} {v.model}</h3>
                {v.price && <p className="text-primary-600 font-bold">{v.price}</p>}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(v.id)}
                    isLoading={isDeleting === v.id}
                    className="flex-1 text-red-600 hover:bg-red-50"
                  >
                    🗑️ Remove
                  </Button>
                </div>
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
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-xl mb-1">{title}</h3>
      <p className="text-sm opacity-80">{desc}</p>
    </motion.button>
  );
}
