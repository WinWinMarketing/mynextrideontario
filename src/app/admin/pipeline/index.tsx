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
  const [zoom, setZoom] = useState(0.7);
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
  const [hideNodes, setHideNodes] = useState(false);
  
  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState<'presets' | 'custom' | 'templates'>('presets');
  const [presetPreview, setPresetPreview] = useState<Preset | null>(null);
  const [presetCategory, setPresetCategory] = useState<string>('all');
  
  // Custom node builder state
  const [customIcon, setCustomIcon] = useState('⭐');
  const [customColor, setCustomColor] = useState<StageColor>('blue');
  const [customLabel, setCustomLabel] = useState('New Stage');
  const [customType, setCustomType] = useState<'stage' | 'label'>('stage');
  const [labelBgColor, setLabelBgColor] = useState('#1e293b');

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
    if ((e.target as HTMLElement).closest('.stage-node') || 
        (e.target as HTMLElement).closest('.label-node') || 
        (e.target as HTMLElement).closest('.sidebar')) return;
    
    if (connectingFrom) {
      setConnectingFrom(null);
      return;
    }
    
    setIsDraggingCanvas(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
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
      setZoom(0.7);
      setPan({ x: 50, y: 50 });
      return;
    }

    const xs = stages.map(s => s.x);
    const ys = stages.map(s => s.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const rangeX = maxX - minX + 500;
    const rangeY = maxY - minY + 400;
    
    const containerWidth = containerRef.current?.clientWidth || 1200;
    const containerHeight = containerRef.current?.clientHeight || 800;
    
    const zoomX = containerWidth / rangeX;
    const zoomY = containerHeight / rangeY;
    const newZoom = Math.min(zoomX, zoomY, 1) * 0.8;
    
    setZoom(Math.max(0.35, Math.min(1, newZoom)));
    setPan({
      x: containerWidth / 2 - centerX * newZoom,
      y: containerHeight / 2 - centerY * newZoom + 30
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
      width: Math.max(160, Math.min(500, s.width + dw)),
      height: Math.max(140, Math.min(500, s.height + dh)),
    } : s));
  };

  const addStage = () => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: customLabel,
      statusId: 'working',
      x: 400 + stages.length * 40, 
      y: 200 + stages.length * 20,
      width: hideNodes ? 320 : 260, 
      height: hideNodes ? 280 : 220,
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
      fontSize: 18,
      color: '#ffffff',
      bgColor: labelBgColor,
    };
    setLabels([...labels, newLabel]);
  };

  const handleLabelMove = (labelId: string, dx: number, dy: number) => {
    setLabels(prev => prev.map(l => l.id === labelId ? {
      ...l,
      x: l.x + dx / zoom,
      y: l.y + dy / zoom,
    } : l));
  };

  const deleteLabel = (id: string) => {
    setLabels(labels.filter(l => l.id !== id));
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
    alert(`🚀 Running automation for "${stage.label}"\n\n${stageLeads.length} leads will be processed.\n\nFollow-up: ${stage.followUpMethod || 'None configured'}\nEmail: ${stage.emailTemplateId || 'None'}`);
  };

  // ============ EXPORT ============
  const exportDeadLeads = () => {
    const deadLeads = leads.filter(l => l.status === 'dead');
    if (deadLeads.length === 0) { alert('No dead leads'); return; }
    
    const headers = ['Name', 'Email', 'Phone', 'Vehicle', 'Budget', 'Reason', 'Date'];
    const rows = deadLeads.map(l => [
      l.formData.fullName, l.formData.email, l.formData.phone,
      l.formData.vehicleType || '',
      l.formData.paymentType === 'finance' ? l.formData.financeBudget : l.formData.cashBudget,
      l.deadReason || '', new Date(l.createdAt).toLocaleDateString(),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dead-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStageCenter = (stage: PipelineStage, anchor: 'left' | 'right') => {
    const x = anchor === 'right' ? stage.x + stage.width : stage.x;
    const y = stage.y + stage.height / 2;
    return { x, y };
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const deadCount = leads.filter(l => l.status === 'dead').length;
  
  // Filter presets by category
  const filteredPresets = presetCategory === 'all' 
    ? ALL_PRESETS 
    : ALL_PRESETS.filter(p => p.complexity === presetCategory || p.category === presetCategory);

  // Calculate sizes based on hideNodes mode
  const nodeWidth = hideNodes ? 320 : 260;
  const nodeHeight = hideNodes ? 300 : 220;

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden flex">
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col z-40 flex-shrink-0">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { id: 'presets', label: '📊 Presets' },
            { id: 'custom', label: '⚡ Custom' },
            { id: 'templates', label: '✉️ Email' },
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
              {/* Category filter */}
              <div className="flex flex-wrap gap-1 mb-3">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'simple', label: 'Simple' },
                  { id: 'medium', label: 'Standard' },
                  { id: 'advanced', label: 'Advanced' },
                  { id: 'post-sale', label: 'Post-Sale' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setPresetCategory(cat.id)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      presetCategory === cat.id 
                        ? 'bg-primary-500/30 text-primary-400' 
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              
              {filteredPresets.map(preset => (
                <div
                  key={preset.id}
                  className="relative"
                  onMouseEnter={() => setPresetPreview(preset)}
                  onMouseLeave={() => setPresetPreview(null)}
                >
                  <button
                    onClick={() => applyPreset(preset)}
                    className="w-full p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-left hover:border-primary-500/50 hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{preset.icon}</span>
                      <span className="text-xs font-semibold text-white flex-1">{preset.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        preset.complexity === 'simple' ? 'bg-green-500/20 text-green-400' :
                        preset.complexity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {preset.stages.length} steps
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{preset.description}</p>
                  </button>
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'custom' && (
            <div className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCustomType('stage')}
                  className={`p-2.5 rounded-lg text-xs font-medium transition-all ${
                    customType === 'stage' 
                      ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  📦 Stage
                </button>
                <button
                  onClick={() => setCustomType('label')}
                  className={`p-2.5 rounded-lg text-xs font-medium transition-all ${
                    customType === 'label' 
                      ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  🏷️ Label
                </button>
              </div>

              {/* Core Features */}
              <div className="bg-slate-800/40 rounded-xl p-3 space-y-3">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Core Settings</label>
                
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder={customType === 'stage' ? 'Stage name...' : 'Label text...'}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-primary-500 outline-none"
                />
                
                {customType === 'stage' && (
                  <>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1.5 block">Icon</label>
                      <div className="grid grid-cols-10 gap-0.5 max-h-20 overflow-y-auto p-1 bg-slate-900/50 rounded-lg">
                        {EMOJI_BANK.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setCustomIcon(emoji)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-sm hover:bg-slate-700 ${
                              customIcon === emoji ? 'bg-primary-500/30 ring-1 ring-primary-500' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 mb-1.5 block">Color</label>
                      <div className="grid grid-cols-6 gap-1">
                        {STAGE_COLORS.slice(0, 6).map(c => (
                          <button
                            key={c.id}
                            onClick={() => setCustomColor(c.id)}
                            className={`h-7 rounded-lg bg-gradient-to-br ${c.bg} border ${
                              customColor === c.id ? c.border + ' scale-105' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {customType === 'label' && (
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1.5 block">Background Color</label>
                    <div className="grid grid-cols-6 gap-1">
                      {['#1e293b', '#0f172a', '#7c3aed', '#0891b2', '#16a34a', '#dc2626'].map(color => (
                        <button
                          key={color}
                          onClick={() => setLabelBgColor(color)}
                          className={`h-7 rounded-lg border ${
                            labelBgColor === color ? 'border-white scale-105' : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={customType === 'stage' ? addStage : addLabel}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm hover:from-primary-400 hover:to-primary-500"
                >
                  + Create {customType === 'stage' ? 'Stage' : 'Label'}
                </button>
              </div>

              {/* Quick Add */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Quick Add Stages</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'New Leads', icon: '📥', color: 'blue' as StageColor },
                    { label: 'Hot Leads', icon: '🔥', color: 'orange' as StageColor },
                    { label: 'Follow Up 1', icon: '📞', color: 'cyan' as StageColor },
                    { label: 'Follow Up 2', icon: '📧', color: 'teal' as StageColor },
                    { label: 'Follow Up 3', icon: '💬', color: 'indigo' as StageColor },
                    { label: 'Follow Up 4', icon: '📱', color: 'purple' as StageColor },
                    { label: 'Meeting', icon: '📅', color: 'purple' as StageColor },
                    { label: 'Closing', icon: '🎯', color: 'green' as StageColor },
                    { label: 'Won!', icon: '🏆', color: 'green' as StageColor },
                    { label: 'Dead', icon: '💀', color: 'red' as StageColor },
                    { label: '1 Week', icon: '📆', color: 'blue' as StageColor },
                    { label: '1 Month', icon: '🗓️', color: 'yellow' as StageColor },
                  ].map(q => (
                    <button
                      key={q.label}
                      onClick={() => {
                        setCustomLabel(q.label);
                        setCustomIcon(q.icon);
                        setCustomColor(q.color);
                        setCustomType('stage');
                        setTimeout(addStage, 50);
                      }}
                      className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-left transition-all text-[10px]"
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
                  <div className="text-[10px] text-slate-600 line-clamp-2 bg-slate-900/50 p-1.5 rounded">
                    {template.body.slice(0, 60)}...
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
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-30 px-4 py-2.5 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-lg">🚀</span>
                Pipeline
              </h1>
              <span className="text-[10px] text-slate-500">
                {stages.length} stages • {leads.length} leads
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Hide Nodes Toggle */}
              <button 
                onClick={() => setHideNodes(!hideNodes)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  hideNodes 
                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' 
                    : 'bg-slate-900/90 border border-slate-700/50 text-slate-400 hover:text-white'
                }`}
              >
                {hideNodes ? '📋 Simple Mode' : '🔗 Node Mode'}
              </button>

              <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg px-2 py-1 border border-slate-700/50">
                <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="text-slate-400 hover:text-white px-1 text-sm">−</button>
                <span className="text-[10px] text-slate-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="text-slate-400 hover:text-white px-1 text-sm">+</button>
              </div>

              <button onClick={fitView} className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/50 text-slate-400 hover:text-white text-[10px]">
                ⊡ Fit
              </button>

              <button onClick={() => activeProfileId ? saveProfile() : setShowProfilesSidebar(true)} className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] font-medium">
                💾 Save
              </button>

              {deadCount > 0 && (
                <button onClick={exportDeadLeads} className="px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[10px]">
                  📥 Export ({deadCount})
                </button>
              )}

              <button onClick={() => setShowProfilesSidebar(!showProfilesSidebar)} className="px-2.5 py-1.5 rounded-lg bg-primary-500/20 border border-primary-500/50 text-primary-400 text-[10px] font-medium">
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
              width: '5000px',
              height: '4000px',
            }}
          >
            {/* Labels */}
            {labels.map(label => (
              <LabelNode
                key={label.id}
                label={label}
                zoom={zoom}
                onMove={handleLabelMove}
                onDelete={() => deleteLabel(label.id)}
              />
            ))}

            {/* Connection Lines */}
            {!hideNodes && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
                  </marker>
                  <marker id="arrow-yellow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#fbbf24" />
                  </marker>
                </defs>
                
                {connections.map(conn => {
                  const from = stages.find(s => s.id === conn.fromStageId);
                  const to = stages.find(s => s.id === conn.toStageId);
                  if (!from || !to) return null;
                  
                  const start = getStageCenter(from, 'right');
                  const end = getStageCenter(to, 'left');
                  const midX = (start.x + end.x) / 2;
                  
                  return (
                    <g key={conn.id}>
                      <path
                        d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray={conn.style === 'dashed' ? '6 3' : 'none'}
                        markerEnd="url(#arrow)"
                        opacity={0.7}
                      />
                      {conn.label && (
                        <text x={midX} y={(start.y + end.y) / 2 - 6} fill="#64748b" fontSize="10" textAnchor="middle">
                          {conn.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {connectingFrom && (
                  <line
                    x1={getStageCenter(stages.find(s => s.id === connectingFrom)!, 'right').x}
                    y1={getStageCenter(stages.find(s => s.id === connectingFrom)!, 'right').y}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    markerEnd="url(#arrow-yellow)"
                  />
                )}
              </svg>
            )}

            {/* Stage Nodes */}
            {stages.map(stage => (
              <StageNode
                key={stage.id}
                stage={{ ...stage, width: hideNodes ? nodeWidth : stage.width, height: hideNodes ? nodeHeight : stage.height }}
                leads={getStageLeads(stage)}
                isSelected={selectedStage === stage.id}
                isEditing={editingStage === stage.id}
                isConnecting={connectingFrom === stage.id}
                isDropTarget={!!draggedLead}
                hideConnections={hideNodes}
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
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-lg backdrop-blur-sm">
            <p className="text-yellow-400 text-xs">🔗 Click another node to connect</p>
          </div>
        )}

        {/* Preset Preview */}
        <AnimatePresence>
          {presetPreview && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-80 top-16 z-50 w-72 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl ml-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{presetPreview.icon}</span>
                <div>
                  <h3 className="text-xs font-bold text-white">{presetPreview.name}</h3>
                  <p className="text-[9px] text-slate-500">{presetPreview.stages.length} stages, {presetPreview.connections.length} connections</p>
                </div>
              </div>
              
              <div className="bg-slate-950 rounded-lg p-2 mb-2">
                <div className="flex items-center gap-1 flex-wrap text-[9px]">
                  {presetPreview.stages.slice(0, 6).map((s, i) => (
                    <div key={s.id} className="flex items-center">
                      <span className={`px-1.5 py-0.5 rounded bg-gradient-to-br ${STAGE_COLORS.find(c => c.id === s.color)?.bg}`}>
                        {s.icon}
                      </span>
                      {i < Math.min(presetPreview.stages.length - 1, 5) && <span className="text-slate-600 mx-0.5">→</span>}
                    </div>
                  ))}
                  {presetPreview.stages.length > 6 && <span className="text-slate-500">+{presetPreview.stages.length - 6}</span>}
                </div>
              </div>

              <p className="text-[10px] text-slate-400">{presetPreview.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PROFILES SIDEBAR */}
      <AnimatePresence>
        {showProfilesSidebar && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-slate-900/98 border-l border-slate-800 z-50 flex flex-col"
          >
            <div className="p-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white">👤 Profiles ({profiles.length}/{MAX_PROFILES})</h2>
                <button onClick={() => setShowProfilesSidebar(false)} className="text-slate-400 hover:text-white">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className={`p-2.5 rounded-lg border cursor-pointer ${
                    activeProfileId === profile.id
                      ? 'bg-primary-500/20 border-primary-500/50'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                  onClick={() => loadProfile(profile.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{profile.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                      className="text-red-400 text-[9px]"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-[9px] text-slate-500">{profile.stages.length} stages</div>
                </div>
              ))}

              {profiles.length < MAX_PROFILES && (
                <div className="p-2.5 rounded-lg border border-dashed border-slate-700">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Profile name..."
                    className="w-full bg-transparent text-white text-xs mb-2 outline-none"
                  />
                  <button
                    onClick={() => { if (profileName.trim()) { saveProfile(profileName.trim()); setProfileName(''); } }}
                    className="w-full py-1 rounded bg-primary-500/20 text-primary-400 text-[10px]"
                  >
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

// ============ LABEL NODE ============
function LabelNode({ label, zoom, onMove, onDelete }: { label: TextLabel; zoom: number; onMove: (id: string, dx: number, dy: number) => void; onDelete: () => void }) {
  const lastPos = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    lastPos.current = { x: e.clientX, y: e.clientY };
    
    const handleMove = (moveE: MouseEvent) => {
      onMove(label.id, moveE.clientX - lastPos.current.x, moveE.clientY - lastPos.current.y);
      lastPos.current = { x: moveE.clientX, y: moveE.clientY };
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div
      className="label-node absolute cursor-move select-none"
      style={{ left: label.x, top: label.y }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="px-4 py-2 rounded-lg font-bold relative"
        style={{ 
          fontSize: label.fontSize, 
          color: label.color,
          backgroundColor: label.bgColor || 'transparent',
        }}
      >
        {label.text}
        {isHovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ============ STAGE NODE ============
interface StageNodeProps {
  stage: PipelineStage;
  leads: Lead[];
  isSelected: boolean;
  isEditing: boolean;
  isConnecting: boolean;
  isDropTarget: boolean;
  hideConnections: boolean;
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
  stage, leads, isSelected, isEditing, isConnecting, isDropTarget, hideConnections, zoom, emailTemplates,
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
      onMove(stage.id, moveE.clientX - lastPos.current.x, moveE.clientY - lastPos.current.y);
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

  const visibleLeads = Math.floor((stage.height - 70) / 44);

  return (
    <div
      className="stage-node absolute"
      style={{ left: stage.x, top: stage.y, zIndex: isSelected ? 100 : 1 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Connection points - only show in node mode */}
      {!hideConnections && (
        <>
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600" />
          <button
            onClick={onConnect}
            className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-all ${
              isConnecting
                ? 'bg-yellow-500 border-yellow-400 text-white scale-110'
                : 'bg-primary-500/30 border-primary-400/60 text-primary-400 hover:bg-primary-500/50'
            }`}
          >
            +
          </button>
        </>
      )}
      
      <motion.div
        onClick={onSelect}
        onMouseDown={handleMouseDown}
        onDoubleClick={onEdit}
        className={`
          relative rounded-2xl overflow-hidden backdrop-blur-xl
          bg-gradient-to-br ${colorConfig.bg}
          border-2 transition-all duration-150
          ${isSelected ? `${colorConfig.border} ring-2 ring-${stage.color}-500/20` : 'border-slate-700/60 hover:border-slate-600'}
          ${isConnecting ? 'ring-2 ring-yellow-400/40' : ''}
          ${isDropTarget ? 'ring-2 ring-green-400/40' : ''}
          ${isDragging ? 'cursor-grabbing shadow-xl' : 'cursor-grab'}
        `}
        style={{ width: stage.width, height: stage.height }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-slate-700/40 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{stage.icon}</span>
            <span className="text-xs font-bold text-white truncate">{stage.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onRun(); }} className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center text-[9px]">
              ▶
            </button>
            <div className={`px-1.5 py-0.5 rounded bg-slate-900/80 ${colorConfig.text} text-xs font-bold`}>
              {leads.length}
            </div>
          </div>
        </div>

        {/* Leads */}
        <div className="p-1.5 overflow-hidden" style={{ height: stage.height - 50 }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl mb-1">📥</div>
              <div className="text-[9px] text-slate-500">Drop leads</div>
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
                  className="lead-card flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 cursor-grab transition-all"
                >
                  <div className={`w-6 h-6 rounded bg-gradient-to-br ${colorConfig.bg} flex items-center justify-center ${colorConfig.text} text-[9px] font-bold flex-shrink-0`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-white font-medium truncate">{lead.formData.fullName}</div>
                    <div className="text-[9px] text-slate-500 truncate">{lead.formData.phone}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }} className="text-xs">
                    {starredLeads.has(lead.id) ? '⭐' : '☆'}
                  </button>
                </div>
              ))}
              {leads.length > visibleLeads && (
                <div className="text-center text-[9px] text-slate-500">+{leads.length - visibleLeads} more</div>
              )}
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div className="resize-handle absolute bottom-0.5 right-0.5 w-3 h-3 cursor-se-resize opacity-30 hover:opacity-100" onMouseDown={handleResize}>
          <svg className="w-full h-full text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22Z" />
          </svg>
        </div>

        {/* Controls */}
        {isSelected && (
          <div className="absolute -top-8 left-0 right-0 flex items-center justify-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-1.5 py-0.5 rounded bg-slate-800 text-white text-[9px]">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px]">🗑️</button>
          </div>
        )}
      </motion.div>

      {/* Edit Panel */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="edit-panel absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 z-50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <input
              value={stage.label}
              onChange={(e) => onUpdateStage({ label: e.target.value })}
              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs"
            />
            <div className="grid grid-cols-6 gap-1">
              {STAGE_COLORS.slice(0, 6).map(c => (
                <button
                  key={c.id}
                  onClick={() => onUpdateStage({ color: c.id })}
                  className={`h-5 rounded bg-gradient-to-br ${c.bg} border ${stage.color === c.id ? c.border : 'border-transparent'}`}
                />
              ))}
            </div>
            <select
              value={stage.followUpMethod || ''}
              onChange={(e) => onUpdateStage({ followUpMethod: e.target.value as any || undefined })}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[10px]"
            >
              <option value="">No follow-up</option>
              {FOLLOW_UP_METHODS.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <select
              value={stage.meetingType || ''}
              onChange={(e) => onUpdateStage({ meetingType: e.target.value as any || undefined })}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[10px]"
            >
              <option value="">No meeting</option>
              {MEETING_TYPES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}
