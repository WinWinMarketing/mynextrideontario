'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Select, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions, ShowcaseVehicle } from '@/lib/validation';
import { formatDate } from '@/lib/utils';
import { DEFAULT_TEMPLATES, EmailTemplate } from '@/lib/email';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'leads' | 'funnel' | 'templates' | 'showcase';

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

  // Fetch leads
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
      if (res.ok) {
        setShowcase(prev => prev.filter(v => v.id !== id));
      }
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
      if (res.ok) {
        setShowcaseEnabled(newEnabled);
      }
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="h-14 px-8 flex items-center justify-between max-w-[2000px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-sm">Admin</span>
          </div>

          <nav className="flex gap-1">
            {(['dashboard', 'leads', 'funnel', 'templates', 'showcase'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-primary-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'funnel' ? 'Pipeline' : tab}
              </button>
            ))}
          </nav>

          <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="pt-14 min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardView key="dash" stats={stats} leads={leads} onNav={setActiveTab} />
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
              onSendEmail={(lead) => setEmailModal({ lead })}
              stats={stats}
            />
          )}
          {activeTab === 'funnel' && (
            <FunnelView
              key="funnel"
              leads={leads}
              onStatusChange={updateStatus}
              onViewDetails={setDetailModal}
              starredLeads={starredLeads}
              onToggleStar={toggleStar}
            />
          )}
          {activeTab === 'templates' && (
            <TemplatesView key="templates" templates={templates} />
          )}
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

// ============ DASHBOARD VIEW ============
function DashboardView({ stats, leads, onNav }: { stats: any; leads: Lead[]; onNav: (tab: TabType) => void }) {
  const approvalRate = stats.total > 0 ? Math.round((stats.approval / stats.total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'bg-slate-800' },
            { label: 'New', value: stats.new, color: 'bg-slate-500' },
            { label: 'Working', value: stats.working, color: 'bg-amber-500' },
            { label: 'Circle Back', value: stats.circleBack, color: 'bg-cyan-500' },
            { label: 'Approved', value: stats.approval, color: 'bg-emerald-500' },
            { label: 'Dead', value: stats.dead, color: 'bg-red-500' },
          ].map((s) => (
            <motion.div
              key={s.label}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm"
            >
              <div className={`w-3 h-3 rounded-full ${s.color} mb-3`} />
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <ActionCard title="View Leads" desc="Manage your pipeline" onClick={() => onNav('leads')} />
          <ActionCard title="Pipeline View" desc="Visual funnel system" onClick={() => onNav('funnel')} />
          <ActionCard title="Templates" desc="Email templates" onClick={() => onNav('templates')} />
        </div>

        {/* Performance */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Performance Overview</h3>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary-600">{approvalRate}%</p>
              <p className="text-sm text-slate-500 mt-1">Approval Rate</p>
            </div>
            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${approvalRate}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-primary-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm text-left hover:border-primary-300 transition-colors"
    >
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </motion.button>
  );
}

// ============ LEADS VIEW ============
function LeadsView({ leads, isLoading, selectedMonth, selectedYear, statusFilter, licenseUrls, starredLeads, onMonthChange, onYearChange, onFilterChange, onToggleStar, onStatusChange, onViewDetails, onSendEmail, stats }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/50 p-6 flex-shrink-0 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Period</label>
            <div className="mt-2 space-y-2">
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

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</label>
            <div className="mt-2 space-y-1">
              <FilterBtn label="All" count={stats.total} active={statusFilter === 'all'} onClick={() => onFilterChange('all')} />
              {leadStatusOptions.map(s => (
                <FilterBtn key={s.value} label={s.label} active={statusFilter === s.value} onClick={() => onFilterChange(s.value)} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">{leads.length} Leads</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-3 border-slate-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-20 text-slate-400">No leads found</div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
      </div>
    </motion.div>
  );
}

function FilterBtn({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span className="flex justify-between">
        {label}
        {count !== undefined && <span className={active ? 'text-white/70' : 'text-slate-400'}>{count}</span>}
      </span>
    </button>
  );
}

// ============ FUNNEL VIEW - Interactive Pipeline ============
function FunnelView({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: any) {
  const [zoomedStage, setZoomedStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const stages = [
    { id: 'new', label: 'New Leads', color: '#64748b' },
    { id: 'working', label: 'Working', color: '#f59e0b' },
    { id: 'circle-back', label: 'Circle Back', color: '#06b6d4' },
    { id: 'approval', label: 'Approved', color: '#10b981' },
    { id: 'dead', label: 'Dead', color: '#ef4444' },
  ];

  const handleDrop = (stageId: string) => {
    if (draggedLead && draggedLead.status !== stageId) {
      onStatusChange(draggedLead.id, stageId);
    }
    setDraggedLead(null);
  };

  const getStageLeads = (stageId: string) => leads.filter((l: Lead) => l.status === stageId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-56px)] p-8 overflow-hidden">
      <div className="max-w-[2000px] mx-auto h-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Pipeline</h2>
          <p className="text-sm text-slate-500">Drag leads between stages. Click a stage to zoom in.</p>
        </div>

        {/* Funnel Flow */}
        <div className="relative h-[calc(100%-80px)]">
          {zoomedStage ? (
            // Zoomed-in view of a single stage
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setZoomedStage(null)}
                  className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  ← Back to Pipeline
                </button>
                <h3 className="text-lg font-semibold" style={{ color: stages.find(s => s.id === zoomedStage)?.color }}>
                  {stages.find(s => s.id === zoomedStage)?.label} ({getStageLeads(zoomedStage).length})
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto max-h-[calc(100%-60px)]">
                {getStageLeads(zoomedStage).map((lead: Lead) => (
                  <motion.div
                    key={lead.id}
                    layout
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 truncate">{lead.formData.fullName}</h4>
                      <button onClick={() => onToggleStar(lead.id)} className="text-lg">
                        {starredLeads.has(lead.id) ? '⭐' : '☆'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{lead.formData.vehicleType} • {lead.formData.phone}</p>
                    {lead.status === 'dead' && lead.deadReason && (
                      <div className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded mb-2 capitalize">
                        {lead.deadReason.replace(/-/g, ' ')}
                      </div>
                    )}
                    <button
                      onClick={() => onViewDetails(lead)}
                      className="text-xs text-primary-600 font-medium hover:underline"
                    >
                      View Details
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            // Pipeline overview
            <div className="flex gap-4 h-full">
              {stages.map((stage, idx) => {
                const stageLeads = getStageLeads(stage.id);
                const size = Math.max(180, 100 + stageLeads.length * 20);

                return (
                  <motion.div
                    key={stage.id}
                    className="flex-1 flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(stage.id)}
                  >
                    {/* Stage Header */}
                    <button
                      onClick={() => setZoomedStage(stage.id)}
                      className="mb-3 text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{stage.label}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                      </div>
                    </button>

                    {/* Stage Content */}
                    <div
                      className="flex-1 rounded-2xl border-2 border-dashed p-3 overflow-y-auto transition-colors"
                      style={{ borderColor: `${stage.color}40`, backgroundColor: `${stage.color}05` }}
                    >
                      <div className="space-y-2">
                        {stageLeads.slice(0, 10).map((lead: Lead) => (
                          <motion.div
                            key={lead.id}
                            draggable
                            onDragStart={() => setDraggedLead(lead)}
                            onDragEnd={() => setDraggedLead(null)}
                            whileHover={{ scale: 1.02 }}
                            className={`bg-white rounded-lg p-3 border shadow-sm cursor-grab active:cursor-grabbing ${
                              draggedLead?.id === lead.id ? 'opacity-50' : ''
                            }`}
                            style={{ borderColor: `${stage.color}30` }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm text-slate-800 truncate">{lead.formData.fullName}</span>
                              {starredLeads.has(lead.id) && <span className="text-sm">⭐</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 truncate">{lead.formData.vehicleType}</p>
                            {lead.status === 'dead' && lead.deadReason && (
                              <div className="text-xs text-red-500 mt-1 truncate capitalize">
                                {lead.deadReason.replace(/-/g, ' ')}
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {stageLeads.length > 10 && (
                          <button
                            onClick={() => setZoomedStage(stage.id)}
                            className="w-full text-center text-xs text-slate-400 py-2 hover:text-primary-600"
                          >
                            +{stageLeads.length - 10} more
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============ LEAD CARD ============
function LeadCard({ lead, hasLicense, isStarred, onToggleStar, onViewDetails, onSendEmail }: any) {
  const { formData } = lead;
  const statusColors: Record<string, string> = {
    'new': 'bg-slate-100 text-slate-600',
    'working': 'bg-amber-100 text-amber-700',
    'circle-back': 'bg-cyan-100 text-cyan-700',
    'approval': 'bg-emerald-100 text-emerald-700',
    'dead': 'bg-red-100 text-red-700',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-white rounded-xl p-5 border shadow-sm transition-all ${
        isStarred ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{formData.fullName}</h3>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[lead.status]}`}>
            {leadStatusOptions.find(s => s.value === lead.status)?.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasLicense && <span title="Has License">🪪</span>}
          <button onClick={onToggleStar} className="text-lg hover:scale-110 transition-transform">
            {isStarred ? '⭐' : '☆'}
          </button>
        </div>
      </div>

      {/* Dead reason */}
      {lead.status === 'dead' && lead.deadReason && (
        <div className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg mb-3 capitalize">
          {lead.deadReason.replace(/-/g, ' ')}
        </div>
      )}

      <div className="space-y-1 text-sm mb-4">
        <p className="text-slate-600">{formData.phone}</p>
        <p className="text-slate-400 truncate text-xs">{formData.email}</p>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Vehicle</span>
          <span className="font-medium text-slate-700">{formData.vehicleType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Budget</span>
          <span className="font-medium text-slate-700">
            {formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={onViewDetails} className="flex-1 text-xs">
          Details
        </Button>
        <Button size="sm" variant="secondary" onClick={onSendEmail} className="text-xs">
          ✉️
        </Button>
      </div>
    </motion.div>
  );
}

// ============ LEAD DETAIL POPUP ============
function LeadDetailPopup({ lead, licenseUrl, onStatusChange, onSaveNotes, onClose, onSendEmail }: any) {
  const { formData } = lead;
  const [notes, setNotes] = useState(lead.notes || '');
  const [deadReason, setDeadReason] = useState(lead.deadReason || '');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{formData.fullName}</h1>
          <p className="text-sm text-slate-500">{formatDate(lead.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${formData.phone}`}><Button size="sm">📞 Call</Button></a>
          <Button size="sm" variant="secondary" onClick={onSendEmail}>✉️ Email</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <InfoCard title="Contact">
          <InfoRow label="Phone" value={formData.phone} />
          <InfoRow label="Email" value={formData.email} />
          <InfoRow label="DOB" value={formData.dateOfBirth} />
          <InfoRow label="Best Time" value={formData.bestTimeToReach} />
        </InfoCard>
        <InfoCard title="Vehicle">
          <InfoRow label="Type" value={formData.vehicleType} />
          <InfoRow label="Payment" value={formData.paymentType} />
          <InfoRow label="Budget" value={formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget} />
          {formData.creditRating && <InfoRow label="Credit" value={formData.creditRating} />}
        </InfoCard>
      </div>

      {licenseUrl && (
        <div className="mb-6 bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Driver's License</h3>
          <img src={licenseUrl} alt="License" className="w-full max-w-md rounded-lg" />
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-slate-200 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Update Status</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {leadStatusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(lead.id, opt.value)}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                lead.status === opt.value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {lead.status === 'dead' && (
          <Select
            label="Dead Reason"
            value={deadReason}
            onChange={(e) => { setDeadReason(e.target.value); onStatusChange(lead.id, 'dead', e.target.value); }}
            options={[{ value: '', label: 'Select reason...' }, ...deadReasonOptions]}
          />
        )}
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes..."
          className="w-full h-24 p-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none text-sm"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={() => onSaveNotes(lead.id, notes)}>Save Notes</Button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value || '-'}</span>
    </div>
  );
}

// ============ TEMPLATES VIEW ============
function TemplatesView({ templates }: { templates: EmailTemplate[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Email Templates</h2>
        <p className="text-sm text-slate-500 mb-8">Use these templates when sending emails to clients</p>

        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-primary-800 font-medium">Available variables:</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {['{{name}}', '{{email}}', '{{phone}}', '{{vehicle}}', '{{budget}}'].map(v => (
              <code key={v} className="px-2 py-1 bg-white rounded text-xs font-mono text-primary-700">{v}</code>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-1">{t.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{t.subject}</p>
              <div className="bg-slate-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{t.body}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============ EMAIL COMPOSER ============
function EmailComposer({ lead, templates, onClose }: { lead: Lead; templates: EmailTemplate[]; onClose: () => void }) {
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const applyTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) {
      const vars: Record<string, string> = {
        '{{name}}': lead.formData.fullName,
        '{{email}}': lead.formData.email,
        '{{phone}}': lead.formData.phone,
        '{{vehicle}}': lead.formData.vehicleType,
        '{{budget}}': lead.formData.paymentType === 'finance' ? lead.formData.financeBudget || '' : lead.formData.cashBudget || '',
      };
      let s = t.subject, b = t.body;
      Object.entries(vars).forEach(([k, v]) => {
        s = s.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v);
        b = b.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v);
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
        body: JSON.stringify({ toEmail: lead.formData.email, toName: lead.formData.fullName, subject, body }),
      });
      if (res.ok) setSent(true);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-slate-900">Email Sent!</h3>
        <p className="text-sm text-slate-500 mt-1">Sent to {lead.formData.email}</p>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-lg p-3">
        <p className="text-sm text-slate-600">To: <strong>{lead.formData.fullName}</strong> ({lead.formData.email})</p>
      </div>
      <Select
        label="Template"
        options={[{ value: '', label: 'Choose...' }, ...templates.map(t => ({ value: t.id, label: t.name }))]}
        value={templateId}
        onChange={(e) => applyTemplate(e.target.value)}
      />
      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full p-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none text-sm" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={send} isLoading={sending} disabled={!subject || !body}>Send</Button>
      </div>
    </div>
  );
}

// ============ SHOWCASE VIEW ============
function ShowcaseView({ vehicles, enabled, onToggle, onDelete, onRefresh }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Showcase</h2>
            <p className="text-sm text-slate-500">{vehicles.length} vehicles</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-slate-600">Show on Homepage</span>
              <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <Button variant="secondary" size="sm" onClick={onRefresh}>Refresh</Button>
          </div>
        </div>

        {!enabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">⚠️ Showcase is hidden on the homepage. Toggle above to show it.</p>
          </div>
        )}

        {vehicles.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No vehicles in showcase</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicles.map((v: ShowcaseVehicle) => (
              <div key={v.id} className="bg-white rounded-xl overflow-hidden border border-slate-200">
                <div className="aspect-video bg-slate-100">
                  {v.imageUrl ? (
                    <img src={v.imageUrl} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🚗</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{v.year} {v.make} {v.model}</h3>
                  {v.price && <p className="text-sm text-primary-600 font-medium">{v.price}</p>}
                  <button
                    onClick={() => onDelete(v.id)}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
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
