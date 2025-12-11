'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

const DEAD_REASONS = [
  { id: 'declined', label: 'Declined' },
  { id: 'negative-equity', label: 'Neg. Equity' },
  { id: 'no-longer-interested', label: 'No Interest' },
  { id: 'already-purchased', label: 'Purchased' },
  { id: 'cannot-afford-payment', label: 'Budget' },
  { id: 'too-far-to-visit', label: 'Too Far' },
];

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const getStageLeads = (stageId: string) => leads.filter(l => l.status === stageId);
  const deadLeads = leads.filter(l => l.status === 'dead');
  const getDeadByReason = (reason: string) => deadLeads.filter(l => l.deadReason === reason);

  // Stage positions and sizes (based on lead count)
  const stages = [
    { id: 'new', label: 'NEW INQUIRIES', x: 12, y: 45, baseWidth: 280, baseHeight: 160 },
    { id: 'working', label: 'ENGAGED', x: 38, y: 25, baseWidth: 220, baseHeight: 140 },
    { id: 'circle-back', label: 'FOLLOW UP', x: 38, y: 68, baseWidth: 220, baseHeight: 140 },
    { id: 'approval', label: 'APPROVED', x: 65, y: 45, baseWidth: 240, baseHeight: 150 },
  ];

  // Canvas interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.stage-card') || (e.target as HTMLElement).closest('.lead-item')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.03 : 0.03;
    setZoom(z => Math.max(0.4, Math.min(1.2, z + delta)));
  };

  const handleDrop = (stageId: string, deadReason?: string) => {
    if (draggedLead) {
      if (stageId === 'dead' && deadReason) {
        onStatusChange(draggedLead.id, 'dead', deadReason);
      } else {
        onStatusChange(draggedLead.id, stageId as LeadStatus);
      }
      setDraggedLead(null);
    }
  };

  // Calculate dynamic size based on lead count
  const getStageSize = (stageId: string, baseWidth: number, baseHeight: number) => {
    const count = getStageLeads(stageId).length;
    const scale = Math.min(1.5, 1 + (count * 0.05));
    return { width: baseWidth * scale, height: baseHeight * scale };
  };

  return (
    <div className="h-full bg-[#0a0e17] relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(30,64,175,0.08) 0%, transparent 50%),
          linear-gradient(rgba(30,64,175,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,64,175,0.12) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 80px 80px, 80px 80px',
      }} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-[#0a0e17] to-transparent">
        <div>
          <h1 className="text-xl font-bold text-white">Lead Pipeline</h1>
          <p className="text-xs text-slate-500">Drag canvas to explore • Scroll to zoom</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          <button onClick={() => setZoom(z => Math.min(1.2, z + 0.1))} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
          <button onClick={() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }} className="px-4 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm border border-white/10 transition-all ml-2">
            Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <motion.div
          className="absolute w-full h-full"
          animate={{ x: pan.x, y: pan.y, scale: zoom }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ transformOrigin: 'center center' }}
        >
          {/* Dotted Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(59,130,246,0.4)" />
              </marker>
            </defs>
            
            {/* New → Engaged */}
            <motion.path
              d="M 22% 45% C 28% 35%, 32% 28%, 35% 28%"
              fill="none"
              stroke="rgba(59,130,246,0.3)"
              strokeWidth="2"
              strokeDasharray="8 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
            />
            
            {/* New → Follow Up */}
            <motion.path
              d="M 22% 50% C 28% 60%, 32% 68%, 35% 68%"
              fill="none"
              stroke="rgba(59,130,246,0.3)"
              strokeWidth="2"
              strokeDasharray="8 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.4 }}
            />
            
            {/* Engaged → Approved */}
            <motion.path
              d="M 48% 28% C 54% 32%, 58% 40%, 62% 45%"
              fill="none"
              stroke="rgba(59,130,246,0.3)"
              strokeWidth="2"
              strokeDasharray="8 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.6 }}
            />
            
            {/* Follow Up → Approved */}
            <motion.path
              d="M 48% 68% C 54% 62%, 58% 52%, 62% 48%"
              fill="none"
              stroke="rgba(59,130,246,0.3)"
              strokeWidth="2"
              strokeDasharray="8 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.8 }}
            />
            
            {/* Approved → Dead Archive */}
            <motion.path
              d="M 78% 48% C 82% 48%, 84% 48%, 86% 48%"
              fill="none"
              stroke="rgba(239,68,68,0.2)"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 1 }}
            />
          </svg>

          {/* Stage Cards - Rectangular with rounded corners */}
          {stages.map((stage, index) => {
            const stageLeads = getStageLeads(stage.id);
            const { width, height } = getStageSize(stage.id, stage.baseWidth, stage.baseHeight);
            const isHovered = hoveredStage === stage.id;
            const isDropTarget = draggedLead && draggedLead.status !== stage.id;

            return (
              <motion.div
                key={stage.id}
                className="stage-card absolute"
                style={{ left: `${stage.x}%`, top: `${stage.y}%` }}
                initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.id)}
              >
                <motion.div
                  className={`
                    relative rounded-2xl overflow-hidden backdrop-blur-xl
                    border transition-all duration-300
                    ${isDropTarget ? 'border-primary-400 shadow-lg shadow-primary-500/20' : 'border-white/10'}
                    ${isHovered ? 'border-white/20' : ''}
                  `}
                  animate={{ width, height }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)',
                    boxShadow: isHovered 
                      ? '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
                      : '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-primary-400 font-semibold tracking-widest uppercase">{stage.label}</span>
                      <span className="text-lg font-bold text-white">{stageLeads.length}</span>
                    </div>
                  </div>

                  {/* Leads List */}
                  <div className="p-2 overflow-y-auto" style={{ maxHeight: height - 60 }}>
                    {stageLeads.length === 0 ? (
                      <div className="flex items-center justify-center h-16 text-slate-600 text-xs">
                        Drop leads here
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {stageLeads.slice(0, 6).map((lead) => (
                          <motion.div
                            key={lead.id}
                            draggable
                            onDragStart={() => setDraggedLead(lead)}
                            onDragEnd={() => setDraggedLead(null)}
                            onClick={() => onViewDetails(lead)}
                            className="lead-item group flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all"
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-300 text-xs font-bold flex-shrink-0">
                              {lead.formData.fullName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-medium truncate">{lead.formData.fullName}</div>
                              <div className="text-slate-500 text-[10px] truncate">{lead.formData.vehicleType}</div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            >
                              {starredLeads.has(lead.id) ? '⭐' : '☆'}
                            </button>
                          </motion.div>
                        ))}
                        {stageLeads.length > 6 && (
                          <div className="text-center text-xs text-slate-500 py-1">
                            +{stageLeads.length - 6} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}

          {/* Dead Leads Archive - Visible rectangular card */}
          <motion.div
            className="absolute"
            style={{ left: '88%', top: '45%' }}
            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div 
              className="w-52 rounded-2xl overflow-hidden backdrop-blur-xl border border-red-500/20"
              style={{
                background: 'linear-gradient(135deg, rgba(30,10,10,0.9) 0%, rgba(20,5,5,0.8) 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div className="px-4 py-3 border-b border-red-500/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-red-400 font-semibold tracking-widest uppercase">ARCHIVE</span>
                  <span className="ml-auto text-sm font-bold text-red-400">{deadLeads.length}</span>
                </div>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {DEAD_REASONS.map(reason => {
                    const count = getDeadByReason(reason.id).length;
                    return (
                      <div
                        key={reason.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop('dead', reason.id)}
                        className={`p-2 rounded-lg border border-dashed text-center transition-all ${
                          draggedLead ? 'border-red-400/50 bg-red-500/10' : 'border-red-900/30 hover:border-red-800/50'
                        }`}
                      >
                        <div className="text-white/80 text-[10px] font-medium">{reason.label}</div>
                        <div className="text-red-500/50 text-[9px]">{count}</div>
                      </div>
                    );
                  })}
                </div>

                {deadLeads.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {deadLeads.slice(0, 3).map(lead => (
                      <div key={lead.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-red-950/30 text-[10px]">
                        <span className="text-white/70 truncate flex-1">{lead.formData.fullName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Stats */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-6 py-3 bg-gradient-to-t from-[#0a0e17] to-transparent">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 text-slate-400">
            <span>Total: <span className="text-white font-medium">{leads.length}</span></span>
            <span>Active: <span className="text-primary-400 font-medium">{leads.filter(l => l.status !== 'dead').length}</span></span>
            <span>Approved: <span className="text-green-400 font-medium">{getStageLeads('approval').length}</span></span>
          </div>
          <span className="text-slate-600">Drag leads to move between stages</span>
        </div>
      </div>
    </div>
  );
}
