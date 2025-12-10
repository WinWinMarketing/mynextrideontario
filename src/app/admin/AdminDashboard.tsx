'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Select, Textarea, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions, ShowcaseVehicle } from '@/lib/validation';
import { formatDate } from '@/lib/utils';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'leads' | 'templates' | 'showcase';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'new': { label: 'New Lead', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
  'working': { label: 'Working', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' },
  'circle-back': { label: 'Circle Back', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-300' },
  'approval': { label: 'Approval', color: 'text-green-700', bg: 'bg-green-50 border-green-300' },
  'dead': { label: 'Dead Lead', color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
};

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [starredLeads, setStarredLeads] = useState<Set<string>>(new Set());
  const [licenseUrls, setLicenseUrls] = useState<Record<string, string>>({});
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; name: string } | null>(null);
  const [emailModal, setEmailModal] = useState<{ lead: Lead } | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showcaseVehicles, setShowcaseVehicles] = useState<ShowcaseVehicle[]>([]);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        const fetchedLeads = data.leads || [];
        setLeads(fetchedLeads);
        
        // Fetch ALL license URLs upfront
        const urlPromises = fetchedLeads
          .filter((lead: Lead) => lead.driversLicenseKey)
          .map(async (lead: Lead) => {
            try {
              const res = await fetch(`/api/admin/leads/${lead.id}/license-url?key=${encodeURIComponent(lead.driversLicenseKey!)}`);
              if (res.ok) {
                const { url } = await res.json();
                return { leadId: lead.id, url };
              }
            } catch (err) {
              console.error(`Failed license URL for ${lead.id}:`, err);
            }
            return null;
          });

        const urlResults = await Promise.all(urlPromises);
        const urlMap: Record<string, string> = {};
        urlResults.forEach(result => {
          if (result) urlMap[result.leadId] = result.url;
        });
        setLicenseUrls(urlMap);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, status }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleStar = (leadId: string) => {
    setStarredLeads(prev => {
      const newSet = new Set(prev);
      newSet.has(leadId) ? newSet.delete(leadId) : newSet.add(leadId);
      return newSet;
    });
  };

  const openEmailModal = (lead: Lead) => {
    setEmailSubject(`Following up on your ${lead.formData.vehicleType} inquiry`);
    setEmailBody(`Hi ${lead.formData.fullName},\n\nThank you for submitting your vehicle application with us. I wanted to follow up on your interest in a ${lead.formData.vehicleType}...\n\nBest regards,\nMy Next Ride Ontario Team`);
    setEmailModal({ lead });
  };

  const sendEmail = () => {
    if (!emailModal) return;
    window.location.href = `mailto:${emailModal.lead.formData.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    setEmailModal(null);
  };

  const filteredLeads = leads
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .sort((a, b) => {
      if (starredLeads.has(a.id) && !starredLeads.has(b.id)) return -1;
      if (!starredLeads.has(a.id) && starredLeads.has(b.id)) return 1;
      if (a.status === 'dead' && b.status !== 'dead') return 1;
      if (a.status !== 'dead' && b.status === 'dead') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Calculate metrics for emotional animations
  const totalLeads = leads.length;
  const approvedLeads = leads.filter(l => l.status === 'approval').length;
  const deadLeads = leads.filter(l => l.status === 'dead').length;
  const approvalRate = totalLeads > 0 ? (approvedLeads / totalLeads) * 100 : 0;
  
  // Determine mood: great (>50% approval), good (20-50%), poor (<20%)
  const mood = approvalRate > 50 ? 'great' : approvalRate > 20 ? 'good' : 'poor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">My Next Ride Ontario</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['dashboard', 'leads', 'templates', 'showcase'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-semibold rounded-lg capitalize ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
            Sign Out
          </button>
        </div>
      </header>

      <div className="pt-20 px-6 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardOverview 
              leads={leads} 
              mood={mood} 
              totalLeads={totalLeads} 
              approvalRate={approvalRate}
              onNavigateToLeads={() => setActiveTab('leads')}
            />
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
              onStatusFilterChange={setStatusFilter}
              onToggleStar={toggleStar}
              onStatusChange={updateStatus}
              onViewLicense={(url, name) => setEnlargedImage({ url, name })}
              onEmail={openEmailModal}
            />
          )}

          {activeTab === 'templates' && (
            <EmailTemplatesTab templates={templates} onSave={(t) => setTemplates(prev => [...prev.filter(x => x.id !== t.id), t])} onDelete={(id) => setTemplates(prev => prev.filter(t => t.id !== id))} />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal isOpen={!!emailModal} onClose={() => setEmailModal(null)} title={`Email ${emailModal?.lead.formData.fullName}`} size="lg">
        {emailModal && (
          <div className="space-y-4">
            <Input label="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            <Textarea label="Message" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setEmailModal(null)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={sendEmail} className="flex-1">Open in Email Client</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!enlargedImage} onClose={() => setEnlargedImage(null)} title={`Driver's License - ${enlargedImage?.name}`} size="xl">
        {enlargedImage && (
          <div className="space-y-4">
            <img src={enlargedImage.url} alt="License" className="w-full rounded-xl shadow-lg" />
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => navigator.clipboard.writeText(enlargedImage.url)} className="flex-1">
                Copy URL
              </Button>
              <a href={enlargedImage.url} download className="flex-1">
                <Button variant="secondary" className="w-full">Download</Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Dashboard Overview with Emotional Animations
function DashboardOverview({ leads, mood, totalLeads, approvalRate, onNavigateToLeads }: {
  leads: Lead[];
  mood: 'great' | 'good' | 'poor';
  totalLeads: number;
  approvalRate: number;
  onNavigateToLeads: () => void;
}) {
  const stats = {
    new: leads.filter(l => l.status === 'new').length,
    working: leads.filter(l => l.status === 'working').length,
    approval: leads.filter(l => l.status === 'approval').length,
    dead: leads.filter(l => l.status === 'dead').length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto">
      {/* Emotional Weather Animation */}
      <div className="relative h-64 mb-8 rounded-3xl overflow-hidden">
        {mood === 'great' && <SunshineBackground />}
        {mood === 'good' && <CloudyBackground />}
        {mood === 'poor' && <RainyBackground />}
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <h2 className="text-5xl font-bold mb-2">{totalLeads === 0 ? 'Let\'s Get Started' : `${totalLeads} Total Leads`}</h2>
            {totalLeads > 0 && (
              <p className="text-xl text-white/90">{approvalRate.toFixed(0)}% Approval Rate</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="New Leads" value={stats.new} color="slate" icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>} />
        <StatCard title="Working" value={stats.working} color="amber" icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        <StatCard title="Approved" value={stats.approval} color="green" icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Dead" value={stats.dead} color="red" icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <QuickActionCard 
          title="View All Leads" 
          description="Manage your lead pipeline" 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          onClick={onNavigateToLeads}
        />
        <QuickActionCard 
          title="Email Templates" 
          description="Manage mail merge templates" 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          onClick={() => {}}
        />
        <QuickActionCard 
          title="Showcase Vehicles" 
          description="Manage featured inventory" 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          onClick={() => {}}
        />
      </div>
    </motion.div>
  );
}

// Emotional Weather Backgrounds
function SunshineBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-200 rounded-full"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

function CloudyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white/20 rounded-full blur-xl"
          style={{
            width: `${100 + Math.random() * 100}px`,
            height: `${40 + Math.random() * 40}px`,
            top: `${20 + Math.random() * 40}%`,
            left: `${i * 20}%`,
          }}
          animate={{
            x: [0, 50, 0],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

function RainyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 bg-blue-200/40"
          style={{
            left: `${Math.random() * 100}%`,
            height: `${20 + Math.random() * 30}px`,
          }}
          animate={{
            y: ['0vh', '100vh'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1 + Math.random() * 0.5,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Stat Card
function StatCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className={`bg-white rounded-2xl p-6 border-2 border-${color}-100 shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-14 h-14 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}>
          {icon}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-4xl font-bold text-slate-900"
        >
          {value}
        </motion.div>
      </div>
      <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
    </motion.div>
  );
}

// Quick Action Card
function QuickActionCard({ title, description, icon, onClick }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -4 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg text-left hover:shadow-xl transition-shadow"
    >
      <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-1 text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </motion.button>
  );
}

// Leads View (Card Grid)
function LeadsView({ leads, isLoading, selectedMonth, selectedYear, statusFilter, licenseUrls, starredLeads, onMonthChange, onYearChange, onStatusFilterChange, onToggleStar, onStatusChange, onViewLicense, onEmail }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center gap-4 mb-6">
        <Select options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString('en', { month: 'long' }) }))} value={String(selectedMonth)} onChange={(e) => onMonthChange(parseInt(e.target.value))} className="w-40" />
        <Select options={[{ value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) }]} value={String(selectedYear)} onChange={(e) => onYearChange(parseInt(e.target.value))} className="w-28" />
        <Select options={[{ value: 'all', label: 'All Statuses' }, ...leadStatusOptions.map(s => ({ value: s.value, label: s.label }))]} value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} className="w-48" />
        <div className="flex-1" />
        <span className="text-sm text-slate-500">{leads.length} leads</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl">
          <p className="text-slate-400">No leads found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {leads.map((lead: Lead) => (
            <LeadCardCompact 
              key={lead.id} 
              lead={lead} 
              licenseUrl={licenseUrls[lead.id]}
              isStarred={starredLeads.has(lead.id)}
              onToggleStar={() => onToggleStar(lead.id)}
              onStatusChange={(s) => onStatusChange(lead.id, s)}
              onViewLicense={() => licenseUrls[lead.id] && onViewLicense(licenseUrls[lead.id], lead.formData.fullName)}
              onEmail={() => onEmail(lead)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Compact Lead Card with License Image
function LeadCardCompact({ lead, licenseUrl, isStarred, onToggleStar, onStatusChange, onViewLicense, onEmail }: any) {
  const [expanded, setExpanded] = useState(false);
  const { formData } = lead;
  const config = STATUS_CONFIG[lead.status];

  return (
    <motion.div layout className={`bg-white rounded-2xl border-2 shadow-xl overflow-hidden ${isStarred ? 'border-amber-400 ring-4 ring-amber-100' : 'border-slate-200'}`}>
      {/* License Image */}
      {licenseUrl && (
        <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer group" onClick={onViewLicense}>
          <img src={licenseUrl} alt="License" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 bg-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl">
              🔍 Click to Enlarge
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{formData.fullName}</h3>
            <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${config.bg} ${config.color} mt-1`}>
              {config.label}
            </span>
          </div>
          <button onClick={onToggleStar} className="text-3xl leading-none">
            {isStarred ? '⭐' : '☆'}
          </button>
        </div>

        <div className="space-y-2 mb-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            {formData.phone}
          </div>
          <div className="truncate">{formData.email}</div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs space-y-1">
          <div><strong>Vehicle:</strong> {formData.vehicleType}</div>
          <div><strong>Budget:</strong> {formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}</div>
          <div><strong>Credit:</strong> {formData.creditRating || 'Cash'}</div>
        </div>

        <Button size="sm" variant="primary" onClick={onEmail} className="w-full mb-2">
          📧 Send Email
        </Button>

        <div className="flex flex-wrap gap-1.5">
          {leadStatusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(opt.value)}
              className={`px-2 py-1 text-xs font-semibold rounded-md ${lead.status === opt.value ? `${STATUS_CONFIG[opt.value].bg}` : 'bg-slate-100 text-slate-500'}`}
            >
              {opt.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Email Templates Tab
function EmailTemplatesTab({ templates, onSave, onDelete }: {
  templates: EmailTemplate[];
  onSave: (template: EmailTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-slate-500">Mail merge with {{name}}, {{vehicle}}, {{budget}}</p>
        </div>
        <Button variant="primary" onClick={() => setEditing({ id: `tpl-${Date.now()}`, name: '', subject: '', body: '' })}>
          + New Template
        </Button>
      </div>

      {editing && (
        <Card className="p-6 mb-6 border-2 border-primary-300">
          <Input label="Template Name" value={name} onChange={(e) => setName(e.target.value)} className="mb-4" />
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-4" placeholder="Use {{name}}, {{vehicle}}" />
          <Textarea label="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Hi {{name}},\n\nThank you for your inquiry about a {{vehicle}}..." />
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { onSave({ ...editing, name, subject, body }); setEditing(null); }}>
              Save Template
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {templates.map(t => (
          <Card key={t.id} className="p-5">
            <div className="flex justify-between">
              <div>
                <h4 className="font-bold text-lg">{t.name}</h4>
                <p className="text-sm text-slate-600">Subject: {t.subject}</p>
                <p className="text-sm text-slate-500 mt-2">{t.body.substring(0, 100)}...</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setName(t.name); setSubject(t.subject); setBody(t.body); }}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(t.id)} className="text-red-600">Delete</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
