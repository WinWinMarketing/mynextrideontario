'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';
import { 
  PipelineStage, NodeConnection, TextLabel, WorkspaceProfile, WorkspaceSettings, EmailTemplate,
  STAGE_COLORS, DEFAULT_AUTOMATION, DEFAULT_CONTACT_SETTINGS, DEFAULT_WORKSPACE_SETTINGS, DEFAULT_EMAIL_TEMPLATES,
  MAX_PROFILES, STORAGE_KEY, ACTIVE_PROFILE_KEY, MEETING_TYPES, FOLLOW_UP_METHODS
} from './types';
import { ALL_PRESETS } from './presets';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  // ============ STATE ============
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Workspace state
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showProfilesSidebar, setShowProfilesSidebar] = useState(false);
  const [profileName, setProfileName] = useState('');
  
  // Canvas state
  const [zoom, setZoom] = useState(0.55);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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
  const [showPresets, setShowPresets] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

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
      const defaultPreset = ALL_PRESETS[0];
      setStages(defaultPreset.stages);
      setConnections(defaultPreset.connections);
      setLabels(defaultPreset.labels);
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
      // Update existing
      const updated = profiles.map(p => 
        p.id === activeProfileId ? {
          ...p,
          updatedAt: now,
          stages, connections, labels, emailTemplates,
          settings: { zoom, panX: pan.x, panY: pan.y, showGrid: true, showConnections: true, defaultStageWidth: 340, defaultStageHeight: 320 }
        } : p
      );
      setProfiles(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else if (name) {
      // Create new
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
        settings: { zoom, panX: pan.x, panY: pan.y, showGrid: true, showConnections: true, defaultStageWidth: 340, defaultStageHeight: 320 }
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
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = () => setIsDragging(false);
  
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(z => Math.max(0.2, Math.min(1.5, z + delta)));
  };

  // ============ STAGES ============
  const handleStageMove = (stageId: string, dx: number, dy: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? {
      ...s,
      x: Math.max(2, Math.min(95, s.x + dx * 0.08 / zoom)),
      y: Math.max(5, Math.min(92, s.y + dy * 0.08 / zoom)),
    } : s));
  };

  const handleStageResize = (stageId: string, dw: number, dh: number) => {
    setStages(prev => prev.map(s => s.id === stageId ? {
      ...s,
      width: Math.max(200, Math.min(500, s.width + dw)),
      height: Math.max(200, Math.min(500, s.height + dh)),
    } : s));
  };

  const addStage = () => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      label: 'New Stage',
      statusId: 'working',
      x: 50, y: 50,
      width: 360, height: 340,
      color: 'blue',
      icon: '⭐',
      contactMethods: [],
      automationSettings: DEFAULT_AUTOMATION,
    };
    setStages([...stages, newStage]);
    setSelectedStage(newStage.id);
    setEditingStage(newStage.id);
  };

  const deleteStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
    setConnections(connections.filter(c => c.fromStageId !== id && c.toStageId !== id));
    if (selectedStage === id) setSelectedStage(null);
  };

  // ============ CONNECTIONS ============
  const startConnection = (stageId: string) => {
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

  const deleteConnection = (id: string) => {
    setConnections(connections.filter(c => c.id !== id));
  };

  // ============ PRESETS ============
  const applyPreset = (preset: typeof ALL_PRESETS[0]) => {
    setStages(preset.stages);
    setConnections(preset.connections);
    setLabels(preset.labels);
    setEmailTemplates(preset.emailTemplates);
    setZoom(0.5);
    setPan({ x: 0, y: 0 });
    setShowPresets(false);
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

  // Get connection path
  const getPath = (from: PipelineStage, to: PipelineStage) => {
    const fromX = from.x + 5;
    const fromY = from.y;
    const toX = to.x - 5;
    const toY = to.y;
    const midX = (fromX + toX) / 2;
    return `M ${fromX}% ${fromY}% C ${midX}% ${fromY}%, ${midX}% ${toY}%, ${toX}% ${toY}%`;
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const deadCount = leads.filter(l => l.status === 'dead').length;

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 px-6 py-4 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🚀</span>
                Pipeline Workspace
              </h1>
              <p className="text-sm text-slate-500">
                {activeProfile ? `Profile: ${activeProfile.name}` : 'No profile selected'} • {stages.length} stages • {leads.length} leads
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Zoom */}
            <div className="flex items-center gap-2 bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-700/50">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="text-slate-400 hover:text-white">−</button>
              <span className="text-sm text-slate-400 w-14 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="text-slate-400 hover:text-white">+</button>
            </div>

            {/* Fit View */}
            <button
              onClick={() => { setZoom(0.5); setPan({ x: 0, y: 0 }); }}
              className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/50 text-slate-400 hover:text-white text-sm"
            >
              Fit View
            </button>

            {/* Save */}
            <button
              onClick={() => activeProfileId ? saveProfile() : setShowProfilesSidebar(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium"
            >
              💾 Save
            </button>

            {/* Export Dead */}
            {deadCount > 0 && (
              <button onClick={exportDeadLeads} className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 text-sm">
                📥 Export Dead ({deadCount})
              </button>
            )}

            {/* Profiles */}
            <button
              onClick={() => setShowProfilesSidebar(!showProfilesSidebar)}
              className="px-4 py-2 rounded-xl bg-primary-500/20 border border-primary-500/50 text-primary-400 hover:bg-primary-500/30 text-sm font-medium"
            >
              👤 Profiles
            </button>
          </div>
        </div>
      </header>

      {/* Left Sidebar - Presets & Templates */}
      <motion.div
        className="absolute left-0 top-20 bottom-20 z-30 w-80 bg-slate-900/95 border-r border-slate-800 rounded-r-2xl overflow-hidden flex flex-col"
        initial={{ x: -320 }}
        animate={{ x: showPresets ? 0 : -280 }}
      >
        {/* Toggle */}
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-20 bg-slate-800 rounded-r-xl flex items-center justify-center text-slate-400 hover:text-white"
        >
          {showPresets ? '◀' : '▶'}
        </button>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setShowTemplates(false)}
            className={`flex-1 py-3 text-sm font-medium ${!showTemplates ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500'}`}
          >
            📊 Presets
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className={`flex-1 py-3 text-sm font-medium ${showTemplates ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500'}`}
          >
            ✉️ Templates
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
          {!showTemplates ? (
            <div className="space-y-3">
              <button
                onClick={addStage}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/50 text-left hover:from-primary-500/30 hover:to-purple-500/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="text-sm font-semibold text-white">Add Custom Node</div>
                    <div className="text-xs text-slate-400">Create your own stage</div>
                  </div>
                </div>
              </button>

              <div className="text-xs text-slate-500 uppercase tracking-wider mt-4 mb-2">Quick Presets</div>
              
              {ALL_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{preset.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{preset.name}</div>
                      <div className="text-xs text-slate-500">{preset.stages.length} stages</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {emailTemplates.map(template => (
                <div key={template.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{template.category === 'welcome' ? '👋' : template.category === 'follow-up' ? '🔄' : template.category === 'closing' ? '🎯' : '✉️'}</span>
                    <div className="text-sm font-medium text-white">{template.name}</div>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">Subject: {template.subject}</div>
                  <div className="text-xs text-slate-500 line-clamp-3 bg-slate-900/50 p-2 rounded">{template.body.slice(0, 150)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute w-[200%] h-[200%]"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}
        >
          {/* Labels */}
          {labels.map(label => (
            <div
              key={label.id}
              className="absolute pointer-events-none select-none font-bold"
              style={{ left: `${label.x}%`, top: `${label.y}%`, fontSize: label.fontSize, color: label.color, transform: 'translate(-50%, -50%)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            >
              {label.text}
            </div>
          ))}

          {/* Connections SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrowhead" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto">
                <polygon points="0 0, 12 5, 0 10" fill="#3b82f6" />
              </marker>
              <marker id="arrowhead-gray" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto">
                <polygon points="0 0, 12 5, 0 10" fill="#64748b" />
              </marker>
            </defs>
            
            {connections.map(conn => {
              const from = stages.find(s => s.id === conn.fromStageId);
              const to = stages.find(s => s.id === conn.toStageId);
              if (!from || !to) return null;
              
              const isSelected = selectedStage === conn.fromStageId || selectedStage === conn.toStageId;
              
              return (
                <g key={conn.id}>
                  <path
                    d={getPath(from, to)}
                    fill="none"
                    stroke={conn.style === 'dashed' ? '#64748b' : '#3b82f6'}
                    strokeWidth={isSelected ? 4 : 3}
                    strokeDasharray={conn.style === 'dashed' ? '12 8' : 'none'}
                    markerEnd={conn.style === 'dashed' ? 'url(#arrowhead-gray)' : 'url(#arrowhead)'}
                    opacity={isSelected ? 1 : 0.7}
                  />
                  {conn.label && (
                    <text
                      x={`${(from.x + to.x) / 2}%`}
                      y={`${(from.y + to.y) / 2 - 2}%`}
                      fill="#94a3b8"
                      fontSize="14"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Connecting preview */}
            {connectingFrom && (
              <line
                x1={`${stages.find(s => s.id === connectingFrom)?.x || 50}%`}
                y1={`${stages.find(s => s.id === connectingFrom)?.y || 50}%`}
                x2="50%"
                y2="50%"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeDasharray="10 6"
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
              onConnect={() => startConnection(stage.id)}
              onDrop={() => handleDropOnStage(stage.id)}
              onDragLead={setDraggedLead}
              onViewLead={onViewDetails}
              onToggleStar={onToggleStar}
              starredLeads={starredLeads}
              onUpdateStage={(updates) => setStages(prev => prev.map(s => s.id === stage.id ? { ...s, ...updates } : s))}
            />
          ))}
        </div>
      </div>

      {/* Profiles Sidebar (Right) */}
      <AnimatePresence>
        {showProfilesSidebar && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900/98 border-l border-slate-800 z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">👤 Workspace Profiles</h2>
                <button onClick={() => setShowProfilesSidebar(false)} className="text-slate-400 hover:text-white text-xl">×</button>
              </div>
              <p className="text-sm text-slate-500">Save up to {MAX_PROFILES} pipeline configurations</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    activeProfileId === profile.id
                      ? 'bg-primary-500/20 border-primary-500/50'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                  onClick={() => loadProfile(profile.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-white">{profile.name}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">
                    {profile.stages.length} stages • Updated {new Date(profile.updatedAt).toLocaleDateString()}
                  </div>
                  {activeProfileId === profile.id && (
                    <div className="mt-2 text-xs text-primary-400">✓ Active</div>
                  )}
                </div>
              ))}

              {profiles.length < MAX_PROFILES && (
                <div className="p-4 rounded-xl border border-dashed border-slate-700">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="New profile name..."
                    className="w-full bg-transparent text-white text-sm mb-3 outline-none"
                  />
                  <button
                    onClick={() => { if (profileName.trim()) { saveProfile(profileName.trim()); setProfileName(''); } }}
                    disabled={!profileName.trim()}
                    className="w-full py-2 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-medium hover:bg-primary-500/30 disabled:opacity-50"
                  >
                    + Create Profile
                  </button>
                </div>
              )}

              {profiles.length >= MAX_PROFILES && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                  <p className="text-sm text-yellow-400">Maximum {MAX_PROFILES} profiles reached</p>
                  <p className="text-xs text-slate-500 mt-1">Contact developer for more</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-40 px-6 py-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-slate-500">
            <span>Stages: <span className="text-primary-400 font-medium">{stages.length}</span></span>
            <span>Connections: <span className="text-blue-400 font-medium">{connections.length}</span></span>
            <span>Leads: <span className="text-white font-medium">{leads.length}</span></span>
            {connectingFrom && <span className="text-yellow-400 animate-pulse">🔗 Click another node to connect</span>}
          </div>
          <div className="text-slate-600 text-xs">
            Scroll to zoom • Drag to pan • Click nodes to select
          </div>
        </div>
      </footer>
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
  onConnect: () => void;
  onDrop: () => void;
  onDragLead: (lead: Lead | null) => void;
  onViewLead: (lead: Lead) => void;
  onToggleStar: (id: string) => void;
  starredLeads: Set<string>;
  onUpdateStage: (updates: Partial<PipelineStage>) => void;
}

function StageNode({
  stage, leads, isSelected, isEditing, isConnecting, isDropTarget, zoom, emailTemplates,
  onSelect, onEdit, onMove, onResize, onDelete, onConnect, onDrop, onDragLead, onViewLead, onToggleStar, starredLeads, onUpdateStage
}: StageNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  const colorConfig = STAGE_COLORS.find(c => c.id === stage.color) || STAGE_COLORS[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.lead-card') || (e.target as HTMLElement).closest('.resize-handle') || (e.target as HTMLElement).closest('.edit-panel')) return;
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

  const visibleLeads = Math.floor((stage.height - 100) / 60);
  const template = emailTemplates.find(t => t.id === stage.emailTemplateId);

  return (
    <div
      className="stage-node absolute"
      style={{ left: `${stage.x}%`, top: `${stage.y}%`, transform: 'translate(-50%, -50%)', zIndex: isSelected ? 100 : 1 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <motion.div
        onClick={onSelect}
        onMouseDown={handleMouseDown}
        onDoubleClick={onEdit}
        className={`
          relative rounded-3xl overflow-hidden backdrop-blur-xl
          bg-gradient-to-br ${colorConfig.bg}
          border-2 transition-all duration-200
          ${isSelected ? `${colorConfig.border} ring-4 ring-${stage.color}-500/30` : 'border-slate-700/60 hover:border-slate-600'}
          ${isConnecting ? 'ring-4 ring-yellow-400/50' : ''}
          ${isDropTarget ? 'ring-4 ring-green-400/50 scale-[1.02]' : ''}
          ${isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'}
        `}
        style={{ width: stage.width, height: stage.height }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700/40 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{stage.icon}</span>
            <div>
              <div className="text-base font-bold text-white">{stage.label}</div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                {stage.followUpMethod && <span>{FOLLOW_UP_METHODS.find(f => f.id === stage.followUpMethod)?.icon}</span>}
                {stage.meetingType && <span>{MEETING_TYPES.find(m => m.id === stage.meetingType)?.icon}</span>}
                {template && <span title={template.name}>✉️</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl bg-slate-900/80 ${colorConfig.border} ${colorConfig.text} text-lg font-bold`}>
              {leads.length}
            </div>
          </div>
        </div>

        {/* Leads */}
        <div className="p-3 overflow-hidden" style={{ height: stage.height - 80 }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-5xl mb-3">📥</div>
              <div className="text-sm text-slate-500">Drop leads here</div>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, visibleLeads).map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => onDragLead(lead)}
                  onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-card flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-slate-700"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorConfig.bg} ${colorConfig.border} flex items-center justify-center ${colorConfig.text} text-sm font-bold`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{lead.formData.fullName}</div>
                    <div className="text-xs text-slate-500 truncate">{lead.formData.vehicleType || lead.formData.phone}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }}
                    className="text-lg"
                  >
                    {starredLeads.has(lead.id) ? '⭐' : '☆'}
                  </button>
                </div>
              ))}
              {leads.length > visibleLeads && (
                <div className="text-center text-xs text-slate-500 py-2">+{leads.length - visibleLeads} more</div>
              )}
            </div>
          )}
        </div>

        {/* Connection Points */}
        <div
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-600 cursor-pointer hover:border-primary-400 hover:bg-primary-500/30"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onConnect(); }}
          className={`absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
            isConnecting
              ? 'bg-yellow-500 border-yellow-400 text-white'
              : 'bg-primary-500/30 border-primary-400/60 text-primary-400 hover:bg-primary-500/50'
          }`}
        >
          +
        </button>

        {/* Resize Handle */}
        <div
          className="resize-handle absolute bottom-1 right-1 w-6 h-6 cursor-se-resize opacity-50 hover:opacity-100"
          onMouseDown={handleResize}
        >
          <svg className="w-full h-full text-slate-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>

        {/* Controls (when selected) */}
        {isSelected && (
          <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs hover:bg-slate-700">✏️ Edit</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30">🗑️ Delete</button>
          </div>
        )}
      </motion.div>

      {/* Edit Panel */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="edit-panel absolute top-full left-0 mt-4 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 z-50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-semibold text-white mb-4">Edit Stage</div>
          
          <div className="space-y-3">
            <input
              value={stage.label}
              onChange={(e) => onUpdateStage({ label: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              placeholder="Stage name"
            />
            
            <div className="grid grid-cols-6 gap-1">
              {STAGE_COLORS.slice(0, 6).map(c => (
                <button
                  key={c.id}
                  onClick={() => onUpdateStage({ color: c.id })}
                  className={`h-8 rounded-lg bg-gradient-to-br ${c.bg} border-2 ${stage.color === c.id ? c.border : 'border-transparent'}`}
                />
              ))}
            </div>
            
            <select
              value={stage.followUpMethod || ''}
              onChange={(e) => onUpdateStage({ followUpMethod: e.target.value as any || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">No follow-up method</option>
              {FOLLOW_UP_METHODS.map(f => (
                <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
              ))}
            </select>
            
            <select
              value={stage.meetingType || ''}
              onChange={(e) => onUpdateStage({ meetingType: e.target.value as any || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">No meeting type</option>
              {MEETING_TYPES.map(m => (
                <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
              ))}
            </select>
            
            <select
              value={stage.emailTemplateId || ''}
              onChange={(e) => onUpdateStage({ emailTemplateId: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">No email template</option>
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
