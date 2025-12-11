'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, LeadStatus } from '@/lib/validation';
import {
  Workflow, Stage, Connection, ViewMode, ActionType, ActionConfig,
  getColor, STAGE_PRESETS, ACTION_PRESETS, DEAD_LEAD_CATEGORIES,
  createDefaultWorkflow, UPLOAD_FIELDS, TimerConfig, formatTimer,
  UPLOAD_TEMPLATES, UploadTemplate, validateHeaders,
} from './types';

interface FlowPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
}

export function FlowPipeline({ leads, onStatusChange, onViewDetails }: FlowPipelineProps) {
  // ============ WORKFLOW STATE ============
  const [workflow, setWorkflow] = useState<Workflow>(createDefaultWorkflow());
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ============ VIEW STATE ============
  const [viewMode, setViewMode] = useState<ViewMode>('builder');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // ============ SELECTION STATE ============
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  // ============ UI STATE ============
  const [sidebarTab, setSidebarTab] = useState<'stages' | 'actions' | 'upload'>('stages');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // ============ REFS ============
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============ LOAD WORKFLOWS FROM S3 ============
  useEffect(() => {
    const loadWorkflows = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/workflows');
        if (response.ok) {
          const data = await response.json();
          if (data.workflows?.length > 0) {
            const fullWorkflows = await Promise.all(
              data.workflows.slice(0, 5).map(async (w: { id: string }) => {
                const res = await fetch(`/api/admin/workflows?id=${w.id}`);
                return res.ok ? res.json() : null;
              })
            );
            const valid = fullWorkflows.filter(Boolean);
            if (valid.length > 0) {
              setWorkflows(valid);
              setWorkflow(valid[0]);
            }
          }
        }
      } catch (err) {
        console.log('Loading from S3 failed, using default');
      }
      setIsLoading(false);
    };
    loadWorkflows();
  }, []);

  // ============ AUTO-SAVE TO S3 ============
  const saveToS3 = useCallback(async (wf: Workflow) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wf, updatedAt: new Date().toISOString() }),
      });
      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
    setIsSaving(false);
  }, [isSaving]);

  // Debounced auto-save
  const triggerAutoSave = useCallback((wf: Workflow) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToS3(wf), 2000);
  }, [saveToS3]);

  // ============ WORKFLOW UPDATES ============
  const updateWorkflow = useCallback((updates: Partial<Workflow>) => {
    setWorkflow(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      triggerAutoSave(updated);
      return updated;
    });
  }, [triggerAutoSave]);

  // ============ CANVAS PANNING ============
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.stage-node, .sidebar, .modal')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setSelectedStage(null);
    setConnectingFrom(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
  };

  const handleCanvasMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
  };

  // ============ STAGE OPERATIONS ============
  const addStage = (preset: typeof STAGE_PRESETS[0]) => {
    const existingX = workflow.stages.map(s => s.position.x);
    const maxX = existingX.length > 0 ? Math.max(...existingX) : 0;
    
    const newStage: Stage = {
      id: `stage-${Date.now()}`,
      label: preset.label,
      status: preset.status,
      color: preset.color,
      icon: preset.icon,
      position: { x: maxX + 300, y: 200 },
      actions: [],
    };
    
    updateWorkflow({ stages: [...workflow.stages, newStage] });
    showNotification(`Added ${preset.label}`);
  };

  const addDeadStage = (category: typeof DEAD_LEAD_CATEGORIES[0]) => {
    const deadStages = workflow.stages.filter(s => s.status === 'dead');
    
    const newStage: Stage = {
      id: `dead-${Date.now()}`,
      label: category.label,
      status: 'dead',
      deadReason: category.id,
      color: category.color,
      icon: category.icon,
      description: category.description,
      position: { x: 100, y: 400 + deadStages.length * 120 },
      actions: [],
    };
    
    updateWorkflow({ stages: [...workflow.stages, newStage] });
    showNotification(`Added ${category.label}`);
  };

  const deleteStage = (stageId: string) => {
    updateWorkflow({
      stages: workflow.stages.filter(s => s.id !== stageId),
      connections: workflow.connections.filter(c => c.from !== stageId && c.to !== stageId),
    });
    setSelectedStage(null);
  };

  const moveStage = (stageId: string, dx: number, dy: number) => {
    updateWorkflow({
      stages: workflow.stages.map(s => 
        s.id === stageId 
          ? { ...s, position: { x: s.position.x + dx / zoom, y: s.position.y + dy / zoom } }
          : s
      ),
    });
  };

  // ============ CONNECTIONS ============
  const startConnection = (stageId: string) => {
    if (connectingFrom === stageId) {
      setConnectingFrom(null);
    } else if (connectingFrom) {
      // Create connection
      const exists = workflow.connections.some(
        c => c.from === connectingFrom && c.to === stageId
      );
      if (!exists && connectingFrom !== stageId) {
        updateWorkflow({
          connections: [...workflow.connections, {
            id: `conn-${Date.now()}`,
            from: connectingFrom,
            to: stageId,
          }],
        });
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(stageId);
    }
  };

  // ============ ACTIONS ============
  const addAction = (stageId: string, type: ActionType) => {
    const newAction: ActionConfig = {
      id: `action-${Date.now()}`,
      type,
      templateId: '',
      enabled: true,
    };
    
    updateWorkflow({
      stages: workflow.stages.map(s =>
        s.id === stageId ? { ...s, actions: [...s.actions, newAction] } : s
      ),
    });
  };

  const updateAction = (stageId: string, actionId: string, updates: Partial<ActionConfig>) => {
    updateWorkflow({
      stages: workflow.stages.map(s =>
        s.id === stageId
          ? { ...s, actions: s.actions.map(a => a.id === actionId ? { ...a, ...updates } : a) }
          : s
      ),
    });
  };

  const deleteAction = (stageId: string, actionId: string) => {
    updateWorkflow({
      stages: workflow.stages.map(s =>
        s.id === stageId ? { ...s, actions: s.actions.filter(a => a.id !== actionId) } : s
      ),
    });
  };

  // ============ LEAD OPERATIONS ============
  const handleDropLead = (stageId: string) => {
    if (!draggedLead) return;
    const stage = workflow.stages.find(s => s.id === stageId);
    if (!stage) return;
    
    if (stage.status === 'dead' && stage.deadReason) {
      onStatusChange(draggedLead.id, 'dead', stage.deadReason);
    } else {
      onStatusChange(draggedLead.id, stage.status as LeadStatus);
    }
    setDraggedLead(null);
  };

  const getStageLeads = (stage: Stage): Lead[] => {
    if (stage.status === 'dead') {
      return leads.filter(l => l.status === 'dead' && l.deadReason === stage.deadReason);
    }
    return leads.filter(l => l.status === stage.status);
  };

  // ============ FIT VIEW ============
  const fitView = () => {
    if (workflow.stages.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1);
      return;
    }
    
    const xs = workflow.stages.map(s => s.position.x);
    const ys = workflow.stages.map(s => s.position.y);
    const minX = Math.min(...xs) - 100;
    const maxX = Math.max(...xs) + 300;
    const minY = Math.min(...ys) - 100;
    const maxY = Math.max(...ys) + 200;
    
    const width = containerRef.current?.clientWidth || 1000;
    const height = containerRef.current?.clientHeight || 600;
    
    const scaleX = width / (maxX - minX);
    const scaleY = height / (maxY - minY);
    const newZoom = Math.min(scaleX, scaleY, 1) * 0.9;
    
    setPan({ x: -minX * newZoom + 50, y: -minY * newZoom + 50 });
    setZoom(newZoom);
  };

  // ============ AUTO LAYOUT - HOURGLASS PATTERN ============
  const autoLayout = () => {
    const newStages = workflow.stages.filter(s => s.status === 'new');
    const workingStages = workflow.stages.filter(s => s.status === 'working');
    const circleBackStages = workflow.stages.filter(s => s.status === 'circle-back');
    const approvalStages = workflow.stages.filter(s => s.status === 'approval');
    const deadStages = workflow.stages.filter(s => s.status === 'dead');
    
    const centerY = 300; // Center point for hourglass
    const spacing = { x: 300, y: 120 };
    
    const layouted = workflow.stages.map(stage => {
      // NEW stages - Center-left focal point
      if (stage.status === 'new') {
        const idx = newStages.indexOf(stage);
        const offset = (newStages.length - 1) / 2;
        return { ...stage, position: { x: 100, y: centerY + (idx - offset) * spacing.y } };
      }
      
      // WORKING stages - First branch out (spread vertically)
      if (stage.status === 'working') {
        const idx = workingStages.indexOf(stage);
        const total = workingStages.length;
        const offset = (total - 1) / 2;
        const spread = Math.min(total * 100, 400); // Max spread
        return { ...stage, position: { x: 400, y: centerY + (idx - offset) * (spread / Math.max(total - 1, 1)) } };
      }
      
      // CIRCLE-BACK stages - Below working, slightly left
      if (stage.status === 'circle-back') {
        const idx = circleBackStages.indexOf(stage);
        return { ...stage, position: { x: 350 + idx * 150, y: centerY + 250 + idx * 80 } };
      }
      
      // APPROVAL stages - Narrowing back (hourglass waist & exit)
      if (stage.status === 'approval') {
        const idx = approvalStages.indexOf(stage);
        const total = approvalStages.length;
        if (total === 1) {
          return { ...stage, position: { x: 700, y: centerY } };
        }
        const offset = (total - 1) / 2;
        const isLast = idx === total - 1;
        // Last approval (Won) goes further right
        if (isLast && total > 1) {
          return { ...stage, position: { x: 1000, y: centerY } };
        }
        return { ...stage, position: { x: 700, y: centerY + (idx - offset) * 100 } };
      }
      
      // DEAD stages - Bottom track, spread horizontally
      if (stage.status === 'dead') {
        const idx = deadStages.indexOf(stage);
        const cols = Math.min(deadStages.length, 4);
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        return { ...stage, position: { x: 100 + col * 250, y: centerY + 400 + row * 140 } };
      }
      
      return stage;
    });
    
    updateWorkflow({ stages: layouted });
    setTimeout(fitView, 100);
    showNotification('Hourglass layout applied');
  };

  // ============ NOTIFICATIONS ============
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  // ============ GET CONNECTION PATH ============
  const getConnectionPath = (from: Stage, to: Stage): string => {
    const x1 = from.position.x + 200;
    const y1 = from.position.y + 40;
    const x2 = to.position.x;
    const y2 = to.position.y + 40;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  };

  // ============ RENDER ============
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-slate-950 overflow-hidden">
      {/* ============ SIDEBAR ============ */}
      <aside className="w-72 bg-slate-900/80 border-r border-slate-800 flex flex-col sidebar">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-white">{workflow.name}</h1>
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              title="Upload Leads"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('builder')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                viewMode === 'builder' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Builder
            </button>
            <button
              onClick={() => setViewMode('nodes')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                viewMode === 'nodes' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Node View
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { id: 'stages', label: 'Stages' },
            { id: 'actions', label: 'Actions' },
            { id: 'upload', label: 'Upload' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id as typeof sidebarTab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                sidebarTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === 'stages' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pipeline Stages</h3>
                <div className="space-y-2">
                  {STAGE_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => addStage(preset)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all text-left group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${getColor(preset.color).bg} ${getColor(preset.color).border} border flex items-center justify-center ${getColor(preset.color).text} text-sm`}>
                        {preset.icon}
                      </div>
                      <span className="text-sm text-white font-medium">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dead Lead Categories</h3>
                <div className="space-y-2">
                  {DEAD_LEAD_CATEGORIES.map((cat, i) => (
                    <button
                      key={i}
                      onClick={() => addDeadStage(cat)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-red-500/30 transition-all text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg ${getColor(cat.color).bg} ${getColor(cat.color).border} border flex items-center justify-center ${getColor(cat.color).text} text-xs`}>
                        {cat.icon}
                      </div>
                      <div>
                        <span className="text-sm text-white font-medium block">{cat.label}</span>
                        <span className="text-xs text-slate-500">{cat.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sidebarTab === 'actions' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Select a stage first, then add actions.</p>
              
              {selectedStage && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add Action to Stage</h3>
                  {ACTION_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => addAction(selectedStage, preset.type)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm">
                        {preset.icon}
                      </div>
                      <span className="text-sm text-white font-medium">{preset.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Upload leads from Excel, CSV, or Google Sheets.</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full py-3 px-4 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/30 transition-colors"
              >
                Open Upload Tool
              </button>
              
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Supported Formats</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Excel (.xlsx, .xls)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    CSV files
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Google Sheets (paste)
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}</span>
            <span>{workflow.stages.length} stages</span>
          </div>
        </div>
      </aside>

      {/* ============ CANVAS ============ */}
      <main className="flex-1 relative overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800">
              <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="text-slate-400 hover:text-white px-2">−</button>
              <span className="text-sm text-white w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="text-slate-400 hover:text-white px-2">+</button>
            </div>
            <button onClick={fitView} className="px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-sm text-white hover:bg-slate-800 transition-colors">
              Fit
            </button>
            <button onClick={autoLayout} className="px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-sm text-white hover:bg-slate-800 transition-colors">
              Auto Layout
            </button>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            {connectingFrom && (
              <div className="px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm">
                Click a stage to connect
              </div>
            )}
          </div>
        </div>

        {/* Canvas Background */}
        <div
          ref={containerRef}
          className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          {/* Dot Grid */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
              backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          {/* Canvas Content */}
          <div
            ref={canvasRef}
            className="absolute"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Connections */}
            <svg className="absolute inset-0 w-[5000px] h-[3000px] pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {workflow.connections.map(conn => {
                const from = workflow.stages.find(s => s.id === conn.from);
                const to = workflow.stages.find(s => s.id === conn.to);
                if (!from || !to) return null;
                return (
                  <g key={conn.id}>
                    <path
                      d={getConnectionPath(from, to)}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth={2}
                    />
                    <circle
                      cx={to.position.x}
                      cy={to.position.y + 40}
                      r={4}
                      fill="#8b5cf6"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Stages */}
            {workflow.stages.map(stage => (
              <StageNode
                key={stage.id}
                stage={stage}
                leads={getStageLeads(stage)}
                isSelected={selectedStage === stage.id}
                isConnecting={connectingFrom === stage.id}
                isDropTarget={!!draggedLead}
                viewMode={viewMode}
                zoom={zoom}
                onSelect={() => setSelectedStage(stage.id)}
                onMove={(dx, dy) => moveStage(stage.id, dx, dy)}
                onDelete={() => deleteStage(stage.id)}
                onConnect={() => startConnection(stage.id)}
                onDrop={() => handleDropLead(stage.id)}
                onDragLead={setDraggedLead}
                onViewLead={onViewDetails}
                onUpdateAction={(actionId, updates) => updateAction(stage.id, actionId, updates)}
                onDeleteAction={(actionId) => deleteAction(stage.id, actionId)}
              />
            ))}
          </div>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ============ UPLOAD MODAL ============ */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadLeadsModal onClose={() => setShowUploadModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ STAGE NODE COMPONENT ============
function StageNode({
  stage,
  leads,
  isSelected,
  isConnecting,
  isDropTarget,
  viewMode,
  zoom,
  onSelect,
  onMove,
  onDelete,
  onConnect,
  onDrop,
  onDragLead,
  onViewLead,
  onUpdateAction,
  onDeleteAction,
}: {
  stage: Stage;
  leads: Lead[];
  isSelected: boolean;
  isConnecting: boolean;
  isDropTarget: boolean;
  viewMode: ViewMode;
  zoom: number;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
  onDelete: () => void;
  onConnect: () => void;
  onDrop: () => void;
  onDragLead: (lead: Lead | null) => void;
  onViewLead: (lead: Lead) => void;
  onUpdateAction: (actionId: string, updates: Partial<ActionConfig>) => void;
  onDeleteAction: (actionId: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const color = getColor(stage.color);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-panel, .connect-btn, .lead-item')) return;
    e.stopPropagation();
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };

    const handleMove = (ev: MouseEvent) => {
      onMove(ev.clientX - lastPos.current.x, ev.clientY - lastPos.current.y);
      lastPos.current = { x: ev.clientX, y: ev.clientY };
    };
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Builder mode - compact view
  if (viewMode === 'builder') {
    return (
      <div
        className="stage-node absolute"
        style={{ left: stage.position.x, top: stage.position.y }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div
          onClick={onSelect}
          onMouseDown={handleMouseDown}
          className={`relative px-6 py-3 rounded-xl border-2 backdrop-blur-sm transition-all cursor-grab ${
            isSelected ? `${color.border} ring-2 ring-blue-500/30` : 'border-slate-700/50'
          } ${isConnecting ? 'ring-2 ring-yellow-500/50' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ background: 'rgba(15, 23, 42, 0.8)' }}
        >
          {/* Left connector */}
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-500" />
          
          {/* Content */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${color.bg} ${color.border} border flex items-center justify-center ${color.text} text-sm`}>
              {stage.icon}
            </div>
            <div>
              <span className="text-white font-medium block">{stage.label}</span>
              <span className="text-xs text-slate-500">{leads.length} leads</span>
            </div>
          </div>

          {/* Right connector */}
          <button
            onClick={(e) => { e.stopPropagation(); onConnect(); }}
            className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isConnecting ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-slate-700 border-slate-500 text-slate-300 hover:bg-blue-500 hover:border-blue-400'
            }`}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  // Node view - expanded view
  return (
    <div
      className="stage-node absolute"
      style={{ left: stage.position.x, top: stage.position.y }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Left connector */}
      <div className="absolute left-0 top-10 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-500" />

      <div
        onClick={onSelect}
        onMouseDown={handleMouseDown}
        className={`relative w-[200px] rounded-xl border-2 backdrop-blur-sm overflow-hidden transition-all ${
          isSelected ? `${color.border} ring-2 ring-blue-500/30` : 'border-slate-700/50'
        } ${isConnecting ? 'ring-2 ring-yellow-500/50' : ''} ${isDropTarget ? 'ring-2 ring-green-500/50' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ background: 'rgba(15, 23, 42, 0.9)' }}
      >
        {/* Header */}
        <div className={`px-4 py-3 border-b border-slate-700/50 ${color.bg}`}>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${color.text}`}>{stage.icon}</span>
            <span className="text-white font-medium text-sm">{stage.label}</span>
            <span className={`ml-auto px-2 py-0.5 rounded text-xs ${color.bg} ${color.text} border ${color.border}`}>
              {leads.length}
            </span>
          </div>
        </div>

        {/* Leads */}
        <div className="p-2 max-h-[200px] overflow-y-auto">
          {leads.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-4">Drop leads here</p>
          ) : (
            <div className="space-y-1">
              {leads.slice(0, 5).map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => onDragLead(lead)}
                  onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-item flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <div className={`w-6 h-6 rounded ${color.bg} ${color.text} flex items-center justify-center text-xs font-medium`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <span className="text-xs text-white truncate flex-1">{lead.formData.fullName}</span>
                </div>
              ))}
              {leads.length > 5 && (
                <p className="text-center text-xs text-slate-500 py-1">+{leads.length - 5} more</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {stage.actions.length > 0 && (
          <div className="px-2 pb-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className="w-full py-1.5 px-2 rounded-lg bg-slate-800/50 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {stage.actions.length} action{stage.actions.length !== 1 ? 's' : ''} {showActions ? '▲' : '▼'}
            </button>
            
            {showActions && (
              <div className="action-panel mt-2 space-y-1">
                {stage.actions.map(action => (
                  <ActionItem
                    key={action.id}
                    action={action}
                    onUpdate={(updates) => onUpdateAction(action.id, updates)}
                    onDelete={() => onDeleteAction(action.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right connector */}
      <button
        onClick={(e) => { e.stopPropagation(); onConnect(); }}
        className={`connect-btn absolute right-0 top-10 translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
          isConnecting ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-slate-700 border-slate-500 text-slate-300 hover:bg-blue-500 hover:border-blue-400'
        }`}
      >
        +
      </button>

      {/* Delete button (when selected) */}
      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-8 right-0 px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  );
}

// ============ ACTION ITEM COMPONENT ============
function ActionItem({
  action,
  onUpdate,
  onDelete,
}: {
  action: ActionConfig;
  onUpdate: (updates: Partial<ActionConfig>) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const typeLabel = ACTION_PRESETS.find(p => p.type === action.type)?.label || action.type;

  return (
    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${action.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`}>
            {ACTION_PRESETS.find(p => p.type === action.type)?.icon}
          </span>
          <span className="text-xs text-white">{typeLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {isEditing && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-2">
          {/* Wait Timer */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase">Wait Before</label>
            <div className="flex gap-1 mt-1">
              <input
                type="number"
                min="0"
                value={action.waitBefore?.value || 0}
                onChange={(e) => onUpdate({ waitBefore: { value: parseInt(e.target.value) || 0, unit: action.waitBefore?.unit || 'hours' } })}
                className="w-14 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
              />
              <select
                value={action.waitBefore?.unit || 'hours'}
                onChange={(e) => onUpdate({ waitBefore: { value: action.waitBefore?.value || 0, unit: e.target.value as TimerConfig['unit'] } })}
                className="flex-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
              >
                <option value="minutes">min</option>
                <option value="hours">hrs</option>
                <option value="days">days</option>
                <option value="weeks">wks</option>
              </select>
            </div>
          </div>
          
          {/* Enable Toggle */}
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase">Enabled</span>
            <button
              onClick={() => onUpdate({ enabled: !action.enabled })}
              className={`w-8 h-4 rounded-full transition-colors ${action.enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
            >
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${action.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>
      )}
    </div>
  );
}

// ============ UPLOAD LEADS MODAL - ENHANCED ============
function UploadLeadsModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'template' | 'upload' | 'mapping' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<UploadTemplate | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('paste');
  const [fileData, setFileData] = useState<string[][] | null>(null);
  const [pasteData, setPasteData] = useState('');
  const [columnMappings, setColumnMappings] = useState<Record<number, string>>({});
  const [validationResult, setValidationResult] = useState<{ valid: boolean; missing: string[]; extra: string[] } | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  const filteredTemplates = UPLOAD_TEMPLATES.filter(t => 
    templateFilter === 'all' || t.category === templateFilter
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Handle both CSV (comma) and TSV (tab)
      const delimiter = text.includes('\t') ? '\t' : ',';
      const rows = text.split('\n')
        .filter(row => row.trim())
        .map(row => row.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, '')));
      processData(rows);
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (!pasteData.trim()) return;
    // Tab-separated for paste from Excel/Sheets
    const rows = pasteData.split('\n')
      .filter(row => row.trim())
      .map(row => row.split('\t').map(cell => cell.trim()));
    processData(rows);
  };

  const processData = (rows: string[][]) => {
    if (rows.length < 2) return;
    setFileData(rows);
    
    // Auto-detect mappings based on headers
    const headers = rows[0];
    const autoMappings: Record<number, string> = {};
    
    headers.forEach((header, idx) => {
      const headerLower = header.toLowerCase().trim();
      // Try to match with upload fields
      const matchedField = UPLOAD_FIELDS.find(f => 
        f.label.toLowerCase() === headerLower ||
        f.id.toLowerCase() === headerLower ||
        headerLower.includes(f.id.toLowerCase()) ||
        headerLower.includes(f.label.toLowerCase())
      );
      if (matchedField) {
        autoMappings[idx] = matchedField.id;
      }
    });
    
    setColumnMappings(autoMappings);
    
    // Validate if template selected
    if (selectedTemplate) {
      const result = validateHeaders(headers, selectedTemplate);
      setValidationResult(result);
    }
    
    setStep('mapping');
  };

  const applyTemplate = (template: UploadTemplate) => {
    setSelectedTemplate(template);
    // Generate sample paste data from template
    const sampleData = [template.headers.join('\t'), template.sampleRow.join('\t')].join('\n');
    setPasteData(sampleData);
    setStep('upload');
  };

  const downloadTemplate = (template: UploadTemplate) => {
    const csvContent = [
      template.headers.join(','),
      template.sampleRow.join(','),
      // Add a few empty rows for user to fill
      template.headers.map(() => '').join(','),
      template.headers.map(() => '').join(','),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Upload Leads</h2>
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {['template', 'upload', 'mapping', 'preview'].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s ? 'bg-blue-500 text-white' : 
                    ['template', 'upload', 'mapping', 'preview'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>
                  {i < 3 && <div className={`w-8 h-0.5 ${['template', 'upload', 'mapping', 'preview'].indexOf(step) > i ? 'bg-green-500' : 'bg-slate-700'}`} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Template Selection */}
          {step === 'template' && (
            <div>
              <p className="text-slate-400 mb-4">Choose a template or start with custom headers.</p>
              
              {/* Category Filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {['all', 'universal', 'automotive', 'real-estate', 'services'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTemplateFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                      templateFilter === cat ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' ? 'All Templates' : cat.replace('-', ' ')}
                  </button>
                ))}
              </div>
              
              {/* Template Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h3 className="text-white font-medium group-hover:text-blue-400">{template.name}</h3>
                        <p className="text-xs text-slate-500">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{template.headers.length} columns</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadTemplate(template); }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Download CSV
                      </button>
                    </div>
                  </button>
                ))}
              </div>

              {/* Skip to custom */}
              <button
                onClick={() => { setSelectedTemplate(null); setStep('upload'); }}
                className="w-full py-3 rounded-lg border-2 border-dashed border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white transition-all"
              >
                Skip template - Use custom headers
              </button>
            </div>
          )}

          {/* STEP 2: Upload Data */}
          {step === 'upload' && (
            <div>
              {selectedTemplate && (
                <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    <div>
                      <h3 className="text-white font-medium">{selectedTemplate.name}</h3>
                      <p className="text-xs text-blue-300">Required headers: {selectedTemplate.headers.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Method Toggle */}
              <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setUploadMethod('paste')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    uploadMethod === 'paste' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  📋 Paste from Excel/Sheets
                </button>
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    uploadMethod === 'file' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  📁 Upload File
                </button>
              </div>

              {uploadMethod === 'paste' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                    Paste data (Tab-separated from Excel/Google Sheets)
                  </label>
                  <textarea
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    placeholder={`Paste your data here. First row should be headers.\n\nExample:\nFull Name\tEmail\tPhone\tNotes\nJohn Smith\tjohn@email.com\t(416) 555-1234\tInterested`}
                    className="w-full h-48 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 resize-none font-mono text-sm"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-slate-500">Tip: Copy directly from Excel or Google Sheets (Ctrl+C), then paste here (Ctrl+V)</p>
                    <button
                      onClick={handlePaste}
                      disabled={!pasteData.trim()}
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Process Data
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-white font-medium mb-1">Click to upload or drag & drop</p>
                    <p className="text-sm text-slate-500">CSV, Excel (.xlsx, .xls), TSV files</p>
                  </label>
                </div>
              )}

              {/* Back button */}
              <button
                onClick={() => { setStep('template'); setSelectedTemplate(null); }}
                className="mt-4 text-sm text-slate-400 hover:text-white"
              >
                ← Back to templates
              </button>
            </div>
          )}

          {/* STEP 3: Column Mapping */}
          {step === 'mapping' && fileData && (
            <div>
              {/* Validation Messages */}
              {validationResult && !validationResult.valid && (
                <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <h4 className="text-yellow-400 font-medium mb-2">⚠️ Header Mismatch</h4>
                  {validationResult.missing.length > 0 && (
                    <p className="text-sm text-yellow-300">Missing: {validationResult.missing.join(', ')}</p>
                  )}
                  {validationResult.extra.length > 0 && (
                    <p className="text-sm text-slate-400">Extra columns: {validationResult.extra.join(', ')}</p>
                  )}
                </div>
              )}

              <h3 className="text-white font-medium mb-4">Map Columns to Fields</h3>
              
              {/* Column Mapping Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {fileData[0].map((header, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{header}</p>
                      <p className="text-xs text-slate-500 truncate">Sample: {fileData[1]?.[idx] || '-'}</p>
                    </div>
                    <select
                      value={columnMappings[idx] || ''}
                      onChange={(e) => setColumnMappings(prev => ({ ...prev, [idx]: e.target.value }))}
                      className="w-36 px-2 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs"
                    >
                      <option value="">Skip column</option>
                      {UPLOAD_FIELDS.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.label} {field.required && '*'}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Required fields check */}
              <div className="p-3 rounded-lg bg-slate-800/30 mb-4">
                <p className="text-xs text-slate-400 mb-2">Required fields:</p>
                <div className="flex flex-wrap gap-2">
                  {UPLOAD_FIELDS.filter(f => f.required).map(field => {
                    const isMapped = Object.values(columnMappings).includes(field.id);
                    return (
                      <span key={field.id} className={`px-2 py-1 rounded text-xs ${isMapped ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {field.label} {isMapped ? '✓' : '✕'}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                  ← Back
                </button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={!UPLOAD_FIELDS.filter(f => f.required).every(f => Object.values(columnMappings).includes(f.id))}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Preview
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Preview & Import */}
          {step === 'preview' && fileData && (
            <div>
              <h3 className="text-white font-medium mb-4">Preview Import ({fileData.length - 1} leads)</h3>
              
              {/* Data Preview Table */}
              <div className="overflow-x-auto mb-6 rounded-xl border border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">#</th>
                      {Object.entries(columnMappings)
                        .filter(([_, value]) => value)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([idx, fieldId]) => {
                          const field = UPLOAD_FIELDS.find(f => f.id === fieldId);
                          return (
                            <th key={idx} className="px-3 py-2 text-left text-slate-400 font-medium">
                              {field?.label || fieldId}
                            </th>
                          );
                        })}
                    </tr>
                  </thead>
                  <tbody>
                    {fileData.slice(1, 6).map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-t border-slate-800">
                        <td className="px-3 py-2 text-slate-500">{rowIdx + 1}</td>
                        {Object.entries(columnMappings)
                          .filter(([_, value]) => value)
                          .sort(([a], [b]) => parseInt(a) - parseInt(b))
                          .map(([idx]) => (
                            <td key={idx} className="px-3 py-2 text-white">{row[parseInt(idx)] || '-'}</td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fileData.length > 6 && (
                  <div className="px-3 py-2 text-center text-slate-500 text-xs bg-slate-800/50">
                    ... and {fileData.length - 6} more rows
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('mapping')} className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                  ← Back to Mapping
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement actual import
                    alert(`Would import ${fileData.length - 1} leads. Integration with backend required.`);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                >
                  🚀 Import {fileData.length - 1} Leads
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Supported: CSV, Excel, Google Sheets (paste)</span>
            <span>First row must contain headers</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

