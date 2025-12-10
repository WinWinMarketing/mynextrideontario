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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'new': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  'working': { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300' },
  'circle-back': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
  'approval': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
  'dead': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
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

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        const fetchedLeads = data.leads || [];
        setLeads(fetchedLeads);
        
        // Fetch ALL license URLs in parallel
        const licensePromises = fetchedLeads
          .filter((l: Lead) => l.driversLicenseKey)
          .map(async (l: Lead) => {
            try {
              const res = await fetch(`/api/admin/leads/${l.id}/license-url?key=${encodeURIComponent(l.driversLicenseKey!)}`);
              if (res.ok) {
                const { url } = await res.json();
                return { id: l.id, url };
              }
            } catch (err) {
              console.error(`License URL failed for ${l.id}:`, err);
            }
            return null;
          });

        const results = await Promise.all(licensePromises);
        const urlMap: Record<string, string> = {};
        results.forEach(r => {
          if (r) urlMap[r.id] = r.url;
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
      if (detailModal?.id === leadId) setDetailModal({ ...detailModal, status });
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

  const filteredLeads = leads
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .sort((a, b) => {
      if (starredLeads.has(a.id) && !starredLeads.has(b.id)) return -1;
      if (!starredLeads.has(a.id) && starredLeads.has(b.id)) return 1;
      if (a.status === 'dead' && b.status !== 'dead') return 1;
      if (a.status !== 'dead' && b.status === 'dead') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    working: leads.filter(l => l.status === 'working').length,
    approval: leads.filter(l => l.status === 'approval').length,
    dead: leads.filter(l => l.status === 'dead').length,
  };

  const approvalRate = stats.total > 0 ? (stats.approval / stats.total) * 100 : 0;
  const mood = approvalRate > 50 ? 'great' : approvalRate > 20 ? 'good' : 'poor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="flex items-center justify-center px-6 py-4 relative">
          <div className="absolute left-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">My Next Ride Ontario</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
            {(['dashboard', 'leads', 'templates', 'showcase'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg capitalize transition-all ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <button onClick={onLogout} className="absolute right-6 text-sm text-slate-500 hover:text-slate-900 font-medium">
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="pt-24 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardOverview leads={leads} mood={mood} stats={stats} approvalRate={approvalRate} onViewLeads={() => setActiveTab('leads')} />
          )}

          {activeTab === 'leads' && (
            <LeadsCardView 
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
            />
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Lead Details" size="xl">
        {detailModal && <LeadDetailView lead={detailModal} licenseUrl={licenseUrls[detailModal.id]} onStatusChange={updateStatus} onClose={() => setDetailModal(null)} />}
      </Modal>

      {/* Image Modal */}
      <Modal isOpen={!!enlargedImage} onClose={() => setEnlargedImage(null)} title="Driver's License" size="xl">
        {enlargedImage && (
          <div className="space-y-4">
            <img src={enlargedImage} alt="License" className="w-full rounded-2xl shadow-2xl" />
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => navigator.clipboard.writeText(enlargedImage)} className="flex-1">
                📋 Copy URL
              </Button>
              <a href={enlargedImage} download className="flex-1">
                <Button variant="secondary" className="w-full">⬇️ Download</Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Dashboard Overview
function DashboardOverview({ leads, mood, stats, approvalRate, onViewLeads }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6">
      {/* Weather Hero */}
      <div className="relative h-72 mb-10 rounded-3xl overflow-hidden shadow-2xl">
        {mood === 'great' && <SunshineBackground />}
        {mood === 'good' && <CloudyBackground />}
        {mood === 'poor' && <RainyBackground />}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <h2 className="text-6xl font-bold mb-3">{stats.total === 0 ? 'Welcome Back!' : `${stats.total} Total Leads`}</h2>
            {stats.total > 0 && <p className="text-2xl text-white/90">{approvalRate.toFixed(1)}% Approval Rate</p>}
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {[
          { label: 'New Leads', value: stats.new, color: 'slate', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
          { label: 'Working', value: stats.working, color: 'amber', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
          { label: 'Approved', value: stats.approval, color: 'green', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Dead', value: stats.dead, color: 'red', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -4 }} className={`bg-white rounded-2xl p-6 border-2 border-${stat.color}-100 shadow-xl`}>
            <div className="flex justify-between items-start mb-3">
              <div className={`w-14 h-14 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div className="text-4xl font-bold text-slate-900">{stat.value}</div>
            </div>
            <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <QuickActionCard title="View All Leads" desc="Manage pipeline" onClick={onViewLeads} icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <QuickActionCard title="Email Templates" desc="Mail merge system" onClick={() => {}} icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
        <QuickActionCard title="Showcase" desc="Manage vehicles" onClick={() => {}} icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>
    </motion.div>
  );
}

// Leads Card View
function LeadsCardView({ leads, isLoading, selectedMonth, selectedYear, statusFilter, licenseUrls, starredLeads, onMonthChange, onYearChange, onFilterChange, onToggleStar, onStatusChange, onViewDetails, onViewImage }: any) {
  return (
    <div className="flex gap-6 px-6">
      {/* LEFT SIDEBAR - FILTERS */}
      <aside className="w-72 flex-shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Time Period</h3>
            <div className="space-y-3">
              <Select options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString('en', { month: 'long' }) }))} value={String(selectedMonth)} onChange={(e) => onMonthChange(parseInt(e.target.value))} />
              <Select options={[{ value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) }]} value={String(selectedYear)} onChange={(e) => onYearChange(parseInt(e.target.value))} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Status Filter</h3>
            <div className="space-y-2">
              <button onClick={() => onFilterChange('all')} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${statusFilter === 'all' ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                All Leads ({leads.length})
              </button>
              {leadStatusOptions.map(opt => (
                <button key={opt.value} onClick={() => onFilterChange(opt.value)} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${statusFilter === opt.value ? `${STATUS_COLORS[opt.value].bg} ${STATUS_COLORS[opt.value].text} border-2 ${STATUS_COLORS[opt.value].border}` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT - CARD GRID */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl shadow-lg">
            <p className="text-2xl text-slate-400 font-medium">No leads found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {leads.map((lead: Lead) => (
              <LeadCard 
                key={lead.id}
                lead={lead}
                licenseUrl={licenseUrls[lead.id]}
                isStarred={starredLeads.has(lead.id)}
                onToggleStar={() => onToggleStar(lead.id)}
                onStatusChange={(s) => onStatusChange(lead.id, s)}
                onViewDetails={() => onViewDetails(lead)}
                onViewImage={() => licenseUrls[lead.id] && onViewImage(licenseUrls[lead.id])}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Lead Card - Photo RIGHT, Info LEFT
function LeadCard({ lead, licenseUrl, isStarred, onToggleStar, onStatusChange, onViewDetails, onViewImage }: any) {
  const { formData } = lead;
  const config = STATUS_COLORS[lead.status];

  return (
    <motion.div layout whileHover={{ y: -4 }} className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${isStarred ? 'border-amber-400 ring-4 ring-amber-100' : 'border-slate-200'}`}>
      <div className="flex h-full">
        {/* LEFT - Info */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">{formData.fullName}</h3>
              <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg border-2 ${config.bg} ${config.text} ${config.border}`}>
                {leadStatusOptions.find(s => s.value === lead.status)?.label}
              </span>
            </div>
            <button onClick={onToggleStar} className="text-3xl leading-none hover:scale-125 transition-transform">
              {isStarred ? '⭐' : '☆'}
            </button>
          </div>

          <div className="space-y-2 text-sm text-slate-700 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <a href={`tel:${formData.phone}`} className="hover:text-primary-600 font-medium">{formData.phone}</a>
            </div>
            <div className="text-xs text-slate-500 truncate">{formData.email}</div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 mb-4 text-xs space-y-2">
            <div><strong className="text-slate-700">Vehicle:</strong> <span className="text-slate-600">{formData.vehicleType}</span></div>
            <div><strong className="text-slate-700">Budget:</strong> <span className="text-slate-600">{formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}</span></div>
            <div><strong className="text-slate-700">Credit:</strong> <span className="text-slate-600">{formData.creditRating || 'Cash'}</span></div>
          </div>

          {/* Large Status Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {leadStatusOptions.slice(0, 4).map(opt => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={`px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  lead.status === opt.value ? `${STATUS_COLORS[opt.value].bg} ${STATUS_COLORS[opt.value].text} border-2 ${STATUS_COLORS[opt.value].border}` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button size="sm" variant="primary" onClick={onViewDetails} className="w-full font-bold">
            View Full Details →
          </Button>
        </div>

        {/* RIGHT - License Photo */}
        {licenseUrl && (
          <div className="w-48 bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer group relative" onClick={onViewImage}>
            <img src={licenseUrl} alt="License" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 bg-white px-4 py-2 rounded-xl font-bold text-sm shadow-2xl">
                🔍 Enlarge
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Lead Detail Modal Content
function LeadDetailView({ lead, licenseUrl, onStatusChange, onClose }: any) {
  const { formData } = lead;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{formData.fullName}</h2>
          <p className="text-slate-500">{formatDate(lead.createdAt)}</p>
        </div>
        <span className={`px-4 py-2 rounded-xl font-bold ${STATUS_COLORS[lead.status].bg} ${STATUS_COLORS[lead.status].text}`}>
          {leadStatusOptions.find(s => s.value === lead.status)?.label}
        </span>
      </div>

      {/* License Image */}
      {licenseUrl && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4">
          <h4 className="font-bold text-green-900 mb-3">Driver's License</h4>
          <img src={licenseUrl} alt="License" className="w-full rounded-xl shadow-lg" />
        </div>
      )}

      {/* Complete Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Phone" value={formData.phone} />
        <DetailField label="Email" value={formData.email} />
        <DetailField label="Date of Birth" value={formData.dateOfBirth} />
        <DetailField label="Best Time" value={formData.bestTimeToReach} />
        <DetailField label="Vehicle Type" value={formData.vehicleType} />
        <DetailField label="Payment Type" value={formData.paymentType} />
        <DetailField label="Budget" value={formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget} />
        <DetailField label="Credit Rating" value={formData.creditRating || 'N/A'} />
        <DetailField label="License Class" value={formData.licenseClass} />
        <DetailField label="Trade-In" value={formData.tradeIn} />
        {formData.tradeIn === 'yes' && (
          <>
            <DetailField label="Trade Year/Make/Model" value={`${formData.tradeInYear} ${formData.tradeInMake} ${formData.tradeInModel}`} />
            <DetailField label="Trade Mileage" value={formData.tradeInMileage || 'N/A'} />
            <DetailField label="Trade VIN" value={formData.tradeInVin || 'N/A'} />
          </>
        )}
        <DetailField label="Cosigner" value={formData.cosigner} />
        {formData.cosigner === 'yes' && (
          <>
            <DetailField label="Cosigner Name" value={formData.cosignerFullName || 'N/A'} />
            <DetailField label="Cosigner Phone" value={formData.cosignerPhone || 'N/A'} />
            <DetailField label="Cosigner Email" value={formData.cosignerEmail || 'N/A'} />
          </>
        )}
      </div>

      {/* Status Update */}
      <div>
        <h4 className="font-bold text-slate-700 mb-3">Update Status</h4>
        <div className="grid grid-cols-5 gap-3">
          {leadStatusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(lead.id, opt.value)}
              className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                lead.status === opt.value ? `${STATUS_COLORS[opt.value].bg} ${STATUS_COLORS[opt.value].text} border-2 ${STATUS_COLORS[opt.value].border} scale-105` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <h4 className="font-bold text-slate-700 mb-3">Notes</h4>
        <div className="bg-slate-50 rounded-xl p-4 min-h-24">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.notes || 'No notes yet'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <a href={`mailto:${formData.email}`} className="flex-1">
          <Button variant="primary" className="w-full">📧 Send Email</Button>
        </a>
        <a href={`tel:${formData.phone}`} className="flex-1">
          <Button variant="secondary" className="w-full">📞 Call</Button>
        </a>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-500 font-semibold mb-1">{label}</div>
      <div className="text-sm text-slate-900 font-medium">{value}</div>
    </div>
  );
}

function QuickActionCard({ title, desc, icon, onClick }: any) {
  return (
    <motion.button whileHover={{ scale: 1.03, y: -4 }} onClick={onClick} className="bg-white rounded-2xl p-6 shadow-xl text-left hover:shadow-2xl transition-shadow border border-slate-100">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="font-bold text-lg text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </motion.button>
  );
}

// Weather Animations
function SunshineBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-400">
      {[...Array(20)].map((_, i) => (
        <motion.div key={i} className="absolute w-2 h-2 bg-yellow-200 rounded-full" style={{ top: `${20 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%` }} animate={{ y: [0, -30, 0], opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }} transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }} />
      ))}
    </div>
  );
}

function CloudyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700">
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="absolute bg-white/15 rounded-full blur-2xl" style={{ width: `${120 + Math.random() * 80}px`, height: `${50 + Math.random() * 30}px`, top: `${25 + i * 10}%`, left: `${i * 15}%` }} animate={{ x: [0, 60, 0] }} transition={{ duration: 20 + Math.random() * 10, repeat: Infinity, ease: 'linear' }} />
      ))}
    </div>
  );
}

function RainyBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
      {[...Array(40)].map((_, i) => (
        <motion.div key={i} className="absolute w-0.5 bg-blue-200/50" style={{ left: `${Math.random() * 100}%`, height: `${25 + Math.random() * 35}px` }} animate={{ y: ['0vh', '100vh'], opacity: [0, 1, 0] }} transition={{ duration: 0.8 + Math.random() * 0.4, repeat: Infinity, delay: Math.random() * 2, ease: 'linear' }} />
      ))}
    </div>
  );
}
