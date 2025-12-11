'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus, deadReasonOptions } from '@/lib/validation';
import { Button, Modal, Select } from '@/components/ui';
import { DEFAULT_TEMPLATES } from '@/lib/email';
import { formatDate } from '@/lib/utils';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

// Pipeline Stages (Dead is separate on left)
const STAGES = [
  { id: 'new', label: 'NEW INQUIRIES', color: '#3b82f6', accent: 'from-blue-500/20 to-blue-600/10' },
  { id: 'working', label: 'ENGAGED', color: '#eab308', accent: 'from-yellow-500/20 to-yellow-600/10' },
  { id: 'circle-back', label: 'FOLLOW UP', color: '#06b6d4', accent: 'from-cyan-500/20 to-cyan-600/10' },
  { id: 'approval', label: 'PENDING APPROVAL', color: '#22c55e', accent: 'from-green-500/20 to-green-600/10' },
];

const DEAD_CATEGORIES = [
  { id: 'declined', label: 'Declined', icon: '✕' },
  { id: 'negative-equity', label: 'Neg. Equity', icon: '−' },
  { id: 'no-longer-interested', label: 'No Interest', icon: '○' },
  { id: 'already-purchased', label: 'Purchased', icon: '✓' },
  { id: 'cannot-afford-payment', label: 'Budget', icon: '$' },
  { id: 'too-far-to-visit', label: 'Distance', icon: '◇' },
];

const HOTKEYS = [
  { key: 'B', action: 'Bulk Email', desc: 'Send emails to selected leads' },
  { key: 'M', action: 'Bulk Move', desc: 'Move selected leads to another stage' },
  { key: 'S', action: 'Star/Unstar', desc: 'Toggle star on focused lead' },
  { key: 'D', action: 'Details', desc: 'Open lead details popup' },
  { key: 'F', action: 'Follow Up', desc: 'Mark for follow up' },
  { key: '?', action: 'Help', desc: 'Show this help panel' },
  { key: 'Esc', action: 'Close', desc: 'Close any open modal' },
];

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollX, setScrollX] = useState(0);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkEmailModal, setBulkEmailModal] = useState<Lead[] | null>(null);
  const [overdueThreshold, setOverdueThreshold] = useState(3); // days
  const [focusedLead, setFocusedLead] = useState<string | null>(null);

  // Get leads by status
  const getStageLeads = (stageId: string) => leads.filter(l => l.status === stageId);
  const getDeadLeadsByReason = (reason: string) => leads.filter(l => l.status === 'dead' && l.deadReason === reason);
  const deadLeads = leads.filter(l => l.status === 'dead');

  // Check if lead is overdue
  const isOverdue = (lead: Lead) => {
    const created = new Date(lead.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > overdueThreshold && lead.status !== 'approval' && lead.status !== 'dead';
  };

  const overdueLeads = leads.filter(isOverdue);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case '?':
          e.preventDefault();
          setShowHelp(true);
          break;
        case 'escape':
          setShowHelp(false);
          setShowSettings(false);
          setBulkEmailModal(null);
          break;
        case 'b':
          if (selectedLeads.size > 0) {
            const leadsToEmail = leads.filter(l => selectedLeads.has(l.id));
            setBulkEmailModal(leadsToEmail);
          }
          break;
        case 's':
          if (focusedLead) onToggleStar(focusedLead);
          break;
        case 'd':
          if (focusedLead) {
            const lead = leads.find(l => l.id === focusedLead);
            if (lead) onViewDetails(lead);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLeads, focusedLead, leads, onToggleStar, onViewDetails]);

  // Horizontal scroll with wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (e.shiftKey) {
      // Zoom
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(0.6, Math.min(1.5, z + delta)));
    } else {
      // Horizontal scroll
      setScrollX(x => x - e.deltaY);
    }
  };

  const handleDrop = (stageId: string, deadReason?: string) => {
    if (draggedLead) {
      if (stageId === 'dead' && deadReason) {
        onStatusChange(draggedLead.id, 'dead', deadReason);
      } else if (stageId !== 'dead') {
        onStatusChange(draggedLead.id, stageId as LeadStatus);
      }
      setDraggedLead(null);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) newSet.delete(leadId);
      else newSet.add(leadId);
      return newSet;
    });
  };

  return (
    <div className="h-full bg-[#0a0f1a] relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `
          linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Lead Pipeline</h1>
            <p className="text-xs text-slate-500">Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70">?</kbd> for hotkeys</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 text-white flex items-center justify-center">−</button>
              <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 text-white flex items-center justify-center">+</button>
            </div>
            <button onClick={() => setShowSettings(true)} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white">⚙️ Settings</button>
            <button onClick={() => setShowHelp(true)} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white">? Help</button>
          </div>
        </div>
      </div>

      {/* Main Pipeline Area */}
      <div
        ref={containerRef}
        className="absolute inset-0 pt-16 pb-16 overflow-hidden"
        onWheel={handleWheel}
      >
        <div
          className="flex h-full px-6 gap-6 transition-transform duration-200"
          style={{
            transform: `translateX(${scrollX}px) scale(${zoom})`,
            transformOrigin: 'left center',
          }}
        >
          {/* Dead Leads Archive - LEFT SIDE */}
          <div className="flex-shrink-0 w-64 h-full">
            <div className="h-full bg-gradient-to-b from-red-900/20 to-red-950/10 backdrop-blur-xl rounded-2xl border border-red-500/20 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-white font-bold text-sm">DEAD LEADS</h3>
                <span className="ml-auto text-red-400 text-xs">{deadLeads.length}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {DEAD_CATEGORIES.map((cat) => {
                  const count = getDeadLeadsByReason(cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop('dead', cat.id)}
                      className={`p-2 rounded-xl border border-dashed transition-all cursor-pointer text-center ${
                        draggedLead ? 'border-red-400 bg-red-500/10' : 'border-red-500/20 hover:border-red-500/40'
                      }`}
                    >
                      <span className="text-red-400 text-lg">{cat.icon}</span>
                      <div className="text-white text-xs font-medium mt-1">{cat.label}</div>
                      <div className="text-red-400/60 text-[10px]">{count}</div>
                    </div>
                  );
                })}
              </div>

              {/* Dead leads list */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {deadLeads.slice(0, 8).map((lead) => (
                  <div key={lead.id} className="bg-red-950/30 rounded-lg p-2 text-xs">
                    <div className="text-white font-medium truncate">{lead.formData.fullName}</div>
                    <div className="text-red-400/60 capitalize">{lead.deadReason?.replace(/-/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Stages */}
          {STAGES.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              leads={getStageLeads(stage.id)}
              isExpanded={selectedStage === stage.id}
              onExpand={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              onDrop={() => handleDrop(stage.id)}
              onDragStart={setDraggedLead}
              onViewDetails={onViewDetails}
              starredLeads={starredLeads}
              onToggleStar={onToggleStar}
              selectedLeads={selectedLeads}
              onToggleSelect={toggleLeadSelection}
              isDragTarget={!!draggedLead && draggedLead.status !== stage.id}
              focusedLead={focusedLead}
              onFocusLead={setFocusedLead}
              isOverdue={isOverdue}
            />
          ))}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-[#0a0f1a]/90 backdrop-blur-xl border-t border-white/5 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs text-slate-400">
                <span className="text-amber-400 font-bold">{overdueLeads.length}</span> overdue ({overdueThreshold}+ days)
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {selectedLeads.size > 0 && (
                <span className="text-primary-400">{selectedLeads.size} selected • Press B for bulk email</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Scroll: Navigate</span>
            <span>Shift+Scroll: Zoom</span>
            <span>Drag: Move leads</span>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#12182a] rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4">Keyboard Shortcuts</h2>
              <div className="space-y-2">
                {HOTKEYS.map(h => (
                  <div key={h.key} className="flex items-center gap-4 py-2 border-b border-white/5">
                    <kbd className="px-2 py-1 bg-white/10 rounded text-white font-mono text-sm min-w-[40px] text-center">{h.key}</kbd>
                    <div>
                      <div className="text-white font-medium text-sm">{h.action}</div>
                      <div className="text-slate-500 text-xs">{h.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowHelp(false)} className="mt-6 w-full py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#12182a] rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Overdue Threshold (days)</label>
                  <div className="flex gap-2">
                    {[1, 3, 7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setOverdueThreshold(d)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          overdueThreshold === d ? 'bg-primary-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => setShowSettings(false)} className="mt-6 w-full py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Email Modal */}
      <Modal isOpen={!!bulkEmailModal} onClose={() => setBulkEmailModal(null)} title="Bulk Email" size="xl">
        {bulkEmailModal && <BulkEmailComposer leads={bulkEmailModal} onClose={() => setBulkEmailModal(null)} />}
      </Modal>
    </div>
  );
}

// Stage Column Component - Phone-like rectangular design
function StageColumn({
  stage,
  leads,
  isExpanded,
  onExpand,
  onDrop,
  onDragStart,
  onViewDetails,
  starredLeads,
  onToggleStar,
  selectedLeads,
  onToggleSelect,
  isDragTarget,
  focusedLead,
  onFocusLead,
  isOverdue,
}: {
  stage: typeof STAGES[0];
  leads: Lead[];
  isExpanded: boolean;
  onExpand: () => void;
  onDrop: () => void;
  onDragStart: (lead: Lead) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
  selectedLeads: Set<string>;
  onToggleSelect: (id: string) => void;
  isDragTarget: boolean;
  focusedLead: string | null;
  onFocusLead: (id: string | null) => void;
  isOverdue: (lead: Lead) => boolean;
}) {
  const width = isExpanded ? 380 : 280;

  return (
    <motion.div
      className="flex-shrink-0 h-full"
      animate={{ width }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Metallic Glass Card */}
      <div
        className={`h-full rounded-2xl overflow-hidden transition-all duration-300 ${
          isDragTarget ? 'ring-2 ring-white/30' : ''
        }`}
        style={{
          background: `linear-gradient(180deg, ${stage.color}15 0%, ${stage.color}05 100%)`,
          border: `1px solid ${stage.color}30`,
          boxShadow: `0 4px 30px ${stage.color}10, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b cursor-pointer"
          style={{ borderColor: `${stage.color}20` }}
          onClick={onExpand}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-white font-bold text-xs tracking-wider">{stage.label}</span>
            </div>
            <div
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
            >
              {leads.length}
            </div>
          </div>
        </div>

        {/* Leads List - Phone-like display */}
        <div className="p-3 h-[calc(100%-60px)] overflow-y-auto space-y-2">
          {leads.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Drop leads here
            </div>
          ) : (
            leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                stageColor={stage.color}
                isStarred={starredLeads.has(lead.id)}
                isSelected={selectedLeads.has(lead.id)}
                isFocused={focusedLead === lead.id}
                isOverdue={isOverdue(lead)}
                onToggleStar={() => onToggleStar(lead.id)}
                onToggleSelect={() => onToggleSelect(lead.id)}
                onViewDetails={() => onViewDetails(lead)}
                onDragStart={() => onDragStart(lead)}
                onFocus={() => onFocusLead(lead.id)}
                isExpanded={isExpanded}
              />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Lead Card - Phone-like metallic design
function LeadCard({
  lead,
  stageColor,
  isStarred,
  isSelected,
  isFocused,
  isOverdue,
  onToggleStar,
  onToggleSelect,
  onViewDetails,
  onDragStart,
  onFocus,
  isExpanded,
}: {
  lead: Lead;
  stageColor: string;
  isStarred: boolean;
  isSelected: boolean;
  isFocused: boolean;
  isOverdue: boolean;
  onToggleStar: () => void;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onDragStart: () => void;
  onFocus: () => void;
  isExpanded: boolean;
}) {
  const { formData } = lead;
  const daysSinceCreated = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      draggable
      onDragStart={onDragStart}
      onClick={onFocus}
      onDoubleClick={onViewDetails}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all
        ${isSelected ? 'ring-2 ring-primary-500' : ''}
        ${isFocused ? 'ring-2 ring-white/50' : ''}
        ${isOverdue ? 'ring-1 ring-amber-500/50' : ''}
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Checkbox for selection */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        className="absolute top-2 left-2 w-5 h-5 rounded border border-white/20 flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors"
        style={{ backgroundColor: isSelected ? stageColor : 'transparent' }}
      >
        {isSelected && <span className="text-white text-xs">✓</span>}
      </div>

      {/* Star */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
        className="absolute top-2 right-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
      >
        {isStarred ? '⭐' : '☆'}
      </button>

      {/* Content */}
      <div className="p-3 pt-8">
        {/* Name & Time */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-semibold text-sm truncate pr-2">{formData.fullName}</h4>
          <span className={`text-[10px] ${isOverdue ? 'text-amber-400' : 'text-slate-500'}`}>
            {daysSinceCreated}d ago
          </span>
        </div>

        {/* Vehicle & Budget */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span className="px-2 py-0.5 rounded bg-white/5">{formData.vehicleType}</span>
          <span className="px-2 py-0.5 rounded bg-white/5">
            {formData.paymentType === 'finance' ? formData.financeBudget : formData.cashBudget}
          </span>
        </div>

        {/* Expanded Info */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 pt-2 border-t border-white/10"
          >
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">📞</span>
                <span>{formData.phone}</span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-500">✉️</span>
                <span className="truncate">{formData.email}</span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
              className="mt-3 w-full py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs text-white font-medium transition-colors"
            >
              View Details
            </button>
          </motion.div>
        )}
      </div>

      {/* Overdue indicator */}
      {isOverdue && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
      )}
    </motion.div>
  );
}

// Bulk Email Composer
function BulkEmailComposer({ leads, onClose }: { leads: Lead[]; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [emailBodies, setEmailBodies] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const templates = DEFAULT_TEMPLATES;
  const currentLead = leads[currentIndex];

  const applyTemplate = (templateId: string) => {
    const t = templates.find(t => t.id === templateId);
    if (t && currentLead) {
      const vars: Record<string, string> = {
        '{{name}}': currentLead.formData.fullName,
        '{{vehicle}}': currentLead.formData.vehicleType,
        '{{budget}}': currentLead.formData.paymentType === 'finance' ? currentLead.formData.financeBudget || '' : currentLead.formData.cashBudget || '',
      };
      let body = t.body;
      Object.entries(vars).forEach(([k, v]) => {
        body = body.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v);
      });
      setEmailBodies(prev => ({ ...prev, [currentLead.id]: body }));
    }
    setSelectedTemplate(templateId);
  };

  const approveAndNext = () => {
    if (currentLead) {
      setApproved(prev => new Set(prev).add(currentLead.id));
      if (currentIndex < leads.length - 1) setCurrentIndex(currentIndex + 1);
    }
  };

  const sendAll = async () => {
    setSending(true);
    for (const leadId of Array.from(approved)) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && emailBodies[leadId]) {
        try {
          await fetch('/api/admin/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: lead.formData.email,
              toName: lead.formData.fullName,
              subject: `Following up - ${lead.formData.fullName}`,
              body: emailBodies[leadId],
            }),
          });
        } catch (e) { console.error(e); }
      }
    }
    setSent(true);
    setSending(false);
  };

  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Emails Sent!</h3>
        <p className="text-slate-500">Sent {approved.size} emails</p>
        <Button onClick={onClose} className="mt-6">Close</Button>
      </div>
    );
  }

  if (leads.length === 0) {
    return <div className="text-center py-12 text-slate-500">No leads selected</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Reviewing {currentIndex + 1} of {leads.length}</span>
        <span className="text-sm text-primary-600 font-medium">{approved.size} approved</span>
      </div>

      <div className="h-2 bg-slate-200 rounded-full">
        <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${(approved.size / leads.length) * 100}%` }} />
      </div>

      {currentLead && (
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
              {currentLead.formData.fullName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold">{currentLead.formData.fullName}</div>
              <div className="text-sm text-slate-500">{currentLead.formData.email}</div>
            </div>
            {approved.has(currentLead.id) && (
              <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Approved</span>
            )}
          </div>

          <Select
            label="Template"
            options={[{ value: '', label: 'Choose...' }, ...templates.map(t => ({ value: t.id, label: t.name }))]}
            value={selectedTemplate}
            onChange={(e) => applyTemplate(e.target.value)}
          />

          <textarea
            value={emailBodies[currentLead.id] || ''}
            onChange={(e) => setEmailBodies(prev => ({ ...prev, [currentLead.id]: e.target.value }))}
            rows={5}
            className="mt-3 w-full p-3 rounded-xl border border-slate-200 focus:border-primary-500 outline-none resize-none text-sm"
            placeholder="Select a template or write message..."
          />
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="px-4 py-2 text-sm text-slate-600 disabled:opacity-50">← Prev</button>
        <div className="flex gap-2">
          <button onClick={() => setCurrentIndex(Math.min(leads.length - 1, currentIndex + 1))} className="px-4 py-2 text-sm text-slate-600">Skip</button>
          <Button onClick={approveAndNext} disabled={!emailBodies[currentLead?.id]}>Approve {currentIndex < leads.length - 1 ? '& Next' : ''}</Button>
        </div>
        <button onClick={() => setCurrentIndex(Math.min(leads.length - 1, currentIndex + 1))} disabled={currentIndex === leads.length - 1} className="px-4 py-2 text-sm text-slate-600 disabled:opacity-50">Next →</button>
      </div>

      {approved.size > 0 && (
        <div className="pt-4 border-t">
          <Button onClick={sendAll} isLoading={sending} className="w-full">Send {approved.size} Emails</Button>
        </div>
      )}
    </div>
  );
}
