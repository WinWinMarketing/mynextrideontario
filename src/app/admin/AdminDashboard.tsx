'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Select, Textarea, Modal, StatusPill } from '@/components/ui';
import { Lead, LeadStatus, deadReasonOptions, leadStatusOptions } from '@/lib/validation';
import { formatDate, formatMonthYear } from '@/lib/utils';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [editingNotes, setEditingNotes] = useState<{ id: string; notes: string } | null>(null);
  const [licenseModal, setLicenseModal] = useState<{ url: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

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

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          year: selectedYear,
          month: selectedMonth,
          status,
        }),
      });

      if (response.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, status } : lead
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateLeadDeadReason = async (leadId: string, deadReason: string) => {
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          year: selectedYear,
          month: selectedMonth,
          deadReason,
        }),
      });

      if (response.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, deadReason: deadReason as Lead['deadReason'] } : lead
          )
        );
      }
    } catch (error) {
      console.error('Error updating dead reason:', error);
    }
  };

  const saveNotes = async (leadId: string, notes: string) => {
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          year: selectedYear,
          month: selectedMonth,
          notes,
        }),
      });

      if (response.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, notes } : lead
          )
        );
        setEditingNotes(null);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const viewLicense = async (lead: Lead) => {
    if (!lead.driversLicenseKey) return;

    try {
      const response = await fetch(
        `/api/admin/leads/${lead.id}/license-url?year=${selectedYear}&month=${selectedMonth}`
      );
      if (response.ok) {
        const data = await response.json();
        setLicenseModal({ url: data.url, name: lead.formData.fullName });
      }
    } catch (error) {
      console.error('Error getting license URL:', error);
    }
  };

  // Filter and sort leads
  const filteredLeads = leads
    .filter((lead) => statusFilter === 'all' || lead.status === statusFilter)
    .sort((a, b) => {
      // Dead leads at bottom
      if (a.status === 'dead' && b.status !== 'dead') return 1;
      if (a.status !== 'dead' && b.status === 'dead') return -1;
      // Then by date, newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const activeLeads = filteredLeads.filter((l) => l.status !== 'dead');
  const deadLeads = filteredLeads.filter((l) => l.status === 'dead');

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleString('en-CA', { month: 'long' }),
  }));

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
    { value: String(currentYear - 2), label: String(currentYear - 2) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary-100/50">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold gradient-text">Admin Dashboard</h1>
              <p className="text-sm text-muted">My Next Ride Ontario</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                options={monthOptions}
                value={String(selectedMonth)}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-36"
              />
              <Select
                options={yearOptions}
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-24"
              />
              <Select
                options={[
                  { value: 'all', label: 'All Statuses' },
                  ...leadStatusOptions.map((s) => ({ value: s, label: s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) })),
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                className="w-36"
              />
              <Button variant="ghost" onClick={onLogout} size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary-900">{leads.length}</div>
            <div className="text-sm text-muted">Total Leads</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-info">{leads.filter((l) => l.status === 'new').length}</div>
            <div className="text-sm text-muted">New</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-error">{leads.filter((l) => l.status === 'hot').length}</div>
            <div className="text-sm text-muted">Hot</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-success">{leads.filter((l) => l.status === 'approved').length}</div>
            <div className="text-sm text-muted">Approved</div>
          </Card>
        </div>

        {/* Month Header */}
        <h2 className="text-2xl font-bold mb-6">
          Leads for {formatMonthYear(new Date(selectedYear, selectedMonth - 1, 1))}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-muted">Loading leads...</span>
            </div>
          </div>
        ) : leads.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted">No leads for this month yet.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Leads */}
            {activeLeads.length > 0 && (
              <div className="space-y-4">
                {activeLeads.map((lead, index) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={index}
                    onStatusChange={updateLeadStatus}
                    onDeadReasonChange={updateLeadDeadReason}
                    onNotesEdit={(id, notes) => setEditingNotes({ id, notes })}
                    onViewLicense={() => viewLicense(lead)}
                    editingNotes={editingNotes}
                    onNotesSave={saveNotes}
                    onNotesCancel={() => setEditingNotes(null)}
                    onNotesChange={(notes) => setEditingNotes((prev) => prev ? { ...prev, notes } : null)}
                  />
                ))}
              </div>
            )}

            {/* Dead Leads Section */}
            {deadLeads.length > 0 && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-muted mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-foreground/30" />
                  Dead Leads ({deadLeads.length})
                </h3>
                <div className="space-y-4 opacity-70">
                  {deadLeads.map((lead, index) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      index={index}
                      onStatusChange={updateLeadStatus}
                      onDeadReasonChange={updateLeadDeadReason}
                      onNotesEdit={(id, notes) => setEditingNotes({ id, notes })}
                      onViewLicense={() => viewLicense(lead)}
                      editingNotes={editingNotes}
                      onNotesSave={saveNotes}
                      onNotesCancel={() => setEditingNotes(null)}
                      onNotesChange={(notes) => setEditingNotes((prev) => prev ? { ...prev, notes } : null)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* License Modal */}
      <Modal
        isOpen={!!licenseModal}
        onClose={() => setLicenseModal(null)}
        title={`Driver's License - ${licenseModal?.name}`}
        size="xl"
      >
        {licenseModal && (
          <div className="space-y-4">
            <img
              src={licenseModal.url}
              alt="Driver's License"
              className="w-full rounded-lg"
            />
            <div className="flex gap-3">
              <a
                href={licenseModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="primary" className="w-full">
                  Open in New Tab
                </Button>
              </a>
              <a href={licenseModal.url} download className="flex-1">
                <Button variant="secondary" className="w-full">
                  Download
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Lead Card Component
interface LeadCardProps {
  lead: Lead;
  index: number;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDeadReasonChange: (id: string, reason: string) => void;
  onNotesEdit: (id: string, notes: string) => void;
  onViewLicense: () => void;
  editingNotes: { id: string; notes: string } | null;
  onNotesSave: (id: string, notes: string) => void;
  onNotesCancel: () => void;
  onNotesChange: (notes: string) => void;
}

function LeadCard({
  lead,
  index,
  onStatusChange,
  onDeadReasonChange,
  onNotesEdit,
  onViewLicense,
  editingNotes,
  onNotesSave,
  onNotesCancel,
  onNotesChange,
}: LeadCardProps) {
  const { formData } = lead;

  const getBudgetDisplay = () => {
    if (formData.paymentType === 'finance') {
      const budgetMap: Record<string, string> = {
        '400-or-less': '≤$400/mo',
        '400-500': '$400-500/mo',
        '500-600': '$500-600/mo',
        '600-plus': '$600+/mo',
      };
      return budgetMap[formData.financeBudget || ''] || 'N/A';
    } else {
      const budgetMap: Record<string, string> = {
        '15k-or-less': '≤$15k',
        '20-30k': '$20-30k',
        '30-45k': '$30-45k',
        '50k-plus': '$50k+',
      };
      return budgetMap[formData.cashBudget || ''] || 'N/A';
    }
  };

  const vehicleTypeLabel: Record<string, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    hatchback: 'Hatchback',
    'coupe-convertible': 'Coupe',
    truck: 'Truck',
    minivan: 'Minivan',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold">{formData.fullName}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted mt-1">
              <a href={`tel:${formData.phone}`} className="hover:text-primary-700">
                📞 {formData.phone}
              </a>
              <span>•</span>
              <a href={`mailto:${formData.email}`} className="hover:text-primary-700">
                ✉️ {formData.email}
              </a>
            </div>
            <p className="text-xs text-muted mt-1">
              {formatDate(lead.createdAt)} • DOB: {formData.dateOfBirth}
            </p>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap gap-2">
            {leadStatusOptions.map((status) => (
              <StatusPill
                key={status}
                status={status}
                active={lead.status === status}
                onClick={() => onStatusChange(lead.id, status)}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-primary-50 rounded-xl">
          <div>
            <span className="text-xs text-muted">Vehicle</span>
            <p className="font-medium">{vehicleTypeLabel[formData.vehicleType] || formData.vehicleType}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Budget</span>
            <p className="font-medium">{getBudgetDisplay()}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Credit</span>
            <p className="font-medium">
              {formData.paymentType === 'finance'
                ? (formData.creditRating || 'N/A').charAt(0).toUpperCase() + (formData.creditRating || '').slice(1)
                : 'Cash'}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted">Trade-In</span>
            <p className="font-medium">
              {formData.tradeIn === 'yes'
                ? `${formData.tradeInYear} ${formData.tradeInMake}`
                : formData.tradeIn === 'unsure'
                ? 'Maybe'
                : 'No'}
            </p>
          </div>
        </div>

        {/* Dead Reason */}
        {lead.status === 'dead' && (
          <div className="mb-4">
            <Select
              label="Dead Reason"
              options={deadReasonOptions.map((o) => ({ value: o.value, label: o.label }))}
              value={lead.deadReason || ''}
              onChange={(e) => onDeadReasonChange(lead.id, e.target.value)}
              placeholder="Select reason..."
            />
          </div>
        )}

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.cosigner === 'yes' && (
            <span className="text-xs px-2 py-1 bg-info/10 text-info rounded-full">
              Has Cosigner
            </span>
          )}
          {lead.driversLicenseKey && (
            <button
              onClick={onViewLicense}
              className="text-xs px-2 py-1 bg-success/10 text-success rounded-full hover:bg-success/20 transition-colors"
            >
              📄 View License
            </button>
          )}
          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
            {formData.licenseClass.toUpperCase()}
          </span>
          <span className="text-xs px-2 py-1 bg-accent/20 text-primary-900 rounded-full">
            Best: {formData.bestTimeToReach}
          </span>
        </div>

        {/* Notes */}
        <div className="border-t border-primary-100 pt-4">
          {editingNotes?.id === lead.id ? (
            <div className="space-y-3">
              <Textarea
                label="Notes"
                value={editingNotes.notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onNotesSave(lead.id, editingNotes.notes)}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onNotesCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => onNotesEdit(lead.id, lead.notes)}
              className="cursor-pointer p-3 bg-primary-50/50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <p className="text-xs text-muted mb-1">Notes (click to edit)</p>
              <p className="text-sm whitespace-pre-wrap">
                {lead.notes || <span className="text-muted italic">No notes yet...</span>}
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

