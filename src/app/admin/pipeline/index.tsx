'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';
import { PipelineStage, NodeConnection, NodeTemplate, ContactMethod } from './types';
import { PipelineSidebar } from './PipelineSidebar';
import { StageCard, ContactMethodModal } from './StageCard';
import { COMPLEXITY_PRESETS } from './presets';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<'node' | 'dragdrop'>('dragdrop');
  const [stages, setStages] = useState<PipelineStage[]>(COMPLEXITY_PRESETS[1].stages);
  const [connections, setConnections] = useState<NodeConnection[]>(COMPLEXITY_PRESETS[1].connections);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showApprovalAnim, setShowApprovalAnim] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [contactMethodModal, setContactMethodModal] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Get leads for a stage
  const getStageLeads = useCallback((stage: PipelineStage) => {
    if (stage.statusId === 'dead') {
      return stage.deadReason 
        ? leads.filter(l => l.status === 'dead' && l.deadReason === stage.deadReason)
        : leads.filter(l => l.status === 'dead');
    }
    return leads.filter(l => l.status === stage.statusId);
  }, [leads]);

  // Momentum physics for panning
  useEffect(() => {
    const animate = () => {
      if (!isDraggingCanvas && (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1)) {
        setPan(p => ({ x: p.x + velocity.x, y: p.y + velocity.y }));
        setVelocity(v => ({ x: v.x * 0.92, y: v.y * 0.92 }));
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    if (!isDraggingCanvas) animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isDraggingCanvas, velocity]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') { setZoom(0.85); setPan({ x: 0, y: 0 }); }
      if (e.key === 'm' || e.key === 'M') setMode(m => m === 'node' ? 'dragdrop' : 'node');
      if (e.key === 's' || e.key === 'S') setSidebarOpen(o => !o);
      if (e.key === 'Escape') { setSelectedStage(null); setConnectingFrom(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStage) {
        setStages(s => s.filter(st => st.id !== selectedStage));
        setConnections(c => c.filter(cn => cn.fromStageId !== selectedStage && cn.toStageId !== selectedStage));
        setSelectedStage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStage]);

  // Canvas handlers
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

  const handleMouseUp = useCallback(() => setIsDraggingCanvas(false), []);
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
  }, []);

  // Drop lead on stage
  const handleDropOnStage = useCallback((stageId: string) => {
    if (!draggedLead) return;
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    if (stage.statusId === 'approval') {
      setShowApprovalAnim(true);
      setTimeout(() => setShowApprovalAnim(false), 2000);
    }
    
    if (stage.statusId === 'dead' && stage.deadReason) {
      onStatusChange(draggedLead.id, 'dead', stage.deadReason);
    } else {
      onStatusChange(draggedLead.id, stage.statusId as LeadStatus);
    }
    setDraggedLead(null);
  }, [draggedLead, stages, onStatusChange]);

  // Add new stage from template
  const addStage = useCallback((template: NodeTemplate) => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: template.label,
      statusId: template.defaultStatusId,
      icon: template.icon,
      x: 50,
      y: 50,
      width: 240,
      height: 180,
      contactMethods: template.contactMethods,
    };
    setStages(prev => [...prev, newStage]);
    setSelectedStage(newStage.id);
  }, []);

  // Apply preset
  const applyPreset = useCallback((presetStages: PipelineStage[], presetConnections: NodeConnection[]) => {
    setStages(presetStages);
    setConnections(presetConnections);
    setSelectedStage(null);
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  }, []);

  // Move stage
  const handleStageMove = useCallback((stageId: string, dx: number, dy: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, x: Math.max(5, Math.min(95, s.x + dx)), y: Math.max(10, Math.min(90, s.y + dy)) } : s));
  }, []);

  // Resize stage
  const handleResize = useCallback((stageId: string, dw: number, dh: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, width: Math.max(160, Math.min(450, s.width + dw)), height: Math.max(130, Math.min(400, s.height + dh)) } : s));
  }, []);

  // Start connection
  const startConnection = useCallback((stageId: string) => {
    if (connectingFrom === stageId) {
      setConnectingFrom(null);
    } else if (connectingFrom) {
      // Create connection
      const newConnection: NodeConnection = {
        id: `conn-${Date.now()}`,
        fromStageId: connectingFrom,
        toStageId: stageId,
        style: 'solid',
        animated: true,
      };
      setConnections(prev => [...prev, newConnection]);
      setConnectingFrom(null);
    } else {
      setConnectingFrom(stageId);
    }
  }, [connectingFrom]);

  // Update contact methods
  const updateContactMethods = useCallback((stageId: string, contactMethods: ContactMethod[]) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, contactMethods } : s));
  }, []);

  // Calculate connection path
  const getConnectionPath = useCallback((from: PipelineStage, to: PipelineStage) => {
    const fromX = from.x;
    const fromY = from.y;
    const toX = to.x;
    const toY = to.y;
    
    const midX = (fromX + toX) / 2;
    const controlOffset = Math.abs(toX - fromX) * 0.3;
    
    return `M ${fromX}% ${fromY}% C ${fromX + controlOffset}% ${fromY}%, ${toX - controlOffset}% ${toY}%, ${toX}% ${toY}%`;
  }, []);

  const selectedStageForModal = stages.find(s => s.id === contactMethodModal) || null;

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(30,64,175,0.08) 0%, transparent 50%),
          linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 40px 40px, 40px 40px',
      }} />

      {/* Approval Animation */}
      <AnimatePresence>
        {showApprovalAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-8xl"
              >
                🎉
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-32 h-32 rounded-full border-4 border-emerald-400" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Lead Pipeline
              </h1>
              <p className="text-xs text-slate-500">
                {mode === 'node' ? 'Node Mode: Build automation flows' : 'Drag & Drop: Move leads between stages'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex bg-slate-900/90 rounded-2xl p-1.5 border border-slate-700/50 backdrop-blur-xl shadow-lg">
              <button
                onClick={() => setMode('dragdrop')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'dragdrop'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>📥</span> Drag & Drop
                </span>
              </button>
              <button
                onClick={() => setMode('node')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'node'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>⚡</span> Node System
                </span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-900/90 rounded-2xl p-1.5 border border-slate-700/50 backdrop-blur-xl">
              <button
                onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
                className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs text-slate-400 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(2, z + 0.15))}
                className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }}
              className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-700/50 backdrop-blur-xl transition-all"
            >
              Reset View
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <PipelineSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onAddStage={addStage}
        onApplyPreset={applyPreset}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`absolute inset-0 ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'} ${connectingFrom ? 'cursor-crosshair' : ''}`}
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
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrowPrimary" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <polygon points="0 0, 10 4, 0 8" fill="rgba(59,130,246,0.6)" />
              </marker>
              <marker id="arrowYellow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <polygon points="0 0, 10 4, 0 8" fill="rgba(234,179,8,0.6)" />
              </marker>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.3)" />
                <stop offset="50%" stopColor="rgba(59,130,246,0.6)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0.3)" />
              </linearGradient>
            </defs>
            
            {connections.map((conn, i) => {
              const fromStage = stages.find(s => s.id === conn.fromStageId);
              const toStage = stages.find(s => s.id === conn.toStageId);
              if (!fromStage || !toStage) return null;
              
              return (
                <g key={conn.id}>
                  <motion.path
                    d={getConnectionPath(fromStage, toStage)}
                    fill="none"
                    stroke={conn.style === 'dashed' ? 'rgba(148,163,184,0.3)' : 'url(#lineGradient)'}
                    strokeWidth="3"
                    strokeDasharray={conn.style === 'dashed' ? '8 6' : conn.style === 'dotted' ? '3 3' : 'none'}
                    markerEnd="url(#arrowPrimary)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                  {conn.animated && (
                    <motion.circle
                      r="4"
                      fill="#3b82f6"
                      initial={{ offsetDistance: '0%' }}
                      animate={{ offsetDistance: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{ offsetPath: `path('${getConnectionPath(fromStage, toStage).replace(/%/g, '')}')` }}
                    />
                  )}
                </g>
              );
            })}
            
            {/* Connecting Line Preview */}
            {connectingFrom && (
              <motion.line
                x1={`${stages.find(s => s.id === connectingFrom)?.x || 50}%`}
                y1={`${stages.find(s => s.id === connectingFrom)?.y || 50}%`}
                x2="50%"
                y2="50%"
                stroke="rgba(234,179,8,0.5)"
                strokeWidth="3"
                strokeDasharray="8 6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
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
              zoom={zoom}
              onSelect={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              onDrop={() => handleDropOnStage(stage.id)}
              onDragLead={setDraggedLead}
              onViewLead={onViewDetails}
              onToggleStar={onToggleStar}
              starredLeads={starredLeads}
              onMove={(dx, dy) => handleStageMove(stage.id, dx, dy)}
              onResize={(dw, dh) => handleResize(stage.id, dw, dh)}
              onStartConnection={startConnection}
              onOpenContactMethods={setContactMethodModal}
            />
          ))}
        </motion.div>
      </div>

      {/* Footer Stats */}
      <footer className="absolute bottom-0 left-0 right-0 z-40 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-6 bg-slate-900/80 backdrop-blur-xl rounded-2xl px-5 py-3 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Leads:</span>
              <span className="text-sm font-bold text-white">{leads.length}</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Stages:</span>
              <span className="text-sm font-bold text-primary-400">{stages.length}</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Mode:</span>
              <span className={`text-sm font-bold ${mode === 'node' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {mode === 'node' ? '⚡ Node' : '📥 D&D'}
              </span>
            </div>
            {connectingFrom && (
              <>
                <div className="w-px h-4 bg-slate-700" />
                <span className="text-xs text-yellow-400 animate-pulse">🔗 Connecting...</span>
              </>
            )}
          </div>
          
          <div className="text-[11px] text-slate-600 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Scroll</kbd>
              zoom
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Drag</kbd>
              pan
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">R</kbd>
              reset
            </span>
          </div>
        </div>
      </footer>

      {/* Contact Method Modal */}
      <AnimatePresence>
        {contactMethodModal && (
          <ContactMethodModal
            isOpen={!!contactMethodModal}
            stage={selectedStageForModal}
            onClose={() => setContactMethodModal(null)}
            onUpdate={updateContactMethods}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

