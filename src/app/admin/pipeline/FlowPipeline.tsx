'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, LeadStatus } from '@/lib/validation';
import {
  Workflow, Stage, Connection, ViewMode, ActionType, ActionConfig, TimerConfig,
  getColor, STAGE_PRESETS, ACTION_PRESETS, DEAD_LEAD_CATEGORIES, UPLOAD_TEMPLATES,
  createDefaultWorkflow, UPLOAD_FIELDS, formatTimer, LAYOUT, StageColor,
} from './types';

interface FlowPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

export function FlowPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FlowPipelineProps) {
  // ============ WORKFLOW STATE ============
  const [workflow, setWorkflow] = useState<Workflow>(createDefaultWorkflow());
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading pipeline...');

  // ============ VIEW STATE ============
  const [viewMode, setViewMode] = useState<ViewMode>('builder');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // ============ SELECTION STATE ============
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<{ stageId: string; actionId: string } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  // ============ UI STATE ============
  const [sidebarTab, setSidebarTab] = useState<'stages' | 'actions' | 'templates' | 'upload'>('stages');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWorkflowsModal, setShowWorkflowsModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // ============ REFS ============
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasChanges = useRef(false);

  // ============ LOAD WORKFLOWS FROM AWS S3 ============
  useEffect(() => {
    const loadWorkflows = async () => {
      setIsLoading(true);
      setLoadingMessage('Connecting to cloud storage...');
      
      try {
        const response = await fetch('/api/admin/workflows');
        if (response.ok) {
          const data = await response.json();
          setLoadingMessage('Loading workflows...');
          
          if (data.workflows?.length > 0) {
            const fullWorkflows = await Promise.all(
              data.workflows.slice(0, 10).map(async (w: { id: string }) => {
                try {
                  const res = await fetch(`/api/admin/workflows?id=${w.id}`);
                  return res.ok ? res.json() : null;
                } catch {
                  return null;
                }
              })
            );
            
            const valid = fullWorkflows.filter(Boolean);
            if (valid.length > 0) {
              setWorkflows(valid);
              setWorkflow(valid[0]);
              setLastSaved(new Date(valid[0].updatedAt));
            }
          }
        }
      } catch (err) {
        console.log('Cloud load failed, using default workflow');
      }
      
      setIsLoading(false);
    };
    
    loadWorkflows();
  }, []);

  // ============ OPTIMIZED AUTO-SAVE TO AWS S3 ============
  const saveToS3 = useCallback(async (wf: Workflow, force = false) => {
    if (isSaving && !force) return;
    if (!hasChanges.current && !force) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/admin/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...wf,
          updatedAt: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        setLastSaved(new Date());
        hasChanges.current = false;
        showNotification('Saved to cloud', 'success');
      } else {
        showNotification('Save failed - saved locally', 'error');
      }
    } catch (err) {
      console.error('Save failed:', err);
      showNotification('Save failed - offline mode', 'error');
    }
    
    setIsSaving(false);
  }, [isSaving]);

  // Debounced auto-save - only saves when there are actual changes
  const triggerAutoSave = useCallback((wf: Workflow) => {
    hasChanges.current = true;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToS3(wf);
    }, 3000);
  }, [saveToS3]);

  // ============ WORKFLOW UPDATES ============
  const updateWorkflow = useCallback((updates: Partial<Workflow>) => {
    setWorkflow(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      triggerAutoSave(updated);
      return updated;
    });
  }, [triggerAutoSave]);

  // ============ CANVAS PANNING - SMOOTH & INTUITIVE ============
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.stage-node, .sidebar, .modal, .action-panel, .toolbar')) return;
    
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setSelectedStage(null);
    setSelectedAction(null);
    setConnectingFrom(null);
    
    document.body.style.cursor = 'grabbing';
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    
    setPan({
      x: panStart.current.panX + dx,
      y: panStart.current.panY + dy,
    });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    document.body.style.cursor = '';
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with ctrl/cmd + scroll
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(z => Math.max(0.4, Math.min(1.5, z + delta)));
    } else {
      // Horizontal scroll without modifier
      setPan(p => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    }
  };

  // ============ STAGE OPERATIONS ============
  const addStage = (preset: typeof STAGE_PRESETS[0]) => {
    const liveStages = workflow.stages.filter(s => s.status !== 'dead');
    const maxOrder = liveStages.length > 0 ? Math.max(...liveStages.map(s => s.order)) : -1;
    
    const newStage: Stage = {
      id: `stage-${Date.now()}`,
      label: preset.label,
      status: preset.status,
      color: preset.color,
      icon: preset.icon,
      position: { x: (maxOrder + 1) * (LAYOUT.STAGE_WIDTH_EXPANDED + LAYOUT.STAGE_SPACING), y: 0 },
      actions: [],
      order: maxOrder + 1,
    };
    
    updateWorkflow({ stages: [...workflow.stages, newStage] });
    showNotification(`Added "${preset.label}"`, 'success');
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
      position: { x: 0, y: LAYOUT.ROW_HEIGHT + deadStages.length * 100 },
      actions: [],
      order: -1,
    };
    
    updateWorkflow({ stages: [...workflow.stages, newStage] });
    showNotification(`Added "${category.label}"`, 'success');
  };

  const deleteStage = (stageId: string) => {
    updateWorkflow({
      stages: workflow.stages.filter(s => s.id !== stageId),
      connections: workflow.connections.filter(c => c.from !== stageId && c.to !== stageId),
    });
    setSelectedStage(null);
    showNotification('Stage deleted', 'info');
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

  const updateStageLabel = (stageId: string, label: string) => {
    updateWorkflow({
      stages: workflow.stages.map(s =>
        s.id === stageId ? { ...s, label } : s
      ),
    });
  };

  // ============ CONNECTIONS ============
  const startConnection = (stageId: string) => {
    if (connectingFrom === stageId) {
      setConnectingFrom(null);
    } else if (connectingFrom) {
      const exists = workflow.connections.some(
        c => (c.from === connectingFrom && c.to === stageId) || (c.from === stageId && c.to === connectingFrom)
      );
      
      if (!exists && connectingFrom !== stageId) {
        updateWorkflow({
          connections: [...workflow.connections, {
            id: `conn-${Date.now()}`,
            from: connectingFrom,
            to: stageId,
          }],
        });
        showNotification('Connection created', 'success');
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(stageId);
    }
  };

  const deleteConnection = (connId: string) => {
    updateWorkflow({
      connections: workflow.connections.filter(c => c.id !== connId),
    });
  };

  // ============ ACTIONS ============
  const addAction = (stageId: string, preset: typeof ACTION_PRESETS[0]) => {
    const newAction: ActionConfig = {
      id: `action-${Date.now()}`,
      type: preset.type,
      label: preset.label,
      icon: preset.icon,
      templateId: '',
      enabled: true,
    };
    
    updateWorkflow({
      stages: workflow.stages.map(s =>
        s.id === stageId ? { ...s, actions: [...s.actions, newAction] } : s
      ),
    });
    
    setSelectedAction({ stageId, actionId: newAction.id });
    showNotification(`Added "${preset.label}" action`, 'success');
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
    setSelectedAction(null);
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
    showNotification('Lead moved', 'success');
  };

  const getStageLeads = (stage: Stage): Lead[] => {
    if (stage.status === 'dead') {
      return leads.filter(l => l.status === 'dead' && l.deadReason === stage.deadReason);
    }
    return leads.filter(l => l.status === stage.status);
  };

  // ============ AUTO LAYOUT ============
  const autoLayout = useCallback(() => {
    const liveStages = workflow.stages.filter(s => s.status !== 'dead');
    const deadStages = workflow.stages.filter(s => s.status === 'dead');
    
    const layouted = workflow.stages.map(stage => {
      if (stage.status === 'dead') {
        const deadIndex = deadStages.indexOf(stage);
        return {
          ...stage,
          position: { x: 0, y: LAYOUT.ROW_HEIGHT + deadIndex * 100 },
          order: -1,
        };
      }
      
      const liveIndex = liveStages.indexOf(stage);
      return {
        ...stage,
        position: { x: liveIndex * (LAYOUT.STAGE_WIDTH_EXPANDED + LAYOUT.STAGE_SPACING), y: 0 },
        order: liveIndex,
      };
    });
    
    updateWorkflow({ stages: layouted });
    
    // Fit view after layout
    setTimeout(() => {
      fitView();
    }, 100);
    
    showNotification('Layout optimized', 'success');
  }, [workflow.stages, updateWorkflow]);

  // ============ FIT VIEW ============
  const fitView = useCallback(() => {
    if (workflow.stages.length === 0) {
      setPan({ x: 60, y: 60 });
      setZoom(1);
      return;
    }
    
    const liveStages = workflow.stages.filter(s => s.status !== 'dead');
    if (liveStages.length === 0) {
      setPan({ x: 60, y: 60 });
      setZoom(1);
      return;
    }
    
    const xs = liveStages.map(s => s.position.x);
    const maxX = Math.max(...xs) + (viewMode === 'builder' ? LAYOUT.STAGE_WIDTH_COLLAPSED : LAYOUT.STAGE_WIDTH_EXPANDED);
    
    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;
    
    const neededWidth = maxX + 200;
    const neededHeight = viewMode === 'builder' ? 200 : LAYOUT.STAGE_HEIGHT_EXPANDED + 200;
    
    const scaleX = (containerWidth - 200) / neededWidth;
    const scaleY = (containerHeight - 200) / neededHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);
    
    setZoom(Math.max(0.4, newZoom));
    setPan({ x: 60, y: 60 });
  }, [workflow.stages, viewMode]);

  // ============ NOTIFICATIONS ============
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };

  // ============ CREATE NEW WORKFLOW ============
  const createNewWorkflow = (name: string) => {
    const newWorkflow = createDefaultWorkflow();
    newWorkflow.name = name;
    
    setWorkflow(newWorkflow);
    setWorkflows([newWorkflow, ...workflows]);
    saveToS3(newWorkflow, true);
    setShowWorkflowsModal(false);
    showNotification('New workflow created', 'success');
  };

  // ============ SWITCH WORKFLOW ============
  const switchWorkflow = (wf: Workflow) => {
    setWorkflow(wf);
    setShowWorkflowsModal(false);
    fitView();
  };

  // ============ GET CONNECTION PATH ============
  const getConnectionPath = (from: Stage, to: Stage): string => {
    const stageWidth = viewMode === 'builder' ? LAYOUT.STAGE_WIDTH_COLLAPSED : LAYOUT.STAGE_WIDTH_EXPANDED;
    const stageHeight = viewMode === 'builder' ? LAYOUT.STAGE_HEIGHT_COLLAPSED : 80;
    
    const x1 = from.position.x + stageWidth;
    const y1 = from.position.y + stageHeight / 2;
    const x2 = to.position.x;
    const y2 = to.position.y + stageHeight / 2;
    
    // Elegant curved path
    const dx = x2 - x1;
    const controlOffset = Math.min(Math.abs(dx) * 0.4, 100);
    
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  };

  // ============ KEYBOARD SHORTCUTS ============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingFrom(null);
        setSelectedStage(null);
        setSelectedAction(null);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToS3(workflow, true);
      }
      
      if (e.key === 'Delete' && selectedStage) {
        deleteStage(selectedStage);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStage, workflow, saveToS3]);

  // ============ RENDER ============
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-6"
          />
          <p className="text-xl text-slate-300 font-medium">{loadingMessage}</p>
          <p className="text-sm text-slate-500 mt-2">Please wait...</p>
        </motion.div>
      </div>
    );
  }

  const liveStages = workflow.stages.filter(s => s.status !== 'dead').sort((a, b) => a.order - b.order);
  const deadStages = workflow.stages.filter(s => s.status === 'dead');

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* ============ ELEGANT SIDEBAR ============ */}
      <aside className="w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col sidebar z-40">
        {/* Header with Pipeline Name */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-lg">🚀</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{workflow.name}</h1>
              <p className="text-xs text-slate-400">
                {liveStages.length} stages • {leads.length} leads
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30"
              title="Upload Leads"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>

          {/* View Mode Toggle - Clean Design */}
          <div className="flex bg-slate-800/80 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setViewMode('builder')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'builder'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Builder Mode
            </button>
            <button
              onClick={() => setViewMode('nodes')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'nodes'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Node View
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          {[
            { id: 'stages', label: 'Stages', icon: '📦' },
            { id: 'actions', label: 'Actions', icon: '⚡' },
            { id: 'upload', label: 'Import', icon: '📥' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id as typeof sidebarTab)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${
                sidebarTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {sidebarTab === 'stages' && (
            <div className="space-y-5">
              {/* Pipeline Stages */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pipeline Stages</h3>
                <div className="space-y-2">
                  {STAGE_PRESETS.map((preset, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addStage(preset)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 transition-all text-left group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${getColor(preset.color).bg} ${getColor(preset.color).border} border flex items-center justify-center ${getColor(preset.color).text} text-lg`}>
                        {preset.icon}
                      </div>
                      <span className="text-sm text-white font-semibold">{preset.label}</span>
                      <span className="ml-auto opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity">+</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Dead Lead Categories */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Dead Lead Categories</h3>
                <div className="space-y-2">
                  {DEAD_LEAD_CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addDeadStage(cat)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-red-500/30 transition-all text-left group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${getColor(cat.color).bg} ${getColor(cat.color).border} border flex items-center justify-center ${getColor(cat.color).text} text-lg`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white font-semibold block">{cat.label}</span>
                        <span className="text-xs text-slate-500 truncate block">{cat.description}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sidebarTab === 'actions' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-300">
                  {selectedStage ? (
                    <>Select an action type to add to <strong>{workflow.stages.find(s => s.id === selectedStage)?.label}</strong></>
                  ) : (
                    <>Click a stage first, then add actions here.</>
                  )}
                </p>
              </div>

              {selectedStage && (
                <div className="space-y-2">
                  {ACTION_PRESETS.map((preset, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addAction(selectedStage, preset)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/30 transition-all text-left group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${getColor(preset.color).bg} ${getColor(preset.color).border} border flex items-center justify-center text-lg`}>
                        {preset.icon}
                      </div>
                      <span className="text-sm text-white font-semibold">{preset.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'upload' && (
            <div className="space-y-5">
              <p className="text-sm text-slate-400">Import leads from Excel, CSV, or Google Sheets with intelligent field mapping.</p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUploadModal(true)}
                className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/30"
              >
                📥 Open Import Tool
              </motion.button>

              <div className="pt-4 border-t border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Supported Formats</h4>
                <ul className="space-y-2 text-sm">
                  {[
                    { format: 'Excel (.xlsx, .xls)', color: 'bg-green-500' },
                    { format: 'CSV files', color: 'bg-green-500' },
                    { format: 'Google Sheets (paste)', color: 'bg-green-500' },
                    { format: 'Tab-separated values', color: 'bg-green-500' },
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-400">
                      <span className={`w-2 h-2 rounded-full ${f.color}`} />
                      {f.format}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Templates</h4>
                <div className="space-y-2">
                  {UPLOAD_TEMPLATES.slice(0, 3).map(tmpl => (
                    <button
                      key={tmpl.id}
                      className="w-full p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 text-left transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tmpl.icon}</span>
                        <span className="text-sm text-white font-medium">{tmpl.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSaving ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full"
                  />
                  <span className="text-xs font-medium">Saving...</span>
                </div>
              ) : lastSaved ? (
                <span className="text-xs text-slate-500">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              ) : (
                <span className="text-xs text-slate-500">Not saved</span>
              )}
            </div>
            <button
              onClick={() => setShowWorkflowsModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Switch Workflow
            </button>
          </div>
        </div>
      </aside>

      {/* ============ MAIN CANVAS ============ */}
      <main className="flex-1 relative overflow-hidden">
        {/* Top Toolbar */}
        <div className="toolbar absolute top-5 left-5 right-5 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-xl">
              <button
                onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-lg"
              >
                −
              </button>
              <span className="text-sm text-white font-semibold w-14 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-lg"
              >
                +
              </button>
            </div>

            <button
              onClick={fitView}
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-sm text-white font-semibold hover:bg-slate-800/90 transition-colors shadow-xl"
            >
              ⊡ Fit View
            </button>

            <button
              onClick={autoLayout}
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-sm text-white font-semibold hover:bg-slate-800/90 transition-colors shadow-xl"
            >
              ✨ Auto Layout
            </button>
          </div>

          {/* Connection Mode Indicator */}
          {connectingFrom && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-auto px-5 py-2.5 rounded-xl bg-amber-500/20 backdrop-blur-xl border border-amber-500/40 text-amber-400 text-sm font-semibold shadow-xl"
            >
              🔗 Click another stage to connect
            </motion.div>
          )}

          {/* Save Status */}
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={() => saveToS3(workflow, true)}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xl ${
                hasChanges.current
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500'
                  : 'bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-slate-400'
              }`}
            >
              💾 {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)',
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          {/* Elegant Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${60 * zoom}px ${60 * zoom}px`,
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
            {/* Connections SVG */}
            <svg
              className="absolute inset-0 w-[6000px] h-[4000px] pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
                <filter id="connectionGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {workflow.connections.map(conn => {
                const fromStage = workflow.stages.find(s => s.id === conn.from);
                const toStage = workflow.stages.find(s => s.id === conn.to);
                if (!fromStage || !toStage) return null;

                return (
                  <g key={conn.id}>
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                      d={getConnectionPath(fromStage, toStage)}
                      fill="none"
                      stroke="url(#connectionGradient)"
                      strokeWidth={3}
                      filter="url(#connectionGlow)"
                    />
                    {/* Arrow head */}
                    <circle
                      cx={toStage.position.x - 6}
                      cy={toStage.position.y + (viewMode === 'builder' ? LAYOUT.STAGE_HEIGHT_COLLAPSED / 2 : 40)}
                      r={5}
                      fill="#8b5cf6"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Live Stages */}
            {liveStages.map((stage, index) => (
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
                onToggleStar={onToggleStar}
                starredLeads={starredLeads}
                onUpdateLabel={(label) => updateStageLabel(stage.id, label)}
                onUpdateAction={(actionId, updates) => updateAction(stage.id, actionId, updates)}
                onDeleteAction={(actionId) => deleteAction(stage.id, actionId)}
                selectedAction={selectedAction?.stageId === stage.id ? selectedAction.actionId : null}
                onSelectAction={(actionId) => setSelectedAction(actionId ? { stageId: stage.id, actionId } : null)}
              />
            ))}

            {/* Dead Lead Stages */}
            {viewMode === 'nodes' && deadStages.map((stage) => (
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
                onToggleStar={onToggleStar}
                starredLeads={starredLeads}
                onUpdateLabel={(label) => updateStageLabel(stage.id, label)}
                onUpdateAction={(actionId, updates) => updateAction(stage.id, actionId, updates)}
                onDeleteAction={(actionId) => deleteAction(stage.id, actionId)}
                selectedAction={selectedAction?.stageId === stage.id ? selectedAction.actionId : null}
                onSelectAction={(actionId) => setSelectedAction(actionId ? { stageId: stage.id, actionId } : null)}
              />
            ))}
          </div>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl border font-semibold text-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : notification.type === 'error'
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-slate-800/90 border-slate-700/50 text-white'
              }`}
            >
              {notification.type === 'success' && '✓ '}
              {notification.type === 'error' && '✕ '}
              {notification.message}
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

      {/* ============ WORKFLOWS MODAL ============ */}
      <AnimatePresence>
        {showWorkflowsModal && (
          <WorkflowsModal
            workflows={workflows}
            currentWorkflow={workflow}
            onSelect={switchWorkflow}
            onCreate={createNewWorkflow}
            onClose={() => setShowWorkflowsModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ STAGE NODE COMPONENT ============
interface StageNodeProps {
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
  onToggleStar: (id: string) => void;
  starredLeads: Set<string>;
  onUpdateLabel: (label: string) => void;
  onUpdateAction: (actionId: string, updates: Partial<ActionConfig>) => void;
  onDeleteAction: (actionId: string) => void;
  selectedAction: string | null;
  onSelectAction: (actionId: string | null) => void;
}

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
  onToggleStar,
  starredLeads,
  onUpdateLabel,
  onUpdateAction,
  onDeleteAction,
  selectedAction,
  onSelectAction,
}: StageNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editLabel, setEditLabel] = useState(stage.label);
  const lastPos = useRef({ x: 0, y: 0 });
  const color = getColor(stage.color);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-panel, .connect-btn, .lead-item, .delete-btn, input')) return;
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

  const handleLabelSubmit = () => {
    if (editLabel.trim()) {
      onUpdateLabel(editLabel.trim());
    } else {
      setEditLabel(stage.label);
    }
    setIsEditingLabel(false);
  };

  // ============ BUILDER MODE - COMPACT HORIZONTAL FLOW ============
  if (viewMode === 'builder') {
    return (
      <motion.div
        className="stage-node absolute"
        style={{ left: stage.position.x, top: stage.position.y }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {/* Left Connector */}
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-500 shadow-lg" />

        <motion.div
          onClick={onSelect}
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setIsEditingLabel(true)}
          whileHover={{ scale: 1.02 }}
          className={`relative px-5 py-3.5 rounded-2xl border-2 backdrop-blur-xl transition-all cursor-grab ${
            isSelected ? `${color.border} ring-2 ring-offset-2 ring-offset-slate-900 ring-${color.id}-500/40` : 'border-slate-700/50'
          } ${isConnecting ? 'ring-2 ring-amber-500/50' : ''} ${isDropTarget ? 'ring-2 ring-green-500/50' : ''} ${isDragging ? 'cursor-grabbing scale-105' : ''}`}
          style={{
            background: `linear-gradient(135deg, ${color.accent}15 0%, rgba(15, 23, 42, 0.95) 100%)`,
            minWidth: LAYOUT.STAGE_WIDTH_COLLAPSED,
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${color.bg} ${color.border} border flex items-center justify-center ${color.text} text-lg shadow-lg`}>
              {stage.icon}
            </div>
            <div className="flex-1 min-w-0">
              {isEditingLabel ? (
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={handleLabelSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
                  className="bg-transparent border-none outline-none text-white font-bold text-sm w-full"
                  autoFocus
                />
              ) : (
                <span className="text-white font-bold text-sm block truncate">{stage.label}</span>
              )}
              <span className="text-xs text-slate-400">{leads.length} leads</span>
            </div>
            {stage.actions.length > 0 && (
              <div className={`w-6 h-6 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-bold`}>
                {stage.actions.length}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Connector */}
        <button
          onClick={(e) => { e.stopPropagation(); onConnect(); }}
          className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all shadow-lg ${
            isConnecting
              ? 'bg-amber-500 border-amber-400 text-black'
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-blue-500 hover:border-blue-400 hover:text-white'
          }`}
        >
          +
        </button>
      </motion.div>
    );
  }

  // ============ NODE VIEW - EXPANDED WITH FULL DETAILS ============
  return (
    <motion.div
      className="stage-node absolute"
      style={{ left: stage.position.x, top: stage.position.y }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Left Connector */}
      <div className="absolute left-0 top-10 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-600 border-2 border-slate-500 shadow-lg" />

      <motion.div
        onClick={onSelect}
        onMouseDown={handleMouseDown}
        className={`relative rounded-2xl border-2 backdrop-blur-xl overflow-hidden transition-all shadow-2xl ${
          isSelected ? `${color.border} ring-2 ring-offset-2 ring-offset-slate-900 ring-${color.id}-500/40` : 'border-slate-700/50'
        } ${isConnecting ? 'ring-2 ring-amber-500/50' : ''} ${isDropTarget ? 'ring-2 ring-green-500/50' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          width: LAYOUT.STAGE_WIDTH_EXPANDED,
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
        }}
      >
        {/* Header */}
        <div className={`px-5 py-4 ${color.bg} border-b border-slate-700/50`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.border} border flex items-center justify-center ${color.text} text-xl shadow-lg`}>
              {stage.icon}
            </div>
            <div className="flex-1 min-w-0">
              {isEditingLabel ? (
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={handleLabelSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
                  className="bg-transparent border-none outline-none text-white font-bold text-base w-full"
                  autoFocus
                />
              ) : (
                <span
                  className="text-white font-bold text-base block truncate cursor-text"
                  onDoubleClick={() => setIsEditingLabel(true)}
                >
                  {stage.label}
                </span>
              )}
              {stage.description && (
                <span className="text-xs text-slate-400 block truncate">{stage.description}</span>
              )}
            </div>
            <div className={`px-3 py-1.5 rounded-xl ${color.bg} ${color.border} border ${color.text} text-lg font-bold`}>
              {leads.length}
            </div>
          </div>
        </div>

        {/* Leads */}
        <div className="p-4 max-h-[200px] overflow-y-auto">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
              <span className="text-3xl mb-2 opacity-50">📥</span>
              <span className="text-sm font-medium">Drop leads here</span>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 6).map(lead => (
                <motion.div
                  key={lead.id}
                  draggable
                  onDragStart={() => onDragLead(lead)}
                  onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  whileHover={{ scale: 1.02 }}
                  className="lead-item flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 cursor-grab border border-slate-700/50 transition-all"
                >
                  <div className={`w-9 h-9 rounded-lg ${color.bg} ${color.text} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white font-semibold block truncate">{lead.formData.fullName}</span>
                    <span className="text-xs text-slate-500 truncate block">{lead.formData.phone}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }}
                    className="text-lg flex-shrink-0 hover:scale-110 transition-transform"
                  >
                    {starredLeads.has(lead.id) ? '⭐' : '☆'}
                  </button>
                </motion.div>
              ))}
              {leads.length > 6 && (
                <div className="text-center text-xs text-slate-500 py-2 font-medium">
                  +{leads.length - 6} more leads
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Section */}
        {stage.actions.length > 0 && (
          <div className="px-4 pb-4">
            <button
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 border border-slate-700/50 text-sm text-slate-300 font-semibold hover:bg-slate-700/80 transition-colors flex items-center justify-between"
            >
              <span>⚡ {stage.actions.length} Action{stage.actions.length !== 1 ? 's' : ''}</span>
              <span>{showActions ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="action-panel mt-3 space-y-2 overflow-hidden"
                >
                  {stage.actions.map(action => (
                    <ActionItem
                      key={action.id}
                      action={action}
                      isSelected={selectedAction === action.id}
                      onSelect={() => onSelectAction(selectedAction === action.id ? null : action.id)}
                      onUpdate={(updates) => onUpdateAction(action.id, updates)}
                      onDelete={() => onDeleteAction(action.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Right Connector */}
      <button
        onClick={(e) => { e.stopPropagation(); onConnect(); }}
        className={`connect-btn absolute right-0 top-10 translate-x-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all shadow-lg ${
          isConnecting
            ? 'bg-amber-500 border-amber-400 text-black'
            : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-blue-500 hover:border-blue-400 hover:text-white'
        }`}
      >
        +
      </button>

      {/* Delete Button */}
      {isSelected && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="delete-btn absolute -top-10 right-0 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors"
        >
          🗑️ Delete
        </motion.button>
      )}
    </motion.div>
  );
}

// ============ ACTION ITEM COMPONENT ============
interface ActionItemProps {
  action: ActionConfig;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ActionConfig>) => void;
  onDelete: () => void;
}

function ActionItem({ action, isSelected, onSelect, onUpdate, onDelete }: ActionItemProps) {
  return (
    <div className={`p-3 rounded-xl border transition-all ${
      isSelected ? 'bg-blue-500/10 border-blue-500/40' : 'bg-slate-900/60 border-slate-700/50'
    }`}>
      <div className="flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
            action.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'
          }`}>
            {action.icon}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-white font-semibold block truncate">{action.label}</span>
            {action.delay && action.delay.value > 0 && (
              <span className="text-[10px] text-purple-400">⏱️ After {formatTimer(action.delay)}</span>
            )}
          </div>
        </button>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate({ enabled: !action.enabled }); }}
            className={`w-8 h-4 rounded-full transition-colors ${action.enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${action.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Expanded Settings - Wait Timer Integrated */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-slate-700/50 space-y-3"
          >
            {/* Wait Timer - Integrated Naturally */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">
                Delay Before Action
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={action.delay?.value || 0}
                  onChange={(e) => onUpdate({
                    delay: { value: parseInt(e.target.value) || 0, unit: action.delay?.unit || 'hours' }
                  })}
                  className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium"
                />
                <select
                  value={action.delay?.unit || 'hours'}
                  onChange={(e) => onUpdate({
                    delay: { value: action.delay?.value || 0, unit: e.target.value as TimerConfig['unit'] }
                  })}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">
                Trigger Condition
              </label>
              <select
                value={action.condition || 'always'}
                onChange={(e) => onUpdate({ condition: e.target.value as ActionConfig['condition'] })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium"
              >
                <option value="always">Always</option>
                <option value="no-response">If no response</option>
                <option value="if-opened">If email opened</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ UPLOAD LEADS MODAL ============
function UploadLeadsModal({ onClose }: { onClose: () => void }) {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste' | 'template'>('file');
  const [fileData, setFileData] = useState<string[][] | null>(null);
  const [pasteData, setPasteData] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row =>
        row.split(/[,\t]/).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
      ).filter(row => row.some(cell => cell));
      setFileData(rows);
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (!pasteData.trim()) return;

    setIsProcessing(true);
    const rows = pasteData.split('\n').map(row =>
      row.split(/[\t]/).map(cell => cell.trim())
    ).filter(row => row.some(cell => cell));
    setFileData(rows);
    setIsProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm modal"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-3xl bg-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-slate-800/80 to-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-2xl">📥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Leads</h2>
              <p className="text-sm text-slate-400">Upload your lead data with intelligent mapping</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Method Tabs */}
        <div className="flex border-b border-slate-700/50">
          {[
            { id: 'file', label: 'Upload File', icon: '📁' },
            { id: 'paste', label: 'Paste Data', icon: '📋' },
            { id: 'template', label: 'Use Template', icon: '📝' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setUploadMethod(tab.id as typeof uploadMethod)}
              className={`flex-1 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                uploadMethod === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {uploadMethod === 'file' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center hover:border-blue-500/50 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center"
                  >
                    <span className="text-4xl">📁</span>
                  </motion.div>
                  <p className="text-lg text-white font-semibold mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500">Excel, CSV, or text files supported</p>
                </label>
              </div>
            </div>
          )}

          {uploadMethod === 'paste' && (
            <div className="space-y-4">
              <textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="Paste your data from Google Sheets, Excel, or any spreadsheet...&#10;&#10;Columns should be separated by tabs.&#10;Each row should be on a new line."
                className="w-full h-48 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
              <button
                onClick={handlePaste}
                disabled={!pasteData.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/30"
              >
                Process Data
              </button>
            </div>
          )}

          {uploadMethod === 'template' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 mb-4">Choose a template that matches your data format:</p>
              <div className="grid grid-cols-2 gap-4">
                {UPLOAD_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedTemplate === tmpl.id
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{tmpl.icon}</span>
                      <span className="text-white font-semibold">{tmpl.name}</span>
                    </div>
                    <p className="text-xs text-slate-400">{tmpl.description}</p>
                    <p className="text-xs text-slate-500 mt-2">{tmpl.fields.length} fields</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview */}
          {fileData && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span>
                Preview ({fileData.length - 1} rows detected)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/80">
                      {fileData[0]?.map((col, i) => (
                        <th key={i} className="px-4 py-3 text-left text-slate-300 font-semibold border-b border-slate-700/50">
                          {col || `Column ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fileData.slice(1, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-700/30">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3 text-white">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {fileData.length > 5 && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Showing 4 of {fileData.length - 1} rows
                </p>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center py-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 flex justify-end gap-3 bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!fileData}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/30"
          >
            Import {fileData ? `${fileData.length - 1} Leads` : ''}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============ WORKFLOWS MODAL ============
function WorkflowsModal({
  workflows,
  currentWorkflow,
  onSelect,
  onCreate,
  onClose,
}: {
  workflows: Workflow[];
  currentWorkflow: Workflow;
  onSelect: (wf: Workflow) => void;
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm modal"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white">Your Workflows</h2>
          <p className="text-sm text-slate-400">Switch between workflows or create a new one</p>
        </div>

        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {workflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => onSelect(wf)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                currentWorkflow.id === wf.id
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold block">{wf.name}</span>
                  <span className="text-xs text-slate-400">
                    {wf.stages.length} stages • Updated {new Date(wf.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {currentWorkflow.id === wf.id && (
                  <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold">
                    Active
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Create New */}
          {isCreating ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-800/30">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workflow name..."
                className="w-full bg-transparent border-none outline-none text-white text-sm mb-3 placeholder:text-slate-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { if (newName.trim()) { onCreate(newName.trim()); setNewName(''); setIsCreating(false); } }}
                  disabled={!newName.trim()}
                  className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewName(''); }}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full p-4 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white transition-all text-sm font-semibold"
            >
              + Create New Workflow
            </button>
          )}
        </div>

        <div className="p-6 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
