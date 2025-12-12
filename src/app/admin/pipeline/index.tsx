'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';
import { 
  PipelineStage, MessageNode, NodeConnection, TextLabel, WorkspaceProfile, InlineAction,
  STAGE_COLORS, DEFAULT_WORKSPACE_SETTINGS, DEAD_LEAD_CATEGORIES, TIMER_PRESETS, NODE_SIZES,
  MAX_PROFILES, STORAGE_KEY, ACTIVE_PROFILE_KEY, StageColor, PipelineAnalytics
} from './types';
import { ALL_PRESETS, Preset, PRESET_CATEGORIES } from './presets';
import { EMAIL_TEMPLATES, SMS_TEMPLATES, CALL_TEMPLATES, ALL_TEMPLATES, MessageTemplate } from './templates';

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
  const [zoom, setZoom] = useState(0.35);
  const [pan, setPan] = useState({ x: 80, y: 80 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  // Pipeline
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [messageNodes, setMessageNodes] = useState<MessageNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [labels, setLabels] = useState<TextLabel[]>([]);
  
  // UI State
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<'stage' | 'message' | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ id: string; type: 'stage' | 'message' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Sidebar
  const [sidebarTab, setSidebarTab] = useState<'presets' | 'stages' | 'messages' | 'templates' | 'settings'>('presets');
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [presetPreview, setPresetPreview] = useState<Preset | null>(null);

  // Node Editor
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [showInlineActions, setShowInlineActions] = useState<string | null>(null);

  // Grid Settings
  const [gridSize, setGridSize] = useState(40);
  const [snapToGrid, setSnapToGrid] = useState(false); // Disabled by default for smooth movement
  const [nodeSize, setNodeSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('large');
  const [showGrid, setShowGrid] = useState(true);
  
  // View Mode - Builder hides action nodes for easier lead management
  const [viewMode, setViewMode] = useState<'builder' | 'node'>('node');

  // Analytics
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);

  // Upload Leads Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState<string>('');
  const [uploadParsed, setUploadParsed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Template Selection for Actions
  const [selectedTemplateType, setSelectedTemplateType] = useState<'email' | 'sms' | 'call'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  // ============ SAVE STATE ============
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [showSaveReminder, setShowSaveReminder] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // ============ UNDO/REDO HISTORY ============
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && activeProfileId) {
        manualSave();
      }
    }, 60000); // Auto-save every minute
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, activeProfileId]);

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
      setSaveNotification('↩️ Undo');
      setTimeout(() => setSaveNotification(null), 1500);
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
      setSaveNotification('↪️ Redo');
      setTimeout(() => setSaveNotification(null), 1500);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
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
      if (e.key === 'Delete' && selectedNode) {
        deleteSelectedNode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedNode]);

  // Delete selected node
  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    if (selectedNodeType === 'stage') {
      setStages(stages.filter(s => s.id !== selectedNode));
      setConnections(connections.filter(c => c.fromNodeId !== selectedNode && c.toNodeId !== selectedNode));
    } else {
      setMessageNodes(messageNodes.filter(m => m.id !== selectedNode));
      setConnections(connections.filter(c => c.fromNodeId !== selectedNode && c.toNodeId !== selectedNode));
    }
    setSelectedNode(null);
    setSelectedNodeType(null);
  };

  // Save reminder
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => setShowSaveReminder(true), 120000);
      return () => clearTimeout(timer);
    } else {
      setShowSaveReminder(false);
    }
  }, [hasUnsavedChanges]);

  // ============ SAVE TO CLOUD (S3) ============
  const manualSave = useCallback(async () => {
    if (activeProfileId) {
      setIsLoading(true);
      const now = new Date().toISOString();
      const updatedProfile = { 
        id: activeProfileId,
        name: profiles.find(p => p.id === activeProfileId)?.name || 'Workflow',
        createdAt: profiles.find(p => p.id === activeProfileId)?.createdAt || now,
        updatedAt: now, 
        stages, 
        messageNodes,
        connections, 
        labels,
        emailTemplates: [],
        settings: { 
          ...DEFAULT_WORKSPACE_SETTINGS, 
          zoom, 
          panX: pan.x, 
          panY: pan.y,
          gridSize,
          snapToGrid,
          nodeSize,
          showGrid,
        } 
      };

      // Update local state
      const updated = profiles.map(p => 
        p.id === activeProfileId ? updatedProfile : p
      );
      setProfiles(updated);

      // Save to Cloud (AWS S3) - Robust save with proper structure
      const payload = {
        profiles: updated,
        activeProfile: updatedProfile,
        metadata: {
          savedAt: now,
          profileCount: updated.length,
          activeProfileId: activeProfileId,
        }
      };
      
      console.log('💾 Saving to S3:', { profileId: activeProfileId, stageCount: stages.length, connectionCount: connections.length });
      
      try {
        const response = await fetch('/api/admin/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include', // Include auth cookies
        });
        
        // Try to parse response as JSON
        let result;
        try {
          const text = await response.text();
          result = text ? JSON.parse(text) : { success: false, error: 'Empty response' };
        } catch (parseErr) {
          console.error('❌ Failed to parse S3 response:', parseErr);
          result = { success: false, error: 'Invalid response from server' };
        }
        
        if (response.ok && result.success) {
          console.log('✅ S3 Save successful:', result);
          setSaveNotification('☁️ Saved to cloud! (' + (result.savedCount || 1) + ' profiles)');
        } else {
          console.error('❌ S3 Save failed:', result, 'Status:', response.status);
          setSaveNotification('⚠️ Cloud save failed: ' + (result.error || result.details || `HTTP ${response.status}`));
        }
      } catch (err) {
        console.error('❌ Cloud save error:', err);
        setSaveNotification('⚠️ Network error - check connection');
      }

      setIsLoading(false);
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);
      setShowSaveReminder(false);
      setTimeout(() => setSaveNotification(null), 2000);
    }
  }, [activeProfileId, stages, messageNodes, connections, labels, zoom, pan, profiles, gridSize, snapToGrid, nodeSize, showGrid]);

  // ============ LOAD - TRY S3 FIRST, THEN LOCAL ============
  useEffect(() => {
    const loadWorkflows = async () => {
      // Try to load from S3 first
      try {
        const response = await fetch('/api/admin/workflows');
        if (response.ok) {
          const data = await response.json();
          if (data.workflows && data.workflows.length > 0) {
            // Load full workflow data for each
            const fullWorkflows = await Promise.all(
              data.workflows.map(async (w: any) => {
                const fullRes = await fetch(`/api/admin/workflows?id=${w.id}`);
                if (fullRes.ok) return fullRes.json();
                return null;
              })
            );
            const validWorkflows = fullWorkflows.filter(Boolean);
            if (validWorkflows.length > 0) {
              setProfiles(validWorkflows);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(validWorkflows));
              loadProfileData(validWorkflows[0]);
              setActiveProfileId(validWorkflows[0].id);
              localStorage.setItem(ACTIVE_PROFILE_KEY, validWorkflows[0].id);
              return;
            }
          }
        }
      } catch (err) {
        console.log('S3 load failed, trying local storage:', err);
      }

      // Fall back to local storage
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
    };

    loadWorkflows();
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
    setZoom(p.settings?.zoom || 0.35); 
    setPan({ x: p.settings?.panX || 80, y: p.settings?.panY || 80 });
    setGridSize(p.settings?.gridSize || 40);
    setSnapToGrid(p.settings?.snapToGrid ?? true);
    setNodeSize(p.settings?.nodeSize || 'large');
    setShowGrid(p.settings?.showGrid ?? true);
    setHasUnsavedChanges(false);
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
    
    // Save to cloud
    fetch('/api/admin/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profiles: updated, activeProfile: np }),
    }).catch(() => {
      // Fallback to local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    });
    
    setHasUnsavedChanges(false);
    setSaveNotification('☁️ Profile created!');
    setTimeout(() => setSaveNotification(null), 2000);
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

  // ============ CANVAS PANNING - Like Figma/Runway ============
  // Click ANYWHERE on background to pan, nodes move independently
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Check if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isNode = target.closest('.node-card, .message-node, .inline-panel, .sidebar, button, input, select');
    
    // If clicking on a node, don't pan
    if (isNode) return;
    
    // Clear connection mode on empty click
    if (connectingFrom) { 
      setConnectingFrom(null); 
      return; 
    }
    
    // START PANNING - only on background
    e.preventDefault();
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    setIsDraggingCanvas(true);
    
    // Global mouse tracking for smooth pan even when moving fast
    const onMouseMove = (ev: MouseEvent) => {
      if (!isPanningRef.current) return;
      ev.preventDefault();
      setPan({
        x: ev.clientX - panStartRef.current.x,
        y: ev.clientY - panStartRef.current.y
      });
    };
    
    const onMouseUp = () => {
      isPanningRef.current = false;
      setIsDraggingCanvas(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) { 
      const r = canvasRef.current.getBoundingClientRect(); 
      setMousePos({ x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom }); 
    }
  };

  const handleCanvasMouseUp = () => setIsDraggingCanvas(false);
  
  // ============ SCROLL WHEEL = ZOOM (Industry Standard) ============
  const handleWheel = (e: React.WheelEvent) => { 
    e.preventDefault();
    
    // Scroll wheel = zoom in/out (like Figma, Runway, etc.)
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    
    // Zoom towards cursor position for natural feel
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setZoom(prevZoom => {
        const newZoom = Math.max(0.15, Math.min(1.5, prevZoom + delta));
        
        // Adjust pan to zoom towards cursor
        const zoomRatio = newZoom / prevZoom;
        setPan(prevPan => ({
          x: mouseX - (mouseX - prevPan.x) * zoomRatio,
          y: mouseY - (mouseY - prevPan.y) * zoomRatio,
        }));
        
        return newZoom;
      });
    } else {
      setZoom(z => Math.max(0.15, Math.min(1.5, z + delta)));
    }
  };

  const fitView = () => {
    if (stages.length === 0) { setZoom(0.4); setPan({ x: 100, y: 100 }); return; }
    
    // Find the "New Lead" stage (incoming leads) - this is the focal point
    const newLeadStage = stages.find(s => s.statusId === 'new');
    const cw = containerRef.current?.clientWidth || 1200;
    const ch = containerRef.current?.clientHeight || 800;
    
    if (newLeadStage) {
      // Center on New Lead stage with good zoom for readability
      const targetZoom = 0.45;
      const centerX = newLeadStage.x + newLeadStage.width / 2;
      const centerY = newLeadStage.y + newLeadStage.height / 2;
      
      // Calculate pan to center the New Lead
      const panX = (cw / 2) - (centerX * targetZoom);
      const panY = (ch / 2) - (centerY * targetZoom);
      
      setZoom(targetZoom);
      setPan({ x: panX, y: panY });
    } else {
      // Fallback: fit all nodes
      const allNodes = [...stages, ...messageNodes];
      const xs = allNodes.map(s => s.x), ys = allNodes.map(s => s.y);
      const maxX = Math.max(...xs) + 500, maxY = Math.max(...ys) + 500;
      const nz = Math.min(cw / maxX, ch / maxY, 0.5) * 0.7;
      setZoom(Math.max(0.25, Math.min(0.5, nz))); 
      setPan({ x: 100, y: 100 });
    }
  };

  // Snap to grid helper
  const snapPosition = (pos: number) => {
    if (!snapToGrid) return pos;
    return Math.round(pos / gridSize) * gridSize;
  };

  // ============ NODE MOVEMENT - Smooth without mandatory snapping ============
  const handleNodeMove = (id: string, type: 'stage' | 'message', dx: number, dy: number) => {
    if (type === 'stage') {
      setStages(prev => prev.map(s => {
        if (s.id !== id) return s;
        // Only snap if setting is enabled, otherwise move freely
        const newX = snapToGrid ? snapPosition(s.x + dx / zoom) : Math.round(s.x + dx / zoom);
        const newY = snapToGrid ? snapPosition(s.y + dy / zoom) : Math.round(s.y + dy / zoom);
        return { ...s, x: newX, y: newY };
      }));
    } else {
      setMessageNodes(prev => prev.map(m => {
        if (m.id !== id) return m;
        const newX = snapToGrid ? snapPosition(m.x + dx / zoom) : Math.round(m.x + dx / zoom);
        const newY = snapToGrid ? snapPosition(m.y + dy / zoom) : Math.round(m.y + dy / zoom);
        return { ...m, x: newX, y: newY };
      }));
    }
  };
  
  // ============ AUTO LAYOUT - Center-focused hourglass pattern (no overlap) ============
  const autoLayoutHourglass = () => {
    const deadStages = stages.filter(s => s.statusId === 'dead');
    const newStages = stages.filter(s => s.statusId === 'new');
    const workingStages = stages.filter(s => s.statusId === 'working');
    const approvalStages = stages.filter(s => s.statusId === 'approval');
    const circleBackStages = stages.filter(s => s.statusId === 'circle-back');
    
    // Center point - where NEW LEAD sits (big focal point)
    const centerX = 1400;
    const centerY = 900;
    
    // Spacing constants - larger to PREVENT overlap
    const deadSpacing = 520;       // Vertical gap between dead leads
    const workingSpacing = 550;    // Vertical gap between working stages
    const approvalSpacing = 580;   // Vertical gap between approval stages
    const columnGap = 650;         // Horizontal gap between columns
    
    setStages(prev => prev.map(s => {
      // NEW LEAD - Center, big, focal point
      if (s.statusId === 'new') {
        const idx = newStages.findIndex(n => n.id === s.id);
        return { 
          ...s, 
          x: centerX - 230, 
          y: centerY - 230 + idx * 500, // Stack vertically if multiple new stages
          width: 460,
          height: 460
        };
      }
      
      // DEAD LEADS - Far left column, evenly spaced vertically
      if (s.statusId === 'dead') {
        const idx = deadStages.findIndex(d => d.id === s.id);
        const totalDead = deadStages.length;
        // Center the dead leads vertically around the center point
        const totalHeight = (totalDead - 1) * deadSpacing;
        const startY = centerY - totalHeight / 2;
        return { 
          ...s, 
          x: 100, 
          y: startY + idx * deadSpacing,
          width: 380,
          height: 360
        };
      }
      
      // WORKING - Column(s) to the right of center, evenly distributed
      if (s.statusId === 'working') {
        const idx = workingStages.findIndex(w => w.id === s.id);
        const totalWorking = workingStages.length;
        
        // Determine column and row
        const itemsPerColumn = 3;
        const col = Math.floor(idx / itemsPerColumn);
        const row = idx % itemsPerColumn;
        
        // Calculate position
        const xBase = centerX + columnGap + col * columnGap;
        const rowsInThisColumn = Math.min(itemsPerColumn, totalWorking - col * itemsPerColumn);
        const columnHeight = (rowsInThisColumn - 1) * workingSpacing;
        const startY = centerY - columnHeight / 2;
        
        return { 
          ...s, 
          x: xBase,
          y: startY + row * workingSpacing,
          width: 400,
          height: 380
        };
      }
      
      // APPROVAL/WON - Far right column(s), staggered for visual flow
      if (s.statusId === 'approval') {
        const idx = approvalStages.findIndex(a => a.id === s.id);
        const totalApproval = approvalStages.length;
        
        // Position in columns
        const itemsPerColumn = 2;
        const col = Math.floor(idx / itemsPerColumn);
        const row = idx % itemsPerColumn;
        
        // How many working columns are there?
        const workingCols = Math.ceil(workingStages.length / 3);
        const xBase = centerX + columnGap + workingCols * columnGap + col * approvalSpacing;
        
        // Stack vertically with offset
        const rowsInThisColumn = Math.min(itemsPerColumn, totalApproval - col * itemsPerColumn);
        const columnHeight = (rowsInThisColumn - 1) * approvalSpacing;
        const startY = centerY - columnHeight / 2;
        
        // Last approval stage (usually WON) gets extra size
        const isLast = idx === totalApproval - 1;
        
        return { 
          ...s, 
          x: xBase,
          y: startY + row * approvalSpacing,
          width: isLast ? 460 : 420,
          height: isLast ? 440 : 400
        };
      }
      
      // CIRCLE BACK - Below the center-left area
      if (s.statusId === 'circle-back') {
        const idx = circleBackStages.findIndex(c => c.id === s.id);
        return { 
          ...s, 
          x: centerX - 600 + idx * 450, 
          y: centerY + 600,
          width: 380,
          height: 340
        };
      }
      
      return s;
    }));
    
    // Position message nodes in a neat grid to the far right
    const workingCols = Math.ceil(workingStages.length / 3);
    const approvalCols = Math.ceil(approvalStages.length / 2);
    const msgStartX = centerX + columnGap + (workingCols + approvalCols) * columnGap + 200;
    
    setMessageNodes(prev => prev.map((m, idx) => ({
      ...m,
      x: msgStartX + (idx % 2) * 380,
      y: 200 + Math.floor(idx / 2) * 320
    })));
    
    // Fit view after layout
    setTimeout(fitView, 100);
    
    setSaveNotification('✨ Hourglass layout applied!');
    setTimeout(() => setSaveNotification(null), 2000);
    setHasUnsavedChanges(true);
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
    setHistory([{ stages: p.stages, messageNodes: p.messageNodes, connections: p.connections, labels: p.labels }]);
    setHistoryIndex(0);
    
    // Auto fit and center on New Lead after applying preset
    setTimeout(() => {
      fitView();
      setSaveNotification(`✅ Loaded: ${p.name}`);
      setTimeout(() => setSaveNotification(null), 2000);
    }, 150); 
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

  // Get current node sizes
  const currentNodeSize = NODE_SIZES[nodeSize];

  const filteredPresets = presetCategory === 'all' ? ALL_PRESETS : ALL_PRESETS.filter(p => p.category === presetCategory);
  const deadCount = leads.filter(l => l.status === 'dead').length;

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex">
      {/* PREMIUM LEFT SIDEBAR */}
      <div className="w-[420px] bg-slate-900/95 border-r border-slate-700/50 flex flex-col z-40 flex-shrink-0 sidebar backdrop-blur-xl">
        {/* Header - WinWin Branding */}
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            {/* WinWin Logo - Actual SVG from brand file */}
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-yellow-500/30">
              <svg viewBox="0 0 2428 866" className="w-10 h-4">
                {/* Yellow W shapes */}
                <path fill="#F0CB35" d="M2429,28.5c-10.7,19-21.5,37.6-32.2,56.2c-9,15.5-17.9,31-26.9,46.5c-15.6,26.8-31.3,53.6-46.8,80.5c-15.5,26.7-30.7,53.6-46.1,80.3c-16.2,28-32.5,55.8-48.7,83.8c-16.8,29-33.6,58.1-50.1,87.1c-16.2,28-32.7,55.8-48.9,83.8c-17.8,30.7-35.4,61.5-53.1,92.2c-17.5,30.3-35.2,60.7-52.8,91c-15.5,26.7-30.8,53.5-46.1,80.2c-8.6,14.8-16.9,29.8-25.3,44.6c-4.2,7.3-10.5,11.5-19.4,11.5c-50.2.1-100.4.1-150.5,0c-12.9,0-23.4-14.4-18.7-26.5c3.6-9.1,8.7-17.7,13.4-26.3c8.4-15.1,17-30,25.5-44.9c11.2-19.7,22.4-39.4,33.5-59.2c8-14.2,15.8-28.5,23.8-42.6c11.4-20.2,22.9-40.3,34.3-60.5c7.8-13.9,15.6-27.8,23.4-41.7c11.9-21.2,23.9-42.3,35.8-63.4c9.6-17,19.1-34.1,28.6-51.2c9.7-17.4,19.3-34.8,29-52.2c11-18.8,22.1-37.7,33.1-56.5c9.5-16.3,18.9-32.6,28.4-48.9c11.7-20.6,23.4-41.2,35-61.7c9.6-16.9,19-33.8,28.6-50.7c12.7-22.6,25.6-45.2,38.4-67.8c9.5-16.7,18.8-33.5,28.2-50.3c11.2-19.9,22.5-39.7,33.7-59.6c6.5-11.6,13.1-23.2,19.3-35c3.3-6.3,8.1-10.2,14.9-12.5c62.2-.3,124.4-.3,186.7.3c9.1,2.7,14,8.5,16.2,16.7c4.8,18,9.4,36.1,14.1,54.2c10,38.5,20,77,30,115.6c12.7,49.2,25.4,98.3,38.1,147.5c8.6,33.3,17.1,66.6,25.7,99.9c9.1,35.5,18.3,71,27.5,106.6c4.1,15.9,8.2,31.8,12.6,48.6c.7-1.1,1-1.5,1.2-2c11.7-20.7,23.4-41.5,35.1-62.2c8.2-14.6,16.3-29.3,24.5-44c11.1-19.7,22.4-39.4,33.6-59.1c9.5-16.9,18.9-33.8,28.4-50.7c11.5-20.5,23.1-41,34.7-61.4c8.2-14.7,16.3-29.4,24.5-44.1c12.3-21.9,24.7-43.9,37-65.8c9.8-17.5,19.4-35,29.3-52.5c14-25.9,28.2-51.7,42.3-77.6c11.3-20,22.4-40.2,33.7-60.2c3.9-7,9.1-11.8,17.8-11.7c35.5.1,71,0,106.5-.1c1.9,0,3.7-.6,5.6-1c16.7,0,33.4,0,50.7.3c9.2,1.7,13.9,7.4,17.3,14.7v12.5z"/>
                <path fill="#F0CB35" d="M170.5,1c11.9,2.9,16.4,12.5,21.7,21.5c12.8,22,25.7,43.9,38.5,65.9c13.8,23.7,27.4,47.5,41.2,71.2c13.1,22.5,26.5,45,39.6,67.5c11.5,19.7,22.8,39.5,34.3,59.3c9.9,17,20,33.9,29.9,50.9c11,18.9,21.9,37.8,32.9,56.7c8.6,15.2,17.1,30.4,25.7,45.6c11.4,19.6,22.8,39.3,34.1,58.9c9.8,17.3,19.4,34.6,29.2,51.9c2.2,3.8,4.6,7.6,7,11.5c12.6-18.6,25.2-37,37.7-55.5c21-30.8,41.9-61.6,62.8-92.4c15.6-22.9,31.3-45.8,46.9-68.8c15.7-23.1,31.4-46.2,47.1-69.2c10.3-15.2,30.4-13.9,39.7.1c21.4,31.9,43.6,63.2,65.6,95c16.5,23.7,33.1,47.4,49.6,71c21.5,31,43.1,61.9,64.5,93c6,8.7,12,17.3,18,26.2c-5.1,10.4-10.4,20.4-16,30.2c-12.1,21.4-24.4,42.7-36.5,64c-11,19.3-22.1,38.6-32.8,58.1c-4.9,9.5-12.2,18.4-10.2,30.4c-3,4.6-5.6,9.2-8.2,13.7c-12.3,21.5-24.5,43-36.8,64.5c-16.3,28.5-32.9,56.9-48.9,85.5c-14,24.9-27.6,50-41.3,75c-16.3,27-32.5,54-48.8,80.9c-8.5,15-16.9,30.1-25.4,45c-11.2,19.8-22.4,39.5-33.5,59.4c-8,14.2-15.8,28.5-23.8,42.6c-4.8,8.6-9.9,17.1-13.5,26.3c-4.7,12.1,5.7,26.5,18.6,26.5c50.2.1,100.4,0,150.5,0c6.7,0,12.3-3.3,15.7-8.9c13.9-23.6,27.5-47.4,41.2-71.2c15.7-27.3,31.3-54.7,47-82c15.6-27,31.4-54,47-81c14.8-25.6,29.4-51.3,44.1-77c15.6-27,31.4-54,47-81c15.8-27.3,31.4-54.7,47.1-82c17.2-29.9,34.6-59.6,51.8-89.5c5.2-9.1,13-12.1,22.8-11.2c6.8.6,15,8.1,17.1,16c4.1,15,8,30.1,12.1,45.1c6.9,25.5,13.8,50.9,20.7,76.3c6.8,25,13.6,50,20.4,74.9c6.5,25,13.1,50,19.7,75c6.8,25,13.5,50,20.3,75c6,22.1,12,44.2,18,66.4c6.3,23.2,12.7,46.4,19,69.6c6.8,24.9,13.4,50,20.2,75c2,7.2,10.8,13.6,18.3,13.7c27.8.4,55.5.8,83.3,1c18.5.1,37,.3,55.5.2c8.9-.1,15.2-4.3,19.4-11.6c8.6-14.8,16.8-29.8,25.3-44.6c15.3-26.8,30.7-53.6,46.1-80.3c17.5-30.3,35.3-60.5,52.8-91c16.8-30.3,33.6-60.6,50.5-90.8c17.8-30.7,35.4-61.5,53.1-92.2c16.2-28,32.7-55.8,48.9-83.8c16.8-29,33.6-58.1,50.1-87.1c16.2-28,32.5-55.9,48.7-83.8c15.5-26.7,30.8-53.5,46.1-80.3c15.5-26.8,31.3-53.6,46.8-80.5c9-15.5,17.9-31,26.9-46.5c10.7-19,21.5-37.6,32.2-56.2V1c-6.5,0-12.9,0-19.3.3c-9.2,1.7-13.9,7.4-17.3,14.7c-11.3,20-22.5,39.9-33.6,60c-14,25.9-28.2,51.7-42.2,77.6c-9.8,17.5-19.4,35-29.3,52.5c-12.4,22-24.9,44-37.1,66.1c-8.2,14.6-16.3,29.3-24.5,43.9c-11.5,20.5-23.1,41-34.6,61.4c-9.5,16.9-18.9,33.8-28.4,50.7c-11.1,19.7-22.4,39.4-33.6,59.1c-8.2,14.6-16.2,29.3-24.5,44c-11.7,20.7-23.4,41.5-35.1,62.2c-.2.4-.5.9-1.2,2c-4.4-16.8-8.5-32.7-12.6-48.6c-9.2-35.5-18.4-71-27.5-106.5c-8.6-33.3-17.1-66.6-25.7-99.9c-12.7-49.2-25.4-98.3-38.1-147.5c-10-38.5-20-77-30-115.6c-4.7-18-9.2-36.1-14.1-54.2c-2.2-8.2-7.1-14-16.2-16.7C1740.1,1.3,1678,1.3,1615.8,1c-6.8,2.3-11.6,6.2-14.9,12.5c-6.2,11.8-12.8,23.3-19.3,35c-11.2,19.9-22.5,39.7-33.7,59.6c-6.5,11.6-13.2,23.2-19.7,34.8c-13.7,23.8-27.4,47.5-41.2,71.2c-9.5,16.7-19,33.5-28.4,50.3c-11.2,19.9-22.4,39.8-33.5,59.6c-9.6,17-19.3,33.8-28.9,50.7c-12.8,22.6-25.5,45.2-38.3,67.8c-9.5,17-18.9,34-28.4,51c-11.1,19-22.1,38.1-33.2,57.2c-10.6,18.2-21.2,36.4-31.7,54.7c-9.5,17.1-18.9,34.1-28.3,51.2c-11.9,21.2-23.8,42.4-35.7,63.6c-7.8,13.8-15.6,27.7-23.4,41.6c-11.4,20.2-22.7,40.4-34.1,60.6c-8,14.2-15.8,28.4-23.8,42.6c-11.2,19.7-22.4,39.4-33.5,59.1c-8.5,14.9-16.8,30-25.5,44.9c-3.4,5.5-9,8.8-15.7,8.9c-50.2.1-100.3,0-150.5,0c-12.9,0-23.4-14.4-18.6-26.5c3.6-9.1,8.7-17.6,13.5-26.3c8.4-15.1,16.9-30.1,25.4-45c11.2-19.7,22.4-39.4,33.5-59.2c8-14.2,15.8-28.4,23.8-42.6c11.4-20.2,22.8-40.3,34.3-60.5c7.8-13.9,15.6-27.9,23.4-41.8c11.9-21.2,23.8-42.3,35.8-63.4c9.6-17.1,19.1-34.1,28.6-51.2c10.4-17.9,20.9-35.9,31.3-53.8c11-18.9,21.9-37.9,32.9-56.8c9.6-16.5,19-33,28.6-49.5c11.6-20.3,23.4-40.6,35-60.8c9.6-16.9,19-33.8,28.4-50.7c12.7-22.6,25.6-45.2,38.4-67.7c9.5-16.7,18.8-33.5,28.2-50.3c11.2-19.9,22.5-39.8,33.6-59.7c6.5-11.6,13.1-23.2,19.7-34.7c3.3-6.3,8-10.2,14.8-12.5C119.4,1,144.6,1,170.5,1z"/>
                {/* Dark blue/teal i and elements */}
                <path fill="#4C6971" d="M827.2,717c-.4-.1-.8-.6-1.2-1.5c.4.1.8.6,1.2,1.5z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">WinWin Pipeline</h1>
              <p className="text-sm text-slate-400">Visual Workflow Builder</p>
            </div>
            {/* Upload Leads Button */}
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-yellow-400 hover:from-yellow-500/30 hover:to-amber-500/30 transition-all text-sm font-medium"
              title="Upload Leads"
            >
              📤 Upload
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 bg-slate-800/30">
          {[
            { id: 'presets', label: 'Templates', icon: '📊' }, 
            { id: 'stages', label: 'Stages', icon: '📦' }, 
            { id: 'messages', label: 'Actions', icon: '⚡' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(t => (
            <button key={t.id} onClick={() => setSidebarTab(t.id as any)} 
              className={`flex-1 py-4 text-sm font-semibold transition-all ${sidebarTab === t.id ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
              <span className="block text-lg mb-1">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* PRESETS TAB */}
          {sidebarTab === 'presets' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {PRESET_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setPresetCategory(c.id)} 
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${presetCategory === c.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredPresets.map((p, idx) => (
                  <motion.div key={p.id} 
                    onMouseEnter={() => setPresetPreview(p)} 
                    onMouseLeave={() => setPresetPreview(null)}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-gradient-to-br from-slate-800/90 to-slate-800/60 rounded-2xl border overflow-hidden hover:shadow-lg transition-all ${
                      idx === 0 ? 'border-emerald-500/50 hover:border-emerald-400/70 hover:shadow-emerald-500/10 ring-1 ring-emerald-500/20' : 
                      'border-slate-700/50 hover:border-blue-500/50 hover:shadow-blue-500/10'
                    }`}>
                    {/* WinWin Recommended Badge */}
                    {idx === 0 && (
                      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-4 py-2 border-b border-yellow-500/30">
                        <span className="text-xs font-bold text-yellow-400 flex items-center gap-2">
                          ⭐ WINWIN PICK - Best for getting started
                        </span>
                      </div>
                    )}
                    <button onClick={() => applyPreset(p)} className="w-full p-5 text-left">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-inner ${
                          idx === 0 ? 'bg-gradient-to-br from-emerald-600/30 to-green-700/30' : 'bg-gradient-to-br from-slate-700 to-slate-800'
                        }`}>
                          {p.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{p.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                              p.complexity === 'starter' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                              p.complexity === 'standard' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                              p.complexity === 'advanced' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              p.complexity === 'runway' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {p.complexity === 'starter' ? '⭐ LEVEL 1' : 
                               p.complexity === 'standard' ? '⭐⭐ LEVEL 2' :
                               p.complexity === 'advanced' ? '⭐⭐⭐ LEVEL 3' :
                               p.complexity === 'runway' ? '⭐⭐⭐ LEVEL 3' : 'LEVEL 1'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{p.description}</p>
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-300">📦 {p.stages.length} stages</span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-300">⚡ {p.messageNodes.length} actions</span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-300">⏱️ {p.estimatedSetupTime}</span>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* STAGES TAB */}
          {sidebarTab === 'stages' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white">Add Pipeline Stage</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'New Lead', icon: '📥', color: 'blue' as StageColor, status: 'new' as const },
                  { label: 'Working', icon: '⚙️', color: 'yellow' as StageColor, status: 'working' as const },
                  { label: 'Follow Up', icon: '🔄', color: 'orange' as StageColor, status: 'circle-back' as const },
                  { label: 'Hot Lead', icon: '🔥', color: 'orange' as StageColor, status: 'working' as const },
                  { label: 'Meeting', icon: '📅', color: 'purple' as StageColor, status: 'working' as const },
                  { label: 'Qualified', icon: '✅', color: 'green' as StageColor, status: 'working' as const },
                  { label: 'Proposal', icon: '📋', color: 'emerald' as StageColor, status: 'approval' as const },
                  { label: 'Won!', icon: '🏆', color: 'emerald' as StageColor, status: 'approval' as const },
                ].map(s => (
                  <button key={s.label} onClick={() => {
                    const size = NODE_SIZES[nodeSize];
                    const newStage: PipelineStage = {
                      id: `stage-${Date.now()}`,
                      label: s.label,
                      statusId: s.status,
                      x: snapPosition(500 + stages.length * 50),
                      y: snapPosition(300 + stages.length * 30),
                      width: size.width,
                      height: size.height,
                      color: s.color,
                      icon: s.icon,
                      autoActions: [],
                      inlineActions: [],
                    };
                    setStages([...stages, newStage]);
                  }} className={`p-4 rounded-xl bg-gradient-to-br ${STAGE_COLORS.find(c => c.id === s.color)?.bg} border border-slate-600/50 text-left hover:border-white/30 hover:shadow-lg transition-all`}>
                    <span className="text-2xl block mb-2">{s.icon}</span>
                    <span className="text-base font-semibold text-white">{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <h4 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
                  <span>💀</span> Dead Lead Categories
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {DEAD_LEAD_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => {
                      const size = NODE_SIZES[nodeSize];
                      const newStage: PipelineStage = {
                        id: `dead-${cat.id}-${Date.now()}`,
                        label: cat.label,
                        description: cat.description,
                        statusId: 'dead',
                        deadReason: cat.id,
                        x: snapPosition(50),
                        y: snapPosition(200 + stages.filter(s => s.statusId === 'dead').length * (size.height + 40)),
                        width: size.width,
                        height: size.height,
                        color: cat.color,
                        icon: cat.icon,
                        autoActions: [],
                        inlineActions: [],
                      };
                      setStages([...stages, newStage]);
                    }} className="w-full p-4 rounded-xl bg-slate-800/80 border border-slate-700/50 text-left hover:border-red-500/50 transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
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

          {/* ACTIONS TAB - Template Integration */}
          {sidebarTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Actions</h3>
                <span className="text-xs text-slate-500">{messageNodes.length} on canvas</span>
              </div>
              
              {/* Template Type Selector */}
              <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl">
                {[
                  { id: 'email' as const, label: 'Email', icon: '✉️' },
                  { id: 'sms' as const, label: 'SMS', icon: '💬' },
                  { id: 'call' as const, label: 'Call', icon: '📞' },
                ].map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplateType(t.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedTemplateType === t.id ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Template List - From Templates Tab */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Template</h4>
                {(selectedTemplateType === 'email' ? EMAIL_TEMPLATES.slice(0, 8) : 
                  selectedTemplateType === 'sms' ? SMS_TEMPLATES.slice(0, 8) : 
                  CALL_TEMPLATES.slice(0, 8)).map(tpl => (
                  <button key={tpl.id} onClick={() => {
                    const colorMap = { email: 'blue' as StageColor, sms: 'cyan' as StageColor, call: 'yellow' as StageColor };
                    const newMsg: MessageNode = {
                      id: `msg-${Date.now()}`,
                      type: tpl.category as 'email' | 'sms' | 'call',
                      label: tpl.name,
                      icon: tpl.icon,
                      x: 2000 + messageNodes.length * 80,
                      y: 300 + (messageNodes.length % 4) * 150,
                      width: 320,
                      height: 240,
                      color: colorMap[tpl.category as keyof typeof colorMap] || 'blue',
                      subject: tpl.subject,
                      message: tpl.message,
                      autoTrigger: false,
                      triggerCondition: 'manual',
                      linkedStageIds: [],
                      inlineActions: [],
                      templateId: tpl.id,
                    };
                    setMessageNodes([...messageNodes, newMsg]);
                    setSaveNotification(`✅ Added ${tpl.name}`);
                    setTimeout(() => setSaveNotification(null), 2000);
                  }} className="w-full p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-left hover:border-blue-500/50 transition-all group">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{tpl.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white block truncate">{tpl.name}</span>
                        <span className="text-xs text-slate-500 block">{tpl.useCase}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Automation</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'wait' as const, label: 'Wait', icon: '⏰', color: 'purple' as StageColor },
                    { type: 'notification' as const, label: 'Alert', icon: '🔔', color: 'orange' as StageColor },
                  ].map(m => (
                    <button key={m.type} onClick={() => {
                      const newMsg: MessageNode = {
                        id: `msg-${Date.now()}`,
                        type: m.type,
                        label: m.label,
                        icon: m.icon,
                        x: 2000 + messageNodes.length * 80,
                        y: 300 + (messageNodes.length % 4) * 150,
                        width: 280,
                        height: 180,
                        color: m.color,
                        message: m.type === 'wait' ? 'Wait before next action' : 'Internal notification',
                        autoTrigger: true,
                        triggerCondition: 'on-enter',
                        linkedStageIds: [],
                        inlineActions: [],
                        triggerDelay: m.type === 'wait' ? { value: 24, unit: 'hours', label: '24 hours' } : undefined,
                      };
                      setMessageNodes([...messageNodes, newMsg]);
                    }} className={`p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center hover:border-${m.color}-500/50 transition-all`}>
                      <span className="text-xl block mb-1">{m.icon}</span>
                      <span className="text-xs font-medium text-white">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Presets */}
              <div className="space-y-2 pt-4 border-t border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delay Presets</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '1hr', value: 1, unit: 'hours' as const },
                    { label: '24hr', value: 24, unit: 'hours' as const },
                    { label: '2d', value: 2, unit: 'days' as const },
                    { label: '1wk', value: 1, unit: 'weeks' as const },
                  ].map(t => (
                    <button key={t.label} onClick={() => {
                      const newMsg: MessageNode = {
                        id: `wait-${Date.now()}`,
                        type: 'wait',
                        label: `Wait ${t.label}`,
                        icon: '⏰',
                        x: 2000 + messageNodes.length * 80,
                        y: 300 + (messageNodes.length % 4) * 150,
                        width: 240,
                        height: 160,
                        color: 'purple',
                        message: `Wait ${t.value} ${t.unit}`,
                        autoTrigger: true,
                        triggerCondition: 'on-enter',
                        linkedStageIds: [],
                        inlineActions: [],
                        triggerDelay: { value: t.value, unit: t.unit, label: `${t.value} ${t.unit}` },
                      };
                      setMessageNodes([...messageNodes, newMsg]);
                    }} className="px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-all">
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB - Simplified */}
          {sidebarTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Pipeline Settings</h3>
              
              {/* Auto-Save Status */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xl">☁️</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-400">Cloud Sync Enabled</h4>
                    <p className="text-xs text-slate-400">All changes save automatically to AWS</p>
                  </div>
                </div>
              </div>

              {/* Profile Management */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-300">Profile Management</h4>
                <button onClick={() => setShowProfilesSidebar(true)} className="w-full p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-left hover:border-blue-500/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">👤</div>
                    <div>
                      <span className="text-sm font-medium text-white">Saved Profiles</span>
                      <p className="text-xs text-slate-500">{profiles.length} profiles saved</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Help Section */}
              <div className="space-y-3 pt-4 border-t border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-300">Tips</h4>
                <div className="space-y-2 text-xs text-slate-400">
                  <p>• <strong className="text-slate-300">Builder mode</strong> - Clean view for lead management</p>
                  <p>• <strong className="text-slate-300">Node view</strong> - See all actions & connections</p>
                  <p>• <strong className="text-slate-300">Auto Layout</strong> - Arrange nodes in hourglass pattern</p>
                  <p>• <strong className="text-slate-300">Drag anywhere</strong> - Pan the canvas freely</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 relative">
        {/* Grid Background */}
        {showGrid && (
          <div className="absolute inset-0 opacity-30" style={{ 
            backgroundImage: `linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)`, 
            backgroundSize: `${gridSize}px ${gridSize}px` 
          }} />
        )}

        {/* Premium Header */}
        <header className="absolute top-0 left-0 right-0 z-30 px-6 py-4 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <span className="text-lg">🚀</span>
                <span className="text-base font-semibold text-white">{stages.length} Stages</span>
                <span className="text-slate-500">•</span>
                <span className="text-base text-slate-400">{messageNodes.length} Actions</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Undo/Redo */}
              <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700/50 overflow-hidden">
                <button onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)"
                  className={`px-4 py-2.5 text-lg transition-all border-r border-slate-700/50 ${historyIndex <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
                  ↩️
                </button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)"
                  className={`px-4 py-2.5 text-lg transition-all ${historyIndex >= history.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
                  ↪️
                </button>
              </div>

              {/* Save */}
              <button onClick={manualSave} title="Save (Ctrl+S)"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  hasUnsavedChanges 
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/30' 
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-slate-700/80'
                }`}>
                💾 {hasUnsavedChanges ? 'Save' : 'Saved'}
              </button>

              {/* Zoom */}
              <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-700/50">
                <button onClick={() => setZoom(z => Math.max(0.15, z - 0.1))} className="text-slate-400 px-2 text-lg hover:text-white transition-colors">−</button>
                <span className="text-sm text-white font-semibold w-14 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="text-slate-400 px-2 text-lg hover:text-white transition-colors">+</button>
              </div>
              
              <button onClick={fitView} className="px-5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm font-semibold hover:bg-slate-700/80 transition-all">
                ⊡ Fit
              </button>
              
              <button onClick={autoLayoutHourglass} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border border-yellow-500/50 text-yellow-400 text-sm font-bold hover:from-yellow-500/40 hover:to-amber-500/40 transition-all shadow-lg shadow-yellow-500/10">
                ✨ Auto Layout
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700/50 overflow-hidden">
                <button 
                  onClick={() => setViewMode('builder')} 
                  className={`px-4 py-2.5 text-sm font-medium transition-all ${viewMode === 'builder' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Builder
                </button>
                <button 
                  onClick={() => setViewMode('node')} 
                  className={`px-4 py-2.5 text-sm font-medium transition-all ${viewMode === 'node' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Node View
                </button>
              </div>
              
              {deadCount > 0 && (
                <div className="px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-semibold">
                  💀 {deadCount}
                </div>
              )}
              
              <button onClick={() => setShowProfilesSidebar(!showProfilesSidebar)} 
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 text-blue-400 text-sm font-semibold hover:from-blue-500/30 hover:to-purple-500/30 transition-all">
                👤 Profiles
              </button>
            </div>
          </div>
        </header>

        {/* Save Notification */}
        <AnimatePresence>
          {saveNotification && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold shadow-xl shadow-emerald-500/30">
              {saveNotification}
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
          <div ref={canvasRef} className="absolute" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '10000px', height: '8000px' }}>
            
            {/* Labels */}
            {labels.map(l => (
              <div key={l.id} className="label-node absolute select-none pointer-events-none" style={{ left: l.x, top: l.y }}>
                <div className="px-4 py-2" style={{ fontSize: l.fontSize, color: l.color, fontWeight: l.fontWeight || '800', letterSpacing: '0.02em' }}>
                  {l.text}
                </div>
              </div>
            ))}

            {/* Connections - Hidden in Builder mode - Elegant Curved Paths with Centered Arrows */}
            {viewMode === 'node' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="connGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="connGradientDead" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  {/* Glow filter for connections */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {connections.map(c => {
                  const from = getNodeCenter(c.fromNodeId, c.fromType, 'right');
                  const to = getNodeCenter(c.toNodeId, c.toType, 'left');
                  const isDashed = c.style === 'dashed';
                  
                  // Calculate smart cable management curves
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  
                  // Elegant cable routing - avoid clutter with stepped offsets
                  const connectionIndex = connections.indexOf(c);
                  const verticalOffset = (connectionIndex % 5) * 15 - 30; // Stagger connections
                  
                  // Smart curve calculation - wider for longer distances, tighter for short
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const curveIntensity = Math.min(Math.max(distance * 0.35, 80), 250);
                  
                  // Control points with vertical offset for cable separation
                  const cp1x = from.x + curveIntensity;
                  const cp1y = from.y + verticalOffset * 0.5;
                  const cp2x = to.x - curveIntensity;
                  const cp2y = to.y - verticalOffset * 0.5;
                  
                  // Calculate midpoint for centered arrow (t=0.5 on bezier)
                  const t = 0.5;
                  const midX = Math.pow(1-t,3)*from.x + 3*Math.pow(1-t,2)*t*cp1x + 3*(1-t)*Math.pow(t,2)*cp2x + Math.pow(t,3)*to.x;
                  const midY = Math.pow(1-t,3)*from.y + 3*Math.pow(1-t,2)*t*cp1y + 3*(1-t)*Math.pow(t,2)*cp2y + Math.pow(t,3)*to.y;
                  
                  // Tangent angle for arrow rotation
                  const tangentX = 3*Math.pow(1-t,2)*(cp1x-from.x) + 6*(1-t)*t*(cp2x-cp1x) + 3*Math.pow(t,2)*(to.x-cp2x);
                  const tangentY = 3*Math.pow(1-t,2)*(cp1y-from.y) + 6*(1-t)*t*(cp2y-cp1y) + 3*Math.pow(t,2)*(to.y-cp2y);
                  const angle = Math.atan2(tangentY, tangentX) * 180 / Math.PI;
                  
                  return (
                    <g key={c.id}>
                      {/* Glow effect behind path */}
                      <path 
                        d={`M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`} 
                        fill="none" 
                        stroke={isDashed ? '#ef444440' : '#6366f140'} 
                        strokeWidth={8} 
                        strokeLinecap="round"
                      />
                      
                      {/* Main curved path */}
                      <path 
                        d={`M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`} 
                        fill="none" 
                        stroke={isDashed ? 'url(#connGradientDead)' : 'url(#connGradient)'} 
                        strokeWidth={c.thickness || 3} 
                        strokeDasharray={isDashed ? '8 4' : 'none'} 
                        strokeLinecap="round"
                        opacity={0.95}
                      />
                      
                      {/* Centered Arrow on the path middle */}
                      <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                        <polygon 
                          points="-8,-6 8,0 -8,6 -4,0" 
                          fill={isDashed ? '#ef4444' : '#8b5cf6'}
                          stroke={isDashed ? '#ef4444' : '#6366f1'}
                          strokeWidth={1}
                        />
                      </g>
                      
                      {/* Connection end dot */}
                      <circle cx={to.x} cy={to.y} r={4} fill={isDashed ? '#ef4444' : '#8b5cf6'} />
                      
                      {/* Timer label on connection */}
                      {c.triggerDelay && (
                        <g>
                          <rect x={midX - 45} y={midY + 15} width={90} height={24} rx={12} fill="#1e293b" stroke="#3b82f6" strokeWidth={1.5} />
                          <text x={midX} y={midY + 31} fill="#60a5fa" fontSize="11" textAnchor="middle" fontWeight="600">
                            ⏱ {c.triggerDelay.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
                
                {/* Connection in progress */}
                {connectingFrom && (() => {
                  const from = getNodeCenter(connectingFrom.id, connectingFrom.type, 'right');
                  const mx = (from.x + mousePos.x) / 2;
                  return (
                    <g>
                      <path 
                        d={`M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                        fill="none" stroke="#fbbf24" strokeWidth={3} strokeDasharray="8 5" strokeLinecap="round"
                      />
                      <circle cx={mousePos.x} cy={mousePos.y} r={10} fill="#fbbf24" opacity={0.4} />
                      <circle cx={mousePos.x} cy={mousePos.y} r={5} fill="#fbbf24" />
                    </g>
                  );
                })()}
              </svg>
            )}

            {/* Stage Nodes - Full view in Node mode, Simplified labels in Builder mode */}
            {stages.map(stage => viewMode === 'builder' ? (
              /* Builder Mode - Compact stage labels for clean navigation */
              <div 
                key={stage.id}
                className="node-card absolute cursor-grab active:cursor-grabbing"
                style={{ left: stage.x, top: stage.y }}
                onMouseDown={(e) => {
                  if ((e.target as HTMLElement).closest('.lead-drop')) return;
                  e.stopPropagation();
                  let lastX = e.clientX, lastY = e.clientY;
                  const move = (ev: MouseEvent) => { handleNodeMove(stage.id, 'stage', ev.clientX - lastX, ev.clientY - lastY); lastX = ev.clientX; lastY = ev.clientY; };
                  const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                  window.addEventListener('mousemove', move);
                  window.addEventListener('mouseup', up);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnStage(stage.id)}
              >
                <div className={`px-6 py-4 rounded-xl border-2 backdrop-blur-xl transition-all ${
                  stage.statusId === 'dead' ? 'bg-red-500/10 border-red-500/40' :
                  stage.statusId === 'new' ? 'bg-blue-500/10 border-blue-500/40' :
                  stage.statusId === 'approval' ? 'bg-emerald-500/10 border-emerald-500/40' :
                  'bg-slate-800/60 border-slate-600/40'
                }`} style={{ minWidth: 180 }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stage.icon}</span>
                    <div>
                      <h3 className="text-base font-bold text-white">{stage.label}</h3>
                      <p className="text-xs text-slate-400">{getStageLeads(stage).length} leads</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <RunwayStageNode 
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
                showInlineActions={showInlineActions === stage.id}
                onToggleInlineActions={() => setShowInlineActions(showInlineActions === stage.id ? null : stage.id)}
              />
            ))}

            {/* Message Nodes - Hidden in Builder mode for easier lead management */}
            {viewMode === 'node' && messageNodes.map(msg => (
              <RunwayMessageNode
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
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 px-6 py-3 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border border-yellow-500/50 rounded-xl text-yellow-400 text-base font-semibold backdrop-blur-sm">
            🔗 Click another node to create connection
          </div>
        )}
      </div>

      {/* PROFILES SIDEBAR */}
      <AnimatePresence>
        {showProfilesSidebar && (
          <motion.div initial={{ x: 340 }} animate={{ x: 0 }} exit={{ x: 340 }}
            className="absolute right-0 top-0 bottom-0 w-[340px] bg-slate-900/98 border-l border-slate-700/50 z-50 flex flex-col backdrop-blur-xl">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👤</span> Saved Profiles
              </h2>
              <button onClick={() => setShowProfilesSidebar(false)} className="text-slate-400 hover:text-white text-2xl transition-colors">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {profiles.map(p => (
                <button key={p.id} onClick={() => loadProfile(p.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${activeProfileId === p.id ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'}`}>
                  <span className="text-base font-semibold text-white block">{p.name}</span>
                  <span className="text-sm text-slate-400">{p.stages?.length || 0} stages • {p.messageNodes?.length || 0} actions</span>
                  {activeProfileId === p.id && <span className="text-sm text-blue-400 block mt-1">✓ Active</span>}
                </button>
              ))}
              {profiles.length < MAX_PROFILES && (
                <div className="p-4 rounded-xl border border-dashed border-slate-700/50 bg-slate-800/30">
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                    placeholder="New profile name..." className="w-full bg-transparent text-white text-sm mb-3 outline-none placeholder:text-slate-500" />
                  <button onClick={() => { if (profileName.trim()) { createProfile(profileName.trim()); setProfileName(''); } }}
                    disabled={!profileName.trim()} className="w-full py-2.5 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-semibold disabled:opacity-50 hover:bg-blue-500/30 transition-all border border-blue-500/30">
                    + Create Profile
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPLOAD LEADS MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-8"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl border border-slate-700/50 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl">
                      📤
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Upload Leads</h2>
                      <p className="text-sm text-slate-400">Import leads from Excel, Google Sheets, or paste data</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center text-xl transition-all"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Format Guide */}
                <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <h3 className="text-sm font-bold text-blue-400 mb-2">Required Format (Tab or Comma separated)</h3>
                  <code className="text-xs text-blue-300 font-mono block bg-slate-900/50 p-3 rounded-lg">
                    Full Name, Email, Phone, Vehicle Interest, Budget, Notes
                  </code>
                  <p className="text-xs text-slate-400 mt-2">First row should be headers. Supports Excel paste, CSV, or tab-separated data.</p>
                </div>

                {/* Paste Area */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Paste your data here:</label>
                  <textarea
                    value={uploadData}
                    onChange={(e) => {
                      setUploadData(e.target.value);
                      // Parse on change
                      const lines = e.target.value.trim().split('\n');
                      if (lines.length > 1) {
                        const parsed = lines.slice(1).map(line => {
                          const cols = line.includes('\t') ? line.split('\t') : line.split(',');
                          return {
                            fullName: cols[0]?.trim() || '',
                            email: cols[1]?.trim() || '',
                            phone: cols[2]?.trim() || '',
                            vehicleInterest: cols[3]?.trim() || '',
                            budget: cols[4]?.trim() || '',
                            notes: cols[5]?.trim() || '',
                          };
                        }).filter(r => r.fullName && (r.email || r.phone));
                        setUploadParsed(parsed);
                      } else {
                        setUploadParsed([]);
                      }
                    }}
                    placeholder="Full Name&#9;Email&#9;Phone&#9;Vehicle Interest&#9;Budget&#9;Notes&#10;John Doe&#9;john@email.com&#9;555-123-4567&#9;SUV&#9;$500/mo&#9;Interested in RAV4"
                    className="w-full h-40 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white text-sm font-mono resize-none focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Preview Table */}
                {uploadParsed.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white">Preview ({uploadParsed.length} leads)</h3>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                        Ready to import
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-800/80">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Interest</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {uploadParsed.slice(0, 10).map((lead, i) => (
                              <tr key={i} className="bg-slate-900/50 hover:bg-slate-800/50">
                                <td className="px-4 py-3 text-white font-medium">{lead.fullName}</td>
                                <td className="px-4 py-3 text-slate-300">{lead.email}</td>
                                <td className="px-4 py-3 text-slate-300">{lead.phone}</td>
                                <td className="px-4 py-3 text-slate-400">{lead.vehicleInterest || '-'}</td>
                                <td className="px-4 py-3 text-slate-400">{lead.budget || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {uploadParsed.length > 10 && (
                        <div className="px-4 py-2 bg-slate-800/50 text-center text-xs text-slate-500">
                          +{uploadParsed.length - 10} more leads
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sample Templates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <h4 className="text-sm font-bold text-white mb-2">📄 Download Excel Template</h4>
                    <p className="text-xs text-slate-400 mb-3">Get a pre-formatted Excel template with all required columns.</p>
                    <button className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-all border border-blue-500/30">
                      Download .xlsx
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <h4 className="text-sm font-bold text-white mb-2">📋 Google Sheets Template</h4>
                    <p className="text-xs text-slate-400 mb-3">Copy our Google Sheets template and paste data here.</p>
                    <button className="w-full py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-all border border-green-500/30">
                      Open Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 border-t border-slate-700/50 bg-slate-900/80 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {uploadParsed.length > 0 ? `${uploadParsed.length} leads ready to import` : 'Paste your data above'}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setShowUploadModal(false); setUploadData(''); setUploadParsed([]); }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (uploadParsed.length === 0) return;
                      setIsLoading(true);
                      // Simulate import - in real implementation this would call an API
                      setTimeout(() => {
                        setSaveNotification(`✅ Imported ${uploadParsed.length} leads!`);
                        setShowUploadModal(false);
                        setUploadData('');
                        setUploadParsed([]);
                        setIsLoading(false);
                        setTimeout(() => setSaveNotification(null), 3000);
                      }, 1500);
                    }}
                    disabled={uploadParsed.length === 0 || isLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Importing...
                      </>
                    ) : (
                      <>Import {uploadParsed.length} Leads</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && !showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-white font-medium">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ RUNWAY STAGE NODE ============
function RunwayStageNode({ stage, leads, isSelected, isConnecting, isDropTarget, zoom, onSelect, onMove, onDelete, onConnect, onDrop, onDragLead, onViewLead, onToggleStar, starredLeads, showInlineActions, onToggleInlineActions }: any) {
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const color = STAGE_COLORS.find(c => c.id === stage.color) || STAGE_COLORS[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.lead-card, .connect-btn, .action-btn, .inline-panel')) return;
    e.stopPropagation();
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) => { onMove(ev.clientX - lastPos.current.x, ev.clientY - lastPos.current.y); lastPos.current = { x: ev.clientX, y: ev.clientY }; };
    const up = () => { setDragging(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const headerHeight = 80;
  const maxLeads = 8;

  return (
    <div className="node-card absolute" style={{ left: stage.x, top: stage.y, zIndex: isSelected ? 100 : 1 }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      {/* Connection Points */}
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-500 shadow-lg" />
      <button onClick={onConnect} className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all shadow-lg ${isConnecting ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-blue-500/40 border-blue-400 text-blue-300 hover:bg-blue-500/60'}`}>+</button>
      
      <motion.div onClick={onSelect} onMouseDown={handleMouseDown}
        className={`relative rounded-2xl overflow-hidden backdrop-blur-xl bg-gradient-to-br ${color.bg} border-2 transition-all shadow-2xl ${isSelected ? `${color.border} ring-2 ring-blue-500/40 shadow-${color.glow}` : 'border-slate-600/50 hover:border-slate-500'} ${isConnecting ? 'ring-2 ring-yellow-400/50' : ''} ${isDropTarget ? 'ring-2 ring-green-400/50' : ''} ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ width: stage.width, height: stage.height }}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-600/30 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center text-2xl shadow-lg`}>
              {stage.icon}
            </div>
            <div className="min-w-0">
              <span className="text-lg font-bold text-white block truncate">{stage.label}</span>
              {stage.description && <span className="text-xs text-slate-400 truncate block">{stage.description}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-xl bg-slate-900/80 ${color.text} text-xl font-bold`}>{leads.length}</div>
            {stage.inlineActions && stage.inlineActions.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); onToggleInlineActions(); }} 
                className="action-btn px-3 py-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all text-sm font-medium">
                ⚡ {stage.inlineActions.length}
              </button>
            )}
          </div>
        </div>

        {/* Leads Grid */}
        <div className="p-4 overflow-hidden" style={{ height: stage.height - headerHeight }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <span className="text-4xl mb-3 opacity-50">📥</span>
              <span className="text-sm font-medium">Drop leads here</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {leads.slice(0, maxLeads).map((lead: Lead) => (
                <div key={lead.id} draggable onDragStart={() => onDragLead(lead)} onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="lead-card flex items-center gap-2 p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 cursor-grab transition-all border border-slate-700/50 hover:border-slate-600">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center ${color.text} text-sm font-bold flex-shrink-0`}>
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-semibold truncate">{lead.formData.fullName}</div>
                    <div className="text-xs text-slate-400 truncate">{lead.formData.phone}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }} className="text-base flex-shrink-0">
                    {starredLeads.has(lead.id) ? '⭐' : '☆'}
                  </button>
                </div>
              ))}
              {leads.length > maxLeads && (
                <div className="col-span-2 text-center text-sm text-slate-500 py-2 font-medium">+{leads.length - maxLeads} more leads</div>
              )}
            </div>
          )}
        </div>

        {/* Inline Actions Panel */}
        {showInlineActions && stage.inlineActions && stage.inlineActions.length > 0 && (
          <div className="inline-panel absolute left-full top-0 ml-4 w-80 bg-slate-900/98 rounded-xl border border-slate-700/50 shadow-2xl p-4 z-50 backdrop-blur-xl">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span>⚡</span> Quick Actions
            </h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stage.inlineActions.map((action: InlineAction) => (
                <div key={action.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {action.type === 'sms' ? '💬' : action.type === 'email' ? '✉️' : action.type === 'reminder' ? '⏰' : '📝'}
                    </span>
                    <span className="text-sm font-semibold text-white">{action.label}</span>
                    {action.autoSend && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">AUTO</span>}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{action.content}</p>
                  {action.delay && (
                    <p className="text-xs text-purple-400 mt-1">⏱️ After {action.delay.label}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Actions */}
        {isSelected && (
          <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-4 py-2 rounded-xl bg-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/40 border border-red-500/40 transition-all">
              🗑️ Delete
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============ RUNWAY MESSAGE NODE ============
function RunwayMessageNode({ node, isSelected, isConnecting, zoom, onSelect, onMove, onDelete, onConnect }: any) {
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
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-500 shadow-lg" />
      <button onClick={onConnect} className={`connect-btn absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all shadow-lg ${isConnecting ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-cyan-500/40 border-cyan-400 text-cyan-300 hover:bg-cyan-500/60'}`}>+</button>
      
      <motion.div onClick={onSelect} onMouseDown={handleMouseDown}
        className={`relative rounded-2xl overflow-hidden backdrop-blur-xl bg-gradient-to-br ${color.bg} border-2 transition-all shadow-xl ${isSelected ? `${color.border} ring-2 ring-cyan-500/40` : 'border-slate-600/50 hover:border-slate-500'} ${isConnecting ? 'ring-2 ring-yellow-400/50' : ''} ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ width: node.width, height: node.height }}>
        
        <div className="px-4 py-3 border-b border-slate-600/30 bg-slate-900/60 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center text-xl shadow-lg`}>
            {node.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-white block truncate">{node.label}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wide">{node.type}</span>
          </div>
          {node.autoTrigger && (
            <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">AUTO</span>
          )}
        </div>

        <div className="p-4">
          {node.subject && <p className="text-xs text-slate-400 mb-2">Subject: <span className="text-slate-300 font-medium">{node.subject}</span></p>}
          <p className="text-sm text-slate-300 line-clamp-4">{node.message}</p>
          {node.triggerDelay && (
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-400 font-medium">
              <span>⏱️</span>
              <span>Triggers after {node.triggerDelay.label}</span>
            </div>
          )}
        </div>

        {isSelected && (
          <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="px-4 py-2 rounded-xl bg-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/40 border border-red-500/40 transition-all">
              🗑️ Delete
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
