'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';
import {
  PipelineStage, ActionNode, NodeConnection, Template, Workflow,
  STAGE_COLORS, ACTION_TYPES, DEFAULT_WORKFLOW_SETTINGS,
  ActionNodeType, StageColor, TimerDelay, TIMER_PRESETS, formatDelay,
  DEAD_REASONS, STORAGE_KEYS
} from './types';

// ============ ICONS (SVG paths) ============
const Icons = {
  plus: 'M12 4v16m8-8H4',
  save: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
  undo: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  redo: 'M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6',
  fit: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5m-6 6l-5 5m0 0h4m-4 0v-4m16-1l-5 5m5 0v-4m0 4h-4',
  grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  template: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  close: 'M6 18L18 6M6 6l12 12',
  chevronDown: 'M19 9l-7 7-7-7',
  check: 'M5 13l4 4L19 7',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
};

const Icon = ({ path, className = 'w-5 h-5' }: { path: string; className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

// ============ PROPS ============
interface PipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

// ============ MAIN COMPONENT ============
export function FuturisticPipeline({ leads, onStatusChange, onViewDetails }: PipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // ============ STATE ============
  const [workflow, setWorkflow] = useState<Workflow>(() => createDefaultWorkflow());
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 100, y: 60 });
  
  // Canvas interaction
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{ id: string; type: 'stage' | 'action' } | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Selection & editing
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'stage' | 'action' | null>(null);
  const [connecting, setConnecting] = useState<{ from: string; type: 'stage' | 'action' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // UI panels
  const [activePanel, setActivePanel] = useState<'nodes' | 'templates' | 'settings'>('nodes');
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  
  // Templates
  const [templates, setTemplates] = useState<Template[]>(() => createDefaultTemplates());
  
  // Saving
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // ============ COMPUTED ============
  const selectedStage = useMemo(() => 
    selectedType === 'stage' ? workflow.stages.find(s => s.id === selectedId) : null,
    [selectedId, selectedType, workflow.stages]
  );
  
  const selectedAction = useMemo(() =>
    selectedType === 'action' ? workflow.actions.find(a => a.id === selectedId) : null,
    [selectedId, selectedType, workflow.actions]
  );

  // ============ CANVAS INTERACTIONS ============
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      });
    }
    
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
    
    if (isDragging && dragTarget) {
      const dx = (e.clientX - lastMousePos.current.x) / zoom;
      const dy = (e.clientY - lastMousePos.current.y) / zoom;
      
      if (dragTarget.type === 'stage') {
        setWorkflow(w => ({
          ...w,
          stages: w.stages.map(s => s.id === dragTarget.id ? {
            ...s,
            x: snapToGrid(s.x + dx),
            y: snapToGrid(s.y + dy),
          } : s),
        }));
      } else {
        setWorkflow(w => ({
          ...w,
          actions: w.actions.map(a => a.id === dragTarget.id ? {
            ...a,
            x: snapToGrid(a.x + dx),
            y: snapToGrid(a.y + dy),
          } : a),
        }));
      }
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setHasChanges(true);
    }
  }, [isPanning, isDragging, dragTarget, zoom, pan]);

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    setDragTarget(null);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(z => Math.min(2, Math.max(0.2, z * delta)));
    } else {
      setPan(p => ({
        x: p.x - e.deltaX * 0.5,
        y: p.y - e.deltaY * 0.5,
      }));
    }
  }, []);

  const snapToGrid = (value: number) => {
    if (!workflow.settings.snapToGrid) return value;
    return Math.round(value / workflow.settings.gridSize) * workflow.settings.gridSize;
  };

  // ============ NODE OPERATIONS ============
  const addStage = (color: StageColor = 'blue') => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: 'New Stage',
      statusId: 'new',
      x: snapToGrid((mousePos.x || 400) - 140),
      y: snapToGrid((mousePos.y || 200) - 80),
      width: 280,
      height: 160,
      color,
      column: workflow.stages.length,
      row: 0,
      actionIds: [],
    };
    setWorkflow(w => ({ ...w, stages: [...w.stages, newStage] }));
    setSelectedId(newStage.id);
    setSelectedType('stage');
    setShowPropertiesPanel(true);
    setHasChanges(true);
  };

  const addAction = (type: ActionNodeType) => {
    const config = ACTION_TYPES[type];
    const newAction: ActionNode = {
      id: `action-${Date.now()}`,
      type,
      label: config.label,
      x: snapToGrid((mousePos.x || 400) - 100),
      y: snapToGrid((mousePos.y || 300) - 60),
      width: 200,
      height: 120,
      color: config.color,
      timing: 'immediate',
    };
    setWorkflow(w => ({ ...w, actions: [...w.actions, newAction] }));
    setSelectedId(newAction.id);
    setSelectedType('action');
    setShowPropertiesPanel(true);
    setHasChanges(true);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    if (selectedType === 'stage') {
      setWorkflow(w => ({
        ...w,
        stages: w.stages.filter(s => s.id !== selectedId),
        connections: w.connections.filter(c => c.fromId !== selectedId && c.toId !== selectedId),
      }));
    } else {
      setWorkflow(w => ({
        ...w,
        actions: w.actions.filter(a => a.id !== selectedId),
        connections: w.connections.filter(c => c.fromId !== selectedId && c.toId !== selectedId),
      }));
    }
    setSelectedId(null);
    setSelectedType(null);
    setShowPropertiesPanel(false);
    setHasChanges(true);
  };

  // ============ CONNECTIONS ============
  const startConnection = (id: string, type: 'stage' | 'action') => {
    setConnecting({ from: id, type });
  };

  const completeConnection = (toId: string, toType: 'stage' | 'action') => {
    if (!connecting || connecting.from === toId) {
      setConnecting(null);
      return;
    }
    
    const exists = workflow.connections.some(
      c => c.fromId === connecting.from && c.toId === toId
    );
    
    if (!exists) {
      const newConnection: NodeConnection = {
        id: `conn-${Date.now()}`,
        fromId: connecting.from,
        toId,
        fromType: connecting.type,
        toType,
        style: 'solid',
      };
      setWorkflow(w => ({ ...w, connections: [...w.connections, newConnection] }));
      setHasChanges(true);
    }
    setConnecting(null);
  };

  // ============ FIT VIEW ============
  const fitView = () => {
    if (workflow.stages.length === 0 && workflow.actions.length === 0) {
      setZoom(0.6);
      setPan({ x: 100, y: 60 });
      return;
    }
    
    const allNodes = [
      ...workflow.stages.map(s => ({ x: s.x, y: s.y, w: s.width, h: s.height })),
      ...workflow.actions.map(a => ({ x: a.x, y: a.y, w: a.width, h: a.height })),
    ];
    
    const bounds = allNodes.reduce((acc, n) => ({
      minX: Math.min(acc.minX, n.x),
      minY: Math.min(acc.minY, n.y),
      maxX: Math.max(acc.maxX, n.x + n.w),
      maxY: Math.max(acc.maxY, n.y + n.h),
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    
    const padding = 100;
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;
    
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
    
    const newZoom = Math.min(
      containerWidth / contentWidth,
      containerHeight / contentHeight,
      1
    );
    
    setPan({
      x: (containerWidth - contentWidth * newZoom) / 2 - bounds.minX * newZoom + padding * newZoom,
      y: (containerHeight - contentHeight * newZoom) / 2 - bounds.minY * newZoom + padding * newZoom,
    });
    setZoom(newZoom);
  };

  // ============ SAVE ============
  const save = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.workflows, JSON.stringify(workflow));
      localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
      
      // Also save to S3 via API
      await fetch('/api/admin/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, templates }),
      });
      
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setIsSaving(false);
  };

  // ============ LOAD ============
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.workflows);
    const savedTemplates = localStorage.getItem(STORAGE_KEYS.templates);
    
    if (saved) {
      try {
        setWorkflow(JSON.parse(saved));
      } catch {}
    }
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch {}
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
      if (e.key === 'Delete' && selectedId) {
        deleteSelected();
      }
      if (e.key === 'Escape') {
        setConnecting(null);
        setSelectedId(null);
        setSelectedType(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // ============ GET CONNECTION PATH ============
  const getConnectionPath = (conn: NodeConnection) => {
    const fromNode = conn.fromType === 'stage' 
      ? workflow.stages.find(s => s.id === conn.fromId)
      : workflow.actions.find(a => a.id === conn.fromId);
    const toNode = conn.toType === 'stage'
      ? workflow.stages.find(s => s.id === conn.toId)
      : workflow.actions.find(a => a.id === conn.toId);
    
    if (!fromNode || !toNode) return '';
    
    const fromX = fromNode.x + fromNode.width;
    const fromY = fromNode.y + fromNode.height / 2;
    const toX = toNode.x;
    const toY = toNode.y + toNode.height / 2;
    
    const midX = (fromX + toX) / 2;
    
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  // ============ RENDER ============
  return (
    <div className="h-full flex bg-slate-950 text-white overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 flex flex-col border-r border-white/10 bg-slate-900/50 backdrop-blur-xl">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white/90">Pipeline Builder</h2>
          <p className="text-sm text-white/50 mt-1">Drag nodes to canvas</p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['nodes', 'templates', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActivePanel(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activePanel === tab 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activePanel === 'nodes' && (
            <div className="space-y-6">
              {/* Stage Nodes */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Pipeline Stages</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['blue', 'green', 'yellow', 'purple', 'cyan', 'orange'] as StageColor[]).map(color => (
                    <button
                      key={color}
                      onClick={() => addStage(color)}
                      className="p-3 rounded-lg border border-white/10 hover:border-white/30 transition-all group"
                      style={{ backgroundColor: STAGE_COLORS[color].bg }}
                    >
                      <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: STAGE_COLORS[color].accent }} />
                      <span className="text-xs text-white/70 group-hover:text-white/90">Stage</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Action Nodes */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Action Nodes</h3>
                <div className="space-y-2">
                  {(Object.entries(ACTION_TYPES) as [ActionNodeType, typeof ACTION_TYPES[ActionNodeType]][]).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => addAction(type)}
                      className="w-full p-3 rounded-lg border border-white/10 hover:border-white/30 flex items-center gap-3 transition-all group"
                      style={{ backgroundColor: STAGE_COLORS[config.color].bg }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: STAGE_COLORS[config.color].accent + '40' }}>
                        <Icon path={config.icon} className="w-4 h-4" style={{ color: STAGE_COLORS[config.color].text }} />
                      </div>
                      <span className="text-sm text-white/80 group-hover:text-white">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activePanel === 'templates' && (
            <div className="space-y-4">
              <button className="w-full p-3 rounded-lg border border-dashed border-white/20 hover:border-blue-400/50 text-white/60 hover:text-blue-400 transition-colors flex items-center justify-center gap-2">
                <Icon path={Icons.plus} className="w-4 h-4" />
                Create Template
              </button>
              
              {templates.map(template => (
                <div
                  key={template.id}
                  className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon path={Icons.template} className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">{template.name}</span>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2">{template.content}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      template.channel === 'email' ? 'bg-blue-500/20 text-blue-400' :
                      template.channel === 'sms' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {template.channel}
                    </span>
                    <span className="text-xs text-white/40">{template.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activePanel === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-2">Grid Size</label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={workflow.settings.gridSize}
                  onChange={(e) => setWorkflow(w => ({
                    ...w,
                    settings: { ...w.settings, gridSize: Number(e.target.value) }
                  }))}
                  className="w-full accent-blue-500"
                />
                <span className="text-xs text-white/40">{workflow.settings.gridSize}px</span>
              </div>
              
              <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-white/80">Snap to Grid</span>
                <button
                  onClick={() => setWorkflow(w => ({
                    ...w,
                    settings: { ...w.settings, snapToGrid: !w.settings.snapToGrid }
                  }))}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    workflow.settings.snapToGrid ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    workflow.settings.snapToGrid ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </label>
              
              <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-white/80">Show Grid</span>
                <button
                  onClick={() => setWorkflow(w => ({
                    ...w,
                    settings: { ...w.settings, showGrid: !w.settings.showGrid }
                  }))}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    workflow.settings.showGrid ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    workflow.settings.showGrid ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </label>
            </div>
          )}
        </div>
      </aside>
      
      {/* MAIN CANVAS */}
      <main className="flex-1 relative overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-white/10">
              <button
                onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
                className="p-1 hover:bg-white/10 rounded"
              >
                <span className="text-white/80">−</span>
              </button>
              <span className="text-sm text-white/70 w-14 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="p-1 hover:bg-white/10 rounded"
              >
                <span className="text-white/80">+</span>
              </button>
            </div>
            
            <button
              onClick={fitView}
              className="p-2 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
              title="Fit View"
            >
              <Icon path={Icons.fit} className="w-5 h-5 text-white/70" />
            </button>
            
            <button
              onClick={() => setWorkflow(w => ({ ...w, settings: { ...w.settings, showGrid: !w.settings.showGrid } }))}
              className={`p-2 rounded-lg backdrop-blur-sm border transition-colors ${
                workflow.settings.showGrid ? 'bg-blue-500/20 border-blue-500/50' : 'bg-slate-900/90 border-white/10'
              }`}
              title="Toggle Grid"
            >
              <Icon path={Icons.grid} className="w-5 h-5 text-white/70" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="text-sm text-white/50 mr-2">
              {hasChanges && 'Unsaved changes'}
              {lastSaved && !hasChanges && `Saved ${lastSaved.toLocaleTimeString()}`}
            </div>
            
            <button
              onClick={save}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                hasChanges
                  ? 'bg-blue-500 border-blue-400 text-white hover:bg-blue-600'
                  : 'bg-slate-900/90 border-white/10 text-white/70'
              }`}
            >
              <Icon path={Icons.save} className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {/* Canvas */}
        <div
          ref={containerRef}
          className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : connecting ? 'cursor-crosshair' : 'cursor-grab'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          onClick={() => { setSelectedId(null); setSelectedType(null); }}
        >
          {/* Grid Background */}
          {workflow.settings.showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: `${workflow.settings.gridSize * zoom}px ${workflow.settings.gridSize * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
              }}
            />
          )}
          
          {/* Canvas Content */}
          <div
            ref={canvasRef}
            className="absolute origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="connGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              
              {workflow.connections.map(conn => (
                <path
                  key={conn.id}
                  d={getConnectionPath(conn)}
                  fill="none"
                  stroke="url(#connGradient)"
                  strokeWidth={2}
                  strokeDasharray={conn.style === 'dashed' ? '8 4' : undefined}
                />
              ))}
              
              {/* Drawing connection */}
              {connecting && (
                <line
                  x1={(() => {
                    const node = connecting.type === 'stage'
                      ? workflow.stages.find(s => s.id === connecting.from)
                      : workflow.actions.find(a => a.id === connecting.from);
                    return node ? node.x + node.width : 0;
                  })()}
                  y1={(() => {
                    const node = connecting.type === 'stage'
                      ? workflow.stages.find(s => s.id === connecting.from)
                      : workflow.actions.find(a => a.id === connecting.from);
                    return node ? node.y + node.height / 2 : 0;
                  })()}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                />
              )}
            </svg>
            
            {/* Stage Nodes */}
            {workflow.stages.map(stage => (
              <StageNode
                key={stage.id}
                stage={stage}
                isSelected={selectedId === stage.id}
                isConnecting={!!connecting}
                leads={leads.filter(l => l.status === stage.statusId)}
                onSelect={() => { setSelectedId(stage.id); setSelectedType('stage'); setShowPropertiesPanel(true); }}
                onStartConnection={() => startConnection(stage.id, 'stage')}
                onCompleteConnection={() => completeConnection(stage.id, 'stage')}
                onStartDrag={(e) => {
                  e.stopPropagation();
                  setIsDragging(true);
                  setDragTarget({ id: stage.id, type: 'stage' });
                  lastMousePos.current = { x: e.clientX, y: e.clientY };
                }}
              />
            ))}
            
            {/* Action Nodes */}
            {workflow.actions.map(action => (
              <ActionNodeComponent
                key={action.id}
                action={action}
                isSelected={selectedId === action.id}
                isConnecting={!!connecting}
                template={templates.find(t => t.id === action.templateId)}
                onSelect={() => { setSelectedId(action.id); setSelectedType('action'); setShowPropertiesPanel(true); }}
                onStartConnection={() => startConnection(action.id, 'action')}
                onCompleteConnection={() => completeConnection(action.id, 'action')}
                onStartDrag={(e) => {
                  e.stopPropagation();
                  setIsDragging(true);
                  setDragTarget({ id: action.id, type: 'action' });
                  lastMousePos.current = { x: e.clientX, y: e.clientY };
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Connection Mode Indicator */}
        {connecting && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm">
            Click a node to connect • Press Escape to cancel
          </div>
        )}
      </main>
      
      {/* RIGHT PROPERTIES PANEL */}
      {showPropertiesPanel && (selectedStage || selectedAction) && (
        <aside className="w-80 flex flex-col border-l border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-white/90">Properties</h3>
            <button
              onClick={() => setShowPropertiesPanel(false)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <Icon path={Icons.close} className="w-5 h-5 text-white/50" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedStage && (
              <StagePropertiesPanel
                stage={selectedStage}
                onChange={(updates) => {
                  setWorkflow(w => ({
                    ...w,
                    stages: w.stages.map(s => s.id === selectedStage.id ? { ...s, ...updates } : s),
                  }));
                  setHasChanges(true);
                }}
              />
            )}
            
            {selectedAction && (
              <ActionPropertiesPanel
                action={selectedAction}
                templates={templates}
                onChange={(updates) => {
                  setWorkflow(w => ({
                    ...w,
                    actions: w.actions.map(a => a.id === selectedAction.id ? { ...a, ...updates } : a),
                  }));
                  setHasChanges(true);
                }}
              />
            )}
            
            <button
              onClick={deleteSelected}
              className="w-full p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <Icon path={Icons.trash} className="w-4 h-4" />
              Delete Node
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

// ============ STAGE NODE COMPONENT ============
function StageNode({
  stage,
  isSelected,
  isConnecting,
  leads,
  onSelect,
  onStartConnection,
  onCompleteConnection,
  onStartDrag,
}: {
  stage: PipelineStage;
  isSelected: boolean;
  isConnecting: boolean;
  leads: Lead[];
  onSelect: () => void;
  onStartConnection: () => void;
  onCompleteConnection: () => void;
  onStartDrag: (e: React.MouseEvent) => void;
}) {
  const colors = STAGE_COLORS[stage.color];
  
  return (
    <div
      className={`absolute select-none transition-shadow duration-200 ${
        isSelected ? 'z-10' : ''
      }`}
      style={{
        left: stage.x,
        top: stage.y,
        width: stage.width,
        height: stage.height,
      }}
      onClick={(e) => { e.stopPropagation(); isConnecting ? onCompleteConnection() : onSelect(); }}
      onMouseDown={onStartDrag}
    >
      {/* Input Socket */}
      <div
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all hover:scale-125 cursor-pointer z-10"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        onClick={(e) => { e.stopPropagation(); onCompleteConnection(); }}
      />
      
      {/* Node Body */}
      <div
        className={`w-full h-full rounded-xl overflow-hidden backdrop-blur-xl transition-all ${
          isSelected ? 'ring-2 ring-blue-400/50 shadow-lg' : ''
        } ${isConnecting ? 'ring-2 ring-yellow-400/30' : ''}`}
        style={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: colors.border, backgroundColor: colors.accent + '15' }}
        >
          <h4 className="font-semibold text-white/90 truncate">{stage.label}</h4>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: colors.accent + '30', color: colors.text }}
          >
            {leads.length}
          </span>
        </div>
        
        {/* Content */}
        <div className="p-3 space-y-2 max-h-24 overflow-y-auto">
          {leads.slice(0, 3).map(lead => (
            <div
              key={lead.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Icon path={Icons.user} className="w-3 h-3 text-white/60" />
              </div>
              <span className="text-xs text-white/70 truncate">{lead.formData.firstName} {lead.formData.lastName}</span>
            </div>
          ))}
          {leads.length > 3 && (
            <p className="text-xs text-white/40 text-center">+{leads.length - 3} more</p>
          )}
        </div>
      </div>
      
      {/* Output Socket */}
      <div
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all hover:scale-125 cursor-pointer z-10"
        style={{ backgroundColor: colors.accent, borderColor: colors.border }}
        onClick={(e) => { e.stopPropagation(); onStartConnection(); }}
      />
    </div>
  );
}

// ============ ACTION NODE COMPONENT ============
function ActionNodeComponent({
  action,
  isSelected,
  isConnecting,
  template,
  onSelect,
  onStartConnection,
  onCompleteConnection,
  onStartDrag,
}: {
  action: ActionNode;
  isSelected: boolean;
  isConnecting: boolean;
  template?: Template;
  onSelect: () => void;
  onStartConnection: () => void;
  onCompleteConnection: () => void;
  onStartDrag: (e: React.MouseEvent) => void;
}) {
  const config = ACTION_TYPES[action.type];
  const colors = STAGE_COLORS[action.color];
  
  return (
    <div
      className={`absolute select-none transition-shadow duration-200 ${isSelected ? 'z-10' : ''}`}
      style={{
        left: action.x,
        top: action.y,
        width: action.width,
        height: action.height,
      }}
      onClick={(e) => { e.stopPropagation(); isConnecting ? onCompleteConnection() : onSelect(); }}
      onMouseDown={onStartDrag}
    >
      {/* Input Socket */}
      <div
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all hover:scale-125 cursor-pointer z-10"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        onClick={(e) => { e.stopPropagation(); onCompleteConnection(); }}
      />
      
      {/* Node Body */}
      <div
        className={`w-full h-full rounded-xl overflow-hidden backdrop-blur-xl transition-all ${
          isSelected ? 'ring-2 ring-blue-400/50 shadow-lg' : ''
        } ${isConnecting ? 'ring-2 ring-yellow-400/30' : ''}`}
        style={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="h-full p-3 flex flex-col">
          {/* Icon & Label */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.accent + '30' }}
            >
              <Icon path={config.icon} className="w-4 h-4" style={{ color: colors.text }} />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-medium text-white/90 truncate">{action.label}</h5>
              <p className="text-xs text-white/50">{config.label}</p>
            </div>
          </div>
          
          {/* Template Preview */}
          {template && (
            <div className="flex-1 p-2 rounded-lg bg-white/5 text-xs">
              <p className="text-white/60 truncate">{template.subject || template.name}</p>
              <p className="text-white/40 line-clamp-2 mt-1">{template.content}</p>
            </div>
          )}
          
          {/* Timing */}
          {action.delay && (
            <div className="mt-2 text-xs text-white/50 flex items-center gap-1">
              <Icon path={ACTION_TYPES.wait.icon} className="w-3 h-3" />
              {formatDelay(action.delay)}
            </div>
          )}
        </div>
      </div>
      
      {/* Output Socket */}
      <div
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all hover:scale-125 cursor-pointer z-10"
        style={{ backgroundColor: colors.accent, borderColor: colors.border }}
        onClick={(e) => { e.stopPropagation(); onStartConnection(); }}
      />
    </div>
  );
}

// ============ STAGE PROPERTIES PANEL ============
function StagePropertiesPanel({
  stage,
  onChange,
}: {
  stage: PipelineStage;
  onChange: (updates: Partial<PipelineStage>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-white/50 block mb-1">Stage Name</label>
        <input
          type="text"
          value={stage.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500/50 focus:outline-none"
        />
      </div>
      
      <div>
        <label className="text-xs text-white/50 block mb-1">Description</label>
        <textarea
          value={stage.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500/50 focus:outline-none resize-none"
        />
      </div>
      
      <div>
        <label className="text-xs text-white/50 block mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STAGE_COLORS) as StageColor[]).slice(0, 8).map(color => (
            <button
              key={color}
              onClick={() => onChange({ color })}
              className={`w-8 h-8 rounded-lg transition-all ${
                stage.color === color ? 'ring-2 ring-white/50 scale-110' : ''
              }`}
              style={{ backgroundColor: STAGE_COLORS[color].accent }}
            />
          ))}
        </div>
      </div>
      
      <div>
        <label className="text-xs text-white/50 block mb-2">Follow-up Reminder</label>
        <select
          value={stage.followUpAfter ? `${stage.followUpAfter.value}-${stage.followUpAfter.unit}` : ''}
          onChange={(e) => {
            if (!e.target.value) {
              onChange({ followUpAfter: undefined });
            } else {
              const [value, unit] = e.target.value.split('-');
              onChange({ followUpAfter: { value: Number(value), unit: unit as TimerDelay['unit'] } });
            }
          }}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
        >
          <option value="">No reminder</option>
          {TIMER_PRESETS.map(preset => (
            <option key={`${preset.value}-${preset.unit}`} value={`${preset.value}-${preset.unit}`}>
              {formatDelay(preset)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ============ ACTION PROPERTIES PANEL ============
function ActionPropertiesPanel({
  action,
  templates,
  onChange,
}: {
  action: ActionNode;
  templates: Template[];
  onChange: (updates: Partial<ActionNode>) => void;
}) {
  const config = ACTION_TYPES[action.type];
  const relevantTemplates = templates.filter(t => 
    (action.type === 'email' && t.channel === 'email') ||
    (action.type === 'sms' && t.channel === 'sms') ||
    (action.type === 'call' && t.channel === 'script')
  );
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-white/50 block mb-1">Node Name</label>
        <input
          type="text"
          value={action.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
        />
      </div>
      
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <Icon path={config.icon} className="w-5 h-5 text-white/60" />
          <span className="text-sm text-white/80">{config.label}</span>
        </div>
      </div>
      
      {/* Template Selection */}
      {(action.type === 'email' || action.type === 'sms' || action.type === 'call') && (
        <div>
          <label className="text-xs text-white/50 block mb-1">Linked Template</label>
          <select
            value={action.templateId || ''}
            onChange={(e) => {
              const template = templates.find(t => t.id === e.target.value);
              onChange({ 
                templateId: e.target.value || undefined,
                templateName: template?.name,
              });
            }}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
          >
            <option value="">Select template...</option>
            {relevantTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          
          {action.templateId && (
            <div className="mt-2 p-2 rounded-lg bg-white/5 text-xs text-white/60">
              {templates.find(t => t.id === action.templateId)?.content?.slice(0, 100)}...
            </div>
          )}
        </div>
      )}
      
      {/* Timing */}
      <div>
        <label className="text-xs text-white/50 block mb-2">Timing</label>
        <div className="flex gap-2">
          {(['immediate', 'delayed'] as const).map(timing => (
            <button
              key={timing}
              onClick={() => onChange({ timing })}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                action.timing === timing
                  ? 'bg-blue-500/30 border border-blue-500/50 text-blue-400'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {timing === 'immediate' ? 'Immediately' : 'After Delay'}
            </button>
          ))}
        </div>
      </div>
      
      {action.timing === 'delayed' && (
        <div>
          <label className="text-xs text-white/50 block mb-1">Delay Duration</label>
          <select
            value={action.delay ? `${action.delay.value}-${action.delay.unit}` : ''}
            onChange={(e) => {
              if (!e.target.value) return;
              const [value, unit] = e.target.value.split('-');
              onChange({ delay: { value: Number(value), unit: unit as TimerDelay['unit'] } });
            }}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
          >
            <option value="">Select delay...</option>
            {TIMER_PRESETS.map(preset => (
              <option key={`${preset.value}-${preset.unit}`} value={`${preset.value}-${preset.unit}`}>
                {formatDelay(preset)}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Assignee */}
      {action.type === 'reminder' && (
        <div>
          <label className="text-xs text-white/50 block mb-2">Notify</label>
          <div className="flex gap-2">
            {(['agent', 'manager', 'team'] as const).map(type => (
              <button
                key={type}
                onClick={() => onChange({ assigneeType: type })}
                className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                  action.assigneeType === type
                    ? 'bg-blue-500/30 border border-blue-500/50 text-blue-400'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ HELPER FUNCTIONS ============
function createDefaultWorkflow(): Workflow {
  const stages: PipelineStage[] = [
    { id: 'stage-new', label: 'New Leads', statusId: 'new', x: 100, y: 100, width: 280, height: 180, color: 'blue', column: 0, row: 0, actionIds: [] },
    { id: 'stage-contact', label: 'Contact Attempt', statusId: 'working', x: 460, y: 100, width: 280, height: 180, color: 'cyan', column: 1, row: 0, actionIds: [] },
    { id: 'stage-qualified', label: 'Qualified', statusId: 'working', x: 820, y: 100, width: 280, height: 180, color: 'purple', column: 2, row: 0, actionIds: [] },
    { id: 'stage-meeting', label: 'Meeting Scheduled', statusId: 'circleBack', x: 1180, y: 100, width: 280, height: 180, color: 'green', column: 3, row: 0, actionIds: [] },
    { id: 'stage-won', label: 'Won', statusId: 'approval', x: 1540, y: 100, width: 280, height: 180, color: 'emerald', column: 4, row: 0, actionIds: [] },
  ];
  
  const actions: ActionNode[] = [
    { id: 'action-welcome', type: 'email', label: 'Welcome Email', x: 200, y: 340, width: 200, height: 120, color: 'blue', timing: 'immediate' },
    { id: 'action-followup', type: 'sms', label: 'Follow-up SMS', x: 560, y: 340, width: 200, height: 120, color: 'cyan', timing: 'delayed', delay: { value: 24, unit: 'hours' } },
  ];
  
  const connections: NodeConnection[] = [
    { id: 'conn-1', fromId: 'stage-new', toId: 'action-welcome', fromType: 'stage', toType: 'action', style: 'solid' },
    { id: 'conn-2', fromId: 'action-welcome', toId: 'stage-contact', fromType: 'action', toType: 'stage', style: 'solid' },
    { id: 'conn-3', fromId: 'stage-contact', toId: 'action-followup', fromType: 'stage', toType: 'action', style: 'dashed' },
    { id: 'conn-4', fromId: 'stage-contact', toId: 'stage-qualified', fromType: 'stage', toType: 'stage', style: 'solid' },
    { id: 'conn-5', fromId: 'stage-qualified', toId: 'stage-meeting', fromType: 'stage', toType: 'stage', style: 'solid' },
    { id: 'conn-6', fromId: 'stage-meeting', toId: 'stage-won', fromType: 'stage', toType: 'stage', style: 'solid' },
  ];
  
  return {
    id: `workflow-${Date.now()}`,
    name: 'Sales Pipeline',
    stages,
    actions,
    connections,
    templates: [],
    settings: DEFAULT_WORKFLOW_SETTINGS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultTemplates(): Template[] {
  return [
    {
      id: 'tpl-welcome',
      name: 'Welcome Email',
      channel: 'email',
      category: 'Onboarding',
      subject: 'Welcome to My Next Ride Ontario!',
      content: 'Hi {firstName},\n\nThank you for your interest in finding your next vehicle. We received your application and will be in touch shortly.\n\nBest regards,\nMy Next Ride Ontario Team',
      variables: ['firstName', 'lastName'],
      createdAt: new Date().toISOString(),
      usageCount: 0,
    },
    {
      id: 'tpl-followup',
      name: 'Follow-up SMS',
      channel: 'sms',
      category: 'Follow-up',
      content: 'Hi {firstName}! This is {agentName} from My Next Ride Ontario. I wanted to follow up on your vehicle application. When is a good time to chat?',
      variables: ['firstName', 'agentName'],
      createdAt: new Date().toISOString(),
      usageCount: 0,
    },
    {
      id: 'tpl-meeting',
      name: 'Meeting Confirmation',
      channel: 'email',
      category: 'Scheduling',
      subject: 'Your Appointment is Confirmed',
      content: 'Hi {firstName},\n\nYour appointment has been scheduled for {appointmentDate} at {appointmentTime}.\n\nLocation: {dealerAddress}\n\nSee you soon!',
      variables: ['firstName', 'appointmentDate', 'appointmentTime', 'dealerAddress'],
      createdAt: new Date().toISOString(),
      usageCount: 0,
    },
    {
      id: 'tpl-nomatch',
      name: 'No Vehicle Match',
      channel: 'email',
      category: 'Follow-up',
      subject: 'We\'re Still Looking for Your Perfect Vehicle',
      content: 'Hi {firstName},\n\nWe haven\'t found the perfect match for your criteria yet, but we\'re keeping an eye out. We\'ll contact you as soon as something comes up!\n\nIn the meantime, would you consider any of these alternatives?',
      variables: ['firstName'],
      createdAt: new Date().toISOString(),
      usageCount: 0,
    },
  ];
}
