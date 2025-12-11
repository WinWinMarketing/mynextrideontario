'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus, deadReasonOptions } from '@/lib/validation';
import { Button, Modal, Select } from '@/components/ui';
import { EmailTemplate, DEFAULT_TEMPLATES } from '@/lib/email';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

const STAGES = [
  { id: 'new', label: 'NEW INQUIRIES', color: '#3b82f6', x: 0, y: 50 },
  { id: 'working', label: 'ENGAGED LEADS', color: '#eab308', x: 35, y: 30 },
  { id: 'circle-back', label: 'FOLLOW UP', color: '#06b6d4', x: 35, y: 70 },
  { id: 'approval', label: 'APPLICATION PENDING', color: '#22c55e', x: 70, y: 50 },
];

const DEAD_CATEGORIES = [
  { id: 'declined', label: 'Declined' },
  { id: 'negative-equity', label: 'Negative Equity' },
  { id: 'no-longer-interested', label: 'No Contact' },
  { id: 'already-purchased', label: 'Already Purchased' },
  { id: 'cannot-afford-payment', label: 'Cannot Afford' },
  { id: 'too-far-to-visit', label: 'Too Far' },
];

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [bulkEmailModal, setBulkEmailModal] = useState<{ stage: string; leads: Lead[] } | null>(null);

  const getStageLeads = (stageId: string) => leads.filter(l => l.status === stageId);
  const getDeadLeadsByReason = (reason: string) => leads.filter(l => l.status === 'dead' && l.deadReason === reason);
  const deadLeads = leads.filter(l => l.status === 'dead');

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.5, Math.min(2, z + delta)));
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

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 canvas-bg"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Pipeline</h1>
          <p className="text-slate-400 text-sm">Drag leads between stages • Scroll to zoom • Drag canvas to pan</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setZoom(z => Math.min(2, z + 0.2))}
            className="w-10 h-10 rounded-lg bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center"
          >
            +
          </button>
          <span className="text-slate-400 text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
            className="w-10 h-10 rounded-lg bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center"
          >
            −
          </button>
          <button 
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute w-full h-full transition-transform duration-100"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0.5" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* New -> Engaged */}
            <path
              d="M 15% 50% Q 25% 40% 35% 30%"
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              filter="url(#glow)"
            />
            {/* New -> Follow Up */}
            <path
              d="M 15% 50% Q 25% 60% 35% 70%"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeOpacity="0.4"
              filter="url(#glow)"
            />
            {/* Engaged -> Application */}
            <path
              d="M 45% 30% Q 55% 40% 70% 50%"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeOpacity="0.4"
              filter="url(#glow)"
            />
            {/* Follow Up -> Application */}
            <path
              d="M 45% 70% Q 55% 60% 70% 50%"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeOpacity="0.4"
              filter="url(#glow)"
            />
          </svg>

          {/* Stage Nodes */}
          {STAGES.map((stage) => (
            <StageNode
              key={stage.id}
              stage={stage}
              leads={getStageLeads(stage.id)}
              isSelected={selectedStage === stage.id}
              onSelect={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              onDrop={() => handleDrop(stage.id)}
              onDragStart={setDraggedLead}
              onViewDetails={onViewDetails}
              onBulkEmail={() => setBulkEmailModal({ stage: stage.id, leads: getStageLeads(stage.id) })}
              starredLeads={starredLeads}
              onToggleStar={onToggleStar}
              isDragTarget={!!draggedLead && draggedLead.status !== stage.id}
            />
          ))}
        </div>
      </div>

      {/* Dead Leads Archive Panel */}
      <div className="absolute bottom-0 right-0 w-96 bg-slate-900/95 backdrop-blur-xl border-t border-l border-slate-700 rounded-tl-3xl p-6 z-20">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          DEAD LEADS ARCHIVE
          <span className="text-slate-400 font-normal ml-2">({deadLeads.length})</span>
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          {DEAD_CATEGORIES.map((cat) => {
            const count = getDeadLeadsByReason(cat.id).length;
            return (
              <div
                key={cat.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop('dead', cat.id)}
                className={`
                  p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer
                  ${draggedLead ? 'border-red-500/50 bg-red-500/10' : 'border-slate-700 hover:border-slate-600'}
                `}
              >
                <div className="text-white font-semibold text-sm">{cat.label}</div>
                <div className="text-slate-400 text-xs mt-1">{count} leads</div>
              </div>
            );
          })}
        </div>

        {deadLeads.length > 0 && (
          <div className="mt-4 max-h-32 overflow-y-auto space-y-2">
            {deadLeads.slice(0, 5).map((lead) => (
              <div 
                key={lead.id} 
                className="flex items-center justify-between bg-slate-800 rounded-lg p-2 text-sm"
              >
                <span className="text-white truncate">{lead.formData.fullName}</span>
                <span className="text-red-400 text-xs capitalize">{lead.deadReason?.replace(/-/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Email Modal */}
      <Modal isOpen={!!bulkEmailModal} onClose={() => setBulkEmailModal(null)} title="Bulk Email" size="xl">
        {bulkEmailModal && (
          <BulkEmailComposer 
            leads={bulkEmailModal.leads} 
            stageName={STAGES.find(s => s.id === bulkEmailModal.stage)?.label || ''}
            onClose={() => setBulkEmailModal(null)} 
          />
        )}
      </Modal>
    </div>
  );
}

// Stage Node Component
function StageNode({ 
  stage, 
  leads, 
  isSelected, 
  onSelect, 
  onDrop, 
  onDragStart, 
  onViewDetails,
  onBulkEmail,
  starredLeads,
  onToggleStar,
  isDragTarget 
}: {
  stage: typeof STAGES[0];
  leads: Lead[];
  isSelected: boolean;
  onSelect: () => void;
  onDrop: () => void;
  onDragStart: (lead: Lead) => void;
  onViewDetails: (lead: Lead) => void;
  onBulkEmail: () => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
  isDragTarget: boolean;
}) {
  const size = isSelected ? 280 : 180;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${stage.x}%`,
        top: `${stage.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      animate={{ scale: isSelected ? 1 : 1 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Glow Effect */}
      <div 
        className="absolute rounded-full blur-3xl transition-all duration-500"
        style={{
          width: size + 40,
          height: size + 40,
          left: -20,
          top: -20,
          backgroundColor: stage.color,
          opacity: isSelected ? 0.3 : 0.1,
        }}
      />

      {/* Main Circle */}
      <motion.div
        onClick={onSelect}
        className={`
          relative rounded-full cursor-pointer transition-all duration-300
          border-2 flex flex-col items-center justify-center
          ${isDragTarget ? 'ring-4 ring-white/30' : ''}
        `}
        style={{
          width: size,
          height: size,
          borderColor: stage.color,
          backgroundColor: `${stage.color}15`,
        }}
        whileHover={{ scale: 1.05 }}
      >
        {/* Label */}
        <div className="text-center px-4">
          <div className="text-white font-bold text-sm tracking-wider">{stage.label}</div>
          <div className="text-3xl font-bold mt-1" style={{ color: stage.color }}>
            {leads.length}
          </div>
        </div>

        {/* Actions when selected */}
        {isSelected && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-12 flex gap-2"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); onBulkEmail(); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg"
            >
              ✉️ Bulk Email
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Expanded Lead List */}
      <AnimatePresence>
        {isSelected && leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 max-h-80 overflow-y-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 p-3 z-30"
          >
            <div className="space-y-2">
              {leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  draggable
                  onDragStart={() => onDragStart(lead)}
                  className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-grab active:cursor-grabbing"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{lead.formData.fullName}</div>
                    <div className="text-slate-400 text-xs truncate">{lead.formData.vehicleType}</div>
                  </div>
                  <button 
                    onClick={() => onToggleStar(lead.id)}
                    className="text-lg"
                  >
                    {starredLeads.has(lead.id) ? '⭐' : '☆'}
                  </button>
                  <button 
                    onClick={() => onViewDetails(lead)}
                    className="text-primary-400 hover:text-primary-300 text-xs"
                  >
                    View
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Bulk Email Composer with Approval
function BulkEmailComposer({ leads, stageName, onClose }: { leads: Lead[]; stageName: string; onClose: () => void }) {
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
      if (currentIndex < leads.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
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
        <p className="text-slate-500">Sent {approved.size} emails successfully</p>
        <Button onClick={onClose} className="mt-6">Close</Button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No leads in this stage</p>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Reviewing: {currentIndex + 1} of {leads.length} • {approved.size} approved
        </div>
        <div className="text-sm font-medium text-primary-600">{stageName}</div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-600 transition-all"
          style={{ width: `${(approved.size / leads.length) * 100}%` }}
        />
      </div>

      {/* Current Lead */}
      {currentLead && (
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
              {currentLead.formData.fullName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{currentLead.formData.fullName}</div>
              <div className="text-sm text-slate-500">{currentLead.formData.email}</div>
            </div>
            {approved.has(currentLead.id) && (
              <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                ✓ Approved
              </span>
            )}
          </div>

          <Select
            label="Template"
            options={[{ value: '', label: 'Choose template...' }, ...templates.map(t => ({ value: t.id, label: t.name }))]}
            value={selectedTemplate}
            onChange={(e) => applyTemplate(e.target.value)}
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Message Preview</label>
            <textarea
              value={emailBodies[currentLead.id] || ''}
              onChange={(e) => setEmailBodies(prev => ({ ...prev, [currentLead.id]: e.target.value }))}
              rows={6}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none text-sm"
              placeholder="Select a template or write your message..."
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          {currentIndex < leads.length - 1 ? (
            <>
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Skip
              </button>
              <Button onClick={approveAndNext} disabled={!emailBodies[currentLead?.id]}>
                Approve & Next →
              </Button>
            </>
          ) : (
            <Button onClick={approveAndNext} disabled={!emailBodies[currentLead?.id]}>
              Approve
            </Button>
          )}
        </div>

        <button
          onClick={() => setCurrentIndex(Math.min(leads.length - 1, currentIndex + 1))}
          disabled={currentIndex === leads.length - 1}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      {/* Send All */}
      {approved.size > 0 && (
        <div className="pt-4 border-t">
          <Button 
            onClick={sendAll} 
            isLoading={sending}
            className="w-full"
            variant="primary"
          >
            Send {approved.size} Approved Emails
          </Button>
        </div>
      )}
    </div>
  );
}

