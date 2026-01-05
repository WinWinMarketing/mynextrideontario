'use client';

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Workflow, BaseNode, Connection, CanvasLabel, NodeType, Template,
  FeatureFlags, DEFAULT_FEATURE_FLAGS, CanvasState, CANVAS_DEFAULTS,
  NODE_COLORS, NODE_ICONS, CONNECTION_COLORS,
  createNode, createConnection,
} from './types';

interface UniversalLogicEngineProps {
  initialWorkflow?: Workflow;
  featureFlags?: FeatureFlags;
  onSave?: (workflow: Workflow) => void;
}

export function UniversalLogicEngine({ 
  initialWorkflow, 
  featureFlags = DEFAULT_FEATURE_FLAGS,
  onSave 
}: UniversalLogicEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // ============ WORKFLOW STATE ============
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow || {
    id: `workflow-${Date.now()}`,
    name: 'New Workflow',
    description: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    nodes: [],
    connections: [],
    labels: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    settings: {
      auto_save: true,
      save_interval: 30,
      grid_visible: true,
      grid_size: 20,
      snap_to_grid: true,
      snap_to_align: true,
      show_minimap: true,
      show_conversion_rates: true,
      animation_speed: 'normal',
    },
    analytics: {
      total_leads_processed: 0,
      active_leads: 0,
      conversion_rate: 0,
      average_time_to_complete: 0,
      node_stats: [],
    },
  });

  // ============ CANVAS PHYSICS STATE ============
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    is_panning: false,
    is_zooming: false,
    selected_nodes: [],
    selected_connections: [],
    dragging_node: null,
    connecting_from: null,
    cursor_position: { x: 0, y: 0 },
  });

  // Spring physics for smooth animations
  const zoomSpring = useSpring(canvasState.zoom, { stiffness: 300, damping: 30 });
  const panXSpring = useSpring(canvasState.pan.x, { stiffness: 200, damping: 25 });
  const panYSpring = useSpring(canvasState.pan.y, { stiffness: 200, damping: 25 });

  // Inertial scrolling
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  // ============ UI STATE ============
  const [sidebarTab, setSidebarTab] = useState<'nodes' | 'templates' | 'settings' | 'analytics'>('nodes');
  const [showMinimap, setShowMinimap] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // ============ INERTIAL DECAY ============
  useEffect(() => {
    const decay = () => {
      if (!canvasState.is_panning && (Math.abs(velocityRef.current.x) > 0.1 || Math.abs(velocityRef.current.y) > 0.1)) {
        velocityRef.current.x *= CANVAS_DEFAULTS.inertia_decay;
        velocityRef.current.y *= CANVAS_DEFAULTS.inertia_decay;
        
        setCanvasState(prev => ({
          ...prev,
          pan: {
            x: prev.pan.x + velocityRef.current.x,
            y: prev.pan.y + velocityRef.current.y,
          },
        }));
        
        animationFrameRef.current = requestAnimationFrame(decay);
      }
    };
    
    if (!canvasState.is_panning) {
      animationFrameRef.current = requestAnimationFrame(decay);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasState.is_panning]);

  // ============ AUTO-SAVE ============
  useEffect(() => {
    if (!workflow.settings.auto_save || !onSave) return;
    
    const interval = setInterval(() => {
      handleSave();
    }, workflow.settings.save_interval * 1000);
    
    return () => clearInterval(interval);
  }, [workflow.settings.auto_save, workflow.settings.save_interval]);

  // ============ KEYBOARD SHORTCUTS ============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Delete' && canvasState.selected_nodes.length > 0) {
        deleteSelectedNodes();
      }
      if (e.key === 'Escape') {
        setCanvasState(prev => ({
          ...prev,
          selected_nodes: [],
          connecting_from: null,
        }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState.selected_nodes]);

  // ============ CANVAS INTERACTIONS ============
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-element, .sidebar-panel, .minimap')) return;
    
    if (canvasState.connecting_from) {
      setCanvasState(prev => ({ ...prev, connecting_from: null }));
      return;
    }
    
    setCanvasState(prev => ({ ...prev, is_panning: true, selected_nodes: [] }));
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setCanvasState(prev => ({
        ...prev,
        cursor_position: {
          x: (e.clientX - rect.left - prev.pan.x) / prev.zoom,
          y: (e.clientY - rect.top - prev.pan.y) / prev.zoom,
        },
      }));
    }
    
    if (!canvasState.is_panning) return;
    
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    
    velocityRef.current = { x: dx, y: dy };
    
    setCanvasState(prev => ({
      ...prev,
      pan: { x: prev.pan.x + dx, y: prev.pan.y + dy },
    }));
    
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = () => {
    setCanvasState(prev => ({ ...prev, is_panning: false }));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(
      CANVAS_DEFAULTS.min_zoom,
      Math.min(CANVAS_DEFAULTS.max_zoom, canvasState.zoom * zoomFactor)
    );
    
    // Zoom towards cursor
    const scale = newZoom / canvasState.zoom;
    const newPanX = mouseX - (mouseX - canvasState.pan.x) * scale;
    const newPanY = mouseY - (mouseY - canvasState.pan.y) * scale;
    
    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom,
      pan: { x: newPanX, y: newPanY },
    }));
  };

  // ============ NODE OPERATIONS ============
  const addNode = (type: NodeType) => {
    const centerX = (containerRef.current?.clientWidth || 800) / 2;
    const centerY = (containerRef.current?.clientHeight || 600) / 2;
    
    const canvasX = (centerX - canvasState.pan.x) / canvasState.zoom;
    const canvasY = (centerY - canvasState.pan.y) / canvasState.zoom;
    
    const snappedX = workflow.settings.snap_to_grid 
      ? Math.round(canvasX / workflow.settings.grid_size) * workflow.settings.grid_size
      : canvasX;
    const snappedY = workflow.settings.snap_to_grid
      ? Math.round(canvasY / workflow.settings.grid_size) * workflow.settings.grid_size
      : canvasY;
    
    const newNode = createNode(type, { x: snappedX, y: snappedY });
    
    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      updated_at: new Date().toISOString(),
    }));
    
    setCanvasState(prev => ({
      ...prev,
      selected_nodes: [newNode.id],
    }));
    
    showNotification(`Added ${type.replace('_', ' ')} node`);
  };

  const deleteSelectedNodes = () => {
    const nodesToDelete = canvasState.selected_nodes;
    
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => !nodesToDelete.includes(n.id)),
      connections: prev.connections.filter(
        c => !nodesToDelete.includes(c.from_node_id) && !nodesToDelete.includes(c.to_node_id)
      ),
      updated_at: new Date().toISOString(),
    }));
    
    setCanvasState(prev => ({
      ...prev,
      selected_nodes: [],
    }));
  };

  const moveNode = (nodeId: string, dx: number, dy: number) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => {
        if (n.id !== nodeId) return n;
        
        let newX = n.position.x + dx / canvasState.zoom;
        let newY = n.position.y + dy / canvasState.zoom;
        
        if (workflow.settings.snap_to_grid) {
          newX = Math.round(newX / workflow.settings.grid_size) * workflow.settings.grid_size;
          newY = Math.round(newY / workflow.settings.grid_size) * workflow.settings.grid_size;
        }
        
        return { ...n, position: { x: newX, y: newY } };
      }),
      updated_at: new Date().toISOString(),
    }));
  };

  // ============ CONNECTION OPERATIONS ============
  const startConnection = (nodeId: string, socketId: string) => {
    setCanvasState(prev => ({
      ...prev,
      connecting_from: { node_id: nodeId, socket: socketId },
    }));
  };

  const completeConnection = (toNodeId: string) => {
    if (!canvasState.connecting_from) return;
    if (canvasState.connecting_from.node_id === toNodeId) return;
    
    // Check for existing connection
    const exists = workflow.connections.some(
      c => c.from_node_id === canvasState.connecting_from!.node_id &&
           c.to_node_id === toNodeId
    );
    
    if (!exists) {
      const newConnection = createConnection(
        canvasState.connecting_from.node_id,
        canvasState.connecting_from.socket,
        toNodeId
      );
      
      setWorkflow(prev => ({
        ...prev,
        connections: [...prev.connections, newConnection],
        updated_at: new Date().toISOString(),
      }));
    }
    
    setCanvasState(prev => ({ ...prev, connecting_from: null }));
  };

  // ============ SAVE ============
  const handleSave = async () => {
    if (!onSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave({
        ...workflow,
        zoom: canvasState.zoom,
        pan: canvasState.pan,
        updated_at: new Date().toISOString(),
      });
      setLastSaved(new Date());
      showNotification('✅ Workflow saved!');
    } catch (err) {
      showNotification('❌ Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  // ============ FIT VIEW ============
  const fitView = () => {
    if (workflow.nodes.length === 0) {
      setCanvasState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
      return;
    }
    
    const bounds = workflow.nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + node.size.width),
        maxY: Math.max(acc.maxY, node.position.y + node.size.height),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
    
    const padding = 100;
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
    
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;
    
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);
    
    const newPanX = (containerWidth - contentWidth * newZoom) / 2 - bounds.minX * newZoom + padding * newZoom;
    const newPanY = (containerHeight - contentHeight * newZoom) / 2 - bounds.minY * newZoom + padding * newZoom;
    
    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom,
      pan: { x: newPanX, y: newPanY },
    }));
  };

  // ============ GET NODE POSITION FOR CONNECTIONS ============
  const getNodeSocketPosition = (nodeId: string, socketType: 'input' | 'output', socketId?: string) => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    if (socketType === 'input') {
      return {
        x: node.position.x,
        y: node.position.y + node.size.height / 2,
      };
    } else {
      const outputIndex = node.output_sockets.findIndex(s => s.id === socketId);
      const socketCount = node.output_sockets.length;
      const spacing = node.size.height / (socketCount + 1);
      
      return {
        x: node.position.x + node.size.width,
        y: node.position.y + spacing * (outputIndex + 1),
      };
    }
  };

  // ============ RENDER ============
  return (
    <div className="h-full w-full bg-slate-950 flex overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-slate-900/95 border-r border-slate-700/50 flex flex-col z-40 sidebar-panel">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-bold text-white bg-transparent border-none outline-none w-full truncate"
              />
              <p className="text-xs text-slate-400">Universal Logic Engine</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 bg-slate-800/30">
          {[
            { id: 'nodes', label: 'Nodes', icon: '📦' },
            { id: 'templates', label: 'Templates', icon: '📄' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                sidebarTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <span className="text-lg block mb-0.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === 'nodes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white mb-3">Add Nodes</h3>
              
              {/* Node Categories */}
              {[
                { 
                  label: 'Entry Points', 
                  nodes: [{ type: 'START' as NodeType, icon: '🚀', name: 'Start', desc: 'Entry point' }]
                },
                {
                  label: 'Communication',
                  nodes: [
                    { type: 'EMAIL' as NodeType, icon: '✉️', name: 'Email', desc: 'Send email' },
                    { type: 'SMS' as NodeType, icon: '💬', name: 'SMS', desc: 'Send text' },
                  ]
                },
                {
                  label: 'Logic',
                  nodes: [
                    { type: 'DELAY' as NodeType, icon: '⏱️', name: 'Delay', desc: 'Wait period' },
                    { type: 'DECISION' as NodeType, icon: '🔀', name: 'Decision', desc: 'Branching' },
                  ]
                },
                {
                  label: 'Actions',
                  nodes: [
                    { type: 'INTERNAL_TASK' as NodeType, icon: '📝', name: 'Task', desc: 'Self reminder' },
                    { type: 'SCHEDULER' as NodeType, icon: '📅', name: 'Scheduler', desc: 'Book meeting' },
                  ]
                },
                {
                  label: 'Data',
                  nodes: [
                    { type: 'DATA_MAP' as NodeType, icon: '📊', name: 'Data Map', desc: 'Import data' },
                    { type: 'CONTAINER' as NodeType, icon: '👥', name: 'Container', desc: 'Group leads' },
                  ]
                },
                {
                  label: 'Advanced',
                  nodes: [
                    { type: 'WEBHOOK' as NodeType, icon: '🔗', name: 'Webhook', desc: 'External API' },
                    { type: 'CUSTOM' as NodeType, icon: '⚙️', name: 'Custom', desc: 'Custom node' },
                    { type: 'END' as NodeType, icon: '🏁', name: 'End', desc: 'Terminate' },
                  ]
                },
              ].map(category => (
                <div key={category.label} className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    {category.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {category.nodes.map(node => (
                      <button
                        key={node.type}
                        onClick={() => addNode(node.type)}
                        className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-left hover:border-blue-500/50 hover:bg-slate-700/50 transition-all group"
                      >
                        <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">
                          {node.icon}
                        </span>
                        <span className="text-sm font-semibold text-white block">{node.name}</span>
                        <span className="text-xs text-slate-400">{node.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white mb-3">Templates</h3>
              <p className="text-sm text-slate-400">
                Drag templates onto nodes to configure them.
              </p>
              
              {/* Template list would go here */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-dashed border-slate-700/50 text-center">
                <span className="text-3xl block mb-2">📄</span>
                <span className="text-sm text-slate-400">No templates yet</span>
                <button className="mt-3 w-full py-2 px-4 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/30">
                  + Create Template
                </button>
              </div>
            </div>
          )}

          {sidebarTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white mb-3">Workflow Settings</h3>
              
              {/* Grid Settings */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-300">Show Grid</span>
                  <button
                    onClick={() => setWorkflow(prev => ({
                      ...prev,
                      settings: { ...prev.settings, grid_visible: !prev.settings.grid_visible }
                    }))}
                    className={`w-11 h-6 rounded-full transition-all ${
                      workflow.settings.grid_visible ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      workflow.settings.grid_visible ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-300">Snap to Grid</span>
                  <button
                    onClick={() => setWorkflow(prev => ({
                      ...prev,
                      settings: { ...prev.settings, snap_to_grid: !prev.settings.snap_to_grid }
                    }))}
                    className={`w-11 h-6 rounded-full transition-all ${
                      workflow.settings.snap_to_grid ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      workflow.settings.snap_to_grid ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-300">Show Minimap</span>
                  <button
                    onClick={() => setShowMinimap(!showMinimap)}
                    className={`w-11 h-6 rounded-full transition-all ${
                      showMinimap ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      showMinimap ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-300">Auto-Save</span>
                  <button
                    onClick={() => setWorkflow(prev => ({
                      ...prev,
                      settings: { ...prev.settings, auto_save: !prev.settings.auto_save }
                    }))}
                    className={`w-11 h-6 rounded-full transition-all ${
                      workflow.settings.auto_save ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      workflow.settings.auto_save ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>
              </div>

              {/* Grid Size Slider */}
              <div className="p-3 bg-slate-800/50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-300">Grid Size</span>
                  <span className="text-sm text-slate-400">{workflow.settings.grid_size}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={workflow.settings.grid_size}
                  onChange={(e) => setWorkflow(prev => ({
                    ...prev,
                    settings: { ...prev.settings, grid_size: Number(e.target.value) }
                  }))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Status */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isSaving
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSaving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas Background Grid */}
        {workflow.settings.grid_visible && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(148,163,184,${CANVAS_DEFAULTS.grid_opacity}) 1px, transparent 1px)`,
              backgroundSize: `${workflow.settings.grid_size * canvasState.zoom}px ${workflow.settings.grid_size * canvasState.zoom}px`,
              backgroundPosition: `${canvasState.pan.x}px ${canvasState.pan.y}px`,
            }}
          />
        )}

        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-700/50">
              <span className="text-sm text-slate-300">{workflow.nodes.length} nodes</span>
              <span className="text-slate-600">•</span>
              <span className="text-sm text-slate-300">{workflow.connections.length} connections</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-700/50">
              <button
                onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.max(CANVAS_DEFAULTS.min_zoom, prev.zoom - 0.1) }))}
                className="px-2 text-lg text-slate-400 hover:text-white"
              >−</button>
              <span className="text-sm text-white font-medium w-12 text-center">
                {Math.round(canvasState.zoom * 100)}%
              </span>
              <button
                onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.min(CANVAS_DEFAULTS.max_zoom, prev.zoom + 0.1) }))}
                className="px-2 text-lg text-slate-400 hover:text-white"
              >+</button>
            </div>

            <button
              onClick={fitView}
              className="px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 text-sm font-semibold text-white hover:bg-slate-800/90"
            >
              ⊡ Fit
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className={`absolute inset-0 ${
            canvasState.is_panning ? 'cursor-grabbing' : 
            canvasState.connecting_from ? 'cursor-crosshair' : 'cursor-grab'
          }`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          <div
            ref={canvasRef}
            className="absolute origin-top-left"
            style={{
              transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
              width: '10000px',
              height: '8000px',
            }}
          >
            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {workflow.connections.map(conn => {
                const from = getNodeSocketPosition(conn.from_node_id, 'output', conn.from_socket);
                const to = getNodeSocketPosition(conn.to_node_id, 'input');
                const midX = (from.x + to.x) / 2;
                
                return (
                  <g key={conn.id}>
                    <path
                      d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                      fill="none"
                      stroke={CONNECTION_COLORS[conn.state]}
                      strokeWidth={3}
                      opacity={0.8}
                      filter={conn.state === 'active' ? 'url(#glow)' : undefined}
                    />
                    {conn.animated && conn.state === 'active' && (
                      <circle r="4" fill="#ffffff">
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                        />
                      </circle>
                    )}
                    <circle cx={to.x} cy={to.y} r={6} fill={CONNECTION_COLORS[conn.state]} />
                  </g>
                );
              })}

              {/* Connection being drawn */}
              {canvasState.connecting_from && (
                <line
                  x1={getNodeSocketPosition(canvasState.connecting_from.node_id, 'output', canvasState.connecting_from.socket).x}
                  y1={getNodeSocketPosition(canvasState.connecting_from.node_id, 'output', canvasState.connecting_from.socket).y}
                  x2={canvasState.cursor_position.x}
                  y2={canvasState.cursor_position.y}
                  stroke="#fbbf24"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                />
              )}
            </svg>

            {/* Nodes */}
            {workflow.nodes.map(node => (
              <NodeComponent
                key={node.id}
                node={node}
                isSelected={canvasState.selected_nodes.includes(node.id)}
                isConnecting={canvasState.connecting_from?.node_id === node.id}
                zoom={canvasState.zoom}
                onSelect={() => setCanvasState(prev => ({
                  ...prev,
                  selected_nodes: [node.id],
                }))}
                onMove={(dx, dy) => moveNode(node.id, dx, dy)}
                onStartConnection={(socketId) => startConnection(node.id, socketId)}
                onCompleteConnection={() => completeConnection(node.id)}
              />
            ))}
          </div>
        </div>

        {/* Minimap */}
        {showMinimap && workflow.nodes.length > 0 && (
          <Minimap
            nodes={workflow.nodes}
            connections={workflow.connections}
            canvasState={canvasState}
            onNavigate={(x, y) => setCanvasState(prev => ({ ...prev, pan: { x, y } }))}
          />
        )}

        {/* Connection Helper */}
        {canvasState.connecting_from && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400 text-sm font-semibold backdrop-blur-sm">
            🔗 Click a node to connect
          </div>
        )}

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-slate-900/95 border border-slate-700/50 rounded-xl text-white text-sm font-semibold backdrop-blur-sm shadow-xl"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============ NODE COMPONENT ============
function NodeComponent({
  node,
  isSelected,
  isConnecting,
  zoom,
  onSelect,
  onMove,
  onStartConnection,
  onCompleteConnection,
}: {
  node: BaseNode;
  isSelected: boolean;
  isConnecting: boolean;
  zoom: number;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
  onStartConnection: (socketId: string) => void;
  onCompleteConnection: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const colors = NODE_COLORS[node.type];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.socket')) return;
    e.stopPropagation();
    onSelect();
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

  // Shape-based rendering
  const getNodeShape = () => {
    switch (node.shape) {
      case 'circle':
        return 'rounded-full';
      case 'diamond':
        return 'rotate-45';
      case 'sticky':
        return 'rounded-lg rotate-1';
      case 'container':
        return 'rounded-2xl border-dashed';
      default:
        return 'rounded-xl';
    }
  };

  return (
    <div
      className={`node-element absolute select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        zIndex: isSelected ? 100 : 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onCompleteConnection();
      }}
    >
      {/* Input Socket */}
      <div
        className="socket absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-600 border-2 border-slate-400 cursor-pointer hover:bg-blue-500 hover:border-blue-400 transition-colors z-10"
        onClick={(e) => {
          e.stopPropagation();
          onCompleteConnection();
        }}
      />

      {/* Node Body */}
      <motion.div
        className={`w-full h-full ${getNodeShape()} overflow-hidden backdrop-blur-xl border-2 transition-all ${
          isSelected ? 'ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/20' : ''
        } ${isConnecting ? 'ring-2 ring-yellow-400/50' : ''}`}
        style={{
          backgroundColor: `${colors.bg}dd`,
          borderColor: isSelected ? colors.border : `${colors.border}80`,
        }}
        initial={false}
        animate={{
          scale: node.type === 'START' && !isDragging ? [1, 1.02, 1] : 1,
        }}
        transition={{
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center gap-3"
          style={{ borderColor: `${colors.border}50`, backgroundColor: `${colors.bg}30` }}
        >
          <span className="text-2xl">{node.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{node.label}</div>
            <div className="text-xs opacity-70 text-white/70 uppercase tracking-wide">
              {node.type.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1">
          {node.template_preview && (
            <p className="text-xs text-white/80 line-clamp-3">{node.template_preview}</p>
          )}
          {node.description && (
            <p className="text-xs text-white/60 mt-1">{node.description}</p>
          )}
        </div>
      </motion.div>

      {/* Output Sockets */}
      {node.output_sockets.map((socket, idx) => {
        const socketCount = node.output_sockets.length;
        const spacing = node.size.height / (socketCount + 1);
        const top = spacing * (idx + 1);

        return (
          <div
            key={socket.id}
            className="socket absolute right-0 translate-x-1/2 -translate-y-1/2 flex items-center gap-1 cursor-pointer group z-10"
            style={{ top }}
            onClick={(e) => {
              e.stopPropagation();
              onStartConnection(socket.id);
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 transition-all group-hover:scale-125"
              style={{
                backgroundColor: socket.color,
                borderColor: socket.color,
              }}
            />
            {socketCount > 1 && (
              <span className="text-xs text-white/70 bg-slate-900/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {socket.label}
              </span>
            )}
          </div>
        );
      })}

      {/* Selection Actions */}
      {isSelected && (
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/50 text-xs font-semibold text-white hover:bg-slate-800/90">
            ✏️ Edit
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-xs font-semibold text-red-400 hover:bg-red-500/30">
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ============ MINIMAP ============
function Minimap({
  nodes,
  connections,
  canvasState,
  onNavigate,
}: {
  nodes: BaseNode[];
  connections: Connection[];
  canvasState: CanvasState;
  onNavigate: (x: number, y: number) => void;
}) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const scale = 0.05;

  // Calculate bounds
  const bounds = nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      minY: Math.min(acc.minY, node.position.y),
      maxX: Math.max(acc.maxX, node.position.x + node.size.width),
      maxY: Math.max(acc.maxY, node.position.y + node.size.height),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const handleClick = (e: React.MouseEvent) => {
    const rect = minimapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale - bounds.minX;
    const y = (e.clientY - rect.top) / scale - bounds.minY;

    onNavigate(-x * canvasState.zoom + 400, -y * canvasState.zoom + 300);
  };

  return (
    <div
      ref={minimapRef}
      className="minimap absolute bottom-4 right-4 w-48 h-32 bg-slate-900/95 border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer z-40 backdrop-blur-sm"
      onClick={handleClick}
    >
      <svg className="w-full h-full">
        {/* Nodes */}
        {nodes.map(node => {
          const colors = NODE_COLORS[node.type];
          return (
            <rect
              key={node.id}
              x={(node.position.x - bounds.minX) * scale + 10}
              y={(node.position.y - bounds.minY) * scale + 10}
              width={node.size.width * scale}
              height={node.size.height * scale}
              fill={colors.bg}
              rx={2}
            />
          );
        })}

        {/* Viewport indicator */}
        <rect
          x={(-canvasState.pan.x / canvasState.zoom - bounds.minX) * scale + 10}
          y={(-canvasState.pan.y / canvasState.zoom - bounds.minY) * scale + 10}
          width={200 * scale / canvasState.zoom}
          height={150 * scale / canvasState.zoom}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          rx={2}
        />
      </svg>
    </div>
  );
}




