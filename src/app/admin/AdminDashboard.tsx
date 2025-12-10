'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Select, Textarea, Modal, Input } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions, ShowcaseVehicle, MAX_SHOWCASE_VEHICLES } from '@/lib/validation';
import { formatDate, formatMonthYear } from '@/lib/utils';

interface AdminDashboardProps {
  onLogout: () => void;
}

// Updated status config to match the 5 requested statuses
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'new': { label: 'New Lead', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
  'working': { label: 'Working', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' },
  'circle-back': { label: 'Circle Back', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-300' },
  'approval': { label: 'Approval', color: 'text-green-700', bg: 'bg-green-50 border-green-300' },
  'dead': { label: 'Dead Lead', color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
};

type TabType = 'leads' | 'showcase' | 'settings';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [licenseModal, setLicenseModal] = useState<{ url: string; name: string } | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  
  // Showcase
  const [showcaseVehicles, setShowcaseVehicles] = useState<ShowcaseVehicle[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ year: '', make: '', model: '', trim: '', price: '', mileage: '' });
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  
  // Settings
  const [emailSettings, setEmailSettings] = useState({ recipientEmail: '', fromName: 'My Next Ride Ontario', enabled: true });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/leads?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  const fetchShowcase = useCallback(async () => {
    setShowcaseLoading(true);
    try {
      const response = await fetch('/api/admin/showcase');
      if (response.ok) {
        const data = await response.json();
        setShowcaseVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching showcase:', error);
    } finally {
      setShowcaseLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) setEmailSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchShowcase();
    fetchSettings();
  }, [fetchLeads, fetchShowcase, fetchSettings]);

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings),
      });
      setSettingsMessage(response.ok ? 'Settings saved successfully!' : 'Failed to save');
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch {
      setSettingsMessage('Error saving settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, status }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateDeadReason = async (leadId: string, deadReason: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, deadReason }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deadReason: deadReason as Lead['deadReason'] } : l));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveNotes = async (leadId: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, year: selectedYear, month: selectedMonth, notes: notesValue }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: notesValue } : l));
      setEditingNotes(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const viewLicense = async (lead: Lead) => {
    if (!lead.driversLicenseKey) return;
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}/license-url?year=${selectedYear}&month=${selectedMonth}&key=${encodeURIComponent(lead.driversLicenseKey)}`);
      if (response.ok) {
        const data = await response.json();
        setLicenseModal({ url: data.url, name: lead.formData.fullName });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const seedShowcase = async () => {
    try {
      const response = await fetch('/api/admin/showcase', { method: 'PUT' });
      if (response.ok) {
        const data = await response.json();
        setShowcaseVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error seeding showcase:', error);
    }
  };

  const addVehicle = async () => {
    if (!newVehicle.year || !newVehicle.make || !newVehicle.model) return;
    
    const formData = new FormData();
    formData.append('data', JSON.stringify({ ...newVehicle, featured: false }));
    if (vehicleImage) formData.append('image', vehicleImage);
    
    try {
      const response = await fetch('/api/admin/showcase', { method: 'POST', body: formData });
      if (response.ok) {
        fetchShowcase();
        setShowAddVehicle(false);
        setNewVehicle({ year: '', make: '', model: '', trim: '', price: '', mileage: '' });
        setVehicleImage(null);
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await fetch(`/api/admin/showcase?id=${id}`, { method: 'DELETE' });
      setShowcaseVehicles(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const filteredLeads = leads
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .sort((a, b) => {
      // Dead leads go to bottom
      if (a.status === 'dead' && b.status !== 'dead') return 1;
      if (a.status !== 'dead' && b.status === 'dead') return -1;
      // Otherwise sort by date (newest first)
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

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleString('en-CA', { month: 'long' }),
  }));

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">My Next Ride Ontario</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['leads', 'showcase', 'settings'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  activeTab === tab 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 flex">
        {/* Sidebar for Leads */}
        {activeTab === 'leads' && (
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 p-5 overflow-y-auto">
            <div className="space-y-6">
              {/* Time Period Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Time Period</label>
                <div className="space-y-2">
                  <Select options={monthOptions} value={String(selectedMonth)} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} />
                  <Select options={yearOptions} value={String(selectedYear)} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Status</label>
                <div className="space-y-1">
                  <button 
                    onClick={() => setStatusFilter('all')} 
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors ${
                      statusFilter === 'all' 
                        ? 'bg-primary-50 text-primary-700 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Applications</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusFilter === 'all' ? 'bg-primary-100' : 'bg-slate-100'}`}>{stats.total}</span>
                  </button>
                  {leadStatusOptions.map(opt => (
                    <button 
                      key={opt.value} 
                      onClick={() => setStatusFilter(opt.value)} 
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors ${
                        statusFilter === opt.value 
                          ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].color} font-semibold border` 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusFilter === opt.value ? 'bg-white/50' : 'bg-slate-100'}`}>
                        {leads.filter(l => l.status === opt.value).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Stats</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-slate-800">{stats.new}</div>
                    <div className="text-xs text-slate-500">New</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-amber-700">{stats.working}</div>
                    <div className="text-xs text-amber-600">Working</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">{stats.approval}</div>
                    <div className="text-xs text-green-600">Approval</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-red-700">{stats.dead}</div>
                    <div className="text-xs text-red-600">Dead</div>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <button 
                onClick={fetchLeads} 
                className="w-full py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 ${activeTab === 'leads' ? 'ml-64' : ''} p-6`}>
          <AnimatePresence mode="wait">
            {/* Leads Tab */}
            {activeTab === 'leads' && (
              <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Leads for {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-CA', { month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-sm text-slate-500">{filteredLeads.length} application{filteredLeads.length !== 1 ? 's' : ''} {statusFilter !== 'all' && `(${STATUS_CONFIG[statusFilter]?.label})`}</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <svg className="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No leads found</h3>
                    <p className="text-slate-500">New applications will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLeads.map((lead) => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        isExpanded={expandedLead === lead.id} 
                        onToggle={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)} 
                        onStatusChange={updateLeadStatus} 
                        onDeadReasonChange={updateDeadReason} 
                        onViewLicense={() => viewLicense(lead)} 
                        editingNotes={editingNotes} 
                        notesValue={notesValue} 
                        onStartEditNotes={(id, notes) => { setEditingNotes(id); setNotesValue(notes); }} 
                        onNotesChange={setNotesValue} 
                        onSaveNotes={saveNotes} 
                        onCancelNotes={() => setEditingNotes(null)} 
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Showcase Tab */}
            {activeTab === 'showcase' && (
              <motion.div key="showcase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Showcase Vehicles</h2>
                    <p className="text-sm text-slate-500">{showcaseVehicles.length} of {MAX_SHOWCASE_VEHICLES} vehicles</p>
                  </div>
                  <div className="flex gap-3">
                    {showcaseVehicles.length === 0 && (
                      <Button variant="ghost" onClick={seedShowcase}>Load Sample Data</Button>
                    )}
                    <Button variant="primary" onClick={() => setShowAddVehicle(true)} disabled={showcaseVehicles.length >= MAX_SHOWCASE_VEHICLES}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Vehicle
                    </Button>
                  </div>
                </div>

                {showcaseLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  </div>
                ) : showcaseVehicles.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <svg className="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No showcase vehicles</h3>
                    <p className="text-slate-500 mb-6">Add vehicles to display on the homepage carousel</p>
                    <Button variant="secondary" onClick={seedShowcase}>Load Sample Data</Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {showcaseVehicles.map(vehicle => (
                      <div key={vehicle.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-slate-100 relative">
                          {vehicle.imageUrl ? (
                            <img src={vehicle.imageUrl} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                              </svg>
                            </div>
                          )}
                          {vehicle.featured && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              Featured
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-slate-900">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                          {vehicle.trim && <p className="text-sm text-slate-500">{vehicle.trim}</p>}
                          <div className="flex items-center justify-between mt-4">
                            <div>
                              {vehicle.price && <span className="text-xl font-bold text-primary-600">{vehicle.price}</span>}
                              {vehicle.mileage && <span className="text-sm text-slate-500 ml-2">{vehicle.mileage}</span>}
                            </div>
                            <button onClick={() => deleteVehicle(vehicle.id)} className="text-sm text-red-600 hover:text-red-700 font-medium">Remove</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Settings</h2>
                
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Email Notifications</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
                      <div>
                        <p className="font-medium text-slate-800">Enable Notifications</p>
                        <p className="text-sm text-slate-500">Receive email when new leads come in</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={emailSettings.enabled} 
                          onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 shadow-inner"></div>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <Input 
                        label="Notification Email" 
                        type="email" 
                        value={emailSettings.recipientEmail} 
                        onChange={(e) => setEmailSettings({ ...emailSettings, recipientEmail: e.target.value })} 
                        placeholder="your@email.com" 
                      />
                      <Input 
                        label="From Name" 
                        value={emailSettings.fromName} 
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })} 
                        placeholder="My Next Ride Ontario" 
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> To send emails to addresses other than your Resend account email, 
                      you must verify a custom domain at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">resend.com/domains</a>.
                    </p>
                  </div>

                  {settingsMessage && (
                    <p className={`text-sm font-medium ${settingsMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                      {settingsMessage}
                    </p>
                  )}

                  <Button variant="primary" onClick={saveSettings} isLoading={settingsSaving} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* License Modal */}
      <Modal isOpen={!!licenseModal} onClose={() => setLicenseModal(null)} title={`Driver's License - ${licenseModal?.name}`} size="lg">
        {licenseModal && (
          <div className="space-y-4">
            <img src={licenseModal.url} alt="Driver's License" className="w-full rounded-xl" />
            <div className="flex gap-3">
              <a href={licenseModal.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="primary" className="w-full">Open Full Size</Button>
              </a>
              <a href={licenseModal.url} download className="flex-1">
                <Button variant="secondary" className="w-full">Download</Button>
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal isOpen={showAddVehicle} onClose={() => setShowAddVehicle(false)} title="Add Showcase Vehicle" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Year *" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} placeholder="2024" required />
            <Input label="Make *" value={newVehicle.make} onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })} placeholder="BMW" required />
            <Input label="Model *" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="M440i" required />
            <Input label="Trim" value={newVehicle.trim} onChange={(e) => setNewVehicle({ ...newVehicle, trim: e.target.value })} placeholder="xDrive Convertible" />
            <Input label="Price" value={newVehicle.price} onChange={(e) => setNewVehicle({ ...newVehicle, price: e.target.value })} placeholder="$65,000" />
            <Input label="Mileage" value={newVehicle.mileage} onChange={(e) => setNewVehicle({ ...newVehicle, mileage: e.target.value })} placeholder="12,000 km" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setVehicleImage(e.target.files?.[0] || null)} 
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" 
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowAddVehicle(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={addVehicle} className="flex-1">Add Vehicle</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Lead Card Component
function LeadCard({ lead, isExpanded, onToggle, onStatusChange, onDeadReasonChange, onViewLicense, editingNotes, notesValue, onStartEditNotes, onNotesChange, onSaveNotes, onCancelNotes }: {
  lead: Lead;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDeadReasonChange: (id: string, reason: string) => void;
  onViewLicense: () => void;
  editingNotes: string | null;
  notesValue: string;
  onStartEditNotes: (id: string, notes: string) => void;
  onNotesChange: (notes: string) => void;
  onSaveNotes: (id: string) => void;
  onCancelNotes: () => void;
}) {
  const { formData } = lead;
  const config = STATUS_CONFIG[lead.status] || STATUS_CONFIG['new'];
  
  const getBudget = () => {
    if (formData.paymentType === 'finance') {
      const map: Record<string, string> = { '400-or-less': '≤$400/mo', '400-500': '$400-500/mo', '500-600': '$500-600/mo', '600-plus': '$600+/mo' };
      return map[formData.financeBudget || ''] || 'N/A';
    }
    const map: Record<string, string> = { '15k-or-less': '≤$15k', '20-30k': '$20-30k', '30-45k': '$30-45k', '50k-plus': '$50k+' };
    return map[formData.cashBudget || ''] || 'N/A';
  };

  const vehicleTypes: Record<string, string> = {
    sedan: 'Sedan', suv: 'SUV', hatchback: 'Hatchback',
    'coupe-convertible': 'Coupe/Convertible', truck: 'Truck', minivan: 'Minivan'
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${lead.status === 'dead' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
      {/* Header Row */}
      <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50/50" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-lg text-slate-900 truncate">{formData.fullName}</h3>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.color}`}>
              {config.label}
            </span>
            {lead.driversLicenseKey && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                License
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="font-medium">{formData.phone}</span>
            <span className="text-slate-300">|</span>
            <span>{vehicleTypes[formData.vehicleType]} • {getBudget()}</span>
            <span className="text-slate-300">|</span>
            <span>{formatDate(lead.createdAt)}</span>
          </div>
        </div>
        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-100 p-5 bg-slate-50/50">
              {/* Status Buttons */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {leadStatusOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, opt.value); }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        lead.status === opt.value
                          ? `${STATUS_CONFIG[opt.value].bg} ${STATUS_CONFIG[opt.value].color} border-current`
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dead Reason Dropdown */}
              {lead.status === 'dead' && (
                <div className="mb-5">
                  <Select
                    label="Reason for Closing"
                    options={deadReasonOptions.map(o => ({ value: o.value, label: o.label }))}
                    value={lead.deadReason || ''}
                    onChange={(e) => onDeadReasonChange(lead.id, e.target.value)}
                  />
                </div>
              )}

              {/* Lead Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <a href={`mailto:${formData.email}`} className="text-sm text-primary-600 hover:underline font-medium truncate block">{formData.email}</a>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Credit Rating</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {formData.paymentType === 'finance' ? (formData.creditRating || 'N/A').charAt(0).toUpperCase() + (formData.creditRating || '').slice(1) : 'Cash Buyer'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Trade-In</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {formData.tradeIn === 'yes' ? `${formData.tradeInYear} ${formData.tradeInMake}` : formData.tradeIn === 'unsure' ? 'Maybe' : 'No'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Best Time</p>
                  <p className="text-sm text-slate-800 font-medium capitalize">{formData.bestTimeToReach}</p>
                </div>
              </div>

              {/* Driver's License Section - Prominent when available */}
              {lead.driversLicenseKey && (
                <div className="mb-5 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Driver&apos;s License Uploaded</p>
                        <p className="text-sm text-green-600">Click to view or download</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewLicense(); }} 
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View License
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center gap-3 mb-5">
                <a href={`tel:${formData.phone}`} className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </a>
                <a href={`mailto:${formData.email}`} className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              </div>

              {/* Notes Section */}
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Notes</p>
                {editingNotes === lead.id ? (
                  <div className="space-y-3">
                    <Textarea value={notesValue} onChange={(e) => onNotesChange(e.target.value)} rows={3} placeholder="Add notes about this lead..." />
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => onSaveNotes(lead.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={onCancelNotes}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={(e) => { e.stopPropagation(); onStartEditNotes(lead.id, lead.notes); }} 
                    className="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
                  >
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {lead.notes || <span className="text-slate-400 italic">Click to add notes...</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
