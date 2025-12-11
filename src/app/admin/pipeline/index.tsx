'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';
import { 
  PipelineStage, NodeConnection, TextLabel, WorkspaceProfile, EmailTemplate,
  STAGE_COLORS, DEFAULT_AUTOMATION, DEFAULT_EMAIL_TEMPLATES,
  MAX_PROFILES, STORAGE_KEY, ACTIVE_PROFILE_KEY, MEETING_TYPES, FOLLOW_UP_METHODS, EMOJI_BANK, StageColor
} from './types';
import { ALL_PRESETS, Preset } from './presets';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Workspace state
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showProfilesSidebar, setShowProfilesSidebar] = useState(false);
  const [profileName, setProfileName] = useState('');
  
  // Canvas state
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  // Pipeline state
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [labels, setLabels] = useState<TextLabel[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
  
  // UI state
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState<'presets' | 'custom' | 'templates'>('presets');
  const [presetPreview, setPresetPreview] = useState<Preset | null>(null);
  
  // Custom node builder state
  const [customIcon, setCustomIcon] = useState('⭐');
  const [customColor, setCustomColor] = useState<StageColor>('blue');
  const [customLabel, setCustomLabel] = useState('New Stage');
  const [customType, setCustomType] = useState<'stage' | 'label'>('stage');

  // ============ LOAD/SAVE ============
  useEffect(() => {
    const savedProfiles = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      setProfiles(parsed);
      
      if (savedActiveId && parsed.find((p: WorkspaceProfile) => p.id === savedActiveId)) {
        loadProfile(savedActiveId, parsed);
      } else if (parsed.length > 0) {
        loadProfile(parsed[0].id, parsed);
      }
    } else {
      // Load default preset
      applyPreset(ALL_PRESETS[0]);
    }
  }, []);

  const loadProfile = (id: string, profileList?: WorkspaceProfile[]) => {
    const list = profileList || profiles;
    const profile = list.find(p => p.id === id);
    if (profile) {
      setStages(profile.stages);
      setConnections(profile.connections);
      setLabels(profile.labels);
      setEmailTemplates(profile.emailTemplates || DEFAULT_EMAIL_TEMPLATES);
      setZoom(profile.settings.zoom);
      setPan({ x: profile.settings.panX, y: profile.settings.panY });
      setActiveProfileId(id);
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    }
  };

  const saveProfile = (name?: string) => {
    const now = new Date().toISOString();
    
    if (activeProfileId) {
      const updated = profiles.map(p => 
        p.id === activeProfileId ? {
          ...p,
          updatedAt: now,
          stages, connections, labels, emailTemplates,
          settings: { zoom, panX: pan.x, panY: pan.y, showGrid: true, showConnections: true, defaultStageWidth: 280, defaultStageHeight: 240 }
        } : p
      );
      setProfiles(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else if (name) {
      if (profiles.length >= MAX_PROFILES) {
        alert(`Maximum ${MAX_PROFILES} profiles reached. Contact developer to increase limit.`);
        return;
      }
      
      const newProfile: WorkspaceProfile = {
        id: `profile-${Date.now()}`,
        name,
        createdAt: now,
        updatedAt: now,
        stages, connections, labels, emailTemplates,
        settings: { zoom, panX: pan.x, panY: pan.y, showGrid: true, showConnections: true, defaultStageWidth: 280, defaultStageHeight: 240 }
      };
      
      const updated = [...profiles, newProfile];
      setProfiles(updated);
      setActiveProfileId(newProfile.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(ACTIVE_PROFILE_KEY, newProfile.id);
    }
  };

  const deleteProfile = (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    if (activeProfileId === id) {
      if (updated.length > 0) {
        loadProfile(updated[0].id, updated);
      } else {
        setActiveProfileId(null);
        setStages([]);
        setConnections([]);
        setLabels([]);
      }
    }
  };

  // ============ LEADS ============
  const getStageLeads = useCallback((stage: PipelineStage) => {
    if (stage.statusId === 'dead') {
      return stage.deadReason 
        ? leads.filter(l => l.status === 'dead' && l.deadReason === stage.deadReason)
        : leads.filter(l => l.status === 'dead');
    }
    return leads.filter(l => l.status === stage.statusId);
  }, [leads]);

  const handleDropOnStage = (stageId: string) => {
    if (!draggedLead) return;
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    if (stage.statusId === 'dead' && stage.deadReason) {
      onStatusChange(draggedLead.id, 'dead', stage.deadReason);
    } else {
      onStatusChange(draggedLead.id, stage.statusId as LeadStatus);
    }
    setDraggedLead(null);
  };

  // ============ CANVAS ============
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.stage-node') || (e.target as HTMLElement).closest('.sidebar')) return;
    
    if (connectingFrom) {
      // Cancel connection if clicking empty space
      setConnectingFrom(null);
      return;
    }
    
    setIsDraggingCanvas(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // Track mouse for connection line
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom
      });
    }
    
    if (!isDraggingCanvas) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = () => setIsDraggingCanvas(false);
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
  };

  // ============ FIT VIEW ============
  const fitView = () => {
    if (stages.length === 0) {
      setZoom(0.75);
      setPan({ x: 50, y: 50 });
      return;
    }

    // Find bounds of all stages
    const xs = stages.map(s => s.x);
    const ys = stages.map(s => s.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // Calculate center
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Calculate needed zoom to fit all
    const rangeX = maxX - minX + 400;
    const rangeY = maxY - minY + 400;
    
    const containerWidth = containerRef.current?.clientWidth || 1200;
    const containerHeight = containerRef.current?.clientHeight || 800;
    
    const zoomX = containerWidth / rangeX;
    const zoomY = containerHeight / rangeY;
    const newZoom = Math.min(zoomX, zoomY, 1.2) * 0.85;
    
    setZoom(Math.max(0.4, Math.min(1.2, newZoom)));
    setPan({
      x: containerWidth / 2 - centerX * newZoom,
      y: containerHeight / 2 - centerY * newZoom + 50
    });
  };

  // ============ STAGES ============
  const handleStageMove = (stageId: string, dx: number, dy: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? {
      ...s,
      x: s.x + dx / zoom,
      y: s.y + dy / zoom,
    } : s));
  };

  const handleStageResize = (stageId: string, dw: number, dh: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? {
      ...s,
      width: Math.max(180, Math.min(450, s.width + dw)),
      height: Math.max(160, Math.min(450, s.height + dh)),
    } : s));
  };

  const addStage = () => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: customLabel,
      statusId: 'working',
      x: 400 + stages.length * 50, 
      y: 200 + stages.length * 30,
      width: 280, 
      height: 240,
      color: customColor,
      icon: customIcon,
      contactMethods: [],
      automationSettings: DEFAULT_AUTOMATION,
    };
    setStages([...stages, newStage]);
    setSelectedStage(newStage.id);
  };

  const addLabel = () => {
    const newLabel: TextLabel = {
      id: `label-${Date.now()}`,
      text: customLabel || 'Section Title',
      x: 400,
      y: 100,
      fontSize: 20,
      color: '#94a3b8',
    };
    setLabels([...labels, newLabel]);
  };

  const deleteStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
    setConnections(connections.filter(c => c.fromStageId !== id && c.toStageId !== id));
    if (selectedStage === id) setSelectedStage(null);
  };

  // ============ CONNECTIONS ============
  const startConnection = (stageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom === stageId) {
      setConnectingFrom(null);
    } else if (connectingFrom) {
      // Complete connection
      const exists = connections.some(c => c.fromStageId === connectingFrom && c.toStageId === stageId);
      if (!exists && connectingFrom !== stageId) {
        const newConn: NodeConnection = {
          id: `conn-${Date.now()}`,
          fromStageId: connectingFrom,
          toStageId: stageId,
          fromAnchor: 'right',
          toAnchor: 'left',
          style: 'solid',
          color: '#3b82f6',
        };
        setConnections([...connections, newConn]);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(stageId);
    }
  };

  const deleteConnection = (id: string) => {
    setConnections(connections.filter(c => c.id !== id));
  };

  // ============ PRESETS ============
  const applyPreset = (preset: Preset) => {
    setStages(preset.stages);
    setConnections(preset.connections);
    setLabels(preset.labels);
    setEmailTemplates(preset.emailTemplates);
    setPresetPreview(null);
    setTimeout(() => fitView(), 100);
  };

  // ============ RUN NODE ============
  const runNode = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    const stageLeads = getStageLeads(stage);
    alert(`🚀 Running automation for "${stage.label}"\n\n${stageLeads.length} leads will be processed.\n\nAutomation: ${stage.followUpMethod || 'None configured'}\nEmail Template: ${stage.emailTemplateId || 'None'}`);
  };

  // ============ EXPORT ============
  const exportDeadLeads = () => {
    const deadLeads = leads.filter(l => l.status === 'dead');
    if (deadLeads.length === 0) { alert('No dead leads'); return; }
    
    const headers = ['Name', 'Email', 'Phone', 'Vehicle', 'Budget', 'Reason', 'Date'];
    const rows = deadLeads.map(l => [
      l.formData.fullName,
      l.formData.email,
      l.formData.phone,
      l.formData.vehicleType || '',
      l.formData.paymentType === 'finance' ? l.formData.financeBudget : l.formData.cashBudget,
      l.deadReason || '',
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dead-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get stage position for connection
  const getStageCenter = (stage: PipelineStage, anchor: 'left' | 'right') => {
    const x = anchor === 'right' ? stage.x + stage.width : stage.x;
    const y = stage.y + stage.height / 2;
    return { x, y };
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const deadCount = leads.filter(l => l.status === 'dead').length;

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden flex">
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col z-40 flex-shrink-0">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { id: 'presets', label: '📊 Presets' },
            { id: 'custom', label: '⚡ Custom' },
            { id: 'templates', label: '✉️ Templates' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id as any)}
              className={`flex-1 py-3 text-xs font-medium transition-all ${
                sidebarTab === tab.id 
                  ? 'text-primary-400 border-b-2 border-primary-400 bg-slate-800/50' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-custom">
          {sidebarTab === 'presets' && (
            <div className="space-y-2">
              {ALL_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className="relative"
                  onMouseEnter={() => setPresetPreview(preset)}
                  onMouseLeave={() => setPresetPreview(null)}
                >
                  <button
                    onClick={() => applyPreset(preset)}
                    className="w-full p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-left hover:border-primary-500/50 hover:bg-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{preset.icon}</span>
                      <span className="text-sm font-semibold text-white">{preset.name}</span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                        preset.complexity === 'simple' ? 'bg-green-500/20 text-green-400' :
                        preset.complexity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {preset.complexity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{preset.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                      <span>{preset.stages.length} stages</span>
                      <span>•</span>
                      <span>{preset.connections.length} connections</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'custom' && (
            <div className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Create Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCustomType('stage')}
                    className={`p-3 rounded-lg text-xs font-medium transition-all ${
                      customType === 'stage' 
                        ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    📦 Stage Node
                  </button>
                  <button
                    onClick={() => setCustomType('label')}
                    className={`p-3 rounded-lg text-xs font-medium transition-all ${
                      customType === 'label' 
                        ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    🏷️ Text Label
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">
                  {customType === 'stage' ? 'Stage Name' : 'Label Text'}
                </label>
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder={customType === 'stage' ? 'e.g., Hot Leads' : 'e.g., Dead Leads Section'}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-primary-500 outline-none"
                />
              </div>

              {customType === 'stage' && (
                <>
                  {/* Icon */}
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Icon</label>
                    <div className="grid grid-cols-10 gap-1 max-h-28 overflow-y-auto p-1 bg-slate-800/50 rounded-lg">
                      {EMOJI_BANK.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setCustomIcon(emoji)}
                          className={`w-7 h-7 rounded flex items-center justify-center text-sm hover:bg-slate-700 transition-all ${
                            customIcon === emoji ? 'bg-primary-500/30 ring-1 ring-primary-500' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Color</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {STAGE_COLORS.slice(0, 6).map(c => (
                        <button
                          key={c.id}
                          onClick={() => setCustomColor(c.id)}
                          className={`h-8 rounded-lg bg-gradient-to-br ${c.bg} border-2 transition-all ${
                            customColor === c.id ? `${c.border} scale-110` : 'border-transparent hover:scale-105'
                          }`}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Create button */}
              <button
                onClick={customType === 'stage' ? addStage : addLabel}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm hover:from-primary-400 hover:to-primary-500 transition-all shadow-lg shadow-primary-500/20"
              >
                + Create {customType === 'stage' ? 'Stage' : 'Label'}
              </button>

              {/* Quick presets */}
              <div className="pt-4 border-t border-slate-800">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Quick Add</label>
                <div className="space-y-1.5">
                  {[
                    { label: 'New Leads', icon: '📥', color: 'blue' as StageColor },
                    { label: 'Hot Leads', icon: '🔥', color: 'orange' as StageColor },
                    { label: 'Follow Up', icon: '📞', color: 'cyan' as StageColor },
                    { label: 'Qualified', icon: '✅', color: 'green' as StageColor },
                    { label: 'Meeting Set', icon: '📅', color: 'purple' as StageColor },
                    { label: 'Dead Leads', icon: '💀', color: 'red' as StageColor },
                  ].map(q => (
                    <button
                      key={q.label}
                      onClick={() => {
                        setCustomLabel(q.label);
                        setCustomIcon(q.icon);
                        setCustomColor(q.color);
                        setCustomType('stage');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-left transition-all text-xs"
                    >
                      <span>{q.icon}</span>
                      <span className="text-slate-300">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sidebarTab === 'templates' && (
            <div className="space-y-2">
              {emailTemplates.map(template => (
                <div key={template.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">
                      {template.category === 'welcome' ? '👋' : 
                       template.category === 'follow-up' ? '🔄' : 
                       template.category === 'closing' ? '🎯' : 
                       template.category === 're-engagement' ? '🔁' : '✉️'}
                    </span>
                    <span className="text-xs font-medium text-white">{template.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-1">{template.subject}</p>
                  <div className="text-[10px] text-slate-600 line-clamp-2 bg-slate-900/50 p-1.5 rounded">
                    {template.body.slice(0, 80)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 relative">
        {/* Grid */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-30 px-4 py-3 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">🚀</span>
                Pipeline
              </h1>
              <span className="text-xs text-slate-500">
                {stages.length} stages • {connections.length} connections • {leads.length} leads
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom */}
              <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg px-2 py-1.5 border border-slate-700/50">
                <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="text-slate-400 hover:text-white px-1">−</button>
                <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} className="text-slate-400 hover:text-white px-1">+</button>
              </div>

              <button onClick={fitView} className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/50 text-slate-400 hover:text-white text-xs">
                ⊡ Fit
              </button>

              <button onClick={() => activeProfileId ? saveProfile() : setShowProfilesSidebar(true)} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium">
                💾 Save
              </button>

              {deadCount > 0 && (
                <button onClick={exportDeadLeads} className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 text-xs">
                  📥 Export ({deadCount})
                </button>
              )}

              <button onClick={() => setShowProfilesSidebar(!showProfilesSidebar)} className="px-3 py-1.5 rounded-lg bg-primary-500/20 border border-primary-500/50 text-primary-400 hover:bg-primary-500/30 text-xs font-medium">
                👤 Profiles
              </button>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div
          ref={containerRef}
          className={`absolute inset-0 ${isDraggingCanvas ? 'cursor-grabbing' : connectingFrom ? 'cursor-crosshair' : 'cursor-grab'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => { handleCanvasMouseUp(); setConnectingFrom(null); }}
          onWheel={handleWheel}
        >
          <div
            ref={canvasRef}
            className="absolute"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '4000px',
              height: '3000px',
            }}
          >
            {/* Labels */}
            {labels.map(label => (
              <div
                key={label.id}
                className="absolute pointer-events-none select-none font-bold"
                style={{ 
                  left: label.x, 
                  top: label.y, 
                  fontSize: label.fontSize, 
                  color: label.color,
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                {label.text}
              </div>
            ))}

            {/* Connection Lines SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                  <polygon points="0 0, 10 4, 0 8" fill="#3b82f6" />
                </marker>
                <marker id="arrow-yellow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                  <polygon points="0 0, 10 4, 0 8" fill="#fbbf24" />
                </marker>
              </defs>
              
              {/* Existing connections */}
              {connections.map(conn => {
                const from = stages.find(s => s.id === conn.fromStageId);
                const to = stages.find(s => s.id === conn.toStageId);
                if (!from || !to) return null;
                
                const start = getStageCenter(from, 'right');
                const end = getStageCenter(to, 'left');
                const midX = (start.x + end.x) / 2;
                
                const isSelected = selectedStage === conn.fromStageId || selectedStage === conn.toStageId;
                
                return (
                  <g key={conn.id}>
                    <path
                      d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`}
                      fill="none"
                      stroke={isSelected ? '#60a5fa' : '#3b82f6'}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray={conn.style === 'dashed' ? '8 4' : 'none'}
                      markerEnd="url(#arrow)"
                      opacity={isSelected ? 1 : 0.8}
                    />
                    {conn.label && (
                      <text
                        x={midX}
                        y={(start.y + end.y) / 2 - 8}
                        fill="#94a3b8"
                        fontSize="11"
                        fontWeight="500"
                        textAnchor="middle"
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Active connection line (while connecting) */}
              {connectingFrom && (
                <line
                  x1={getStageCenter(stages.find(s => s.id === connectingFrom)!, 'right').x}
                  y1={getStageCenter(stages.find(s => s.id === connectingFrom)!, 'right').y}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  markerEnd="url(#arrow-yellow)"
                />
              )}
            </svg>

            {/* Stage Nodes */}
            {stages.map(stage => (
              <StageNode
                key={stage.id}
                stage={stage}
                leads={getStageLeads(stage)}
                isSelected={selectedStage === stage.id}
                isEditing={editingStage === stage.id}
                isConnecting={connectingFrom === stage.id}
                isDropTarget={!!draggedLead}
                zoom={zoom}
                emailTemplates={emailTemplates}
                onSelect={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                onEdit={() => setEditingStage(editingStage === stage.id ? null : stage.id)}
                onMove={handleStageMove}
                onResize={handleStageResize}
                onDelete={() => deleteStage(stage.id)}
                onConnect={(e) => startConnection(stage.id, e)}
                onDrop={() => handleDropOnStage(stage.id)}
                onDragLead={setDraggedLead}
                onViewLead={onViewDetails}
                onToggleStar={onToggleStar}
                starredLeads={starredLeads}
                onUpdateStage={(updates) => setStages(prev => prev.map(s => s.id === stage.id ? { ...s, ...updates } : s))}
                onRun={() => runNode(stage.id)}
              />
            ))}
          </div>
        </div>

        {/* Connection helper */}
        {connectingFrom && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-xl backdrop-blur-sm">
            <p className="text-yellow-400 text-sm flex items-center gap-2">
              <span className="animate-pulse">🔗</span>
              Click another node to connect, or click empty space to cancel
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 z-30 px-4 py-2 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-slate-500">
              {activeProfile && <span className="text-primary-400">{activeProfile.name}</span>}
              <span>Scroll to zoom</span>
              <span>•</span>
              <span>Drag canvas to pan</span>
              <span>•</span>
              <span>Click + to connect nodes</span>
            </div>
          </div>
        </footer>

        {/* Preset Preview Popup */}
        <AnimatePresence>
          {presetPreview && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-80 top-20 z-50 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl ml-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{presetPreview.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{presetPreview.name}</h3>
                  <p className="text-[10px] text-slate-500">{presetPreview.complexity} complexity</p>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 mb-3">{presetPreview.description}</p>
              
              {/* Mini diagram */}
              <div className="bg-slate-950 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-1 flex-wrap">
                  {presetPreview.stages.slice(0, 5).map((s, i) => (
                    <div key={s.id} className="flex items-center">
                      <div className={`px-2 py-1 rounded text-[10px] font-medium bg-gradient-to-br ${STAGE_COLORS.find(c => c.id === s.color)?.bg || 'from-slate-600 to-slate-700'}`}>
                        {s.icon} {s.label.slice(0, 8)}
                      </div>
                      {i < Math.min(presetPreview.stages.length - 1, 4) && (
                        <span className="text-slate-600 mx-0.5">→</span>
                      )}
                    </div>
                  ))}
                  {presetPreview.stages.length > 5 && (
                    <span className="text-[10px] text-slate-500">+{presetPreview.stages.length - 5}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-800/50 rounded p-2">
                  <span className="text-slate-500">Stages:</span>
                  <span className="text-white ml-1">{presetPreview.stages.length}</span>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <span className="text-slate-500">Connections:</span>
                  <span className="text-white ml-1">{presetPreview.connections.length}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PROFILES SIDEBAR (Right) */}
      <AnimatePresence>
        {showProfilesSidebar && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900/98 border-l border-slate-800 z-50 flex flex-col"
          >
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-white">👤 Profiles ({profiles.length}/{MAX_PROFILES})</h2>
                <button onClick={() => setShowProfilesSidebar(false)} className="text-slate-400 hover:text-white">×</button>
              </div>
              <p className="text-[10px] text-slate-500">Save pipeline configurations</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeProfileId === profile.id
                      ? 'bg-primary-500/20 border-primary-500/50'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                  onClick={() => loadProfile(profile.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{profile.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                      className="text-red-400 hover:text-red-300 text-[10px]"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {profile.stages.length} stages • {new Date(profile.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}

              {profiles.length < MAX_PROFILES && (
                <div className="p-3 rounded-xl border border-dashed border-slate-700">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="New profile name..."
                    className="w-full bg-transparent text-white text-xs mb-2 outline-none"
                  />
                  <button
                    onClick={() => { if (profileName.trim()) { saveProfile(profileName.trim()); setProfileName(''); } }}
                    disabled={!profileName.trim()}
                    className="w-full py-1.5 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-medium hover:bg-primary-500/30 disabled:opacity-50"
                  >
                    + Create
                  </button>
                </div>
              )}

              {profiles.length >= MAX_PROFILES && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                  <p className="text-[10px] text-yellow-400">Max {MAX_PROFILES} profiles</p>
                  <p className="text-[10px] text-slate-500">Contact developer for more</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ STAGE NODE COMPONENT ============
interface StageNodeProps {
  stage: PipelineStage;
  leads: Lead[];
  isSelected: boolean;
  isEditing: boolean;
  isConnecting: boolean;
  isDropTarget: boolean;
  zoom: number;
  emailTemplates: EmailTemplate[];
  onSelect: () => void;
  onEdit: () => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, dw: number, dh: number) => void;
  onDelete: () => void;
  onConnect: (e: React.MouseEvent) => void;
  onDrop: () => void;
  onDragLead: (lead: Lead | null) => void;
  onViewLead: (lead: Lead) => void;
  onToggleStar: (id: string) => void;
  starredLeads: Set<string>;
  onUpdateStage: (updates: Partial<PipelineStage>) => void;
  onRun: () => void;
}

function StageNode({
  stage, leads, isSelected, isEditing, isConnecting, isDropTarget, zoom, emailTemplates,
  onSelect, onEdit, onMove, onResize, onDelete, onConnect, onDrop, onDragLead, onViewLead, onToggleStar, starredLeads, onUpdateStage, onRun
}: StageNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  const colorConfig = STAGE_COLORS.find(c => c.id === stage.color) || STAGE_COLORS[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.lead-card') || 
        (e.target as HTMLElement).closest('.resize-handle') || 
        (e.target as HTMLElement).closest('.edit-panel') ||
        (e.target as HTMLElement).closest('.connect-btn')) return;
    e.stopPropagation();
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    
    const handleMove = (moveE: MouseEvent) => {
      const dx = moveE.clientX - lastPos.current.x;
      const dy = moveE.clientY - lastPos.current.y;
      onMove(stage.id, dx, dy);
      lastPos.current = { x: moveE.clientX, y: moveE.clientY };
    };
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    lastPos.current = { x: e.clientX, y: e.clientY };
    
    const handleMove = (moveE: MouseEvent) => {
      onResize(stage.id, (moveE.clientX - lastPos.current.x) / zoom, (moveE.clientY - lastPos.current.y) / zoom);
      lastPos.current = { x: moveE.clientX, y: moveE.clientY };
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const visibleLeads = Math.floor((stage.height - 90) / 50);
  const template = emailTemplates.find(t => t.id === stage.emailTemplateId);

  return (
    <div
      className="stage-node absolute"
      style={{ left: stage.x, top: stage.y, zIndex: isSelected ? 100 : 1 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Left connection point */}
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-700 border border-slate-600" />
      
      <motion.div
        onClick={onSelect}
        onMouseDown={handleMouseDown}
        onDoubleClick={onEdit}
        className={`
          relative rounded-2xl overflow-hidden backdrop-blur-xl
          bg-gradient-to-br ${colorConfig.bg}
          border-2 transition-all duration-150
          ${isSelected ? `${colorConfig.border} ring-2 ring-${stage.color}-500/30` : 'border-slate-700/60 hover:border-slate-600'}
          ${isConnecting ? 'ring-2 ring-yellow-400/50' : ''}
          ${isDropTarget ? 'ring-2 ring-green-400/50' : ''}
          ${isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'}
        `}
        style={{ width: stage.width, height: stage.height }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-700/40 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{stage.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{stage.label}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                {stage.followUpMethod && <span>{FOLLOW_UP_METHODS.find(f => f.id === stage.followUpMethod)?.icon}</span>}
                {stage.meetingType && <span>{MEETING_TYPES.find(m => m.id === stage.meetingType)?.icon}</span>}
                {template && <span title={template.name}>✉️</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onRun(); }} className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center text-xs" title="Run automation">
              ▶
            </button>
            <div className={`px-2 py-1 rounded-lg bg-slate-900/80 ${colorConfig.border} ${colorConfig.text} text-sm font-bold`}>
              {leads.length}
            </div>
          </div>
        </div>

        {/* Leads */}
        <div className="p-2 overflow-hidden" style={{ height: stage.height - 70 }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-3xl mb-1">📥</div>
              <div className="text-[10px] text-slate-500">Drop leads here</div>
            </div>
          ) : (
            <div className="space-y-1">
              {leads.slice(0, visibleLeads).map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => onDragLead(lead)}
                  onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-card flex items-center gap-2 p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-slate-700"
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colorConfig.bg} ${colorConfig.border} flex items-center justify-center ${colorConfig.text} text-[10px] font-bold flex-shrink-0`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white font-medium truncate">{lead.formData.fullName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{lead.formData.phone}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }}
                    className="text-sm flex-shrink-0"
                  >
                    {starredLeads.has(lead.id) ? '⭐' : '☆'}
                  </button>
                </div>
              ))}
              {leads.length > visibleLeads && (
                <div className="text-center text-[10px] text-slate-500 py-1">+{leads.length - visibleLeads} more</div>
              )}
            </div>
          )}
        </div>

        {/* Right connection button */}
        <button
          onClick={onConnect}
          className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
            isConnecting
              ? 'bg-yellow-500 border-yellow-400 text-white scale-110'
              : 'bg-primary-500/30 border-primary-400/60 text-primary-400 hover:bg-primary-500/50 hover:scale-110'
          }`}
        >
          +
        </button>

        {/* Resize Handle */}
        <div
          className="resize-handle absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-40 hover:opacity-100"
          onMouseDown={handleResize}
        >
          <svg className="w-full h-full text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22Z" />
          </svg>
        </div>

        {/* Controls (when selected) */}
        {isSelected && (
          <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-2 py-1 rounded-lg bg-slate-800 text-white text-[10px] hover:bg-slate-700">✏️ Edit</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] hover:bg-red-500/30">🗑️</button>
          </div>
        )}
      </motion.div>

      {/* Edit Panel */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="edit-panel absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl p-3 z-50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-semibold text-white mb-3">Edit Stage</div>
          
          <div className="space-y-2">
            <input
              value={stage.label}
              onChange={(e) => onUpdateStage({ label: e.target.value })}
              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
              placeholder="Stage name"
            />
            
            <div className="grid grid-cols-6 gap-1">
              {STAGE_COLORS.slice(0, 6).map(c => (
                <button
                  key={c.id}
                  onClick={() => onUpdateStage({ color: c.id })}
                  className={`h-6 rounded-lg bg-gradient-to-br ${c.bg} border ${stage.color === c.id ? c.border : 'border-transparent'}`}
                />
              ))}
            </div>
            
            <select
              value={stage.followUpMethod || ''}
              onChange={(e) => onUpdateStage({ followUpMethod: e.target.value as any || undefined })}
              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
            >
              <option value="">No follow-up</option>
              {FOLLOW_UP_METHODS.map(f => (
                <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
              ))}
            </select>
            
            <select
              value={stage.meetingType || ''}
              onChange={(e) => onUpdateStage({ meetingType: e.target.value as any || undefined })}
              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
            >
              <option value="">No meeting</option>
              {MEETING_TYPES.map(m => (
                <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
              ))}
            </select>
            
            <select
              value={stage.emailTemplateId || ''}
              onChange={(e) => onUpdateStage({ emailTemplateId: e.target.value || undefined })}
              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
            >
              <option value="">No template</option>
              {emailTemplates.map(t => (
                <option key={t.id} value={t.id}>✉️ {t.name}</option>
              ))}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}
