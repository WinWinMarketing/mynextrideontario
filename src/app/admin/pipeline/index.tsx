'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';
import { 
  PipelineStage, NodeConnection, TextLabel, WorkspaceProfile, EmailTemplate, PipelineNotification,
  STAGE_COLORS, DEFAULT_AUTOMATION, DEFAULT_EMAIL_TEMPLATES, DEFAULT_WORKSPACE_SETTINGS,
  MAX_PROFILES, STORAGE_KEY, ACTIVE_PROFILE_KEY, MEETING_TYPES, FOLLOW_UP_METHODS, EMOJI_BANK, 
  StageColor, DEAD_LEAD_CATEGORIES, NOTIFICATION_TYPES, NOTIFICATION_TIMING_OPTIONS, AUTO_SAVE_INTERVAL
} from './types';
import { ALL_PRESETS, Preset, PRESET_CATEGORIES, getPresetsByCategory } from './presets';
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES, MessageTemplate, getFilteredTemplates, USE_CASES } from './templates';

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
  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 100, y: 80 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  // Pipeline
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [labels, setLabels] = useState<TextLabel[]>([]);
  const [notifications, setNotifications] = useState<PipelineNotification[]>([]);
  
  // UI
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [simpleMode, setSimpleMode] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  // Sidebar
  const [sidebarTab, setSidebarTab] = useState<'presets' | 'custom' | 'templates' | 'notifications' | 'dead'>('presets');
  const [presetPreview, setPresetPreview] = useState<Preset | null>(null);
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [templateCategory, setTemplateCategory] = useState<string>('email');
  const [templateUseCase, setTemplateUseCase] = useState<string>('all');
  
  // Custom builder
  const [customIcon, setCustomIcon] = useState('⭐');
  const [customColor, setCustomColor] = useState<StageColor>('blue');
  const [customLabel, setCustomLabel] = useState('New Stage');
  const [customType, setCustomType] = useState<'stage' | 'label' | 'dead'>('stage');
  const [customFollowUp, setCustomFollowUp] = useState<string>('');
  const [customMeeting, setCustomMeeting] = useState<string>('');
  const [customDeadReason, setCustomDeadReason] = useState<string>('');
  const [labelBgColor, setLabelBgColor] = useState('#1e293b');

  // View options
  const [showTimers, setShowTimers] = useState(true);
  const [compactLeads, setCompactLeads] = useState(false);
  const [gridViewLeads, setGridViewLeads] = useState(false);

  // Template viewer
  const [viewingTemplate, setViewingTemplate] = useState<MessageTemplate | null>(null);
  const [stageTemplates, setStageTemplates] = useState<Record<string, string[]>>({});

  // Notification creator
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifType, setNotifType] = useState<string>('reminder');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTiming, setNotifTiming] = useState<number>(30);
  const [notifLinkedStage, setNotifLinkedStage] = useState<string>('');

  // ============ INSTANT AUTO-SAVE ============
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCountRef = useRef(0);
  
  const instantSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (activeProfileId && (stages.length > 0 || labels.length > 0)) {
        const now = new Date().toISOString();
        const updated = profiles.map(p => 
          p.id === activeProfileId ? { 
            ...p, 
            updatedAt: now, 
            stages, 
            connections, 
            labels, 
            notifications,
            settings: { 
              ...DEFAULT_WORKSPACE_SETTINGS,
              zoom, 
              panX: pan.x, 
              panY: pan.y, 
              compactMode: compactLeads,
              gridView: gridViewLeads,
            } 
          } : p
        );
        setProfiles(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setLastSaveTime(new Date());
        saveCountRef.current++;
      }
    }, AUTO_SAVE_INTERVAL);
  }, [activeProfileId, stages, connections, labels, notifications, zoom, pan, profiles, compactLeads, gridViewLeads]);

  // Auto-save on ANY change
  useEffect(() => { instantSave(); }, [stages, connections, labels, notifications, zoom, pan, compactLeads, gridViewLeads, instantSave]);

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
    setStages(p.stages || []); 
    setConnections(p.connections || []); 
    setLabels(p.labels || []);
    setNotifications(p.notifications || []);
    setZoom(p.settings?.zoom || 0.5); 
    setPan({ x: p.settings?.panX || 100, y: p.settings?.panY || 80 });
    setCompactLeads(p.settings?.compactMode || false);
    setGridViewLeads(p.settings?.gridView || false);
  };

  const loadProfile = (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (p) { loadProfileData(p); setActiveProfileId(id); localStorage.setItem(ACTIVE_PROFILE_KEY, id); }
  };

  const createProfile = (name: string) => {
    if (profiles.length >= MAX_PROFILES) { alert(`Max ${MAX_PROFILES} profiles.`); return; }
    const now = new Date().toISOString();
    const np: WorkspaceProfile = { 
      id: `profile-${Date.now()}`, 
      name, 
      createdAt: now, 
      updatedAt: now, 
      stages: [], 
      connections: [], 
      labels: [], 
      notifications: [],
      emailTemplates: DEFAULT_EMAIL_TEMPLATES, 
      settings: DEFAULT_WORKSPACE_SETTINGS 
    };
    const updated = [...profiles, np];
    setProfiles(updated); setActiveProfileId(np.id); setStages([]); setConnections([]); setLabels([]); setNotifications([]);
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

  // ============ CANVAS NAVIGATION ============
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only start canvas drag if clicking on the background (not on nodes/labels)
    if ((e.target as HTMLElement).closest('.stage-node, .label-node, .sidebar, .notification-card')) return;
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
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = () => setIsDraggingCanvas(false);
  
  const handleWheel = (e: React.WheelEvent) => { 
    e.preventDefault(); 
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(z => Math.max(0.2, Math.min(1.5, z + delta))); 
  };

  const fitView = () => {
    if (stages.length === 0) { setZoom(0.5); setPan({ x: 100, y: 80 }); return; }
    const xs = stages.map(s => s.x), ys = stages.map(s => s.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs) + 300;
    const minY = Math.min(...ys), maxY = Math.max(...ys) + 300;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const rx = maxX - minX + 200, ry = maxY - minY + 200;
    const cw = containerRef.current?.clientWidth || 1200, ch = containerRef.current?.clientHeight || 800;
    const nz = Math.min(cw / rx, ch / ry, 0.8) * 0.75;
    setZoom(Math.max(0.3, Math.min(0.8, nz))); 
    setPan({ x: cw / 2 - cx * nz, y: ch / 2 - cy * nz + 30 });
  };

  // ============ ORGANIZE / AUTO-LAYOUT ============
  const organizeLayout = () => {
    if (stages.length === 0) return;
    
    // Sort stages by their statusId to group similar stages
    const statusOrder: Record<string, number> = {
      'dead': 0, 'new': 1, 'working': 2, 'circle-back': 3, 'approval': 4
    };
    
    const sortedStages = [...stages].sort((a, b) => {
      const orderA = statusOrder[a.statusId] ?? 5;
      const orderB = statusOrder[b.statusId] ?? 5;
      return orderA - orderB;
    });
    
    // Group dead leads on left, rest flows left-to-right
    const deadStages = sortedStages.filter(s => s.statusId === 'dead');
    const activeStages = sortedStages.filter(s => s.statusId !== 'dead');
    
    // Layout dead stages vertically on left
    const deadStartX = 40;
    const deadStartY = 60;
    const deadSpacing = 230;
    
    // Layout active stages in a grid flowing left-to-right
    const activeStartX = deadStages.length > 0 ? 360 : 80;
    const activeStartY = 100;
    const colSpacing = 340;
    const rowSpacing = 300;
    const maxCols = 5;
    
    const updatedStages = stages.map(s => {
      const deadIdx = deadStages.findIndex(d => d.id === s.id);
      if (deadIdx !== -1) {
        return { ...s, x: deadStartX, y: deadStartY + deadIdx * deadSpacing, width: 240, height: 220 };
      }
      
      const activeIdx = activeStages.findIndex(a => a.id === s.id);
      if (activeIdx !== -1) {
        const col = activeIdx % maxCols;
        const row = Math.floor(activeIdx / maxCols);
        return { 
          ...s, 
          x: activeStartX + col * colSpacing, 
          y: activeStartY + row * rowSpacing,
          width: Math.max(280, s.width),
          height: Math.max(260, s.height)
        };
      }
      
      return s;
    });
    
    setStages(updatedStages);
    setTimeout(fitView, 100);
  };

  const toggleSimpleMode = () => {
    const nm = !simpleMode; setSimpleMode(nm);
    if (nm) {
      const cols = Math.ceil(Math.sqrt(stages.length)), sp = { x: 350, y: 320 };
      setStages(prev => prev.map((s, i) => ({ ...s, x: 100 + (i % cols) * sp.x, y: 100 + Math.floor(i / cols) * sp.y, width: 320, height: 300 })));
      setTimeout(fitView, 50);
    }
  };

  // ============ STAGES ============
  const handleStageMove = (id: string, dx: number, dy: number) => setStages(prev => prev.map(s => s.id === id ? { ...s, x: s.x + dx / zoom, y: s.y + dy / zoom } : s));
  const handleStageResize = (id: string, dw: number, dh: number) => setStages(prev => prev.map(s => s.id === id ? { ...s, width: Math.max(200, Math.min(500, s.width + dw)), height: Math.max(180, Math.min(500, s.height + dh)) } : s));

  const addStage = () => {
    const ns: PipelineStage = { 
      id: `stage-${Date.now()}`, 
      label: customLabel, 
      statusId: customType === 'dead' ? 'dead' : 'working', 
      deadReason: customType === 'dead' ? customDeadReason : undefined,
      x: 400 + stages.length * 30, 
      y: 200 + stages.length * 20, 
      width: simpleMode ? 320 : 280, 
      height: simpleMode ? 300 : 260, 
      color: customColor, 
      icon: customIcon, 
      contactMethods: [], 
      automationSettings: DEFAULT_AUTOMATION, 
      followUpMethod: customFollowUp as any || undefined, 
      meetingType: customMeeting as any || undefined 
    };
    setStages([...stages, ns]); 
    setSelectedStage(ns.id);
  };

  const addDeadLeadStage = (cat: typeof DEAD_LEAD_CATEGORIES[0]) => {
    const ns: PipelineStage = { 
      id: `dead-${cat.id}-${Date.now()}`, 
      label: cat.label, 
      statusId: 'dead', 
      deadReason: cat.id,
      x: 40, 
      y: 60 + stages.filter(s => s.statusId === 'dead').length * 230, 
      width: 240, 
      height: 220, 
      color: cat.color, 
      icon: cat.icon, 
      contactMethods: [], 
      automationSettings: DEFAULT_AUTOMATION 
    };
    setStages([...stages, ns]); 
    setSelectedStage(ns.id);
  };

  const addLabel = () => setLabels([...labels, { id: `label-${Date.now()}`, text: customLabel || 'Section', x: 400, y: 100, fontSize: 18, color: '#fff', bgColor: labelBgColor }]);
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

  // ============ NOTIFICATIONS ============
  const addNotification = () => {
    if (!notifTitle.trim()) return;
    const newNotif: PipelineNotification = {
      id: `notif-${Date.now()}`,
      type: notifType as any,
      title: notifTitle,
      message: notifMessage,
      icon: NOTIFICATION_TYPES.find(t => t.id === notifType)?.icon || '🔔',
      linkedStageId: notifLinkedStage || undefined,
      timing: { type: 'before-event', beforeEventMinutes: notifTiming },
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setNotifications([...notifications, newNotif]);
    setShowNotificationModal(false);
    setNotifTitle(''); setNotifMessage(''); setNotifTiming(30); setNotifLinkedStage('');
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isActive: false, dismissedAt: new Date().toISOString() } : n));
  };

  // ============ PRESETS ============
  const applyPreset = (p: Preset) => { 
    setStages(p.stages); 
    setConnections(p.connections); 
    setLabels(p.labels); 
    setPresetPreview(null); 
    setTimeout(fitView, 100); 
  };

  // ============ TEMPLATES ============
  const getTemplatesForCategory = () => {
    return getFilteredTemplates(templateCategory, templateUseCase);
  };

  const getUseCases = () => {
    const templates = ALL_TEMPLATES[templateCategory as keyof typeof ALL_TEMPLATES] || [];
    return ['all', ...Array.from(new Set(templates.map(t => t.useCase)))];
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
  const filteredPresets = presetCategory === 'all' ? ALL_PRESETS : getPresetsByCategory(presetCategory);
  const currentTemplates = getTemplatesForCategory();
  const activeNotifications = notifications.filter(n => n.isActive);

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden flex">
      {/* LEFT SIDEBAR - ENHANCED */}
      <div className="w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col z-40 flex-shrink-0 sidebar">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { id: 'presets', icon: '📊', label: 'Presets' }, 
            { id: 'custom', icon: '⚡', label: 'Build' }, 
            { id: 'templates', icon: '✉️', label: 'Templates' },
            { id: 'dead', icon: '💀', label: 'Dead' },
            { id: 'notifications', icon: '🔔', label: 'Alerts' }
          ].map(t => (
            <button key={t.id} onClick={() => setSidebarTab(t.id as any)} 
              className={`flex-1 py-2 text-[10px] font-medium transition-all ${sidebarTab === t.id ? 'text-primary-400 border-b-2 border-primary-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}>
              <span className="block text-sm">{t.icon}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-custom">
          {/* PRESETS TAB */}
          {sidebarTab === 'presets' && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1 mb-2">
                {PRESET_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setPresetCategory(c.id)} 
                    className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${presetCategory === c.id ? 'bg-primary-500/30 text-primary-400' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
              {filteredPresets.map(p => (
                <div key={p.id} className="relative" onMouseEnter={() => setPresetPreview(p)} onMouseLeave={() => setPresetPreview(null)}>
                  <button onClick={() => applyPreset(p)} className="w-full p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-left hover:border-primary-500/50 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-[11px] font-semibold text-white flex-1 truncate">{p.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                        p.complexity === 'simple' ? 'bg-green-500/20 text-green-400' : 
                        p.complexity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                        p.complexity === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>{p.stages.length}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                    {p.tags && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[7px] text-slate-400">{tag}</span>
                        ))}
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* CUSTOM BUILD TAB */}
          {sidebarTab === 'custom' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => setCustomType('stage')} className={`p-2 rounded text-[9px] font-medium ${customType === 'stage' ? 'bg-primary-500/20 border-primary-500/50 text-primary-400 border' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>📦 Stage</button>
                <button onClick={() => setCustomType('dead')} className={`p-2 rounded text-[9px] font-medium ${customType === 'dead' ? 'bg-red-500/20 border-red-500/50 text-red-400 border' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>💀 Dead</button>
                <button onClick={() => setCustomType('label')} className={`p-2 rounded text-[9px] font-medium ${customType === 'label' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 border' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>🏷️ Label</button>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-3 space-y-2.5">
                <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Name..." className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px] outline-none focus:border-primary-500" />
                
                {(customType === 'stage' || customType === 'dead') && (
                  <>
                    <div className="grid grid-cols-10 gap-1 max-h-20 overflow-y-auto p-1 bg-slate-900/50 rounded-lg">
                      {EMOJI_BANK.slice(0, 50).map(e => (
                        <button key={e} onClick={() => setCustomIcon(e)} className={`w-6 h-6 rounded text-[11px] flex items-center justify-center transition-all ${customIcon === e ? 'bg-primary-500/30 ring-1 ring-primary-500' : 'hover:bg-slate-700'}`}>{e}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {STAGE_COLORS.slice(0, 6).map(c => (
                        <button key={c.id} onClick={() => setCustomColor(c.id)} className={`h-6 rounded-lg bg-gradient-to-br ${c.bg} border-2 transition-all ${customColor === c.id ? c.border : 'border-transparent hover:border-slate-600'}`} />
                      ))}
                    </div>
                    
                    {customType === 'dead' && (
                      <select value={customDeadReason} onChange={(e) => setCustomDeadReason(e.target.value)} className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-[10px]">
                        <option value="">Select reason...</option>
                        {DEAD_LEAD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                      </select>
                    )}
                    
                    {customType === 'stage' && (
                      <>
                        <select value={customFollowUp} onChange={(e) => setCustomFollowUp(e.target.value)} className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-[10px]">
                          <option value="">No Follow-up</option>
                          {FOLLOW_UP_METHODS.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
                        </select>
                        <select value={customMeeting} onChange={(e) => setCustomMeeting(e.target.value)} className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-[10px]">
                          <option value="">No Meeting</option>
                          {MEETING_TYPES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
                        </select>
                      </>
                    )}
                  </>
                )}

                {customType === 'label' && (
                  <div className="grid grid-cols-6 gap-1">
                    {['#1e293b', '#0f172a', '#7c3aed', '#0891b2', '#16a34a', '#dc2626'].map(c => (
                      <button key={c} onClick={() => setLabelBgColor(c)} className={`h-6 rounded-lg border-2 transition-all ${labelBgColor === c ? 'border-white' : 'border-slate-600'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}

                <button onClick={customType === 'label' ? addLabel : addStage} className="w-full py-2 rounded-lg bg-primary-500 text-white text-[11px] font-medium hover:bg-primary-600 transition-all">
                  + Create {customType === 'dead' ? 'Dead Lead Stage' : customType === 'label' ? 'Label' : 'Stage'}
                </button>
              </div>

              {/* Quick Add Grid */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-medium text-slate-400">Quick Add Stages</h4>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { l: 'New', i: '📥', c: 'blue' }, { l: 'Hot', i: '🔥', c: 'orange' }, { l: 'Follow Up', i: '📞', c: 'cyan' },
                    { l: 'Meeting', i: '📅', c: 'purple' }, { l: 'Closing', i: '🎯', c: 'green' }, { l: 'Won', i: '🏆', c: 'green' },
                  ].map(q => (
                    <button key={q.l} onClick={() => { setCustomLabel(q.l); setCustomIcon(q.i); setCustomColor(q.c as StageColor); setCustomType('stage'); setTimeout(addStage, 50); }}
                      className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/40 text-[9px] hover:bg-slate-800 transition-all">
                      <span>{q.i}</span><span className="text-slate-400">{q.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATES TAB */}
          {sidebarTab === 'templates' && (
            <div className="space-y-2">
              {/* Category tabs */}
              <div className="flex gap-1 flex-wrap">
                {TEMPLATE_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => { setTemplateCategory(c.id); setTemplateUseCase('all'); }}
                    className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${templateCategory === c.id ? 'bg-primary-500/30 text-primary-400' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                    {c.icon} {c.label} ({c.count})
                  </button>
                ))}
              </div>
              
              {/* Use case filter */}
              <div className="flex gap-1 flex-wrap">
                {getUseCases().map(uc => (
                  <button key={uc} onClick={() => setTemplateUseCase(uc)}
                    className={`px-1.5 py-0.5 rounded text-[8px] transition-all ${templateUseCase === uc ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700'}`}>
                    {uc === 'all' ? 'All' : uc}
                  </button>
                ))}
              </div>

              {/* Templates list */}
              <div className="space-y-1">
                {currentTemplates.map(t => (
                  <button key={t.id} onClick={() => setViewingTemplate(t)}
                    className="w-full p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-left hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{t.icon}</span>
                      <span className="text-[10px] font-medium text-white flex-1 truncate">{t.name}</span>
                      {t.timing && <span className="text-[8px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">{t.timing}</span>}
                    </div>
                    <p className="text-[9px] text-slate-500 line-clamp-1">{t.message.slice(0, 60)}...</p>
                    {t.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-1 py-0.5 bg-slate-700/30 rounded text-[7px] text-slate-500">{tag}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DEAD LEADS TAB */}
          {sidebarTab === 'dead' && (
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h4 className="text-[11px] font-medium text-red-400 mb-2">💀 Dead Lead Categories</h4>
                <p className="text-[9px] text-slate-500 mb-3">Click to add dead lead sorting stages to your pipeline</p>
                <div className="space-y-1.5">
                  {DEAD_LEAD_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => addDeadLeadStage(cat)}
                      className={`w-full p-2.5 rounded-lg bg-gradient-to-r ${STAGE_COLORS.find(c => c.id === cat.color)?.bg} border border-slate-700/50 text-left hover:border-red-500/50 transition-all`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-[11px] font-medium text-white">{cat.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {deadCount > 0 && (
                <button onClick={exportDeadLeads} className="w-full py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium hover:bg-slate-700 transition-all">
                  📥 Export {deadCount} Dead Leads (CSV)
                </button>
              )}

              <div className="bg-slate-800/40 rounded-lg p-3">
                <h4 className="text-[10px] font-medium text-slate-400 mb-2">Dead Lead Stats</h4>
                <div className="space-y-1">
                  {DEAD_LEAD_CATEGORIES.map(cat => {
                    const count = leads.filter(l => l.status === 'dead' && l.deadReason === cat.id).length;
                    return count > 0 ? (
                      <div key={cat.id} className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">{cat.icon} {cat.label}</span>
                        <span className="text-slate-300">{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {sidebarTab === 'notifications' && (
            <div className="space-y-3">
              <button onClick={() => setShowNotificationModal(true)}
                className="w-full py-2.5 rounded-lg bg-primary-500/20 border border-primary-500/50 text-primary-400 text-[11px] font-medium hover:bg-primary-500/30 transition-all">
                + Create Notification
              </button>

              <div className="space-y-1.5">
                {notifications.map(n => (
                  <div key={n.id} className={`notification-card p-2.5 rounded-lg border transition-all ${n.isActive ? 'bg-slate-800/60 border-slate-700/50' : 'bg-slate-800/30 border-slate-800 opacity-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-white block truncate">{n.title}</span>
                        <span className="text-[8px] text-slate-500">{n.timing.beforeEventMinutes} min before</span>
                      </div>
                      {n.isActive && (
                        <button onClick={() => dismissNotification(n.id)} className="text-[8px] text-slate-500 hover:text-red-400">✕</button>
                      )}
                    </div>
                    {n.linkedStageId && (
                      <div className="mt-1.5 text-[8px] text-slate-500">
                        Linked to: {stages.find(s => s.id === n.linkedStageId)?.label || 'Unknown'}
                      </div>
                    )}
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-[10px]">
                    <span className="text-2xl block mb-2">🔔</span>
                    No notifications yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-30 px-4 py-2 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-white">🚀 Pipeline</h1>
              <span className="text-[9px] text-slate-500">{stages.length} stages • {leads.length} leads</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400">Auto-saving</span>
              </div>
              {lastSaveTime && (
                <span className="text-[8px] text-slate-600">Last: {lastSaveTime.toLocaleTimeString()}</span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* View Toggle */}
              <button onClick={toggleSimpleMode} className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${simpleMode ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>
                {simpleMode ? '📋 Simple' : '🔗 Flow'}
              </button>
              
              {/* Organize Button */}
              <button onClick={organizeLayout} className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[9px] font-medium hover:text-white hover:border-primary-500/50 transition-all">
                ✨ Organize
              </button>
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg px-1.5 py-1 border border-slate-700">
                <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="text-slate-400 px-1 text-[10px] hover:text-white">−</button>
                <span className="text-[9px] text-slate-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="text-slate-400 px-1 text-[10px] hover:text-white">+</button>
              </div>
              
              <button onClick={fitView} className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[9px] hover:text-white transition-all">⊡ Fit</button>
              
              {deadCount > 0 && (
                <button onClick={exportDeadLeads} className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[9px] font-medium">
                  💀 {deadCount}
                </button>
              )}
              
              <button onClick={() => setShowViewOptions(!showViewOptions)} className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[9px] hover:text-white transition-all">⚙️</button>
              <button onClick={() => setShowProfilesSidebar(!showProfilesSidebar)} className="px-2 py-1 rounded-lg bg-primary-500/20 border border-primary-500/50 text-primary-400 text-[9px] font-medium">👤</button>
            </div>
          </div>
        </header>

        {/* Canvas - Click background to drag */}
        <div ref={containerRef} 
          className={`absolute inset-0 ${isDraggingCanvas ? 'cursor-grabbing' : connectingFrom ? 'cursor-crosshair' : 'cursor-grab'}`}
          onMouseDown={handleCanvasMouseDown} 
          onMouseMove={handleCanvasMouseMove} 
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => { handleCanvasMouseUp(); setConnectingFrom(null); }} 
          onWheel={handleWheel}>
          <div ref={canvasRef} className="absolute" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '6000px', height: '5000px' }}>
            
            {labels.map(l => <LabelNode key={l.id} label={l} zoom={zoom} onMove={handleLabelMove} onDelete={() => setLabels(labels.filter(x => x.id !== l.id))} />)}

            {!simpleMode && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                {connections.map(c => {
                  const f = stages.find(s => s.id === c.fromStageId), t = stages.find(s => s.id === c.toStageId);
                  if (!f || !t) return null;
                  const s = getStageCenter(f, 'right'), e = getStageCenter(t, 'left'), m = (s.x + e.x) / 2;
                  return (
                    <g key={c.id}>
                      <path d={`M ${s.x} ${s.y} C ${m} ${s.y}, ${m} ${e.y}, ${e.x} ${e.y}`} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray={c.style === 'dashed' ? '6 3' : 'none'} opacity={0.7} />
                      {c.label && <text x={m} y={(s.y + e.y) / 2 - 6} fill="#64748b" fontSize="10" textAnchor="middle" fontWeight="500">{c.label}</text>}
                    </g>
                  );
                })}
                {connectingFrom && (() => {
                  const f = stages.find(s => s.id === connectingFrom); if (!f) return null;
                  const s = getStageCenter(f, 'right');
                  return <line x1={s.x} y1={s.y} x2={mousePos.x} y2={mousePos.y} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="4 3" />;
                })()}
              </svg>
            )}

            {stages.map(stage => (
              <StageNode key={stage.id} stage={stage} leads={getStageLeads(stage)} isSelected={selectedStage === stage.id}
                isEditing={editingStage === stage.id} isConnecting={connectingFrom === stage.id} isDropTarget={!!draggedLead}
                simpleMode={simpleMode} showTimers={showTimers} compactLeads={compactLeads} gridViewLeads={gridViewLeads} zoom={zoom}
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

        {connectingFrom && <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-[10px] font-medium">🔗 Click another node to connect</div>}

        {/* Preset Preview */}
        <AnimatePresence>
          {presetPreview && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="absolute left-80 top-12 z-50 w-80 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl ml-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{presetPreview.icon}</span>
                <div>
                  <h3 className="text-[12px] font-bold text-white">{presetPreview.name}</h3>
                  <p className="text-[9px] text-slate-500">{presetPreview.stages.length} stages • {presetPreview.connections.length} connections</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">{presetPreview.description}</p>
              <div className="bg-slate-950 rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                {presetPreview.stages.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-4">{i + 1}.</span>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r ${STAGE_COLORS.find(c => c.id === s.color)?.bg}`}>
                      <span className="text-[12px]">{s.icon}</span>
                      <span className="text-[10px] text-white font-medium">{s.label}</span>
                    </div>
                    {s.emailTemplateId && <span className="text-[9px]">✉️</span>}
                    {s.followUpMethod && <span className="text-[9px]">{FOLLOW_UP_METHODS.find(f => f.id === s.followUpMethod)?.icon}</span>}
                    {s.meetingType && <span className="text-[9px]">{MEETING_TYPES.find(m => m.id === s.meetingType)?.icon}</span>}
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
              <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{viewingTemplate.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{viewingTemplate.name}</h3>
                      <p className="text-[10px] text-slate-500">{viewingTemplate.category} • {viewingTemplate.useCase}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewingTemplate(null)} className="text-slate-400 hover:text-white text-xl">×</button>
                </div>
                {viewingTemplate.subject && (
                  <div className="mb-3 px-3 py-2 bg-slate-800 rounded-lg text-[11px] text-slate-400">
                    Subject: <span className="text-white">{viewingTemplate.subject}</span>
                  </div>
                )}
                <div className="bg-slate-950 rounded-lg p-4 max-h-72 overflow-y-auto">
                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{viewingTemplate.message}</pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(viewingTemplate.message); alert('Copied!'); }}
                    className="flex-1 py-2.5 rounded-lg bg-primary-500/20 text-primary-400 text-[11px] font-medium hover:bg-primary-500/30 transition-all">📋 Copy Message</button>
                  <button onClick={() => setViewingTemplate(null)} className="px-6 py-2.5 rounded-lg bg-slate-800 text-slate-400 text-[11px] hover:bg-slate-700 transition-all">Close</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Modal */}
        <AnimatePresence>
          {showNotificationModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-8" onClick={() => setShowNotificationModal(false)}>
              <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-sm font-bold text-white mb-4">🔔 Create Notification</h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-1">
                    {NOTIFICATION_TYPES.map(t => (
                      <button key={t.id} onClick={() => setNotifType(t.id)}
                        className={`p-2 rounded-lg text-center transition-all ${notifType === t.id ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-slate-800 border border-slate-700'}`}>
                        <span className="text-lg block">{t.icon}</span>
                        <span className="text-[8px] text-slate-500">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Notification title..." className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] outline-none focus:border-primary-500" />
                  
                  <textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Message (optional)..." rows={2} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] outline-none focus:border-primary-500 resize-none" />
                  
                  <select value={notifTiming} onChange={(e) => setNotifTiming(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px]">
                    {NOTIFICATION_TIMING_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  
                  <select value={notifLinkedStage} onChange={(e) => setNotifLinkedStage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px]">
                    <option value="">Link to stage (optional)</option>
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button onClick={addNotification} disabled={!notifTitle.trim()}
                    className="flex-1 py-2.5 rounded-lg bg-primary-500 text-white text-[11px] font-medium hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Create Notification
                  </button>
                  <button onClick={() => setShowNotificationModal(false)} className="px-6 py-2.5 rounded-lg bg-slate-800 text-slate-400 text-[11px] hover:bg-slate-700 transition-all">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Options */}
        <AnimatePresence>
          {showViewOptions && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-12 right-2 z-50 w-48 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl">
              <h4 className="text-[10px] font-medium text-white mb-2">View Options</h4>
              {[
                { label: 'Show Timers', value: showTimers, set: setShowTimers },
                { label: 'Compact Leads', value: compactLeads, set: setCompactLeads },
                { label: 'Grid View', value: gridViewLeads, set: setGridViewLeads },
              ].map(opt => (
                <label key={opt.label} className="flex items-center justify-between py-1.5">
                  <span className="text-[10px] text-slate-400">{opt.label}</span>
                  <button onClick={() => opt.set(!opt.value)} className={`w-8 h-4 rounded-full transition-all ${opt.value ? 'bg-primary-500' : 'bg-slate-700'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${opt.value ? 'translate-x-4' : 'translate-x-0.5'}`} />
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
          <motion.div initial={{ x: 280 }} animate={{ x: 0 }} exit={{ x: 280 }}
            className="absolute right-0 top-0 bottom-0 w-64 bg-slate-900/98 border-l border-slate-800 z-50 flex flex-col">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-white">👤 Profiles ({profiles.length}/{MAX_PROFILES})</h2>
              <button onClick={() => setShowProfilesSidebar(false)} className="text-slate-400 hover:text-white text-sm">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {profiles.map(p => (
                <div key={p.id} onClick={() => loadProfile(p.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${activeProfileId === p.id ? 'bg-primary-500/20 border-primary-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white">{p.name}</span>
                    {profiles.length > 1 && <button onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }} className="text-red-400 text-[9px] hover:text-red-300">×</button>}
                  </div>
                  <div className="text-[9px] text-slate-500">{p.stages?.length || 0} stages</div>
                  {activeProfileId === p.id && <div className="text-[8px] text-primary-400 mt-0.5">✓ Active</div>}
                </div>
              ))}
              {profiles.length < MAX_PROFILES && (
                <div className="p-2.5 rounded-lg border border-dashed border-slate-700">
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                    placeholder="New profile..." className="w-full bg-transparent text-white text-[10px] mb-1.5 outline-none" />
                  <button onClick={() => { if (profileName.trim()) { createProfile(profileName.trim()); setProfileName(''); } }}
                    disabled={!profileName.trim()} className="w-full py-1.5 rounded-lg bg-primary-500/20 text-primary-400 text-[9px] disabled:opacity-50 hover:bg-primary-500/30 transition-all">+ Create</button>
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
      <div className="px-3 py-1.5 rounded-lg font-bold relative" style={{ fontSize: label.fontSize, color: label.color, backgroundColor: label.bgColor || 'transparent' }}>
        {label.text}
        {hover && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center hover:bg-red-600">×</button>}
      </div>
    </div>
  );
}

// ============ STAGE NODE ============
function StageNode({ stage, leads, isSelected, isEditing, isConnecting, isDropTarget, simpleMode, showTimers, compactLeads, gridViewLeads, zoom, linkedTemplates, allTemplates, getTimeSinceContact, onSelect, onEdit, onMove, onResize, onDelete, onConnect, onDrop, onDragLead, onViewLead, onToggleStar, starredLeads, onUpdateStage }: any) {
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

  const leadH = compactLeads ? 32 : gridViewLeads ? 40 : 44;
  const headerH = 52;
  const visibleLeads = gridViewLeads 
    ? Math.floor((stage.height - headerH) / leadH) * 2
    : Math.floor((stage.height - headerH) / leadH);

  return (
    <div className="stage-node absolute" style={{ left: stage.x, top: stage.y, zIndex: isSelected ? 100 : 1 }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      {!simpleMode && (
        <>
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-600" />
          <button onClick={onConnect} className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] transition-all ${isConnecting ? 'bg-yellow-500 border-yellow-400 text-white' : 'bg-primary-500/30 border-primary-400/60 text-primary-400 hover:bg-primary-500/50'}`}>+</button>
        </>
      )}
      
      <motion.div onClick={onSelect} onMouseDown={handleMouseDown} onDoubleClick={onEdit}
        className={`relative rounded-2xl overflow-hidden backdrop-blur-xl bg-gradient-to-br ${color.bg} border-2 transition-all ${isSelected ? `${color.border} ring-2 ring-${stage.color}-500/20` : 'border-slate-700/60 hover:border-slate-600'} ${isConnecting ? 'ring-2 ring-yellow-400/40' : ''} ${isDropTarget ? 'ring-2 ring-green-400/40' : ''} ${dragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'}`}
        style={{ width: stage.width, height: stage.height }}>
        
        {/* Header */}
        <div className="px-3 py-2 border-b border-slate-700/40 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{stage.icon}</span>
            <span className="text-[11px] font-bold text-white truncate">{stage.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {stage.emailTemplateId && <span className="text-[10px]" title="Has email">✉️</span>}
            {stage.followUpMethod && stage.followUpMethod !== 'none' && <span className="text-[10px]" title={stage.followUpMethod}>{FOLLOW_UP_METHODS.find(f => f.id === stage.followUpMethod)?.icon}</span>}
            {stage.meetingType && stage.meetingType !== 'none' && <span className="text-[10px]" title={stage.meetingType}>{MEETING_TYPES.find(m => m.id === stage.meetingType)?.icon}</span>}
            <div className={`px-2 py-0.5 rounded-lg bg-slate-900/80 ${color.text} text-[11px] font-bold`}>{leads.length}</div>
          </div>
        </div>

        {/* Leads */}
        <div className="p-2 overflow-hidden" style={{ height: stage.height - headerH }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="text-2xl mb-1">📥</div>
              <div className="text-[9px]">Drop leads here</div>
            </div>
          ) : (
            <div className={gridViewLeads ? 'grid grid-cols-2 gap-1' : 'space-y-1'}>
              {leads.slice(0, visibleLeads).map((lead: Lead) => (
                <div key={lead.id} draggable onDragStart={() => onDragLead(lead)} onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-card flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 cursor-grab transition-all"
                  style={{ height: leadH }}>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center ${color.text} text-[9px] font-bold flex-shrink-0`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-white font-medium truncate">{lead.formData.fullName}</div>
                    {!compactLeads && <div className="text-[8px] text-slate-500 truncate">{lead.formData.phone}</div>}
                  </div>
                  {showTimers && <span className="text-[8px] text-slate-500 flex-shrink-0">{getTimeSinceContact(lead)}</span>}
                  <button onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }} className="text-[10px] flex-shrink-0">{starredLeads.has(lead.id) ? '⭐' : '☆'}</button>
                </div>
              ))}
              {leads.length > visibleLeads && <div className="text-center text-[8px] text-slate-500 py-1">+{leads.length - visibleLeads} more</div>}
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-40 hover:opacity-100" onMouseDown={handleResize}>
          <svg className="w-full h-full text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22Z" /></svg>
        </div>

        {/* Selection Controls */}
        {isSelected && (
          <div className="absolute -top-7 left-0 right-0 flex items-center justify-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-1.5 py-0.5 rounded-lg bg-slate-800 text-white text-[8px] hover:bg-slate-700">✏️ Edit</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-1.5 py-0.5 rounded-lg bg-red-500/20 text-red-400 text-[8px] hover:bg-red-500/30">🗑️ Delete</button>
          </div>
        )}
      </motion.div>

      {/* Edit Panel */}
      {isEditing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="edit-panel absolute top-full left-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl p-3 z-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <input value={stage.label} onChange={(e) => onUpdateStage({ label: e.target.value })} className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[10px] outline-none focus:border-primary-500" />
            <div className="grid grid-cols-6 gap-1">
              {STAGE_COLORS.slice(0, 6).map(c => (
                <button key={c.id} onClick={() => onUpdateStage({ color: c.id })} className={`h-5 rounded-lg bg-gradient-to-br ${c.bg} border-2 ${stage.color === c.id ? c.border : 'border-transparent hover:border-slate-600'}`} />
              ))}
            </div>
            <select value={stage.followUpMethod || ''} onChange={(e) => onUpdateStage({ followUpMethod: e.target.value || undefined })} className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[9px]">
              <option value="">No Follow-up</option>
              {FOLLOW_UP_METHODS.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <select value={stage.meetingType || ''} onChange={(e) => onUpdateStage({ meetingType: e.target.value || undefined })} className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[9px]">
              <option value="">No Meeting</option>
              {MEETING_TYPES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}
