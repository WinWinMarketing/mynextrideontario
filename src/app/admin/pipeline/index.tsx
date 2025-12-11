'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';
import { 
  PipelineStage, MessageNode, NodeConnection, TextLabel, WorkspaceProfile,
  STAGE_COLORS, DEFAULT_WORKSPACE_SETTINGS, DEAD_LEAD_CATEGORIES, TIMER_PRESETS,
  MAX_PROFILES, STORAGE_KEY, ACTIVE_PROFILE_KEY, StageColor, PipelineAnalytics
} from './types';
import { ALL_PRESETS, Preset, PRESET_CATEGORIES } from './presets';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

// History state for undo/redo
interface HistoryState {
  stages: PipelineStage[];
  messageNodes: MessageNode[];
  connections: NodeConnection[];
  labels: TextLabel[];
}

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Workspace
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showProfilesSidebar, setShowProfilesSidebar] = useState(false);
  const [profileName, setProfileName] = useState('');
  
  // Canvas
  const [zoom, setZoom] = useState(0.4);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  // Pipeline
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [messageNodes, setMessageNodes] = useState<MessageNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [labels, setLabels] = useState<TextLabel[]>([]);
  
  // UI
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<'stage' | 'message' | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ id: string; type: 'stage' | 'message' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Sidebar
  const [sidebarTab, setSidebarTab] = useState<'presets' | 'stages' | 'messages' | 'analytics'>('presets');
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [presetPreview, setPresetPreview] = useState<Preset | null>(null);

  // Analytics
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);

  // ============ SAVE STATE ============
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [showSaveReminder, setShowSaveReminder] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // ============ UNDO/REDO HISTORY ============
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    const newState: HistoryState = { stages: [...stages], messageNodes: [...messageNodes], connections: [...connections], labels: [...labels] };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      // Keep max 50 history states
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    setHasUnsavedChanges(true);
  }, [stages, messageNodes, connections, labels, historyIndex]);

  // Track changes for history
  useEffect(() => {
    if (stages.length > 0 || messageNodes.length > 0) {
      const timeout = setTimeout(saveToHistory, 500);
      return () => clearTimeout(timeout);
    }
  }, [stages, messageNodes, connections, labels]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevState = history[historyIndex - 1];
      setStages(prevState.stages);
      setMessageNodes(prevState.messageNodes);
      setConnections(prevState.connections);
      setLabels(prevState.labels);
      setHistoryIndex(prev => prev - 1);
      setHasUnsavedChanges(true);
      setSaveNotification('↩️ Undo successful');
      setTimeout(() => setSaveNotification(null), 2000);
    }
  }, [history, historyIndex]);

  // Redo function  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextState = history[historyIndex + 1];
      setStages(nextState.stages);
      setMessageNodes(nextState.messageNodes);
      setConnections(nextState.connections);
      setLabels(nextState.labels);
      setHistoryIndex(prev => prev + 1);
      setHasUnsavedChanges(true);
      setSaveNotification('↪️ Redo successful');
      setTimeout(() => setSaveNotification(null), 2000);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        manualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Save reminder - show after 2 minutes of unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => setShowSaveReminder(true), 120000); // 2 minutes
      return () => clearTimeout(timer);
    } else {
      setShowSaveReminder(false);
    }
  }, [hasUnsavedChanges]);

  // ============ MANUAL SAVE ============
  const manualSave = useCallback(() => {
    if (activeProfileId) {
      const now = new Date().toISOString();
      const updated = profiles.map(p => 
        p.id === activeProfileId ? { 
          ...p, 
          updatedAt: now, 
          stages, 
          messageNodes,
          connections, 
          labels, 
          settings: { ...DEFAULT_WORKSPACE_SETTINGS, zoom, panX: pan.x, panY: pan.y } 
        } : p
      );
      setProfiles(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);
      setShowSaveReminder(false);
      setSaveNotification('✅ Saved successfully!');
      setTimeout(() => setSaveNotification(null), 3000);
    }
  }, [activeProfileId, stages, messageNodes, connections, labels, zoom, pan, profiles]);

  // ============ LOAD ============
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActive = localStorage.getItem(ACTIVE_PROFILE_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfiles(parsed);
        if (savedActive) {
          const found = parsed.find((p: WorkspaceProfile) => p.id === savedActive);
          if (found) { loadProfileData(found); setActiveProfileId(savedActive); }
          else if (parsed.length > 0) { loadProfileData(parsed[0]); setActiveProfileId(parsed[0].id); }
        } else if (parsed.length > 0) { loadProfileData(parsed[0]); setActiveProfileId(parsed[0].id); }
      } catch { applyPreset(ALL_PRESETS[0]); }
    } else { applyPreset(ALL_PRESETS[0]); }
  }, []);

  // Calculate analytics
  useEffect(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const deadLeads = leads.filter(l => l.status === 'dead').length;
    const approvedLeads = leads.filter(l => l.status === 'approval').length;
    
    const deadReasonBreakdown = DEAD_LEAD_CATEGORIES.map(cat => ({
      reason: cat.label,
      count: leads.filter(l => l.status === 'dead' && l.deadReason === cat.id).length,
      percentage: totalLeads > 0 ? Math.round((leads.filter(l => l.status === 'dead' && l.deadReason === cat.id).length / totalLeads) * 100) : 0,
    })).filter(d => d.count > 0);

    setAnalytics({
      totalLeads,
      newLeadsThisMonth: newLeads,
      conversionRate: totalLeads > 0 ? Math.round((approvedLeads / totalLeads) * 100) : 0,
      deadLeadRate: totalLeads > 0 ? Math.round((deadLeads / totalLeads) * 100) : 0,
      averageTimeToClose: 14,
      stageBreakdown: stages.filter(s => s.statusId !== 'dead').map(s => ({
        stageId: s.id,
        label: s.label,
        count: getStageLeads(s).length,
        percentage: totalLeads > 0 ? Math.round((getStageLeads(s).length / totalLeads) * 100) : 0,
      })),
      deadReasonBreakdown,
      resurrectedLeads: 0,
      pendingFollowUps: leads.filter(l => l.status === 'circle-back').length,
      scheduledMessages: messageNodes.filter(m => m.autoTrigger).length,
    });
  }, [leads, stages, messageNodes]);

  const loadProfileData = (p: WorkspaceProfile) => {
    setStages(p.stages || []); 
    setMessageNodes(p.messageNodes || []);
    setConnections(p.connections || []); 
    setLabels(p.labels || []);
    setZoom(p.settings?.zoom || 0.4); 
    setPan({ x: p.settings?.panX || 50, y: p.settings?.panY || 50 });
    setHasUnsavedChanges(false);
    // Initialize history with loaded state
    setHistory([{ stages: p.stages || [], messageNodes: p.messageNodes || [], connections: p.connections || [], labels: p.labels || [] }]);
    setHistoryIndex(0);
  };

  const loadProfile = (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (p) { loadProfileData(p); setActiveProfileId(id); localStorage.setItem(ACTIVE_PROFILE_KEY, id); }
  };

  const createProfile = (name: string) => {
    if (profiles.length >= MAX_PROFILES) return;
    const now = new Date().toISOString();
    const np: WorkspaceProfile = { 
      id: `profile-${Date.now()}`, name, createdAt: now, updatedAt: now, 
      stages: [], messageNodes: [], connections: [], labels: [], emailTemplates: [],
      settings: DEFAULT_WORKSPACE_SETTINGS 
    };
    const updated = [...profiles, np];
    setProfiles(updated); setActiveProfileId(np.id);
    setStages([]); setMessageNodes([]); setConnections([]); setLabels([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); localStorage.setItem(ACTIVE_PROFILE_KEY, np.id);
    setHasUnsavedChanges(false);
  };

  // ============ LEADS ============
  const getStageLeads = useCallback((s: PipelineStage) => {
    if (s.statusId === 'dead') return s.deadReason ? leads.filter(l => l.status === 'dead' && l.deadReason === s.deadReason) : leads.filter(l => l.status === 'dead');
    return leads.filter(l => l.status === s.statusId);
  }, [leads]);

  const handleDropOnStage = (sid: string) => {
    if (!draggedLead) return;
    const s = stages.find(x => x.id === sid);
    if (!s) return;
    if (s.statusId === 'dead' && s.deadReason) onStatusChange(draggedLead.id, 'dead', s.deadReason);
    else onStatusChange(draggedLead.id, s.statusId as LeadStatus);
    setDraggedLead(null);
  };

  // ============ CANVAS ============
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card, .message-node, .label-node, .sidebar')) return;
    if (connectingFrom) { setConnectingFrom(null); return; }
    e.preventDefault();
    setIsDraggingCanvas(true); 
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) { 
      const r = canvasRef.current.getBoundingClientRect(); 
      setMousePos({ x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom }); 
    }
    if (!isDraggingCanvas) return;
    setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = () => setIsDraggingCanvas(false);
  const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); setZoom(z => Math.max(0.15, Math.min(1.2, z + (e.deltaY > 0 ? -0.04 : 0.04)))); };

  const fitView = () => {
    if (stages.length === 0) { setZoom(0.4); setPan({ x: 50, y: 50 }); return; }
    const allNodes = [...stages, ...messageNodes];
    const xs = allNodes.map(s => s.x), ys = allNodes.map(s => s.y);
    const maxX = Math.max(...xs) + 400, maxY = Math.max(...ys) + 400;
    const cw = containerRef.current?.clientWidth || 1200, ch = containerRef.current?.clientHeight || 800;
    const nz = Math.min(cw / maxX, ch / maxY, 0.6) * 0.7;
    setZoom(Math.max(0.2, Math.min(0.6, nz))); 
    setPan({ x: 50, y: 50 });
  };

  // ============ NODE MOVEMENT ============
  const handleNodeMove = (id: string, type: 'stage' | 'message', dx: number, dy: number) => {
    if (type === 'stage') {
      setStages(prev => prev.map(s => s.id === id ? { ...s, x: s.x + dx / zoom, y: s.y + dy / zoom } : s));
    } else {
      setMessageNodes(prev => prev.map(m => m.id === id ? { ...m, x: m.x + dx / zoom, y: m.y + dy / zoom } : m));
    }
  };

  // ============ CONNECTIONS ============
  const startConnection = (id: string, type: 'stage' | 'message', e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom?.id === id) { setConnectingFrom(null); return; }
    if (connectingFrom) {
      if (connectingFrom.id !== id) {
        const newConn: NodeConnection = {
          id: `conn-${Date.now()}`,
          fromNodeId: connectingFrom.id,
          toNodeId: id,
          fromType: connectingFrom.type,
          toType: type,
          fromAnchor: 'right',
          toAnchor: 'left',
          autoTrigger: false,
          style: 'solid',
          color: '#3b82f6',
        };
        setConnections([...connections, newConn]);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom({ id, type });
    }
  };

  // ============ PRESETS ============
  const applyPreset = (p: Preset) => { 
    setStages(p.stages); 
    setMessageNodes(p.messageNodes);
    setConnections(p.connections); 
    setLabels(p.labels); 
    setPresetPreview(null);
    setHasUnsavedChanges(true);
    // Initialize history
    setHistory([{ stages: p.stages, messageNodes: p.messageNodes, connections: p.connections, labels: p.labels }]);
    setHistoryIndex(0);
    setTimeout(fitView, 100); 
  };

  const getNodeCenter = (id: string, type: 'stage' | 'message', anchor: 'left' | 'right') => {
    if (type === 'stage') {
      const s = stages.find(x => x.id === id);
      if (!s) return { x: 0, y: 0 };
      return { x: anchor === 'right' ? s.x + s.width : s.x, y: s.y + s.height / 2 };
    } else {
      const m = messageNodes.find(x => x.id === id);
      if (!m) return { x: 0, y: 0 };
      return { x: anchor === 'right' ? m.x + m.width : m.x, y: m.y + m.height / 2 };
    }
  };

  const filteredPresets = presetCategory === 'all' ? ALL_PRESETS : ALL_PRESETS.filter(p => p.category === presetCategory);
  const deadCount = leads.filter(l => l.status === 'dead').length;

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden flex">
      {/* LEFT SIDEBAR */}
      <div className="w-96 bg-slate-900/95 border-r border-slate-700 flex flex-col z-40 flex-shrink-0 sidebar">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-slate-800/50">
          <h1 className="text-xl font-bold text-white mb-1">Pipeline Builder</h1>
          <p className="text-sm text-slate-400">Professional CRM System</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'presets', label: 'Presets', icon: '📊' }, 
            { id: 'stages', label: 'Stages', icon: '📦' }, 
            { id: 'messages', label: 'Messages', icon: '✉️' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
          ].map(t => (
            <button key={t.id} onClick={() => setSidebarTab(t.id as any)} 
              className={`flex-1 py-4 text-sm font-semibold transition-all ${sidebarTab === t.id ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
              <span className="block text-lg mb-1">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* PRESETS TAB */}
          {sidebarTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setPresetCategory(c.id)} 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${presetCategory === c.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredPresets.map(p => (
                  <motion.div key={p.id} 
                    onMouseEnter={() => setPresetPreview(p)} 
                    onMouseLeave={() => setPresetPreview(null)}
                    className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden hover:border-blue-500/50 transition-all">
                    <button onClick={() => applyPreset(p)} className="w-full p-5 text-left">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{p.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{p.name}</h3>
                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            p.complexity === 'starter' ? 'bg-green-500/20 text-green-400' : 
                            p.complexity === 'standard' ? 'bg-yellow-500/20 text-yellow-400' : 
                            p.complexity === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {p.complexity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{p.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>📦 {p.stages.length} stages</span>
                        <span>✉️ {p.messageNodes.length} messages</span>
                        <span>⏱️ {p.estimatedSetupTime}</span>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* STAGES TAB */}
          {sidebarTab === 'stages' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Add New Stage</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'New Lead', icon: '📥', color: 'blue' as StageColor, status: 'new' as const },
                  { label: 'Working', icon: '⚙️', color: 'yellow' as StageColor, status: 'working' as const },
                  { label: 'Follow Up', icon: '🔄', color: 'orange' as StageColor, status: 'circle-back' as const },
                  { label: 'Meeting', icon: '📅', color: 'purple' as StageColor, status: 'working' as const },
                  { label: 'Closing', icon: '🎯', color: 'emerald' as StageColor, status: 'approval' as const },
                  { label: 'Won', icon: '🏆', color: 'emerald' as StageColor, status: 'approval' as const },
                ].map(s => (
                  <button key={s.label} onClick={() => {
                    const newStage: PipelineStage = {
                      id: `stage-${Date.now()}`,
                      label: s.label,
                      statusId: s.status,
                      x: 500 + stages.length * 50,
                      y: 300 + stages.length * 30,
                      width: 340,
                      height: 300,
                      color: s.color,
                      icon: s.icon,
                      autoActions: [],
                    };
                    setStages([...stages, newStage]);
                  }} className={`p-4 rounded-xl bg-gradient-to-br ${STAGE_COLORS.find(c => c.id === s.color)?.bg} border border-slate-600 text-left hover:border-white/30 transition-all`}>
                    <span className="text-2xl block mb-2">{s.icon}</span>
                    <span className="text-base font-semibold text-white">{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-base font-bold text-red-400 mb-3">💀 Dead Lead Categories</h4>
                <div className="space-y-2">
                  {DEAD_LEAD_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => {
                      const newStage: PipelineStage = {
                        id: `dead-${cat.id}-${Date.now()}`,
                        label: cat.label,
                        description: cat.description,
                        statusId: 'dead',
                        deadReason: cat.id,
                        x: 50,
                        y: 200 + stages.filter(s => s.statusId === 'dead').length * 320,
                        width: 320,
                        height: 280,
                        color: cat.color,
                        icon: cat.icon,
                        autoActions: [],
                      };
                      setStages([...stages, newStage]);
                    }} className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-left hover:border-red-500/50 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <span className="text-base font-semibold text-white block">{cat.label}</span>
                          <span className="text-sm text-slate-400">{cat.description}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES TAB */}
          {sidebarTab === 'messages' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Message Templates</h3>
              <p className="text-sm text-slate-400 mb-4">Add message nodes and connect them to stages for automated follow-ups.</p>
              
              <div className="space-y-3">
                {[
                  { type: 'email' as const, label: 'Email Template', icon: '✉️', color: 'blue' as StageColor },
                  { type: 'sms' as const, label: 'SMS Template', icon: '💬', color: 'cyan' as StageColor },
                  { type: 'call' as const, label: 'Call Script', icon: '📞', color: 'yellow' as StageColor },
                  { type: 'notification' as const, label: 'Notification', icon: '🔔', color: 'orange' as StageColor },
                  { type: 'wait' as const, label: 'Wait Timer', icon: '⏰', color: 'purple' as StageColor },
                ].map(m => (
                  <button key={m.type} onClick={() => {
                    const newMsg: MessageNode = {
                      id: `msg-${Date.now()}`,
                      type: m.type,
                      label: m.label,
                      icon: m.icon,
                      x: 600 + messageNodes.length * 50,
                      y: 500 + messageNodes.length * 30,
                      width: 280,
                      height: 200,
                      color: m.color,
                      message: 'Enter your message here...',
                      autoTrigger: false,
                      triggerCondition: 'manual',
                      linkedStageIds: [],
                    };
                    setMessageNodes([...messageNodes, newMsg]);
                  }} className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-left hover:border-blue-500/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${STAGE_COLORS.find(c => c.id === m.color)?.bg} flex items-center justify-center text-2xl`}>
                        {m.icon}
                      </div>
                      <div>
                        <span className="text-base font-semibold text-white block">{m.label}</span>
                        <span className="text-sm text-slate-400">Add to canvas</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {sidebarTab === 'analytics' && analytics && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-4">Pipeline Analytics</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <p className="text-3xl font-bold text-blue-400">{analytics.totalLeads}</p>
                  <p className="text-sm text-blue-300">Total Leads</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <p className="text-3xl font-bold text-emerald-400">{analytics.conversionRate}%</p>
                  <p className="text-sm text-emerald-300">Conversion</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                  <p className="text-3xl font-bold text-red-400">{analytics.deadLeadRate}%</p>
                  <p className="text-sm text-red-300">Dead Rate</p>
                </div>
                <div className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                  <p className="text-3xl font-bold text-yellow-400">{analytics.pendingFollowUps}</p>
                  <p className="text-sm text-yellow-300">Follow-ups</p>
                </div>
              </div>

              {analytics.deadReasonBreakdown.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h4 className="text-base font-bold text-red-400 mb-3">💀 Dead Lead Reasons</h4>
                  <div className="space-y-2">
                    {analytics.deadReasonBreakdown.map(d => (
                      <div key={d.reason} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{d.reason}</span>
                        <span className="text-sm font-medium text-slate-400">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-30 px-6 py-3 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-white">🚀 Visual Pipeline</h1>
              <span className="text-sm text-slate-400">{stages.length} stages • {messageNodes.length} messages</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700">
                <button onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)"
                  className={`px-3 py-2 text-lg transition-all ${historyIndex <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                  ↩️
                </button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)"
                  className={`px-3 py-2 text-lg transition-all ${historyIndex >= history.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                  ↪️
                </button>
              </div>

              {/* Save Button */}
              <button onClick={manualSave} title="Save (Ctrl+S)"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  hasUnsavedChanges 
                    ? 'bg-yellow-500 text-black hover:bg-yellow-400 animate-pulse' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}>
                💾 {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                <button onClick={() => setZoom(z => Math.max(0.15, z - 0.08))} className="text-slate-400 px-2 text-lg hover:text-white">−</button>
                <span className="text-sm text-white font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.2, z + 0.08))} className="text-slate-400 px-2 text-lg hover:text-white">+</button>
              </div>
              
              <button onClick={fitView} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-medium hover:bg-slate-700 transition-all">
                ⊡ Fit
              </button>
              
              {deadCount > 0 && (
                <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-medium">
                  💀 {deadCount}
                </div>
              )}
              
              <button onClick={() => setShowProfilesSidebar(!showProfilesSidebar)} className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-all">
                👤 Profiles
              </button>
            </div>
          </div>
        </header>

        {/* Save Notification */}
        <AnimatePresence>
          {saveNotification && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-500/90 text-white rounded-xl font-medium shadow-lg">
              {saveNotification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Reminder */}
        <AnimatePresence>
          {showSaveReminder && hasUnsavedChanges && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-16 right-6 z-50 p-4 bg-yellow-500/90 text-black rounded-xl shadow-lg max-w-xs">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold">Don't forget to save!</p>
                  <p className="text-sm mt-1">You have unsaved changes.</p>
                  <button onClick={manualSave} className="mt-2 px-4 py-1.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                    💾 Save Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div ref={containerRef} 
          className={`absolute inset-0 ${isDraggingCanvas ? 'cursor-grabbing' : connectingFrom ? 'cursor-crosshair' : 'cursor-grab'}`}
          onMouseDown={handleCanvasMouseDown} 
          onMouseMove={handleCanvasMouseMove} 
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => { handleCanvasMouseUp(); setConnectingFrom(null); }} 
          onWheel={handleWheel}>
          <div ref={canvasRef} className="absolute" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '8000px', height: '6000px' }}>
            
            {/* Labels */}
            {labels.map(l => (
              <div key={l.id} className="label-node absolute select-none" style={{ left: l.x, top: l.y }}>
                <div className="px-4 py-2 rounded-lg font-bold" style={{ fontSize: l.fontSize, color: l.color, backgroundColor: l.bgColor || 'transparent' }}>
                  {l.text}
                </div>
              </div>
            ))}

            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {connections.map(c => {
                const from = getNodeCenter(c.fromNodeId, c.fromType, 'right');
                const to = getNodeCenter(c.toNodeId, c.toType, 'left');
                const mx = (from.x + to.x) / 2;
                return (
                  <g key={c.id}>
                    <path d={`M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`} 
                      fill="none" stroke={c.color} strokeWidth={3} strokeDasharray={c.style === 'dashed' ? '8 4' : 'none'} opacity={0.8} />
                    <circle cx={to.x - 8} cy={to.y} r={4} fill={c.color} />
                    {c.triggerDelay && (
                      <g>
                        <rect x={mx - 40} y={(from.y + to.y) / 2 - 12} width={80} height={24} rx={4} fill="#1e293b" stroke="#475569" />
                        <text x={mx} y={(from.y + to.y) / 2 + 4} fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="500">
                          ⏱️ {c.triggerDelay.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              {connectingFrom && (() => {
                const from = getNodeCenter(connectingFrom.id, connectingFrom.type, 'right');
                return <line x1={from.x} y1={from.y} x2={mousePos.x} y2={mousePos.y} stroke="#fbbf24" strokeWidth={3} strokeDasharray="6 4" />;
              })()}
            </svg>

            {/* Stage Nodes */}
            {stages.map(stage => (
              <StageNode 
                key={stage.id} 
                stage={stage} 
                leads={getStageLeads(stage)} 
                isSelected={selectedNode === stage.id && selectedNodeType === 'stage'}
                isConnecting={connectingFrom?.id === stage.id}
                isDropTarget={!!draggedLead}
                zoom={zoom}
                onSelect={() => { setSelectedNode(stage.id); setSelectedNodeType('stage'); }}
                onMove={(dx, dy) => handleNodeMove(stage.id, 'stage', dx, dy)}
                onDelete={() => { setStages(stages.filter(s => s.id !== stage.id)); setConnections(connections.filter(c => c.fromNodeId !== stage.id && c.toNodeId !== stage.id)); }}
                onConnect={(e) => startConnection(stage.id, 'stage', e)}
                onDrop={() => handleDropOnStage(stage.id)}
                onDragLead={setDraggedLead}
                onViewLead={onViewDetails}
                onToggleStar={onToggleStar}
                starredLeads={starredLeads}
              />
            ))}

            {/* Message Nodes */}
            {messageNodes.map(msg => (
              <MessageNodeComponent
                key={msg.id}
                node={msg}
                isSelected={selectedNode === msg.id && selectedNodeType === 'message'}
                isConnecting={connectingFrom?.id === msg.id}
                zoom={zoom}
                onSelect={() => { setSelectedNode(msg.id); setSelectedNodeType('message'); }}
                onMove={(dx, dy) => handleNodeMove(msg.id, 'message', dx, dy)}
                onDelete={() => { setMessageNodes(messageNodes.filter(m => m.id !== msg.id)); setConnections(connections.filter(c => c.fromNodeId !== msg.id && c.toNodeId !== msg.id)); }}
                onConnect={(e) => startConnection(msg.id, 'message', e)}
              />
            ))}
          </div>
        </div>

        {/* Connection Helper */}
        {connectingFrom && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400 text-base font-medium">
            🔗 Click another node to connect
          </div>
        )}
      </div>

      {/* PROFILES SIDEBAR */}
      <AnimatePresence>
        {showProfilesSidebar && (
          <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900/98 border-l border-slate-700 z-50 flex flex-col">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">👤 Profiles</h2>
              <button onClick={() => setShowProfilesSidebar(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {profiles.map(p => (
                <button key={p.id} onClick={() => loadProfile(p.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${activeProfileId === p.id ? 'bg-blue-500/20 border-blue-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                  <span className="text-base font-semibold text-white block">{p.name}</span>
                  <span className="text-sm text-slate-400">{p.stages?.length || 0} stages</span>
                  {activeProfileId === p.id && <span className="text-sm text-blue-400 block mt-1">✓ Active</span>}
                </button>
              ))}
              {profiles.length < MAX_PROFILES && (
                <div className="p-4 rounded-xl border border-dashed border-slate-700">
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                    placeholder="New profile name..." className="w-full bg-transparent text-white text-sm mb-2 outline-none" />
                  <button onClick={() => { if (profileName.trim()) { createProfile(profileName.trim()); setProfileName(''); } }}
                    disabled={!profileName.trim()} className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium disabled:opacity-50 hover:bg-blue-500/30 transition-all">
                    + Create
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ STAGE NODE ============
function StageNode({ stage, leads, isSelected, isConnecting, isDropTarget, zoom, onSelect, onMove, onDelete, onConnect, onDrop, onDragLead, onViewLead, onToggleStar, starredLeads }: any) {
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const color = STAGE_COLORS.find(c => c.id === stage.color) || STAGE_COLORS[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.lead-card, .connect-btn')) return;
    e.stopPropagation();
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onMove(ev.clientX - lastPos.current.x, ev.clientY - lastPos.current.y); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { setDragging(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const headerHeight = 70;
  const maxLeads = 6;

  return (
    <div className="node-card absolute" style={{ left: stage.x, top: stage.y, zIndex: isSelected ? 100 : 1 }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-500" />
      <button onClick={onConnect} className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm transition-all ${isConnecting ? 'bg-yellow-500 border-yellow-400 text-white' : 'bg-blue-500/30 border-blue-400 text-blue-400 hover:bg-blue-500/50'}`}>+</button>
      
      <motion.div onClick={onSelect} onMouseDown={handleMouseDown}
        className={`relative rounded-2xl overflow-hidden backdrop-blur-xl bg-gradient-to-br ${color.bg} border-2 transition-all ${isSelected ? `${color.border} ring-2 ring-blue-500/30` : 'border-slate-600 hover:border-slate-500'} ${isConnecting ? 'ring-2 ring-yellow-400/40' : ''} ${isDropTarget ? 'ring-2 ring-green-400/40' : ''} ${dragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'}`}
        style={{ width: stage.width, height: stage.height }}>
        
        <div className="px-5 py-4 border-b border-slate-600/40 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{stage.icon}</span>
            <div className="min-w-0">
              <span className="text-base font-bold text-white block truncate">{stage.label}</span>
              {stage.description && <span className="text-xs text-slate-400 truncate block">{stage.description}</span>}
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg bg-slate-900/80 ${color.text} text-lg font-bold`}>{leads.length}</div>
        </div>

        <div className="p-3 overflow-hidden" style={{ height: stage.height - headerHeight }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <span className="text-3xl mb-2">📥</span>
              <span className="text-sm">Drop leads here</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {leads.slice(0, maxLeads).map((lead: Lead) => (
                <div key={lead.id} draggable onDragStart={() => onDragLead(lead)} onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-card flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-grab transition-all border border-slate-700/50">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center ${color.text} text-sm font-bold flex-shrink-0`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{lead.formData.fullName}</div>
                    <div className="text-xs text-slate-400 truncate">{lead.formData.phone}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }} className="text-base flex-shrink-0">
                    {starredLeads.has(lead.id) ? '⭐' : '☆'}
                  </button>
                </div>
              ))}
              {leads.length > maxLeads && (
                <div className="col-span-2 text-center text-sm text-slate-500 py-2">+{leads.length - maxLeads} more</div>
              )}
            </div>
          )}
        </div>

        {isSelected && (
          <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30">🗑️ Delete</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============ MESSAGE NODE ============
function MessageNodeComponent({ node, isSelected, isConnecting, zoom, onSelect, onMove, onDelete, onConnect }: any) {
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const color = STAGE_COLORS.find(c => c.id === node.color) || STAGE_COLORS[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.connect-btn')) return;
    e.stopPropagation();
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onMove(ev.clientX - lastPos.current.x, ev.clientY - lastPos.current.y); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { setDragging(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div className="message-node absolute" style={{ left: node.x, top: node.y, zIndex: isSelected ? 100 : 1 }}>
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-500" />
      <button onClick={onConnect} className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm transition-all ${isConnecting ? 'bg-yellow-500 border-yellow-400 text-white' : 'bg-cyan-500/30 border-cyan-400 text-cyan-400 hover:bg-cyan-500/50'}`}>+</button>
      
      <motion.div onClick={onSelect} onMouseDown={handleMouseDown}
        className={`relative rounded-2xl overflow-hidden backdrop-blur-xl bg-gradient-to-br ${color.bg} border-2 transition-all ${isSelected ? `${color.border} ring-2 ring-cyan-500/30` : 'border-slate-600 hover:border-slate-500'} ${isConnecting ? 'ring-2 ring-yellow-400/40' : ''} ${dragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'}`}
        style={{ width: node.width, height: node.height }}>
        
        <div className="px-4 py-3 border-b border-slate-600/40 bg-slate-900/60 flex items-center gap-3">
          <span className="text-xl">{node.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-white block truncate">{node.label}</span>
            <span className="text-xs text-slate-400 uppercase">{node.type}</span>
          </div>
          {node.autoTrigger && (
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">AUTO</span>
          )}
        </div>

        <div className="p-4">
          {node.subject && <p className="text-xs text-slate-400 mb-1">Subject: <span className="text-slate-300">{node.subject}</span></p>}
          <p className="text-sm text-slate-300 line-clamp-3">{node.message}</p>
          {node.triggerDelay && (
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-400">
              <span>⏱️</span>
              <span>Triggers after {node.triggerDelay.label}</span>
            </div>
          )}
        </div>

        {isSelected && (
          <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30">🗑️ Delete</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
