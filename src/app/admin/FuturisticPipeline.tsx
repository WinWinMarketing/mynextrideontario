'use client';

import { motion, useAnimation, useDragControls } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Lead, LeadStatus } from '@/lib/validation';

interface FuturisticPipelineProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus, deadReason?: string) => void;
  onViewDetails: (lead: Lead) => void;
  starredLeads: Set<string>;
  onToggleStar: (id: string) => void;
}

// Node types for the customizable system
interface PipelineNode {
  id: string;
  type: 'stage' | 'custom' | 'archive';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  statusId?: LeadStatus | 'dead';
  deadReason?: string;
  emoji?: string;
  description?: string;
}

interface Connection {
  from: string;
  to: string;
}

// Pre-made node templates
const NODE_TEMPLATES = [
  { type: 'stage', label: 'New Stage', color: '#3b82f6', emoji: '📥', description: 'Fresh leads' },
  { type: 'stage', label: 'Hot Lead', color: '#ef4444', emoji: '🔥', description: 'High priority' },
  { type: 'stage', label: 'Warm Lead', color: '#f59e0b', emoji: '☀️', description: 'Good potential' },
  { type: 'stage', label: 'Follow Up', color: '#06b6d4', emoji: '📞', description: 'Needs contact' },
  { type: 'stage', label: 'Negotiating', color: '#8b5cf6', emoji: '🤝', description: 'In discussion' },
  { type: 'stage', label: 'Approved', color: '#22c55e', emoji: '✅', description: 'Deal closed' },
  { type: 'stage', label: 'On Hold', color: '#64748b', emoji: '⏸️', description: 'Waiting' },
  { type: 'archive', label: 'Not Interested', color: '#dc2626', emoji: '❌', description: 'Declined' },
  { type: 'archive', label: 'Lost', color: '#991b1b', emoji: '💨', description: 'Gone cold' },
];

// Default pipeline layout
const DEFAULT_NODES: PipelineNode[] = [
  { id: 'new', type: 'stage', label: 'NEW INQUIRIES', x: 10, y: 40, width: 260, height: 180, color: '#3b82f6', statusId: 'new', emoji: '📥' },
  { id: 'working', type: 'stage', label: 'ENGAGED', x: 32, y: 20, width: 220, height: 150, color: '#eab308', statusId: 'working', emoji: '💬' },
  { id: 'circle-back', type: 'stage', label: 'FOLLOW UP', x: 32, y: 62, width: 220, height: 150, color: '#06b6d4', statusId: 'circle-back', emoji: '📞' },
  { id: 'approval', type: 'stage', label: 'APPROVED', x: 56, y: 40, width: 240, height: 160, color: '#22c55e', statusId: 'approval', emoji: '✅' },
  { id: 'archive', type: 'archive', label: 'ARCHIVE', x: 80, y: 40, width: 180, height: 200, color: '#ef4444', statusId: 'dead', emoji: '📁' },
];

const DEFAULT_CONNECTIONS: Connection[] = [
  { from: 'new', to: 'working' },
  { from: 'new', to: 'circle-back' },
  { from: 'working', to: 'approval' },
  { from: 'circle-back', to: 'approval' },
  { from: 'approval', to: 'archive' },
];

export function FuturisticPipeline({ leads, onStatusChange, onViewDetails, starredLeads, onToggleStar }: FuturisticPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0, time: 0 });
  
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nodes, setNodes] = useState<PipelineNode[]>(DEFAULT_NODES);
  const [connections, setConnections] = useState<Connection[]>(DEFAULT_CONNECTIONS);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [editingNode, setEditingNode] = useState<PipelineNode | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const getNodeLeads = (node: PipelineNode) => {
    if (node.statusId === 'dead' && node.deadReason) {
      return leads.filter(l => l.status === 'dead' && l.deadReason === node.deadReason);
    }
    if (node.statusId === 'dead') {
      return leads.filter(l => l.status === 'dead');
    }
    return leads.filter(l => l.status === node.statusId);
  };

  // Smooth momentum-based panning
  useEffect(() => {
    if (!isDraggingCanvas && (Math.abs(velocity.x) > 0.5 || Math.abs(velocity.y) > 0.5)) {
      const friction = 0.95;
      const animate = () => {
        setPan(p => ({ x: p.x + velocity.x, y: p.y + velocity.y }));
        setVelocity(v => ({ x: v.x * friction, y: v.y * friction }));
      };
      const frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }
  }, [isDraggingCanvas, velocity]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card') || (e.target as HTMLElement).closest('.lead-item') || (e.target as HTMLElement).closest('.sidebar')) return;
    setIsDraggingCanvas(true);
    setLastMouse({ x: e.clientX, y: e.clientY, time: Date.now() });
    setVelocity({ x: 0, y: 0 });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      const dt = Math.max(1, Date.now() - lastMouse.time);
      
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      setVelocity({ x: dx / dt * 16, y: dy / dt * 16 });
      setLastMouse({ x: e.clientX, y: e.clientY, time: Date.now() });
    }
  };

  const handleCanvasMouseUp = () => setIsDraggingCanvas(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(z => Math.max(0.3, Math.min(1.5, z + delta)));
  };

  const handleDropOnNode = (nodeId: string) => {
    if (draggedLead) {
      const node = nodes.find(n => n.id === nodeId);
      if (node?.statusId) {
        if (node.statusId === 'dead' && node.deadReason) {
          onStatusChange(draggedLead.id, 'dead', node.deadReason);
        } else if (node.statusId !== 'dead') {
          onStatusChange(draggedLead.id, node.statusId);
        }
      }
      setDraggedLead(null);
    }
  };

  // Node editing
  const addNode = (template: typeof NODE_TEMPLATES[0]) => {
    const newNode: PipelineNode = {
      id: `custom-${Date.now()}`,
      type: template.type as 'stage' | 'custom' | 'archive',
      label: template.label,
      x: 50,
      y: 50,
      width: 200,
      height: 140,
      color: template.color,
      emoji: template.emoji,
      description: template.description,
    };
    setNodes([...nodes, newNode]);
    setSidebarOpen(false);
  };

  const updateNode = (nodeId: string, updates: Partial<PipelineNode>) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
  };

  const addConnection = (fromId: string, toId: string) => {
    if (!connections.find(c => c.from === fromId && c.to === toId)) {
      setConnections([...connections, { from: fromId, to: toId }]);
    }
    setConnectingFrom(null);
  };

  // Get node center for connection lines
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + node.width / 200 * 50, y: node.y + node.height / 200 * 50 };
  };

  return (
    <div className="h-full bg-[#08090d] relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1) 0%, transparent 60%),
          linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 60px 60px, 60px 60px',
      }} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-[#08090d] via-[#08090d]/90 to-transparent">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Lead Pipeline</h1>
            <p className="text-xs text-slate-500">
              {editMode ? 'Edit mode: Drag nodes to reposition' : 'Drag to explore • Scroll to zoom'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-8 h-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-sm text-slate-300 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="w-8 h-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          {/* Edit Mode Toggle */}
          <button
            onClick={() => { setEditMode(!editMode); if (!editMode) setSidebarOpen(true); }}
            className={`px-4 h-9 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              editMode 
                ? 'bg-primary-600 text-white' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {editMode ? 'Done Editing' : 'Edit Pipeline'}
          </button>

          <button onClick={() => { setZoom(0.9); setPan({ x: 0, y: 0 }); }} className="px-4 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm border border-white/10 transition-all">
            Reset
          </button>
        </div>
      </div>

      {/* Edit Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen && editMode ? 0 : -320 }}
        className="sidebar absolute top-16 left-0 bottom-0 w-80 bg-[#0d1117]/95 backdrop-blur-xl border-r border-white/10 z-40 flex flex-col"
      >
        <div className="p-4 border-b border-white/10">
          <h2 className="text-white font-semibold mb-1">Node Templates</h2>
          <p className="text-xs text-slate-500">Click to add to canvas</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {NODE_TEMPLATES.map((template, i) => (
            <motion.button
              key={i}
              onClick={() => addNode(template)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${template.color}20` }}
              >
                {template.emoji}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{template.label}</div>
                <div className="text-slate-500 text-xs">{template.description}</div>
              </div>
              <svg className="w-4 h-4 text-slate-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </motion.button>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-slate-500 text-center">
            Drag nodes to reposition • Click to edit • Right-click to delete
          </p>
        </div>
      </motion.div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`absolute inset-0 ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        <motion.div
          className="absolute w-full h-full"
          style={{
            x: pan.x,
            y: pan.y,
            scale: zoom,
            transformOrigin: 'center center',
          }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(59,130,246,0.5)" />
              </marker>
            </defs>
            
            {connections.map((conn, i) => {
              const from = getNodeCenter(conn.from);
              const to = getNodeCenter(conn.to);
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              
              return (
                <motion.path
                  key={i}
                  d={`M ${from.x}% ${from.y}% Q ${midX}% ${from.y}%, ${midX}% ${midY}% T ${to.x}% ${to.y}%`}
                  fill="none"
                  stroke="rgba(59,130,246,0.3)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  markerEnd="url(#arrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              );
            })}

            {/* Connection in progress */}
            {connectingFrom && (
              <line
                x1={`${getNodeCenter(connectingFrom).x}%`}
                y1={`${getNodeCenter(connectingFrom).y}%`}
                x2="50%"
                y2="50%"
                stroke="rgba(59,130,246,0.5)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              leads={getNodeLeads(node)}
              isSelected={selectedNode === node.id}
              isDropTarget={!!draggedLead}
              editMode={editMode}
              connectingFrom={connectingFrom}
              onSelect={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              onDrop={() => handleDropOnNode(node.id)}
              onDragLead={setDraggedLead}
              onViewLead={onViewDetails}
              onToggleStar={onToggleStar}
              starredLeads={starredLeads}
              onEdit={() => setEditingNode(node)}
              onDelete={() => deleteNode(node.id)}
              onStartConnect={() => setConnectingFrom(node.id)}
              onConnect={() => connectingFrom && addConnection(connectingFrom, node.id)}
              onMove={(x, y) => updateNode(node.id, { x, y })}
            />
          ))}
        </motion.div>
      </div>

      {/* Node Editor Modal */}
      {editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingNode(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0d1117] rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-4">Edit Node</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Label</label>
                <input
                  value={editingNode.label}
                  onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary-500 outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Emoji</label>
                <input
                  value={editingNode.emoji || ''}
                  onChange={(e) => setEditingNode({ ...editingNode, emoji: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Color</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'].map(c => (
                    <button
                      key={c}
                      onClick={() => setEditingNode({ ...editingNode, color: c })}
                      className={`w-8 h-8 rounded-lg transition-all ${editingNode.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d1117]' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingNode(null)} className="flex-1 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { updateNode(editingNode.id, editingNode); setEditingNode(null); }}
                className="flex-1 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom Stats */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-6 py-3 bg-gradient-to-t from-[#08090d] to-transparent">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 text-slate-400">
            <span>Total: <span className="text-white font-medium">{leads.length}</span></span>
            <span>Nodes: <span className="text-primary-400 font-medium">{nodes.length}</span></span>
          </div>
          <span className="text-slate-600">
            {editMode ? 'Click node to edit • Drag to move' : 'Drag leads between stages'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Node Card Component
function NodeCard({
  node,
  leads,
  isSelected,
  isDropTarget,
  editMode,
  connectingFrom,
  onSelect,
  onDrop,
  onDragLead,
  onViewLead,
  onToggleStar,
  starredLeads,
  onEdit,
  onDelete,
  onStartConnect,
  onConnect,
  onMove,
}: {
  node: PipelineNode;
  leads: Lead[];
  isSelected: boolean;
  isDropTarget: boolean;
  editMode: boolean;
  connectingFrom: string | null;
  onSelect: () => void;
  onDrop: () => void;
  onDragLead: (lead: Lead | null) => void;
  onViewLead: (lead: Lead) => void;
  onToggleStar: (id: string) => void;
  starredLeads: Set<string>;
  onEdit: () => void;
  onDelete: () => void;
  onStartConnect: () => void;
  onConnect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging || !editMode) return;
    const dx = (e.clientX - dragOffset.x) / 10;
    const dy = (e.clientY - dragOffset.y) / 10;
    onMove(node.x + dx, node.y + dy);
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => setIsDragging(false);

  return (
    <motion.div
      className="node-card absolute"
      style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onContextMenu={(e) => { e.preventDefault(); if (editMode) onDelete(); }}
    >
      <motion.div
        onClick={editMode ? onEdit : onSelect}
        className={`
          relative rounded-2xl overflow-hidden backdrop-blur-xl cursor-pointer
          border transition-all duration-200
          ${isSelected ? 'ring-2 ring-primary-400' : ''}
          ${isDropTarget ? 'ring-2 ring-white/30' : ''}
          ${editMode ? 'hover:ring-2 hover:ring-white/20' : ''}
          ${connectingFrom && connectingFrom !== node.id ? 'ring-2 ring-green-400/50 cursor-crosshair' : ''}
        `}
        style={{
          width: node.width,
          height: node.height,
          borderColor: `${node.color}40`,
          background: `linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.8) 100%)`,
          boxShadow: `0 0 30px ${node.color}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
        whileHover={{ scale: editMode ? 1.02 : 1.01 }}
        onClick={() => { if (connectingFrom && connectingFrom !== node.id) onConnect(); }}
      >
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: node.color }} />

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {node.emoji && <span className="text-lg">{node.emoji}</span>}
            <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: node.color }}>
              {node.label}
            </span>
          </div>
          <span className="text-xl font-bold text-white">{leads.length}</span>
        </div>

        {/* Edit mode controls */}
        {editMode && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onStartConnect(); }}
              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white text-xs"
              title="Connect to another node"
            >
              →
            </button>
          </div>
        )}

        {/* Leads */}
        <div className="p-2 overflow-y-auto" style={{ maxHeight: node.height - 60 }}>
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-12 text-slate-600 text-xs">
              {editMode ? 'Custom stage' : 'Drop leads here'}
            </div>
          ) : (
            <div className="space-y-1">
              {leads.slice(0, 5).map((lead) => (
                <motion.div
                  key={lead.id}
                  draggable={!editMode}
                  onDragStart={() => onDragLead(lead)}
                  onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); if (!editMode) onViewLead(lead); }}
                  className="lead-item group flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all"
                  whileHover={{ x: 2 }}
                >
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: `${node.color}20`, color: node.color }}
                  >
                    {lead.formData.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{lead.formData.fullName}</div>
                    <div className="text-slate-500 text-[10px] truncate">{lead.formData.vehicleType}</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }}
                    className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                  >
                    {starredLeads.has(lead.id) ? '⭐' : '☆'}
                  </button>
                </motion.div>
              ))}
              {leads.length > 5 && (
                <div className="text-center text-xs text-slate-500 py-1">+{leads.length - 5} more</div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
