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

// Notification Templates
const NOTIFICATION_TEMPLATES = [
  { id: 'remind-call', name: 'Reminder: Call Lead', icon: '📞', message: 'Time to call {{name}} - {{phone}}' },
  { id: 'remind-followup', name: 'Follow Up Due', icon: '🔔', message: 'Follow up with {{name}} - been {{days}} days' },
  { id: 'remind-meeting', name: 'Meeting Reminder', icon: '📅', message: 'Meeting with {{name}} scheduled' },
  { id: 'sms-intro', name: 'SMS: Introduction', icon: '💬', message: 'Hi {{name}}, this is from My Next Ride. I saw your application and wanted to reach out!' },
  { id: 'sms-followup', name: 'SMS: Follow Up', icon: '💬', message: 'Hey {{name}}, just checking in on your vehicle search. Any questions?' },
  { id: 'sms-urgent', name: 'SMS: Urgent', icon: '⚡', message: '{{name}}, I found something perfect for you! Call me when you can.' },
];

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
  const [showViewOptions, setShowViewOptions] = useState(false);
  
  // Canvas state
  const [zoom, setZoom] = useState(0.65);
  const [pan, setPan] = useState({ x: 100, y: 80 });
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
  const [simpleMode, setSimpleMode] = useState(false);
  
  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState<'presets' | 'custom' | 'notifications'>('presets');
  const [presetPreview, setPresetPreview] = useState<Preset | null>(null);
  const [presetCategory, setPresetCategory] = useState<string>('all');
  
  // Custom node builder
  const [customIcon, setCustomIcon] = useState('⭐');
  const [customColor, setCustomColor] = useState<StageColor>('blue');
  const [customLabel, setCustomLabel] = useState('New Stage');
  const [customType, setCustomType] = useState<'stage' | 'label'>('stage');
  const [labelBgColor, setLabelBgColor] = useState('#1e293b');

  // View options
  const [showTimers, setShowTimers] = useState(true);
  const [compactLeads, setCompactLeads] = useState(false);

  // ============ LOAD/SAVE ============
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActive = localStorage.getItem(ACTIVE_PROFILE_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfiles(parsed);
        if (savedActive) {
          const found = parsed.find((p: WorkspaceProfile) => p.id === savedActive);
          if (found) {
            loadProfileData(found);
            setActiveProfileId(savedActive);
          } else if (parsed.length > 0) {
            loadProfileData(parsed[0]);
            setActiveProfileId(parsed[0].id);
          }
        } else if (parsed.length > 0) {
          loadProfileData(parsed[0]);
          setActiveProfileId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to load profiles', e);
        applyPreset(ALL_PRESETS[0]);
      }
    } else {
      applyPreset(ALL_PRESETS[0]);
    }
  }, []);

  const loadProfileData = (profile: WorkspaceProfile) => {
    setStages(profile.stages || []);
    setConnections(profile.connections || []);
    setLabels(profile.labels || []);
    setEmailTemplates(profile.emailTemplates || DEFAULT_EMAIL_TEMPLATES);
    setZoom(profile.settings?.zoom || 0.65);
    setPan({ x: profile.settings?.panX || 100, y: profile.settings?.panY || 80 });
  };

  const loadProfile = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      loadProfileData(profile);
      setActiveProfileId(id);
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    }
  };

  const saveCurrentProfile = () => {
    if (!activeProfileId) return;
    
    const now = new Date().toISOString();
    const updated = profiles.map(p => 
      p.id === activeProfileId ? {
        ...p,
        updatedAt: now,
        stages, connections, labels, emailTemplates,
        settings: { zoom, panX: pan.x, panY: pan.y, showGrid: true, showConnections: true, defaultStageWidth: 240, defaultStageHeight: 200 }
      } : p
    );
    setProfiles(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const createProfile = (name: string) => {
    if (profiles.length >= MAX_PROFILES) {
      alert(`Maximum ${MAX_PROFILES} profiles. Contact developer for more.`);
      return;
    }
    
    const now = new Date().toISOString();
    const newProfile: WorkspaceProfile = {
      id: `profile-${Date.now()}`,
      name,
      createdAt: now,
      updatedAt: now,
      stages: [], connections: [], labels: [],
      emailTemplates: DEFAULT_EMAIL_TEMPLATES,
      settings: { zoom: 0.65, panX: 100, panY: 80, showGrid: true, showConnections: true, defaultStageWidth: 240, defaultStageHeight: 200 }
    };
    
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    setActiveProfileId(newProfile.id);
    setStages([]);
    setConnections([]);
    setLabels([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(ACTIVE_PROFILE_KEY, newProfile.id);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      alert('Cannot delete the only profile');
      return;
    }
    
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    if (activeProfileId === id && updated.length > 0) {
      loadProfile(updated[0].id);
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

  const getTimeSinceContact = (lead: Lead) => {
    const days = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1d';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    return `${Math.floor(days / 30)}mo`;
  };

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
    
    if (connectingFrom) { setConnectingFrom(null); return; }
    setIsDraggingCanvas(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
    }
    if (!isDraggingCanvas) return;
    setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = () => setIsDraggingCanvas(false);
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.25, Math.min(1.8, z + (e.deltaY > 0 ? -0.06 : 0.06))));
  };

  // ============ FIT VIEW ============
  const fitView = () => {
    if (stages.length === 0) { setZoom(0.65); setPan({ x: 100, y: 80 }); return; }
    
    const xs = stages.map(s => s.x);
    const ys = stages.map(s => s.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const rangeX = maxX - minX + 400;
    const rangeY = maxY - minY + 350;
    
    const cw = containerRef.current?.clientWidth || 1200;
    const ch = containerRef.current?.clientHeight || 800;
    
    const newZoom = Math.min(cw / rangeX, ch / rangeY, 0.9) * 0.8;
    setZoom(Math.max(0.35, Math.min(0.9, newZoom)));
    setPan({ x: cw / 2 - centerX * newZoom, y: ch / 2 - centerY * newZoom + 20 });
  };

  // ============ SIMPLE MODE TOGGLE ============
  const toggleSimpleMode = () => {
    const newMode = !simpleMode;
    setSimpleMode(newMode);
    
    if (newMode) {
      // Rearrange stages in a grid for drag & drop
      const cols = Math.ceil(Math.sqrt(stages.length));
      const spacing = { x: 340, y: 320 };
      setStages(prev => prev.map((s, i) => ({
        ...s,
        x: 100 + (i % cols) * spacing.x,
        y: 100 + Math.floor(i / cols) * spacing.y,
        width: 300,
        height: 280,
      })));
      setTimeout(fitView, 50);
    }
  };

  // ============ STAGES ============
  const handleStageMove = (stageId: string, dx: number, dy: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, x: s.x + dx / zoom, y: s.y + dy / zoom } : s));
  };

  const handleStageResize = (stageId: string, dw: number, dh: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? {
      ...s, width: Math.max(160, Math.min(500, s.width + dw)), height: Math.max(140, Math.min(500, s.height + dh))
    } : s));
  };

  const addStage = () => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: customLabel,
      statusId: 'working',
      x: 400 + stages.length * 30, y: 200 + stages.length * 20,
      width: simpleMode ? 300 : 240, height: simpleMode ? 280 : 200,
      color: customColor, icon: customIcon,
      contactMethods: [], automationSettings: DEFAULT_AUTOMATION,
    };
    setStages([...stages, newStage]);
    setSelectedStage(newStage.id);
  };

  const addLabel = () => {
    setLabels([...labels, {
      id: `label-${Date.now()}`, text: customLabel || 'Section', x: 400, y: 100, fontSize: 18, color: '#fff', bgColor: labelBgColor,
    }]);
  };

  const handleLabelMove = (id: string, dx: number, dy: number) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, x: l.x + dx / zoom, y: l.y + dy / zoom } : l));
  };

  const deleteStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
    setConnections(connections.filter(c => c.fromStageId !== id && c.toStageId !== id));
    if (selectedStage === id) setSelectedStage(null);
  };

  // ============ CONNECTIONS ============
  const startConnection = (stageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom === stageId) { setConnectingFrom(null); }
    else if (connectingFrom) {
      if (!connections.some(c => c.fromStageId === connectingFrom && c.toStageId === stageId) && connectingFrom !== stageId) {
        setConnections([...connections, {
          id: `conn-${Date.now()}`, fromStageId: connectingFrom, toStageId: stageId,
          fromAnchor: 'right', toAnchor: 'left', style: 'solid', color: '#3b82f6',
        }]);
      }
      setConnectingFrom(null);
    } else { setConnectingFrom(stageId); }
  };

  // ============ PRESETS ============
  const applyPreset = (preset: Preset) => {
    setStages(preset.stages);
    setConnections(preset.connections);
    setLabels(preset.labels);
    setEmailTemplates(preset.emailTemplates);
    setPresetPreview(null);
    setTimeout(fitView, 100);
  };

  // ============ NOTIFICATIONS ============
  const sendNotification = (template: typeof NOTIFICATION_TEMPLATES[0], lead?: Lead) => {
    let msg = template.message;
    if (lead) {
      msg = msg.replace('{{name}}', lead.formData.fullName)
               .replace('{{phone}}', lead.formData.phone)
               .replace('{{days}}', getTimeSinceContact(lead));
    }
    alert(`🔔 NOTIFICATION\n\n${template.name}\n\n${msg}\n\n(This is a preview - notifications will be implemented)`);
  };

  // ============ EXPORT ============
  const exportDeadLeads = () => {
    const deadLeads = leads.filter(l => l.status === 'dead');
    if (deadLeads.length === 0) { alert('No dead leads'); return; }
    
    const csv = [
      ['Name', 'Email', 'Phone', 'Vehicle', 'Budget', 'Reason', 'Date'].join(','),
      ...deadLeads.map(l => [
        `"${l.formData.fullName}"`, `"${l.formData.email}"`, `"${l.formData.phone}"`,
        `"${l.formData.vehicleType || ''}"`,
        `"${l.formData.paymentType === 'finance' ? l.formData.financeBudget : l.formData.cashBudget}"`,
        `"${l.deadReason || ''}"`, `"${new Date(l.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dead-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStageCenter = (stage: PipelineStage, anchor: 'left' | 'right') => ({
    x: anchor === 'right' ? stage.x + stage.width : stage.x,
    y: stage.y + stage.height / 2
  });

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const deadCount = leads.filter(l => l.status === 'dead').length;
  const filteredPresets = presetCategory === 'all' ? ALL_PRESETS : ALL_PRESETS.filter(p => p.complexity === presetCategory || p.category === presetCategory);

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden flex">
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col z-40 flex-shrink-0">
        <div className="flex border-b border-slate-800">
          {[{ id: 'presets', label: '📊' }, { id: 'custom', label: '⚡' }, { id: 'notifications', label: '🔔' }].map(tab => (
            <button key={tab.id} onClick={() => setSidebarTab(tab.id as any)}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${sidebarTab === tab.id ? 'text-primary-400 border-b-2 border-primary-400 bg-slate-800/50' : 'text-slate-500'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 scrollbar-custom">
          {sidebarTab === 'presets' && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1 mb-2">
                {['all', 'simple', 'medium', 'advanced', 'post-sale'].map(cat => (
                  <button key={cat} onClick={() => setPresetCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium ${presetCategory === cat ? 'bg-primary-500/30 text-primary-400' : 'bg-slate-800 text-slate-500'}`}>
                    {cat === 'all' ? 'All' : cat === 'post-sale' ? 'Post-Sale' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
              
              {filteredPresets.map(preset => (
                <div key={preset.id} className="relative" onMouseEnter={() => setPresetPreview(preset)} onMouseLeave={() => setPresetPreview(null)}>
                  <button onClick={() => applyPreset(preset)}
                    className="w-full p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-left hover:border-primary-500/50 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{preset.icon}</span>
                      <span className="text-[11px] font-semibold text-white flex-1">{preset.name}</span>
                      <span className={`text-[8px] px-1 py-0.5 rounded ${preset.complexity === 'simple' ? 'bg-green-500/20 text-green-400' : preset.complexity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {preset.stages.length}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">{preset.description}</p>
                  </button>
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'custom' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => setCustomType('stage')} className={`p-2 rounded text-[10px] font-medium ${customType === 'stage' ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>📦 Stage</button>
                <button onClick={() => setCustomType('label')} className={`p-2 rounded text-[10px] font-medium ${customType === 'label' ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>🏷️ Label</button>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-2.5 space-y-2">
                <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Name..." className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs outline-none" />
                
                {customType === 'stage' && (
                  <>
                    <div className="grid grid-cols-8 gap-0.5 max-h-16 overflow-y-auto p-1 bg-slate-900/50 rounded">
                      {EMOJI_BANK.slice(0, 40).map(e => (
                        <button key={e} onClick={() => setCustomIcon(e)} className={`w-5 h-5 rounded text-xs flex items-center justify-center ${customIcon === e ? 'bg-primary-500/30 ring-1 ring-primary-500' : 'hover:bg-slate-700'}`}>{e}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {STAGE_COLORS.slice(0, 6).map(c => (
                        <button key={c.id} onClick={() => setCustomColor(c.id)} className={`h-5 rounded bg-gradient-to-br ${c.bg} border ${customColor === c.id ? c.border : 'border-transparent'}`} />
                      ))}
                    </div>
                  </>
                )}

                {customType === 'label' && (
                  <div className="grid grid-cols-6 gap-1">
                    {['#1e293b', '#0f172a', '#7c3aed', '#0891b2', '#16a34a', '#dc2626'].map(c => (
                      <button key={c} onClick={() => setLabelBgColor(c)} className={`h-5 rounded border ${labelBgColor === c ? 'border-white' : 'border-slate-600'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}

                <button onClick={customType === 'stage' ? addStage : addLabel} className="w-full py-2 rounded bg-primary-500 text-white text-xs font-medium">+ Create</button>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { l: 'New', i: '📥', c: 'blue' as StageColor }, { l: 'Hot', i: '🔥', c: 'orange' as StageColor }, { l: 'Follow Up', i: '📞', c: 'cyan' as StageColor },
                  { l: 'Meeting', i: '📅', c: 'purple' as StageColor }, { l: 'Closing', i: '🎯', c: 'green' as StageColor }, { l: 'Dead', i: '💀', c: 'red' as StageColor },
                ].map(q => (
                  <button key={q.l} onClick={() => { setCustomLabel(q.l); setCustomIcon(q.i); setCustomColor(q.c); setTimeout(addStage, 50); }}
                    className="flex items-center gap-1 p-1.5 rounded bg-slate-800/40 text-[9px] hover:bg-slate-800">
                    <span>{q.i}</span><span className="text-slate-400">{q.l}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sidebarTab === 'notifications' && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 mb-2">Notification & SMS Templates (UI Preview)</p>
              {NOTIFICATION_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => sendNotification(t)}
                  className="w-full p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-left hover:border-yellow-500/50 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{t.icon}</span>
                    <span className="text-[10px] font-medium text-white">{t.name}</span>
                  </div>
                  <p className="text-[9px] text-slate-500">{t.message}</p>
                </button>
              ))}
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[9px] text-yellow-400">
                💡 These templates will integrate with your phone notifications and SMS system when connected.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)', backgroundSize: '35px 35px' }} />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-30 px-3 py-2 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">🚀 Pipeline</h1>
              <span className="text-[9px] text-slate-500">{stages.length} stages • {leads.length} leads</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button onClick={toggleSimpleMode} className={`px-2 py-1 rounded text-[10px] font-medium ${simpleMode ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
                {simpleMode ? '📋 Simple' : '🔗 Nodes'}
              </button>
              
              <div className="flex items-center gap-0.5 bg-slate-800 rounded px-1.5 py-0.5 border border-slate-700">
                <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="text-slate-400 px-1 text-sm">−</button>
                <span className="text-[9px] text-slate-400 w-7 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.8, z + 0.1))} className="text-slate-400 px-1 text-sm">+</button>
              </div>

              <button onClick={fitView} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[9px]">⊡ Fit</button>
              <button onClick={saveCurrentProfile} className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[9px]">💾</button>
              {deadCount > 0 && <button onClick={exportDeadLeads} className="px-2 py-1 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-[9px]">📥 {deadCount}</button>}
              <button onClick={() => setShowViewOptions(!showViewOptions)} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[9px]">⚙️</button>
              <button onClick={() => setShowProfilesSidebar(!showProfilesSidebar)} className="px-2 py-1 rounded bg-primary-500/20 border border-primary-500/50 text-primary-400 text-[9px]">👤</button>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div ref={containerRef} className={`absolute inset-0 ${isDraggingCanvas ? 'cursor-grabbing' : connectingFrom ? 'cursor-crosshair' : 'cursor-grab'}`}
          onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => { handleCanvasMouseUp(); setConnectingFrom(null); }} onWheel={handleWheel}>
          <div ref={canvasRef} className="absolute" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '5000px', height: '4000px' }}>
            
            {/* Labels */}
            {labels.map(l => (
              <LabelNode key={l.id} label={l} zoom={zoom} onMove={handleLabelMove} onDelete={() => setLabels(labels.filter(x => x.id !== l.id))} />
            ))}

            {/* Connections - NO ARROWS, just lines */}
            {!simpleMode && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                {connections.map(c => {
                  const from = stages.find(s => s.id === c.fromStageId);
                  const to = stages.find(s => s.id === c.toStageId);
                  if (!from || !to) return null;
                  const s = getStageCenter(from, 'right'), e = getStageCenter(to, 'left');
                  const mid = (s.x + e.x) / 2;
                  return (
                    <g key={c.id}>
                      <path d={`M ${s.x} ${s.y} C ${mid} ${s.y}, ${mid} ${e.y}, ${e.x} ${e.y}`} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray={c.style === 'dashed' ? '5 3' : 'none'} opacity={0.6} />
                      {c.label && <text x={mid} y={(s.y + e.y) / 2 - 5} fill="#64748b" fontSize="9" textAnchor="middle">{c.label}</text>}
                    </g>
                  );
                })}
                {connectingFrom && (() => {
                  const from = stages.find(s => s.id === connectingFrom);
                  if (!from) return null;
                  const s = getStageCenter(from, 'right');
                  return <line x1={s.x} y1={s.y} x2={mousePos.x} y2={mousePos.y} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 2" />;
                })()}
              </svg>
            )}

            {/* Stages */}
            {stages.map(stage => (
              <StageNode key={stage.id} stage={stage} leads={getStageLeads(stage)} isSelected={selectedStage === stage.id}
                isEditing={editingStage === stage.id} isConnecting={connectingFrom === stage.id} isDropTarget={!!draggedLead}
                simpleMode={simpleMode} showTimers={showTimers} compactLeads={compactLeads} zoom={zoom}
                getTimeSinceContact={getTimeSinceContact}
                onSelect={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                onEdit={() => setEditingStage(editingStage === stage.id ? null : stage.id)}
                onMove={handleStageMove} onResize={handleStageResize} onDelete={() => deleteStage(stage.id)}
                onConnect={(e) => startConnection(stage.id, e)} onDrop={() => handleDropOnStage(stage.id)}
                onDragLead={setDraggedLead} onViewLead={onViewDetails} onToggleStar={onToggleStar} starredLeads={starredLeads}
                onUpdateStage={(u) => setStages(prev => prev.map(s => s.id === stage.id ? { ...s, ...u } : s))}
                onNotify={(lead) => sendNotification(NOTIFICATION_TEMPLATES[0], lead)}
              />
            ))}
          </div>
        </div>

        {connectingFrom && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded backdrop-blur-sm">
            <p className="text-yellow-400 text-[10px]">🔗 Click another node</p>
          </div>
        )}

        {/* Preset Preview - BIGGER, right next to sidebar */}
        <AnimatePresence>
          {presetPreview && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="absolute left-72 top-14 z-50 w-80 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl ml-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{presetPreview.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{presetPreview.name}</h3>
                  <p className="text-[9px] text-slate-500">{presetPreview.stages.length} stages • {presetPreview.connections.length} connections</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">{presetPreview.description}</p>
              
              {/* Step by step flow */}
              <div className="bg-slate-950 rounded-lg p-2 space-y-1.5">
                {presetPreview.stages.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-4">{i + 1}.</span>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded bg-gradient-to-r ${STAGE_COLORS.find(c => c.id === s.color)?.bg}`}>
                      <span className="text-sm">{s.icon}</span>
                      <span className="text-[10px] text-white font-medium">{s.label}</span>
                    </div>
                    {i < presetPreview.stages.length - 1 && (
                      <span className="text-slate-600 text-[10px]">→</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Options Panel */}
        <AnimatePresence>
          {showViewOptions && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-12 right-2 z-50 w-48 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
              <h4 className="text-[10px] font-medium text-white mb-2">View Options</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Show Timers</span>
                  <button onClick={() => setShowTimers(!showTimers)} className={`w-8 h-4 rounded-full transition ${showTimers ? 'bg-primary-500' : 'bg-slate-700'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition ${showTimers ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Compact Leads</span>
                  <button onClick={() => setCompactLeads(!compactLeads)} className={`w-8 h-4 rounded-full transition ${compactLeads ? 'bg-primary-500' : 'bg-slate-700'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition ${compactLeads ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PROFILES SIDEBAR */}
      <AnimatePresence>
        {showProfilesSidebar && (
          <motion.div initial={{ x: 280 }} animate={{ x: 0 }} exit={{ x: 280 }}
            className="absolute right-0 top-0 bottom-0 w-64 bg-slate-900/98 border-l border-slate-800 z-50 flex flex-col">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold text-white">👤 Profiles ({profiles.length}/{MAX_PROFILES})</h2>
              <button onClick={() => setShowProfilesSidebar(false)} className="text-slate-400 hover:text-white">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {profiles.map(p => (
                <div key={p.id} onClick={() => loadProfile(p.id)}
                  className={`p-2 rounded-lg border cursor-pointer ${activeProfileId === p.id ? 'bg-primary-500/20 border-primary-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white">{p.name}</span>
                    {profiles.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }} className="text-red-400 text-[9px]">×</button>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500">{p.stages?.length || 0} stages</div>
                  {activeProfileId === p.id && <div className="text-[8px] text-primary-400 mt-0.5">✓ Active</div>}
                </div>
              ))}

              {profiles.length < MAX_PROFILES && (
                <div className="p-2 rounded-lg border border-dashed border-slate-700">
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                    placeholder="New profile..." className="w-full bg-transparent text-white text-[10px] mb-1.5 outline-none" />
                  <button onClick={() => { if (profileName.trim()) { createProfile(profileName.trim()); setProfileName(''); } }}
                    disabled={!profileName.trim()} className="w-full py-1 rounded bg-primary-500/20 text-primary-400 text-[9px] disabled:opacity-50">+ Create</button>
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
  const [hover, setHover] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onMove(label.id, ev.clientX - lastPos.current.x, ev.clientY - lastPos.current.y); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div className="label-node absolute cursor-move select-none" style={{ left: label.x, top: label.y }}
      onMouseDown={handleMouseDown} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="px-3 py-1.5 rounded font-bold relative" style={{ fontSize: label.fontSize, color: label.color, backgroundColor: label.bgColor || 'transparent' }}>
        {label.text}
        {hover && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center">×</button>}
      </div>
    </div>
  );
}

// ============ STAGE NODE ============
function StageNode({ stage, leads, isSelected, isEditing, isConnecting, isDropTarget, simpleMode, showTimers, compactLeads, zoom, getTimeSinceContact, onSelect, onEdit, onMove, onResize, onDelete, onConnect, onDrop, onDragLead, onViewLead, onToggleStar, starredLeads, onUpdateStage, onNotify }: any) {
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const color = STAGE_COLORS.find(c => c.id === stage.color) || STAGE_COLORS[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.lead-card, .resize-handle, .edit-panel, .connect-btn')) return;
    e.stopPropagation();
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onMove(stage.id, ev.clientX - lastPos.current.x, ev.clientY - lastPos.current.y); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { setDragging(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onResize(stage.id, (ev.clientX - lastPos.current.x) / zoom, (ev.clientY - lastPos.current.y) / zoom); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const leadHeight = compactLeads ? 32 : 40;
  const visibleLeads = Math.floor((stage.height - 55) / leadHeight);

  return (
    <div className="stage-node absolute" style={{ left: stage.x, top: stage.y, zIndex: isSelected ? 100 : 1 }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      {!simpleMode && (
        <>
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-700 border border-slate-600" />
          <button onClick={onConnect} className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${isConnecting ? 'bg-yellow-500 border-yellow-400 text-white' : 'bg-primary-500/30 border-primary-400/60 text-primary-400 hover:bg-primary-500/50'}`}>+</button>
        </>
      )}
      
      <motion.div onClick={onSelect} onMouseDown={handleMouseDown} onDoubleClick={onEdit}
        className={`relative rounded-xl overflow-hidden backdrop-blur-xl bg-gradient-to-br ${color.bg} border-2 ${isSelected ? `${color.border} ring-2 ring-${stage.color}-500/20` : 'border-slate-700/60 hover:border-slate-600'} ${isConnecting ? 'ring-2 ring-yellow-400/40' : ''} ${isDropTarget ? 'ring-2 ring-green-400/40' : ''} ${dragging ? 'cursor-grabbing shadow-xl' : 'cursor-grab'}`}
        style={{ width: stage.width, height: stage.height }}>
        
        <div className="px-2.5 py-1.5 border-b border-slate-700/40 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base">{stage.icon}</span>
            <span className="text-[11px] font-bold text-white truncate">{stage.label}</span>
          </div>
          <div className={`px-1.5 py-0.5 rounded bg-slate-900/80 ${color.text} text-[11px] font-bold`}>{leads.length}</div>
        </div>

        <div className="p-1.5 overflow-hidden" style={{ height: stage.height - 45 }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="text-2xl mb-1">📥</div>
              <div className="text-[9px]">Drop leads</div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {leads.slice(0, visibleLeads).map((lead: Lead) => (
                <div key={lead.id} draggable onDragStart={() => onDragLead(lead)} onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-card flex items-center gap-1.5 p-1.5 rounded bg-slate-800/70 hover:bg-slate-800 cursor-grab transition-all"
                  style={{ height: leadHeight }}>
                  <div className={`w-5 h-5 rounded bg-gradient-to-br ${color.bg} flex items-center justify-center ${color.text} text-[8px] font-bold flex-shrink-0`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-white font-medium truncate">{lead.formData.fullName}</div>
                    {!compactLeads && <div className="text-[8px] text-slate-500 truncate">{lead.formData.phone}</div>}
                  </div>
                  {showTimers && <span className="text-[8px] text-slate-500 flex-shrink-0">{getTimeSinceContact(lead)}</span>}
                  <button onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }} className="text-[10px] flex-shrink-0">{starredLeads.has(lead.id) ? '⭐' : '☆'}</button>
                  <button onClick={(e) => { e.stopPropagation(); onNotify(lead); }} className="text-[10px] flex-shrink-0">🔔</button>
                </div>
              ))}
              {leads.length > visibleLeads && <div className="text-center text-[8px] text-slate-500">+{leads.length - visibleLeads} more</div>}
            </div>
          )}
        </div>

        <div className="resize-handle absolute bottom-0.5 right-0.5 w-3 h-3 cursor-se-resize opacity-30 hover:opacity-100" onMouseDown={handleResize}>
          <svg className="w-full h-full text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22Z" /></svg>
        </div>

        {isSelected && (
          <div className="absolute -top-7 left-0 right-0 flex items-center justify-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-1.5 py-0.5 rounded bg-slate-800 text-white text-[8px]">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[8px]">🗑️</button>
          </div>
        )}
      </motion.div>

      {isEditing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="edit-panel absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg p-2.5 z-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <input value={stage.label} onChange={(e) => onUpdateStage({ label: e.target.value })} className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[10px]" />
            <div className="grid grid-cols-6 gap-1">
              {STAGE_COLORS.slice(0, 6).map(c => (
                <button key={c.id} onClick={() => onUpdateStage({ color: c.id })} className={`h-4 rounded bg-gradient-to-br ${c.bg} border ${stage.color === c.id ? c.border : 'border-transparent'}`} />
              ))}
            </div>
            <select value={stage.followUpMethod || ''} onChange={(e) => onUpdateStage({ followUpMethod: e.target.value || undefined })} className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[9px]">
              <option value="">No follow-up</option>
              {FOLLOW_UP_METHODS.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <select value={stage.meetingType || ''} onChange={(e) => onUpdateStage({ meetingType: e.target.value || undefined })} className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[9px]">
              <option value="">No meeting</option>
              {MEETING_TYPES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}
