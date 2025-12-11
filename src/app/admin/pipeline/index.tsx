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
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES, MessageTemplate } from './templates';

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
  
  // Workspace
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showProfilesSidebar, setShowProfilesSidebar] = useState(false);
  const [profileName, setProfileName] = useState('');
  
  // Canvas
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 100, y: 80 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  // Pipeline
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [labels, setLabels] = useState<TextLabel[]>([]);
  
  // UI
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [simpleMode, setSimpleMode] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  
  // Sidebar
  const [sidebarTab, setSidebarTab] = useState<'presets' | 'custom' | 'templates'>('presets');
  const [presetPreview, setPresetPreview] = useState<Preset | null>(null);
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [templateCategory, setTemplateCategory] = useState<string>('email');
  const [templateUseCase, setTemplateUseCase] = useState<string>('all');
  
  // Custom builder
  const [customIcon, setCustomIcon] = useState('⭐');
  const [customColor, setCustomColor] = useState<StageColor>('blue');
  const [customLabel, setCustomLabel] = useState('New Stage');
  const [customType, setCustomType] = useState<'stage' | 'label'>('stage');
  const [customFollowUp, setCustomFollowUp] = useState<string>('');
  const [customMeeting, setCustomMeeting] = useState<string>('');
  const [labelBgColor, setLabelBgColor] = useState('#1e293b');

  // View options
  const [showTimers, setShowTimers] = useState(true);
  const [compactLeads, setCompactLeads] = useState(false);

  // Template viewer
  const [viewingTemplate, setViewingTemplate] = useState<MessageTemplate | null>(null);
  const [stageTemplates, setStageTemplates] = useState<Record<string, string[]>>({});

  // ============ AUTO-SAVE ============
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (activeProfileId && stages.length > 0) {
        const now = new Date().toISOString();
        const updated = profiles.map(p => 
          p.id === activeProfileId ? { ...p, updatedAt: now, stages, connections, labels, settings: { zoom, panX: pan.x, panY: pan.y, showGrid: true, showConnections: true, defaultStageWidth: 220, defaultStageHeight: 190 } } : p
        );
        setProfiles(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log('Auto-saved');
      }
    }, 1000);
  }, [activeProfileId, stages, connections, labels, zoom, pan, profiles]);

  // Auto-save on changes
  useEffect(() => { triggerAutoSave(); }, [stages, connections, labels, triggerAutoSave]);

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

  const loadProfileData = (p: WorkspaceProfile) => {
    setStages(p.stages || []); setConnections(p.connections || []); setLabels(p.labels || []);
    setZoom(p.settings?.zoom || 0.6); setPan({ x: p.settings?.panX || 100, y: p.settings?.panY || 80 });
  };

  const loadProfile = (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (p) { loadProfileData(p); setActiveProfileId(id); localStorage.setItem(ACTIVE_PROFILE_KEY, id); }
  };

  const createProfile = (name: string) => {
    if (profiles.length >= MAX_PROFILES) { alert(`Max ${MAX_PROFILES} profiles. Contact developer.`); return; }
    const now = new Date().toISOString();
    const np: WorkspaceProfile = { id: `profile-${Date.now()}`, name, createdAt: now, updatedAt: now, stages: [], connections: [], labels: [], emailTemplates: DEFAULT_EMAIL_TEMPLATES, settings: { zoom: 0.6, panX: 100, panY: 80, showGrid: true, showConnections: true, defaultStageWidth: 220, defaultStageHeight: 190 } };
    const updated = [...profiles, np];
    setProfiles(updated); setActiveProfileId(np.id); setStages([]); setConnections([]); setLabels([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); localStorage.setItem(ACTIVE_PROFILE_KEY, np.id);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) { alert('Cannot delete only profile'); return; }
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (activeProfileId === id && updated.length > 0) loadProfile(updated[0].id);
  };

  // ============ LEADS ============
  const getStageLeads = useCallback((s: PipelineStage) => {
    if (s.statusId === 'dead') return s.deadReason ? leads.filter(l => l.status === 'dead' && l.deadReason === s.deadReason) : leads.filter(l => l.status === 'dead');
    return leads.filter(l => l.status === s.statusId);
  }, [leads]);

  const getTimeSinceContact = (l: Lead) => {
    const d = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 86400000);
    if (d === 0) return 'Today'; if (d === 1) return '1d'; if (d < 7) return `${d}d`; if (d < 30) return `${Math.floor(d / 7)}w`; return `${Math.floor(d / 30)}mo`;
  };

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
    if ((e.target as HTMLElement).closest('.stage-node, .label-node, .sidebar')) return;
    if (connectingFrom) { setConnectingFrom(null); return; }
    setIsDraggingCanvas(true); lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) { const r = canvasRef.current.getBoundingClientRect(); setMousePos({ x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom }); }
    if (!isDraggingCanvas) return;
    setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = () => setIsDraggingCanvas(false);
  const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); setZoom(z => Math.max(0.25, Math.min(1.6, z + (e.deltaY > 0 ? -0.05 : 0.05)))); };

  const fitView = () => {
    if (stages.length === 0) { setZoom(0.6); setPan({ x: 100, y: 80 }); return; }
    const xs = stages.map(s => s.x), ys = stages.map(s => s.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const rx = Math.max(...xs) - Math.min(...xs) + 400, ry = Math.max(...ys) - Math.min(...ys) + 350;
    const cw = containerRef.current?.clientWidth || 1200, ch = containerRef.current?.clientHeight || 800;
    const nz = Math.min(cw / rx, ch / ry, 0.85) * 0.8;
    setZoom(Math.max(0.35, Math.min(0.85, nz))); setPan({ x: cw / 2 - cx * nz, y: ch / 2 - cy * nz + 20 });
  };

  const toggleSimpleMode = () => {
    const nm = !simpleMode; setSimpleMode(nm);
    if (nm) {
      const cols = Math.ceil(Math.sqrt(stages.length)), sp = { x: 300, y: 280 };
      setStages(prev => prev.map((s, i) => ({ ...s, x: 100 + (i % cols) * sp.x, y: 100 + Math.floor(i / cols) * sp.y, width: 280, height: 250 })));
      setTimeout(fitView, 50);
    }
  };

  // ============ STAGES ============
  const handleStageMove = (id: string, dx: number, dy: number) => setStages(prev => prev.map(s => s.id === id ? { ...s, x: s.x + dx / zoom, y: s.y + dy / zoom } : s));
  const handleStageResize = (id: string, dw: number, dh: number) => setStages(prev => prev.map(s => s.id === id ? { ...s, width: Math.max(160, Math.min(450, s.width + dw)), height: Math.max(140, Math.min(450, s.height + dh)) } : s));

  const addStage = () => {
    const ns: PipelineStage = { id: `stage-${Date.now()}`, label: customLabel, statusId: 'working', x: 400 + stages.length * 30, y: 200 + stages.length * 20, width: simpleMode ? 280 : 220, height: simpleMode ? 250 : 190, color: customColor, icon: customIcon, contactMethods: [], automationSettings: DEFAULT_AUTOMATION, followUpMethod: customFollowUp as any || undefined, meetingType: customMeeting as any || undefined };
    setStages([...stages, ns]); setSelectedStage(ns.id);
  };

  const addLabel = () => setLabels([...labels, { id: `label-${Date.now()}`, text: customLabel || 'Section', x: 400, y: 100, fontSize: 16, color: '#fff', bgColor: labelBgColor }]);
  const handleLabelMove = (id: string, dx: number, dy: number) => setLabels(prev => prev.map(l => l.id === id ? { ...l, x: l.x + dx / zoom, y: l.y + dy / zoom } : l));
  const deleteStage = (id: string) => { setStages(stages.filter(s => s.id !== id)); setConnections(connections.filter(c => c.fromStageId !== id && c.toStageId !== id)); if (selectedStage === id) setSelectedStage(null); };

  // ============ CONNECTIONS ============
  const startConnection = (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom === sid) setConnectingFrom(null);
    else if (connectingFrom) {
      if (!connections.some(c => c.fromStageId === connectingFrom && c.toStageId === sid) && connectingFrom !== sid)
        setConnections([...connections, { id: `conn-${Date.now()}`, fromStageId: connectingFrom, toStageId: sid, fromAnchor: 'right', toAnchor: 'left', style: 'solid', color: '#3b82f6' }]);
      setConnectingFrom(null);
    } else setConnectingFrom(sid);
  };

  // ============ PRESETS ============
  const applyPreset = (p: Preset) => { setStages(p.stages); setConnections(p.connections); setLabels(p.labels); setPresetPreview(null); setTimeout(fitView, 100); };

  // ============ TEMPLATES ============
  const getTemplatesForCategory = () => {
    const templates = ALL_TEMPLATES[templateCategory as keyof typeof ALL_TEMPLATES] || [];
    if (templateUseCase === 'all') return templates;
    return templates.filter(t => t.useCase === templateUseCase);
  };

  const getUseCases = () => {
    const templates = ALL_TEMPLATES[templateCategory as keyof typeof ALL_TEMPLATES] || [];
    return ['all', ...Array.from(new Set(templates.map(t => t.useCase)))];
  };

  const assignTemplateToStage = (stageId: string, templateId: string) => {
    setStageTemplates(prev => ({
      ...prev,
      [stageId]: [...(prev[stageId] || []), templateId]
    }));
  };

  // ============ EXPORT ============
  const exportDeadLeads = () => {
    const dl = leads.filter(l => l.status === 'dead');
    if (dl.length === 0) { alert('No dead leads'); return; }
    const csv = [['Name', 'Email', 'Phone', 'Vehicle', 'Budget', 'Reason', 'Date'].join(','), ...dl.map(l => [`"${l.formData.fullName}"`, `"${l.formData.email}"`, `"${l.formData.phone}"`, `"${l.formData.vehicleType || ''}"`, `"${l.formData.paymentType === 'finance' ? l.formData.financeBudget : l.formData.cashBudget}"`, `"${l.deadReason || ''}"`, `"${new Date(l.createdAt).toLocaleDateString()}"`].join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `dead-leads-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const getStageCenter = (s: PipelineStage, a: 'left' | 'right') => ({ x: a === 'right' ? s.x + s.width : s.x, y: s.y + s.height / 2 });

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const deadCount = leads.filter(l => l.status === 'dead').length;
  const filteredPresets = presetCategory === 'all' ? ALL_PRESETS : ALL_PRESETS.filter(p => p.complexity === presetCategory || p.category === presetCategory);
  const currentTemplates = getTemplatesForCategory();

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden flex">
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col z-40 flex-shrink-0">
        <div className="flex border-b border-slate-800">
          {[{ id: 'presets', icon: '📊' }, { id: 'custom', icon: '⚡' }, { id: 'templates', icon: '✉️' }].map(t => (
            <button key={t.id} onClick={() => setSidebarTab(t.id as any)} className={`flex-1 py-2 text-sm font-medium ${sidebarTab === t.id ? 'text-primary-400 border-b-2 border-primary-400 bg-slate-800/50' : 'text-slate-500'}`}>{t.icon}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-custom">
          {/* PRESETS TAB */}
          {sidebarTab === 'presets' && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1 mb-2">
                {['all', 'simple', 'medium', 'advanced', 'post-sale'].map(c => (
                  <button key={c} onClick={() => setPresetCategory(c)} className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${presetCategory === c ? 'bg-primary-500/30 text-primary-400' : 'bg-slate-800 text-slate-500'}`}>
                    {c === 'all' ? 'All' : c === 'post-sale' ? 'Post-Sale' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
              {filteredPresets.map(p => (
                <div key={p.id} className="relative" onMouseEnter={() => setPresetPreview(p)} onMouseLeave={() => setPresetPreview(null)}>
                  <button onClick={() => applyPreset(p)} className="w-full p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-left hover:border-primary-500/50 transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{p.icon}</span>
                      <span className="text-[10px] font-semibold text-white flex-1 truncate">{p.name}</span>
                      <span className={`text-[7px] px-1 py-0.5 rounded ${p.complexity === 'simple' ? 'bg-green-500/20 text-green-400' : p.complexity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>{p.stages.length}</span>
                    </div>
                    <p className="text-[8px] text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* CUSTOM TAB */}
          {sidebarTab === 'custom' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => setCustomType('stage')} className={`p-1.5 rounded text-[9px] font-medium ${customType === 'stage' ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>📦 Stage</button>
                <button onClick={() => setCustomType('label')} className={`p-1.5 rounded text-[9px] font-medium ${customType === 'label' ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>🏷️ Label</button>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-2 space-y-2">
                <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Name..." className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-[10px] outline-none" />
                
                {customType === 'stage' && (
                  <>
                    <div className="grid grid-cols-8 gap-0.5 max-h-14 overflow-y-auto p-0.5 bg-slate-900/50 rounded">
                      {EMOJI_BANK.slice(0, 40).map(e => (
                        <button key={e} onClick={() => setCustomIcon(e)} className={`w-5 h-5 rounded text-[10px] flex items-center justify-center ${customIcon === e ? 'bg-primary-500/30 ring-1 ring-primary-500' : 'hover:bg-slate-700'}`}>{e}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-0.5">
                      {STAGE_COLORS.slice(0, 6).map(c => (
                        <button key={c.id} onClick={() => setCustomColor(c.id)} className={`h-4 rounded bg-gradient-to-br ${c.bg} border ${customColor === c.id ? c.border : 'border-transparent'}`} />
                      ))}
                    </div>
                    
                    {/* Follow-up and Meeting in sidebar */}
                    <select value={customFollowUp} onChange={(e) => setCustomFollowUp(e.target.value)} className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-white text-[9px]">
                      <option value="">No Follow-up</option>
                      {FOLLOW_UP_METHODS.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
                    </select>
                    <select value={customMeeting} onChange={(e) => setCustomMeeting(e.target.value)} className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-white text-[9px]">
                      <option value="">No Meeting</option>
                      {MEETING_TYPES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
                    </select>
                  </>
                )}

                {customType === 'label' && (
                  <div className="grid grid-cols-6 gap-0.5">
                    {['#1e293b', '#0f172a', '#7c3aed', '#0891b2', '#16a34a', '#dc2626'].map(c => (
                      <button key={c} onClick={() => setLabelBgColor(c)} className={`h-4 rounded border ${labelBgColor === c ? 'border-white' : 'border-slate-600'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}

                <button onClick={customType === 'stage' ? addStage : addLabel} className="w-full py-1.5 rounded bg-primary-500 text-white text-[10px] font-medium">+ Create</button>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { l: 'New', i: '📥', c: 'blue' }, { l: 'Hot', i: '🔥', c: 'orange' }, { l: 'Follow Up', i: '📞', c: 'cyan' },
                  { l: 'Meeting', i: '📅', c: 'purple' }, { l: 'Closing', i: '🎯', c: 'green' }, { l: 'Dead', i: '💀', c: 'red' },
                ].map(q => (
                  <button key={q.l} onClick={() => { setCustomLabel(q.l); setCustomIcon(q.i); setCustomColor(q.c as StageColor); setTimeout(addStage, 50); }}
                    className="flex items-center gap-1 p-1 rounded bg-slate-800/40 text-[8px] hover:bg-slate-800">
                    <span>{q.i}</span><span className="text-slate-400">{q.l}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TEMPLATES TAB */}
          {sidebarTab === 'templates' && (
            <div className="space-y-2">
              {/* Category tabs */}
              <div className="flex gap-0.5 flex-wrap">
                {TEMPLATE_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => { setTemplateCategory(c.id); setTemplateUseCase('all'); }}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${templateCategory === c.id ? 'bg-primary-500/30 text-primary-400' : 'bg-slate-800 text-slate-500'}`}>
                    {c.icon} {c.count}
                  </button>
                ))}
              </div>
              
              {/* Use case filter */}
              <div className="flex gap-0.5 flex-wrap">
                {getUseCases().map(uc => (
                  <button key={uc} onClick={() => setTemplateUseCase(uc)}
                    className={`px-1 py-0.5 rounded text-[7px] ${templateUseCase === uc ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800/50 text-slate-500'}`}>
                    {uc === 'all' ? 'All' : uc}
                  </button>
                ))}
              </div>

              {/* Templates list */}
              <div className="space-y-1">
                {currentTemplates.map(t => (
                  <button key={t.id} onClick={() => setViewingTemplate(t)}
                    className="w-full p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-left hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-[9px] font-medium text-white flex-1 truncate">{t.name}</span>
                      {t.timing && <span className="text-[7px] text-slate-500">{t.timing}</span>}
                    </div>
                    <p className="text-[8px] text-slate-500 line-clamp-1">{t.message.slice(0, 50)}...</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-30 px-3 py-1.5 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-white">🚀 Pipeline</h1>
              <span className="text-[8px] text-slate-500">{stages.length} stages • {leads.length} leads</span>
              <span className="text-[8px] text-emerald-400">●</span>
              <span className="text-[8px] text-emerald-400/70">Auto-saving</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button onClick={toggleSimpleMode} className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${simpleMode ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
                {simpleMode ? '📋' : '🔗'}
              </button>
              <div className="flex items-center gap-0.5 bg-slate-800 rounded px-1 py-0.5 border border-slate-700">
                <button onClick={() => setZoom(z => Math.max(0.25, z - 0.08))} className="text-slate-400 px-0.5 text-[10px]">−</button>
                <span className="text-[8px] text-slate-400 w-6 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.6, z + 0.08))} className="text-slate-400 px-0.5 text-[10px]">+</button>
              </div>
              <button onClick={fitView} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[8px]">⊡</button>
              {deadCount > 0 && <button onClick={exportDeadLeads} className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-[8px]">📥 {deadCount}</button>}
              <button onClick={() => setShowViewOptions(!showViewOptions)} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[8px]">⚙️</button>
              <button onClick={() => setShowProfilesSidebar(!showProfilesSidebar)} className="px-1.5 py-0.5 rounded bg-primary-500/20 border border-primary-500/50 text-primary-400 text-[8px]">👤</button>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div ref={containerRef} className={`absolute inset-0 ${isDraggingCanvas ? 'cursor-grabbing' : connectingFrom ? 'cursor-crosshair' : 'cursor-grab'}`}
          onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => { handleCanvasMouseUp(); setConnectingFrom(null); }} onWheel={handleWheel}>
          <div ref={canvasRef} className="absolute" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '5000px', height: '4000px' }}>
            
            {labels.map(l => <LabelNode key={l.id} label={l} zoom={zoom} onMove={handleLabelMove} onDelete={() => setLabels(labels.filter(x => x.id !== l.id))} />)}

            {!simpleMode && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                {connections.map(c => {
                  const f = stages.find(s => s.id === c.fromStageId), t = stages.find(s => s.id === c.toStageId);
                  if (!f || !t) return null;
                  const s = getStageCenter(f, 'right'), e = getStageCenter(t, 'left'), m = (s.x + e.x) / 2;
                  return (
                    <g key={c.id}>
                      <path d={`M ${s.x} ${s.y} C ${m} ${s.y}, ${m} ${e.y}, ${e.x} ${e.y}`} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray={c.style === 'dashed' ? '4 2' : 'none'} opacity={0.6} />
                      {c.label && <text x={m} y={(s.y + e.y) / 2 - 4} fill="#64748b" fontSize="8" textAnchor="middle">{c.label}</text>}
                    </g>
                  );
                })}
                {connectingFrom && (() => {
                  const f = stages.find(s => s.id === connectingFrom); if (!f) return null;
                  const s = getStageCenter(f, 'right');
                  return <line x1={s.x} y1={s.y} x2={mousePos.x} y2={mousePos.y} stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 2" />;
                })()}
              </svg>
            )}

            {stages.map(stage => (
              <StageNode key={stage.id} stage={stage} leads={getStageLeads(stage)} isSelected={selectedStage === stage.id}
                isEditing={editingStage === stage.id} isConnecting={connectingFrom === stage.id} isDropTarget={!!draggedLead}
                simpleMode={simpleMode} showTimers={showTimers} compactLeads={compactLeads} zoom={zoom}
                linkedTemplates={stageTemplates[stage.id] || []} allTemplates={ALL_TEMPLATES}
                getTimeSinceContact={getTimeSinceContact}
                onSelect={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                onEdit={() => setEditingStage(editingStage === stage.id ? null : stage.id)}
                onMove={handleStageMove} onResize={handleStageResize} onDelete={() => deleteStage(stage.id)}
                onConnect={(e) => startConnection(stage.id, e)} onDrop={() => handleDropOnStage(stage.id)}
                onDragLead={setDraggedLead} onViewLead={onViewDetails} onToggleStar={onToggleStar} starredLeads={starredLeads}
                onUpdateStage={(u) => setStages(prev => prev.map(s => s.id === stage.id ? { ...s, ...u } : s))}
              />
            ))}
          </div>
        </div>

        {connectingFrom && <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-[9px]">🔗 Click another node</div>}

        {/* Preset Preview */}
        <AnimatePresence>
          {presetPreview && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="absolute left-72 top-10 z-50 w-72 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl ml-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">{presetPreview.icon}</span>
                <div>
                  <h3 className="text-[11px] font-bold text-white">{presetPreview.name}</h3>
                  <p className="text-[8px] text-slate-500">{presetPreview.stages.length} stages • {presetPreview.connections.length} connections</p>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mb-2">{presetPreview.description}</p>
              <div className="bg-slate-950 rounded p-1.5 space-y-1 max-h-40 overflow-y-auto">
                {presetPreview.stages.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-600 w-3">{i + 1}.</span>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r ${STAGE_COLORS.find(c => c.id === s.color)?.bg}`}>
                      <span className="text-[11px]">{s.icon}</span>
                      <span className="text-[9px] text-white font-medium">{s.label}</span>
                    </div>
                    {s.emailTemplateId && <span className="text-[8px]">✉️</span>}
                    {s.followUpMethod && <span className="text-[8px]">{FOLLOW_UP_METHODS.find(f => f.id === s.followUpMethod)?.icon}</span>}
                    {s.meetingType && <span className="text-[8px]">{MEETING_TYPES.find(m => m.id === s.meetingType)?.icon}</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Viewer */}
        <AnimatePresence>
          {viewingTemplate && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-8" onClick={() => setViewingTemplate(null)}>
              <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{viewingTemplate.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{viewingTemplate.name}</h3>
                      <p className="text-[10px] text-slate-500">{viewingTemplate.category} • {viewingTemplate.useCase}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewingTemplate(null)} className="text-slate-400 hover:text-white">×</button>
                </div>
                {viewingTemplate.subject && (
                  <div className="mb-2 px-3 py-1.5 bg-slate-800 rounded text-[10px] text-slate-400">
                    Subject: <span className="text-white">{viewingTemplate.subject}</span>
                  </div>
                )}
                <div className="bg-slate-950 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans">{viewingTemplate.message}</pre>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(viewingTemplate.message); alert('Copied!'); }}
                    className="flex-1 py-2 rounded-lg bg-primary-500/20 text-primary-400 text-[10px] font-medium">📋 Copy</button>
                  <button onClick={() => setViewingTemplate(null)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-[10px]">Close</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Options */}
        <AnimatePresence>
          {showViewOptions && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-9 right-2 z-50 w-40 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl">
              <h4 className="text-[9px] font-medium text-white mb-1.5">View Options</h4>
              {[{ label: 'Show Timers', value: showTimers, set: setShowTimers }, { label: 'Compact Leads', value: compactLeads, set: setCompactLeads }].map(opt => (
                <label key={opt.label} className="flex items-center justify-between py-1">
                  <span className="text-[9px] text-slate-400">{opt.label}</span>
                  <button onClick={() => opt.set(!opt.value)} className={`w-7 h-3.5 rounded-full transition ${opt.value ? 'bg-primary-500' : 'bg-slate-700'}`}>
                    <div className={`w-2.5 h-2.5 bg-white rounded-full transition ${opt.value ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PROFILES SIDEBAR */}
      <AnimatePresence>
        {showProfilesSidebar && (
          <motion.div initial={{ x: 260 }} animate={{ x: 0 }} exit={{ x: 260 }}
            className="absolute right-0 top-0 bottom-0 w-56 bg-slate-900/98 border-l border-slate-800 z-50 flex flex-col">
            <div className="p-2.5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-white">👤 Profiles ({profiles.length}/{MAX_PROFILES})</h2>
              <button onClick={() => setShowProfilesSidebar(false)} className="text-slate-400 hover:text-white text-sm">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {profiles.map(p => (
                <div key={p.id} onClick={() => loadProfile(p.id)}
                  className={`p-2 rounded-lg border cursor-pointer ${activeProfileId === p.id ? 'bg-primary-500/20 border-primary-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-white">{p.name}</span>
                    {profiles.length > 1 && <button onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }} className="text-red-400 text-[8px]">×</button>}
                  </div>
                  <div className="text-[8px] text-slate-500">{p.stages?.length || 0} stages</div>
                  {activeProfileId === p.id && <div className="text-[7px] text-primary-400 mt-0.5">✓ Active</div>}
                </div>
              ))}
              {profiles.length < MAX_PROFILES && (
                <div className="p-2 rounded-lg border border-dashed border-slate-700">
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                    placeholder="New profile..." className="w-full bg-transparent text-white text-[9px] mb-1 outline-none" />
                  <button onClick={() => { if (profileName.trim()) { createProfile(profileName.trim()); setProfileName(''); } }}
                    disabled={!profileName.trim()} className="w-full py-1 rounded bg-primary-500/20 text-primary-400 text-[8px] disabled:opacity-50">+ Create</button>
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
    e.stopPropagation(); lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onMove(label.id, ev.clientX - lastPos.current.x, ev.clientY - lastPos.current.y); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };
  return (
    <div className="label-node absolute cursor-move select-none" style={{ left: label.x, top: label.y }} onMouseDown={handleMouseDown} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="px-2.5 py-1 rounded font-bold relative" style={{ fontSize: label.fontSize, color: label.color, backgroundColor: label.bgColor || 'transparent' }}>
        {label.text}
        {hover && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center">×</button>}
      </div>
    </div>
  );
}

// ============ STAGE NODE ============
function StageNode({ stage, leads, isSelected, isEditing, isConnecting, isDropTarget, simpleMode, showTimers, compactLeads, zoom, linkedTemplates, allTemplates, getTimeSinceContact, onSelect, onEdit, onMove, onResize, onDelete, onConnect, onDrop, onDragLead, onViewLead, onToggleStar, starredLeads, onUpdateStage }: any) {
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const color = STAGE_COLORS.find(c => c.id === stage.color) || STAGE_COLORS[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.lead-card, .resize-handle, .edit-panel, .connect-btn')) return;
    e.stopPropagation(); setDragging(true); lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onMove(stage.id, ev.clientX - lastPos.current.x, ev.clientY - lastPos.current.y); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { setDragging(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation(); lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onResize(stage.id, (ev.clientX - lastPos.current.x) / zoom, (ev.clientY - lastPos.current.y) / zoom); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const leadH = compactLeads ? 28 : 36;
  const visibleLeads = Math.floor((stage.height - 50) / leadH);

  return (
    <div className="stage-node absolute" style={{ left: stage.x, top: stage.y, zIndex: isSelected ? 100 : 1 }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      {!simpleMode && (
        <>
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-700 border border-slate-600" />
          <button onClick={onConnect} className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center text-[7px] ${isConnecting ? 'bg-yellow-500 border-yellow-400 text-white' : 'bg-primary-500/30 border-primary-400/60 text-primary-400 hover:bg-primary-500/50'}`}>+</button>
        </>
      )}
      
      <motion.div onClick={onSelect} onMouseDown={handleMouseDown} onDoubleClick={onEdit}
        className={`relative rounded-xl overflow-hidden backdrop-blur-xl bg-gradient-to-br ${color.bg} border-2 ${isSelected ? `${color.border} ring-2 ring-${stage.color}-500/20` : 'border-slate-700/60 hover:border-slate-600'} ${isConnecting ? 'ring-2 ring-yellow-400/40' : ''} ${isDropTarget ? 'ring-2 ring-green-400/40' : ''} ${dragging ? 'cursor-grabbing shadow-xl' : 'cursor-grab'}`}
        style={{ width: stage.width, height: stage.height }}>
        
        <div className="px-2 py-1.5 border-b border-slate-700/40 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm">{stage.icon}</span>
            <span className="text-[10px] font-bold text-white truncate">{stage.label}</span>
          </div>
          <div className="flex items-center gap-1">
            {stage.emailTemplateId && <span className="text-[9px]" title="Has email">✉️</span>}
            {stage.followUpMethod && <span className="text-[9px]" title={stage.followUpMethod}>{FOLLOW_UP_METHODS.find(f => f.id === stage.followUpMethod)?.icon}</span>}
            {stage.meetingType && <span className="text-[9px]" title={stage.meetingType}>{MEETING_TYPES.find(m => m.id === stage.meetingType)?.icon}</span>}
            <div className={`px-1.5 py-0.5 rounded bg-slate-900/80 ${color.text} text-[10px] font-bold`}>{leads.length}</div>
          </div>
        </div>

        <div className="p-1 overflow-hidden" style={{ height: stage.height - 42 }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="text-xl mb-0.5">📥</div>
              <div className="text-[8px]">Drop leads</div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {leads.slice(0, visibleLeads).map((lead: Lead) => (
                <div key={lead.id} draggable onDragStart={() => onDragLead(lead)} onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-card flex items-center gap-1 p-1 rounded bg-slate-800/70 hover:bg-slate-800 cursor-grab transition-all"
                  style={{ height: leadH }}>
                  <div className={`w-5 h-5 rounded bg-gradient-to-br ${color.bg} flex items-center justify-center ${color.text} text-[7px] font-bold flex-shrink-0`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] text-white font-medium truncate">{lead.formData.fullName}</div>
                    {!compactLeads && <div className="text-[7px] text-slate-500 truncate">{lead.formData.phone}</div>}
                  </div>
                  {showTimers && <span className="text-[7px] text-slate-500 flex-shrink-0">{getTimeSinceContact(lead)}</span>}
                  <button onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }} className="text-[9px] flex-shrink-0">{starredLeads.has(lead.id) ? '⭐' : '☆'}</button>
                </div>
              ))}
              {leads.length > visibleLeads && <div className="text-center text-[7px] text-slate-500">+{leads.length - visibleLeads} more</div>}
            </div>
          )}
        </div>

        <div className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-30 hover:opacity-100" onMouseDown={handleResize}>
          <svg className="w-full h-full text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22Z" /></svg>
        </div>

        {isSelected && (
          <div className="absolute -top-6 left-0 right-0 flex items-center justify-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-1 py-0.5 rounded bg-slate-800 text-white text-[7px]">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-1 py-0.5 rounded bg-red-500/20 text-red-400 text-[7px]">🗑️</button>
          </div>
        )}
      </motion.div>

      {isEditing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="edit-panel absolute top-full left-0 mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-lg p-2 z-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-1.5">
            <input value={stage.label} onChange={(e) => onUpdateStage({ label: e.target.value })} className="w-full px-1.5 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[9px]" />
            <div className="grid grid-cols-6 gap-0.5">
              {STAGE_COLORS.slice(0, 6).map(c => (
                <button key={c.id} onClick={() => onUpdateStage({ color: c.id })} className={`h-4 rounded bg-gradient-to-br ${c.bg} border ${stage.color === c.id ? c.border : 'border-transparent'}`} />
              ))}
            </div>
            <select value={stage.followUpMethod || ''} onChange={(e) => onUpdateStage({ followUpMethod: e.target.value || undefined })} className="w-full px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-white text-[8px]">
              <option value="">No Follow-up</option>
              {FOLLOW_UP_METHODS.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <select value={stage.meetingType || ''} onChange={(e) => onUpdateStage({ meetingType: e.target.value || undefined })} className="w-full px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-white text-[8px]">
              <option value="">No Meeting</option>
              {MEETING_TYPES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}
