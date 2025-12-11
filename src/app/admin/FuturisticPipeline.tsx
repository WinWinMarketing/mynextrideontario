'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

// Pipeline stage definition
interface PipelineStage {
  id: string;
  label: string;
  statusId: LeadStatus | 'dead';
  deadReason?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Preset configurations
const PRESETS = {
  simple: {
    name: 'Simple',
    description: 'Basic 3-stage funnel',
    stages: [
      { id: 'new', label: 'New', statusId: 'new' as LeadStatus, x: 15, y: 45, width: 280, height: 200 },
      { id: 'working', label: 'Working', statusId: 'working' as LeadStatus, x: 45, y: 45, width: 280, height: 200 },
      { id: 'done', label: 'Done', statusId: 'approval' as LeadStatus, x: 75, y: 45, width: 280, height: 200 },
    ]
  },
  medium: {
    name: 'Standard',
    description: '5-stage with follow-ups',
    stages: [
      { id: 'new', label: 'New Leads', statusId: 'new' as LeadStatus, x: 10, y: 45, width: 240, height: 180 },
      { id: 'engaged', label: 'Engaged', statusId: 'working' as LeadStatus, x: 30, y: 25, width: 220, height: 160 },
      { id: 'followup', label: 'Follow Up', statusId: 'circle-back' as LeadStatus, x: 30, y: 65, width: 220, height: 160 },
      { id: 'approved', label: 'Approved', statusId: 'approval' as LeadStatus, x: 55, y: 45, width: 240, height: 180 },
      { id: 'archive', label: 'Archive', statusId: 'dead' as LeadStatus, x: 80, y: 45, width: 180, height: 160 },
    ]
  },
  advanced: {
    name: 'Advanced',
    description: 'Full funnel with predictions',
    stages: [
      { id: 'inbox', label: 'Inbox', statusId: 'new' as LeadStatus, x: 8, y: 40, width: 200, height: 220 },
      { id: 'hot', label: 'Hot Leads', statusId: 'working' as LeadStatus, x: 25, y: 20, width: 180, height: 140 },
      { id: 'warm', label: 'Warm Leads', statusId: 'working' as LeadStatus, x: 25, y: 50, width: 180, height: 140 },
      { id: 'cold', label: 'Cold Leads', statusId: 'circle-back' as LeadStatus, x: 25, y: 75, width: 180, height: 120 },
      { id: 'negotiating', label: 'Negotiating', statusId: 'working' as LeadStatus, x: 45, y: 35, width: 200, height: 160 },
      { id: 'closing', label: 'Closing', statusId: 'approval' as LeadStatus, x: 65, y: 35, width: 200, height: 160 },
      { id: 'won', label: 'Won', statusId: 'approval' as LeadStatus, x: 85, y: 25, width: 160, height: 130 },
      { id: 'lost', label: 'Lost', statusId: 'dead' as LeadStatus, x: 85, y: 60, width: 160, height: 130 },
    ]
  }
};

// Node templates with visual preview
const NODE_TEMPLATES = [
  { id: 'inbox', label: 'Inbox', icon: '📥', desc: 'Where new leads arrive', preview: 'blue' },
  { id: 'hot', label: 'Hot Lead', icon: '🔥', desc: 'High priority, ready to buy', preview: 'yellow' },
  { id: 'warm', label: 'Warm Lead', icon: '☀️', desc: 'Interested, needs nurturing', preview: 'yellow' },
  { id: 'cold', label: 'Cold Lead', icon: '❄️', desc: 'Low engagement, revisit later', preview: 'blue' },
  { id: 'followup', label: 'Follow Up', icon: '📞', desc: 'Scheduled for contact', preview: 'blue' },
  { id: 'negotiating', label: 'Negotiating', icon: '🤝', desc: 'Discussing terms', preview: 'yellow' },
  { id: 'approved', label: 'Approved', icon: '✅', desc: 'Deal closed successfully', preview: 'green' },
  { id: 'onhold', label: 'On Hold', icon: '⏸️', desc: 'Waiting on external factors', preview: 'grey' },
  { id: 'lost', label: 'Lost', icon: '❌', desc: 'Did not convert', preview: 'red' },
  { id: 'custom', label: 'Custom Stage', icon: '⚡', desc: 'Create your own stage', preview: 'blue' },
];

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0, time: 0 });
  const animationRef = useRef<number>();

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'templates' | 'presets' | 'settings'>('templates');
  const [mode, setMode] = useState<'node' | 'dragdrop'>('dragdrop');
  const [stages, setStages] = useState<PipelineStage[]>(PRESETS.medium.stages);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [resizingStage, setResizingStage] = useState<string | null>(null);
  const [flippedTemplate, setFlippedTemplate] = useState<string | null>(null);
  const [showApprovalAnim, setShowApprovalAnim] = useState(false);

  // Get leads for a stage
  const getStageLeads = (stage: PipelineStage) => {
    if (stage.statusId === 'dead') {
      return stage.deadReason 
        ? leads.filter(l => l.status === 'dead' && l.deadReason === stage.deadReason)
        : leads.filter(l => l.status === 'dead');
    }
    return leads.filter(l => l.status === stage.statusId);
  };

  // Smooth momentum physics for panning
  useEffect(() => {
    const animate = () => {
      if (!isDraggingCanvas && (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1)) {
        setPan(p => ({ x: p.x + velocity.x, y: p.y + velocity.y }));
        setVelocity(v => ({ x: v.x * 0.92, y: v.y * 0.92 }));
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    if (!isDraggingCanvas) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isDraggingCanvas, velocity]);

  // Canvas interaction handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.stage-card') || target.closest('.lead-item') || target.closest('.sidebar') || target.closest('.resize-handle')) return;
    
    setIsDraggingCanvas(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    setVelocity({ x: 0, y: 0 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingCanvas) return;
    
    const now = performance.now();
    const dt = Math.max(1, now - lastMouseRef.current.time);
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    setVelocity({ x: (dx / dt) * 16, y: (dy / dt) * 16 });
    lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };
  }, [isDraggingCanvas]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(z => Math.max(0.3, Math.min(1.5, z + delta)));
  }, []);

  // Drop lead on stage
  const handleDropOnStage = (stageId: string) => {
    if (!draggedLead) return;
    
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    if (stage.statusId === 'approval') {
      setShowApprovalAnim(true);
      setTimeout(() => setShowApprovalAnim(false), 1500);
    }
    
    if (stage.statusId === 'dead' && stage.deadReason) {
      onStatusChange(draggedLead.id, 'dead', stage.deadReason);
    } else {
      onStatusChange(draggedLead.id, stage.statusId as LeadStatus);
    }
    setDraggedLead(null);
  };

  // Add new stage from template
  const addStage = (template: typeof NODE_TEMPLATES[0]) => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: template.label,
      statusId: 'new',
      x: 50,
      y: 50,
      width: 220,
      height: 160,
    };
    setStages([...stages, newStage]);
  };

  // Resize stage
  const handleResize = (stageId: string, dw: number, dh: number) => {
    setStages(stages.map(s => {
      if (s.id !== stageId) return s;
      return {
        ...s,
        width: Math.max(150, Math.min(400, s.width + dw)),
        height: Math.max(120, Math.min(350, s.height + dh)),
      };
    }));
  };

  // Move stage
  const handleStageMove = (stageId: string, dx: number, dy: number) => {
    setStages(stages.map(s => {
      if (s.id !== stageId) return s;
      return { ...s, x: s.x + dx, y: s.y + dy };
    }));
  };

  // Apply preset
  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    setStages(PRESETS[presetKey].stages);
  };

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(30,64,175,0.06) 0%, transparent 50%),
          linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 50px 50px, 50px 50px',
      }} />

      {/* Approval celebration animation */}
      <AnimatePresence>
        {showApprovalAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-8xl">✅</div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.5, 0] }}
              transition={{ duration: 1.5 }}
              className="absolute w-64 h-64 rounded-full border-4 border-primary-400"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-slate-950 to-transparent">
        <div>
          <h1 className="text-xl font-bold text-white">Lead Pipeline</h1>
          <p className="text-xs text-slate-500">
            {mode === 'node' ? 'Node Mode: Predict & route leads' : 'Drag & Drop: Move leads between stages'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex bg-slate-900/80 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setMode('dragdrop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'dragdrop' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Drag & Drop
            </button>
            <button
              onClick={() => setMode('node')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'node' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Node System
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl p-1 border border-slate-800">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-xs text-slate-400 w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <button onClick={() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }} className="px-3 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-800 transition-all">
            Reset
          </button>
        </div>
      </div>

      {/* Canva-style Side Tab */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50"
        initial={false}
      >
        {/* Tab Handle */}
        <motion.button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-20 bg-slate-900 hover:bg-slate-800 border border-slate-700 border-l-0 rounded-r-xl flex items-center justify-center transition-colors"
          animate={{ x: sidebarOpen ? 280 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: sidebarOpen ? 180 : 0 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>
        </motion.button>

        {/* Sidebar Panel */}
        <motion.div
          className="sidebar absolute left-0 top-1/2 -translate-y-1/2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-r-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '70vh', maxHeight: 600 }}
          initial={{ x: -280 }}
          animate={{ x: sidebarOpen ? 0 : -280 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Sidebar Tabs */}
          <div className="flex border-b border-slate-800">
            {(['templates', 'presets', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-3 text-xs font-medium capitalize transition-colors ${
                  sidebarTab === tab ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {sidebarTab === 'templates' && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Click to add • Tap ℹ️ for details</p>
                {NODE_TEMPLATES.map(template => (
                  <motion.div
                    key={template.id}
                    className="relative"
                    whileHover={{ scale: 1.02 }}
                  >
                    <AnimatePresence mode="wait">
                      {flippedTemplate === template.id ? (
                        <motion.div
                          key="back"
                          initial={{ rotateY: 90 }}
                          animate={{ rotateY: 0 }}
                          exit={{ rotateY: -90 }}
                          className="p-3 rounded-xl bg-slate-800/50 border border-slate-700"
                        >
                          <p className="text-xs text-slate-300 mb-2">{template.desc}</p>
                          <button
                            onClick={() => setFlippedTemplate(null)}
                            className="text-[10px] text-primary-400 hover:text-primary-300"
                          >
                            ← Back
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="front"
                          initial={{ rotateY: -90 }}
                          animate={{ rotateY: 0 }}
                          exit={{ rotateY: 90 }}
                          onClick={() => addStage(template)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all"
                        >
                          {/* Visual Preview */}
                          <div className={`w-12 h-10 rounded-lg flex items-center justify-center text-lg ${
                            template.preview === 'blue' ? 'bg-primary-900/50 border border-primary-700/30' :
                            template.preview === 'yellow' ? 'bg-yellow-900/50 border border-yellow-700/30' :
                            template.preview === 'green' ? 'bg-green-900/50 border border-green-700/30' :
                            template.preview === 'red' ? 'bg-red-900/50 border border-red-700/30' :
                            'bg-slate-800 border border-slate-700'
                          }`}>
                            {template.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-sm text-white font-medium">{template.label}</div>
                            <div className="text-[10px] text-slate-500 truncate">{template.desc}</div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setFlippedTemplate(template.id); }}
                            className="w-6 h-6 rounded-full bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs"
                          >
                            i
                          </button>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}

            {sidebarTab === 'presets' && (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Quick setup layouts</p>
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <motion.button
                    key={key}
                    onClick={() => applyPreset(key as keyof typeof PRESETS)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800 hover:border-primary-700/50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{preset.name}</span>
                      <span className="text-[10px] text-slate-500">{preset.stages.length} stages</span>
                    </div>
                    <p className="text-xs text-slate-400">{preset.description}</p>
                    {/* Mini preview */}
                    <div className="flex gap-1 mt-3">
                      {preset.stages.slice(0, 4).map((_, i) => (
                        <div key={i} className="flex-1 h-1.5 rounded-full bg-primary-900/50" />
                      ))}
                      {preset.stages.length > 4 && (
                        <span className="text-[9px] text-slate-600">+{preset.stages.length - 4}</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {sidebarTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Hotkeys</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">Reset view</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[10px]">R</kbd>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">Toggle mode</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[10px]">M</kbd>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">Open sidebar</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[10px]">S</kbd>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Email Integration</h3>
                  <p className="text-[10px] text-slate-500 mb-2">Setup email templates for each stage</p>
                  <button className="w-full py-2 rounded-lg bg-primary-600/20 text-primary-400 text-xs hover:bg-primary-600/30 transition-colors border border-primary-600/30">
                    Configure Templates →
                  </button>
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Reminders</h3>
                  <p className="text-[10px] text-slate-500 mb-2">Get follow-up reminders via email</p>
                  <button className="w-full py-2 rounded-lg bg-slate-800/50 text-slate-400 text-xs hover:bg-slate-800 transition-colors border border-slate-700">
                    Setup Reminders →
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`absolute inset-0 ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <motion.div
          className="absolute w-full h-full"
          style={{ x: pan.x, y: pan.y, scale: zoom, transformOrigin: 'center' }}
        >
          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(59,130,246,0.4)" />
              </marker>
            </defs>
            {stages.map((stage, i) => {
              const nextStage = stages[i + 1];
              if (!nextStage) return null;
              return (
                <motion.line
                  key={`${stage.id}-${nextStage.id}`}
                  x1={`${stage.x + 5}%`}
                  y1={`${stage.y}%`}
                  x2={`${nextStage.x - 5}%`}
                  y2={`${nextStage.y}%`}
                  stroke="rgba(59,130,246,0.2)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  markerEnd="url(#arrowBlue)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              );
            })}
          </svg>

          {/* Stage Cards */}
          {stages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              leads={getStageLeads(stage)}
              isSelected={selectedStage === stage.id}
              isDropTarget={!!draggedLead}
              mode={mode}
              onSelect={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              onDrop={() => handleDropOnStage(stage.id)}
              onDragLead={setDraggedLead}
              onViewLead={onViewDetails}
              onToggleStar={onToggleStar}
              starredLeads={starredLeads}
              onMove={(dx, dy) => handleStageMove(stage.id, dx, dy)}
              onResize={(dw, dh) => handleResize(stage.id, dw, dh)}
            />
          ))}
        </motion.div>
      </div>

      {/* Bottom Stats */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-6 py-3 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 text-slate-500">
            <span>Total: <span className="text-white">{leads.length}</span></span>
            <span>Stages: <span className="text-primary-400">{stages.length}</span></span>
            <span>Mode: <span className="text-yellow-400 capitalize">{mode}</span></span>
          </div>
          <span className="text-slate-600">Scroll to zoom • Drag canvas to pan</span>
        </div>
      </div>
    </div>
  );
}

// Stage Card Component
function StageCard({
  stage,
  leads,
  isSelected,
  isDropTarget,
  mode,
  onSelect,
  onDrop,
  onDragLead,
  onViewLead,
  onToggleStar,
  starredLeads,
  onMove,
  onResize,
}: {
  stage: PipelineStage;
  leads: Lead[];
  isSelected: boolean;
  isDropTarget: boolean;
  mode: 'node' | 'dragdrop';
  onSelect: () => void;
  onDrop: () => void;
  onDragLead: (lead: Lead | null) => void;
  onViewLead: (lead: Lead) => void;
  onToggleStar: (id: string) => void;
  starredLeads: Set<string>;
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent) => {
    if (isResizing) return;
    e.stopPropagation();
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - lastPos.current.x) * 0.05;
    const dy = (e.clientY - lastPos.current.y) * 0.05;
    onMove(dx, dy);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    const dw = e.clientX - lastPos.current.x;
    const dh = e.clientY - lastPos.current.y;
    onResize(dw, dh);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <motion.div
      className="stage-card absolute"
      style={{ left: `${stage.x}%`, top: `${stage.y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onMouseMove={(e) => { handleDrag(e); handleResizeMove(e); }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <motion.div
        onClick={onSelect}
        onMouseDown={handleDragStart}
        className={`
          relative rounded-2xl overflow-hidden backdrop-blur-sm cursor-move
          bg-slate-900/90 border transition-all duration-200
          ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-800 hover:border-slate-700'}
          ${isDropTarget ? 'border-yellow-500/50 ring-2 ring-yellow-500/20' : ''}
        `}
        style={{ width: stage.width, height: stage.height }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/50">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{stage.label}</span>
          <span className="text-lg font-bold text-primary-400">{leads.length}</span>
        </div>

        {/* Leads */}
        <div className="p-2 overflow-y-auto" style={{ maxHeight: stage.height - 56 }}>
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-slate-600 text-xs">
              {mode === 'node' ? 'Predict & drop' : 'Drop leads here'}
            </div>
          ) : (
            <div className="space-y-1.5">
              {leads.slice(0, Math.floor((stage.height - 56) / 44)).map((lead) => (
                <motion.div
                  key={lead.id}
                  draggable
                  onDragStart={() => onDragLead(lead)}
                  onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-item group flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-slate-700"
                  whileHover={{ x: 2 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-900/50 border border-primary-800/30 flex items-center justify-center text-primary-300 text-xs font-bold flex-shrink-0">
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{lead.formData.fullName}</div>
                    <div className="text-slate-500 text-[10px] truncate">{lead.formData.vehicleType}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }}
                    className="opacity-0 group-hover:opacity-100 text-yellow-400 text-xs transition-opacity"
                  >
                    {starredLeads.has(lead.id) ? '★' : '☆'}
                  </button>
                </motion.div>
              ))}
              {leads.length > Math.floor((stage.height - 56) / 44) && (
                <div className="text-center text-[10px] text-slate-500 py-1">
                  +{leads.length - Math.floor((stage.height - 56) / 44)} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
        >
          <svg className="w-full h-full text-slate-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}
