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

type TabType = 'dashboard' | 'leads' | 'pipeline' | 'templates' | 'showcase';

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50">
        <div className="h-14 px-6 flex items-center justify-between max-w-[2000px] mx-auto">
          <Logo size="sm" />

          <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {(['dashboard', 'leads', 'pipeline', 'templates', 'showcase'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <DashboardView key="dash" stats={stats} leads={leads} onNav={setActiveTab} />}
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
            <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-56px)]">
              <FuturisticPipeline
                leads={leads}
                onStatusChange={updateStatus}
                onViewDetails={setDetailModal}
                starredLeads={starredLeads}
                onToggleStar={toggleStar}
              />
            </motion.div>
          )}
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

// Dashboard View
function DashboardView({ stats, leads, onNav }: { stats: any; leads: Lead[]; onNav: (tab: TabType) => void }) {
  const approvalRate = stats.total > 0 ? Math.round((stats.approval / stats.total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'bg-slate-600' },
            { label: 'New', value: stats.new, color: 'bg-blue-500' },
            { label: 'Working', value: stats.working, color: 'bg-yellow-500' },
            { label: 'Follow Up', value: stats.circleBack, color: 'bg-cyan-500' },
            { label: 'Approved', value: stats.approval, color: 'bg-green-500' },
            { label: 'Dead', value: stats.dead, color: 'bg-red-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-sm">
              <div className={`w-3 h-3 rounded-full ${s.color} mb-3`} />
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button onClick={() => onNav('leads')} className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm text-left hover:border-primary-300 transition-colors">
            <h3 className="font-semibold text-slate-900 mb-1">View Leads</h3>
            <p className="text-sm text-slate-500">Manage your pipeline</p>
          </button>
          <button onClick={() => onNav('pipeline')} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-left hover:from-slate-800 hover:to-slate-700 transition-colors">
            <h3 className="font-semibold text-white mb-1">🚀 Pipeline View</h3>
            <p className="text-sm text-slate-400">Interactive funnel system</p>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Performance</h3>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary-600">{approvalRate}%</p>
              <p className="text-sm text-slate-500 mt-1">Approval Rate</p>
            </div>
            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${approvalRate}%` }} transition={{ duration: 1 }} className="h-full bg-primary-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Leads View
function LeadsView({ leads, isLoading, selectedMonth, selectedYear, statusFilter, licenseUrls, starredLeads, onMonthChange, onYearChange, onFilterChange, onToggleStar, onStatusChange, onViewDetails, onSendEmail, stats }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-[calc(100vh-56px)]">
      <aside className="w-56 bg-white border-r border-slate-200/50 p-5 flex-shrink-0 overflow-y-auto">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase">Period</label>
            <div className="mt-2 space-y-2">
              <Select options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString('en', { month: 'short' }) }))} value={String(selectedMonth)} onChange={(e) => onMonthChange(parseInt(e.target.value))} />
              <Select options={[{ value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) }]} value={String(selectedYear)} onChange={(e) => onYearChange(parseInt(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase">Status</label>
            <div className="mt-2 space-y-1">
              {[{ value: 'all', label: 'All' }, ...leadStatusOptions].map(s => (
                <button key={s.value} onClick={() => onFilterChange(s.value)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${statusFilter === s.value ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{leads.length} Leads</h2>
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin" /></div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No leads found</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {leads.map((lead: Lead) => (
              <LeadCard key={lead.id} lead={lead} hasLicense={!!licenseUrls[lead.id]} isStarred={starredLeads.has(lead.id)} onToggleStar={() => onToggleStar(lead.id)} onViewDetails={() => onViewDetails(lead)} onSendEmail={() => onSendEmail(lead)} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LeadCard({ lead, hasLicense, isStarred, onToggleStar, onViewDetails, onSendEmail }: any) {
  const { formData } = lead;
  const colors: Record<string, string> = { 'new': 'bg-blue-100 text-blue-700', 'working': 'bg-yellow-100 text-yellow-700', 'circle-back': 'bg-cyan-100 text-cyan-700', 'approval': 'bg-green-100 text-green-700', 'dead': 'bg-red-100 text-red-700' };

  return (
    <div className={`bg-white rounded-xl p-4 border shadow-sm ${isStarred ? 'border-yellow-300 ring-1 ring-yellow-200' : 'border-slate-200/50'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-slate-900 truncate">{formData.fullName}</h3>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors[lead.status]}`}>{leadStatusOptions.find(s => s.value === lead.status)?.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {hasLicense && <span>🪪</span>}
          <button onClick={onToggleStar} className="text-lg">{isStarred ? '⭐' : '☆'}</button>
        </div>
      </div>
      {lead.status === 'dead' && lead.deadReason && <div className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded mb-2 capitalize">{lead.deadReason.replace(/-/g, ' ')}</div>}
      <p className="text-sm text-slate-600 mb-1">{formData.phone}</p>
      <p className="text-xs text-slate-400 truncate mb-3">{formData.email}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={onViewDetails} className="flex-1 text-xs">Details</Button>
        <Button size="sm" variant="secondary" onClick={onSendEmail} className="text-xs">✉️</Button>
      </div>
    </div>
  );
}

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

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">Contact</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-slate-800">{formData.phone}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-slate-800 truncate ml-4">{formData.email}</span></div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">Vehicle</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-800">{formData.vehicleType}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="text-slate-800">{formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}</span></div>
          </div>
        </div>
      </div>

      {licenseUrl && <div className="mb-6"><img src={licenseUrl} alt="License" className="w-full max-w-md rounded-lg" /></div>}

      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">Status</h3>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {leadStatusOptions.map(opt => (
            <button key={opt.value} onClick={() => onStatusChange(lead.id, opt.value)} className={`py-2 rounded-lg text-xs font-medium ${lead.status === opt.value ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {lead.status === 'dead' && <Select label="Reason" value={deadReason} onChange={(e) => { setDeadReason(e.target.value); onStatusChange(lead.id, 'dead', e.target.value); }} options={[{ value: '', label: 'Select...' }, ...deadReasonOptions]} />}
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">Notes</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." className="w-full h-24 p-3 rounded-lg border border-slate-200 focus:border-primary-500 outline-none resize-none text-sm" />
        <div className="mt-2 flex justify-end"><Button size="sm" onClick={() => onSaveNotes(lead.id, notes)}>Save</Button></div>
      </div>
    </div>
  );
}

function TemplatesView({ templates }: { templates: EmailTemplate[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Email Templates</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl p-5 border border-slate-200/50">
              <h3 className="font-semibold text-slate-900 mb-1">{t.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{t.subject}</p>
              <div className="bg-slate-50 rounded-lg p-3 max-h-28 overflow-y-auto"><pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{t.body}</pre></div>
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

  if (sent) return <div className="text-center py-8"><div className="text-4xl mb-4">✅</div><h3 className="text-lg font-semibold">Sent!</h3><Button onClick={onClose} className="mt-4">Close</Button></div>;

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-lg p-3"><p className="text-sm">To: <strong>{lead.formData.fullName}</strong></p></div>
      <Select label="Template" options={[{ value: '', label: 'Choose...' }, ...templates.map(t => ({ value: t.id, label: t.name }))]} value={templateId} onChange={(e) => applyTemplate(e.target.value)} />
      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Message</label><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="w-full p-3 rounded-lg border border-slate-200 focus:border-primary-500 outline-none resize-none text-sm" /></div>
      <div className="flex gap-2 justify-end"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={send} isLoading={sending} disabled={!subject || !body}>Send</Button></div>
    </div>
  );
}

function ShowcaseView({ vehicles, enabled, onToggle, onDelete, onRefresh }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-lg font-semibold text-slate-800">Showcase</h2><p className="text-sm text-slate-500">{vehicles.length} vehicles</p></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer"><span className="text-sm text-slate-600">Show on Homepage</span><button onClick={onToggle} className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-slate-300'}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} /></button></label>
            <Button variant="secondary" size="sm" onClick={onRefresh}>Refresh</Button>
          </div>
        </div>
        {!enabled && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"><p className="text-sm text-amber-800">⚠️ Showcase hidden on homepage</p></div>}
        {vehicles.length === 0 ? <div className="text-center py-16 text-slate-400">No vehicles</div> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v: ShowcaseVehicle) => (
              <div key={v.id} className="bg-white rounded-xl overflow-hidden border border-slate-200/50">
                <div className="aspect-video bg-slate-100">{v.imageUrl ? <img src={v.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🚗</div>}</div>
                <div className="p-4"><h3 className="font-semibold text-slate-900">{v.year} {v.make} {v.model}</h3>{v.price && <p className="text-sm text-primary-600">{v.price}</p>}<button onClick={() => onDelete(v.id)} className="mt-2 text-sm text-red-600 hover:text-red-800">Remove</button></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
