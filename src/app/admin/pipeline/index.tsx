'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';
import { PipelineStage, NodeConnection, NodeTemplate, ContactMethod, TextLabel, DEFAULT_AUTOMATION_SETTINGS, STAGE_COLORS } from './types';
import { PipelineSidebar } from './PipelineSidebar';
import { StageCard, ContactMethodModal } from './StageCard';
import { ALL_PRESETS } from './presets';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas state - Start zoomed out more to fit content
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0, time: 0 });
  const animationRef = useRef<number>();

  // Initialize with a default preset
  const defaultPreset = ALL_PRESETS.find(p => p.id === 'standard-5stage') || ALL_PRESETS[0];
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<'node' | 'dragdrop'>('dragdrop');
  const [stages, setStages] = useState<PipelineStage[]>(defaultPreset.stages);
  const [connections, setConnections] = useState<NodeConnection[]>(defaultPreset.connections);
  const [labels, setLabels] = useState<TextLabel[]>(defaultPreset.labels || []);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showApprovalAnim, setShowApprovalAnim] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [contactMethodModal, setContactMethodModal] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showConnections, setShowConnections] = useState(true);

  // Get leads for a stage
  const getStageLeads = useCallback((stage: PipelineStage) => {
    if (stage.statusId === 'dead') {
      return stage.deadReason 
        ? leads.filter(l => l.status === 'dead' && l.deadReason === stage.deadReason)
        : leads.filter(l => l.status === 'dead');
    }
    return leads.filter(l => l.status === stage.statusId);
  }, [leads]);

  // Momentum physics
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

  // PREDICT: Fit all stages in view nicely
  const predictView = useCallback(() => {
    if (stages.length === 0) return;
    
    const minX = Math.min(...stages.map(s => s.x));
    const maxX = Math.max(...stages.map(s => s.x));
    const minY = Math.min(...stages.map(s => s.y));
    const maxY = Math.max(...stages.map(s => s.y));
    
    const rangeX = maxX - minX + 30;
    const rangeY = maxY - minY + 30;
    
    const newZoom = Math.min(0.9, Math.max(0.4, 80 / Math.max(rangeX, rangeY)));
    setZoom(newZoom);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setPan({ x: (50 - centerX) * 8, y: (50 - centerY) * 5 });
  }, [stages]);

  // Reset view with options
  const resetView = useCallback((toDefault = true) => {
    if (toDefault) {
      setZoom(0.7);
      setPan({ x: 0, y: 0 });
    } else {
      predictView();
    }
  }, [predictView]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation
      if (e.key === 'ArrowUp') setPan(p => ({ ...p, y: p.y + 50 }));
      if (e.key === 'ArrowDown') setPan(p => ({ ...p, y: p.y - 50 }));
      if (e.key === 'ArrowLeft') setPan(p => ({ ...p, x: p.x + 50 }));
      if (e.key === 'ArrowRight') setPan(p => ({ ...p, x: p.x - 50 }));
      
      // View
      if (e.key === 'r' || e.key === 'R') resetView(true);
      if (e.key === 'p' || e.key === 'P') predictView();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(2, z + 0.1));
      if (e.key === '-') setZoom(z => Math.max(0.3, z - 0.1));
      if (e.key === '0') setZoom(1);
      if (e.key === '1') setZoom(0.5);
      if (e.key === '2') setZoom(0.75);
      if (e.key === '3') setZoom(1.25);
      if (e.key === 'g' || e.key === 'G') setShowGrid(g => !g);
      if (e.key === 'c' && !e.ctrlKey) setShowConnections(c => !c);
      
      // Mode & UI
      if (e.key === 'm' || e.key === 'M') setMode(m => m === 'node' ? 'dragdrop' : 'node');
      if (e.key === 'b' || e.key === 'B') setSidebarOpen(o => !o);
      if (e.key === 'Escape') { setSelectedStage(null); setConnectingFrom(null); }
      
      // Editing
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStage) {
        setStages(s => s.filter(st => st.id !== selectedStage));
        setConnections(c => c.filter(cn => cn.fromStageId !== selectedStage && cn.toStageId !== selectedStage));
        setSelectedStage(null);
      }
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        // Select all - for now just highlight
      }
      if (e.ctrlKey && e.key === 'd' && selectedStage) {
        e.preventDefault();
        const stage = stages.find(s => s.id === selectedStage);
        if (stage) {
          const newStage = { ...stage, id: `stage-${Date.now()}`, x: stage.x + 5, y: stage.y + 5 };
          setStages([...stages, newStage]);
        }
      }
      
      // Quick add (n for new stage)
      if (e.key === 'n' || e.key === 'N') {
        if (!e.ctrlKey) {
          const newStage: PipelineStage = {
            id: `stage-${Date.now()}`,
            label: 'New Stage',
            statusId: 'working',
            x: 50,
            y: 50,
            width: 280,
            height: 240,
            color: 'blue',
            icon: '⭐',
            contactMethods: [],
            automationSettings: DEFAULT_AUTOMATION_SETTINGS,
            displayMode: 'single',
            maxVisibleLeads: 4,
          };
          setStages([...stages, newStage]);
          setSelectedStage(newStage.id);
        }
      }
      
      // Stage sizing
      if (e.key === 'w' && selectedStage) {
        setStages(prev => prev.map(s => s.id === selectedStage ? { ...s, width: Math.min(450, s.width + (e.shiftKey ? -20 : 20)) } : s));
      }
      if (e.key === 'h' && selectedStage) {
        setStages(prev => prev.map(s => s.id === selectedStage ? { ...s, height: Math.min(400, s.height + (e.shiftKey ? -20 : 20)) } : s));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStage, stages, resetView, predictView]);

  // Canvas handlers - FIXED smooth panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.stage-card') || target.closest('.lead-item') || target.closest('.sidebar') || target.closest('.resize-handle') || target.closest('.text-label')) return;
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

  // Add stage from template
  const addStage = useCallback((template: NodeTemplate) => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: template.label,
      statusId: template.defaultStatusId,
      icon: template.icon,
      x: 50,
      y: 50,
      width: 280,
      height: 240,
      color: template.preview,
      contactMethods: template.contactMethods,
      automationSettings: DEFAULT_AUTOMATION_SETTINGS,
      displayMode: 'single',
      maxVisibleLeads: 4,
    };
    setStages(prev => [...prev, newStage]);
    setSelectedStage(newStage.id);
  }, []);

  // Add custom stage
  const addCustomStage = useCallback((stageData: Partial<PipelineStage>) => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: stageData.label || 'Custom Stage',
      statusId: stageData.statusId || 'working',
      icon: stageData.icon || '⭐',
      x: 50,
      y: 50,
      width: 280,
      height: 240,
      color: stageData.color || 'blue',
      contactMethods: stageData.contactMethods || [],
      automationSettings: stageData.automationSettings || DEFAULT_AUTOMATION_SETTINGS,
      displayMode: 'single',
      maxVisibleLeads: 4,
    };
    setStages(prev => [...prev, newStage]);
    setSelectedStage(newStage.id);
  }, []);

  // Apply preset
  const applyPreset = useCallback((presetStages: PipelineStage[], presetConnections: NodeConnection[], presetLabels: TextLabel[], recommendedZoom: number) => {
    setStages(presetStages);
    setConnections(presetConnections);
    setLabels(presetLabels || []);
    setSelectedStage(null);
    setZoom(recommendedZoom);
    setPan({ x: 0, y: 0 });
  }, []);

  // Move stage
  const handleStageMove = useCallback((stageId: string, dx: number, dy: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? { 
      ...s, 
      x: Math.max(3, Math.min(97, s.x + dx)), 
      y: Math.max(8, Math.min(92, s.y + dy)) 
    } : s));
  }, []);

  // Resize stage
  const handleResize = useCallback((stageId: string, dw: number, dh: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? { 
      ...s, 
      width: Math.max(180, Math.min(450, s.width + dw)), 
      height: Math.max(160, Math.min(400, s.height + dh)),
      displayMode: Math.max(180, Math.min(450, s.width + dw)) > 280 ? 'double' : 'single',
    } : s));
  }, []);

  // Start connection
  const startConnection = useCallback((stageId: string) => {
    if (connectingFrom === stageId) {
      setConnectingFrom(null);
    } else if (connectingFrom) {
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

  // Connection path
  const getConnectionPath = useCallback((from: PipelineStage, to: PipelineStage) => {
    const midX = (from.x + to.x) / 2;
    const controlOffset = Math.abs(to.x - from.x) * 0.4;
    return `M ${from.x}% ${from.y}% C ${from.x + controlOffset}% ${from.y}%, ${to.x - controlOffset}% ${to.y}%, ${to.x}% ${to.y}%`;
  }, []);

  // Export dead leads to Excel
  const exportDeadLeads = useCallback(() => {
    const deadLeads = leads.filter(l => l.status === 'dead');
    if (deadLeads.length === 0) {
      alert('No dead leads to export');
      return;
    }
    
    const headers = ['Name', 'Email', 'Phone', 'Vehicle Type', 'Reason', 'Date'];
    const rows = deadLeads.map(l => [
      l.formData.fullName,
      l.formData.email,
      l.formData.phone,
      l.formData.vehicleType || '',
      l.deadReason || '',
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dead-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [leads]);

  const selectedStageForModal = stages.find(s => s.id === contactMethodModal) || null;
  const deadLeadsCount = leads.filter(l => l.status === 'dead').length;

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden">
      {/* Grid Background */}
      {showGrid && (
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(30,64,175,0.08) 0%, transparent 50%),
            linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }} />
      )}

      {/* Approval Animation */}
      <AnimatePresence>
        {showApprovalAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-8xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto">
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
          
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-slate-900/90 rounded-2xl p-1 border border-slate-700/50 backdrop-blur-xl">
              <button
                onClick={() => setMode('dragdrop')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'dragdrop'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📥 Drag & Drop
              </button>
              <button
                onClick={() => setMode('node')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'node'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Node System
              </button>
            </div>

            {/* Predict Button */}
            <button
              onClick={predictView}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold hover:from-yellow-500/30 hover:to-orange-500/30 transition-all"
            >
              🎯 Predict
            </button>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-slate-900/90 rounded-xl p-1 border border-slate-700/50">
              <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <span className="text-xs text-slate-400 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={() => resetView(true)}
              className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-700/50 transition-all"
            >
              Reset
            </button>

            {/* Export Dead Leads */}
            {deadLeadsCount > 0 && (
              <button
                onClick={exportDeadLeads}
                className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
              >
                📥 Export Dead ({deadLeadsCount})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <PipelineSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onAddStage={addStage}
        onAddCustomStage={addCustomStage}
        onApplyPreset={applyPreset}
        onOpenFeedback={() => setShowFeedbackModal(true)}
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
          {/* Text Labels */}
          {labels.map(label => (
            <div
              key={label.id}
              className="text-label absolute pointer-events-none select-none"
              style={{
                left: `${label.x}%`,
                top: `${label.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: label.fontSize,
                color: label.color,
                fontWeight: 600,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {label.text}
            </div>
          ))}

          {/* Connections */}
          {showConnections && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <marker id="arrowPrimary" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                  <polygon points="0 0, 10 4, 0 8" fill="rgba(59,130,246,0.6)" />
                </marker>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.2)" />
                  <stop offset="50%" stopColor="rgba(59,130,246,0.5)" />
                  <stop offset="100%" stopColor="rgba(59,130,246,0.2)" />
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
                      stroke={conn.style === 'dashed' ? 'rgba(148,163,184,0.25)' : 'url(#lineGradient)'}
                      strokeWidth="3"
                      strokeDasharray={conn.style === 'dashed' ? '8 6' : conn.style === 'dotted' ? '3 3' : 'none'}
                      markerEnd="url(#arrowPrimary)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                    {conn.label && (
                      <text
                        x={`${(fromStage.x + toStage.x) / 2}%`}
                        y={`${(fromStage.y + toStage.y) / 2 - 2}%`}
                        fill="rgba(148,163,184,0.6)"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Connecting Preview */}
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
          )}

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
      <footer className="absolute bottom-0 left-0 right-0 z-40 px-6 py-3">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto">
          <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl rounded-xl px-4 py-2.5 border border-slate-700/50">
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
          
          <div className="text-[11px] text-slate-600 flex items-center gap-4 bg-slate-900/60 backdrop-blur px-4 py-2 rounded-xl border border-slate-800/50">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">P</kbd> predict</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">R</kbd> reset</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">M</kbd> mode</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">N</kbd> new</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">B</kbd> sidebar</span>
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

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">💬 Send Feedback</h2>
              <textarea
                placeholder="Tell us how to improve the pipeline..."
                className="w-full h-32 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-primary-500"
              />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowFeedbackModal(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 text-sm font-medium hover:bg-slate-700">Cancel</button>
                <button onClick={() => { setShowFeedbackModal(false); alert('Thanks for your feedback!'); }} className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600">Send</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
