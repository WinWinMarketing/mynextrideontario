'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { Lead } from '@/lib/validation';
import { PipelineStage, ContactMethod } from './types';

interface StageCardProps {
  stage: PipelineStage;
  leads: Lead[];
  isSelected: boolean;
  isDropTarget: boolean;
  mode: 'node' | 'dragdrop';
  zoom: number;
  onSelect: () => void;
  onDrop: () => void;
  onDragLead: (lead: Lead | null) => void;
  onViewLead: (lead: Lead) => void;
  onToggleStar: (id: string) => void;
  starredLeads: Set<string>;
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number) => void;
  onStartConnection: (stageId: string) => void;
  onOpenContactMethods: (stageId: string) => void;
}

export function StageCard({
  stage,
  leads,
  isSelected,
  isDropTarget,
  mode,
  zoom,
  onSelect,
  onDrop,
  onDragLead,
  onViewLead,
  onToggleStar,
  starredLeads,
  onMove,
  onResize,
  onStartConnection,
  onOpenContactMethods,
}: StageCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isResizing) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    
    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - lastPos.current.x) * (0.1 / zoom);
      const dy = (e.clientY - lastPos.current.y) * (0.1 / zoom);
      onMove(dx, dy);
      lastPos.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isResizing, zoom, onMove]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    
    const handleMouseMove = (e: MouseEvent) => {
      const dw = (e.clientX - lastPos.current.x) / zoom;
      const dh = (e.clientY - lastPos.current.y) / zoom;
      onResize(dw, dh);
      lastPos.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [zoom, onResize]);

  const getStatusColor = () => {
    const colors: Record<string, string> = {
      'new': 'from-blue-500/20 via-blue-600/10 to-transparent border-blue-500/30',
      'working': 'from-yellow-500/20 via-yellow-600/10 to-transparent border-yellow-500/30',
      'circle-back': 'from-cyan-500/20 via-cyan-600/10 to-transparent border-cyan-500/30',
      'approval': 'from-emerald-500/20 via-emerald-600/10 to-transparent border-emerald-500/30',
      'dead': 'from-red-500/20 via-red-600/10 to-transparent border-red-500/30',
    };
    return colors[stage.statusId] || colors.new;
  };

  const getStatusGlow = () => {
    const glows: Record<string, string> = {
      'new': 'shadow-blue-500/10',
      'working': 'shadow-yellow-500/10',
      'circle-back': 'shadow-cyan-500/10',
      'approval': 'shadow-emerald-500/10',
      'dead': 'shadow-red-500/10',
    };
    return glows[stage.statusId] || glows.new;
  };

  const visibleLeads = Math.floor((stage.height - 70) / 52);

  return (
    <motion.div
      className="stage-card absolute select-none"
      style={{ left: `${stage.x}%`, top: `${stage.y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging ? 1.02 : 1,
        zIndex: isDragging || isSelected ? 100 : 1 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <motion.div
        onClick={onSelect}
        onMouseDown={handleDragStart}
        className={`
          relative rounded-2xl overflow-hidden backdrop-blur-xl cursor-move
          bg-gradient-to-br ${getStatusColor()}
          border-2 transition-all duration-300
          ${isSelected ? 'border-primary-400 ring-4 ring-primary-500/20' : 'border-slate-700/50 hover:border-slate-600'}
          ${isDropTarget ? 'border-yellow-400 ring-4 ring-yellow-400/30 scale-105' : ''}
          ${isDragging ? 'shadow-2xl' : `shadow-xl ${getStatusGlow()}`}
        `}
        style={{ width: stage.width, height: stage.height }}
        whileHover={{ y: -2 }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            {stage.icon && <span className="text-lg">{stage.icon}</span>}
            <span className="text-sm font-bold text-white tracking-wide">{stage.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Lead Count Badge */}
            <motion.div
              key={leads.length}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="min-w-[28px] h-7 px-2 rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center"
            >
              <span className="text-sm font-bold text-primary-400">{leads.length}</span>
            </motion.div>
            
            {/* Contact Methods Indicator */}
            {stage.contactMethods && stage.contactMethods.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenContactMethods(stage.id); }}
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                {stage.contactMethods.filter(cm => cm.enabled).slice(0, 3).map(cm => (
                  <span key={cm.id} className="text-xs">
                    {cm.type === 'email' ? '✉️' : cm.type === 'phone' ? '📞' : cm.type === 'text' ? '💬' : '📱'}
                  </span>
                ))}
              </button>
            )}
          </div>
        </div>

        {/* Leads List */}
        <div className="p-3 overflow-hidden" style={{ maxHeight: stage.height - 56 }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-2xl mb-2">
                {mode === 'node' ? '🎯' : '📥'}
              </div>
              <p className="text-xs text-slate-500">
                {mode === 'node' ? 'Route leads here' : 'Drop leads here'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, visibleLeads).map((lead, idx) => (
                <motion.div
                  key={lead.id}
                  draggable
                  onDragStart={() => onDragLead(lead)}
                  onDragEnd={() => onDragLead(null)}
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="lead-item group flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-slate-700/50"
                  whileHover={{ x: 4 }}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/30 to-primary-700/30 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-300">
                      {lead.formData.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{lead.formData.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{lead.formData.vehicleType || 'No vehicle'}</div>
                  </div>

                  {/* Star */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-all"
                  >
                    <span className={`text-sm ${starredLeads.has(lead.id) ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {starredLeads.has(lead.id) ? '★' : '☆'}
                    </span>
                  </button>
                </motion.div>
              ))}
              
              {leads.length > visibleLeads && (
                <motion.div
                  className="text-center py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-[11px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                    +{leads.length - visibleLeads} more leads
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Connection Point (Node Mode) */}
        {mode === 'node' && (
          <>
            {/* Input connector (left) */}
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-600 hover:border-primary-400 hover:bg-primary-500/20 transition-all cursor-pointer" />
            
            {/* Output connector (right) */}
            <button
              onClick={(e) => { e.stopPropagation(); onStartConnection(stage.id); }}
              className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary-500/20 border-2 border-primary-500/50 hover:border-primary-400 hover:bg-primary-500/40 hover:scale-125 transition-all cursor-pointer flex items-center justify-center"
            >
              <span className="text-[10px] text-primary-400">+</span>
            </button>
          </>
        )}

        {/* Resize Handle */}
        <motion.div
          className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
          animate={{ opacity: isHovering || isResizing ? 1 : 0 }}
          onMouseDown={handleResizeStart}
        >
          <svg className="w-full h-full text-slate-500 hover:text-primary-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22ZM10 22H8V20H10V22ZM18 14H16V12H18V14ZM14 18H12V16H14V18Z" />
          </svg>
        </motion.div>

        {/* Selection Glow */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'radial-gradient(circle at center, rgba(59,130,246,0.1) 0%, transparent 70%)',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// Contact Method Modal Component
interface ContactMethodModalProps {
  isOpen: boolean;
  stage: PipelineStage | null;
  onClose: () => void;
  onUpdate: (stageId: string, contactMethods: ContactMethod[]) => void;
}

export function ContactMethodModal({ isOpen, stage, onClose, onUpdate }: ContactMethodModalProps) {
  if (!isOpen || !stage) return null;

  const contactTypes = [
    { type: 'email', icon: '✉️', label: 'Email', desc: 'Send email sequences' },
    { type: 'phone', icon: '📞', label: 'Phone Call', desc: 'Schedule calls' },
    { type: 'text', icon: '💬', label: 'Text/SMS', desc: 'Send text messages' },
    { type: 'whatsapp', icon: '📱', label: 'WhatsApp', desc: 'WhatsApp messaging' },
    { type: 'meeting', icon: '📅', label: 'Meeting', desc: 'Schedule meetings' },
    { type: 'reminder', icon: '⏰', label: 'Reminder', desc: 'Task reminders' },
    { type: 'manual', icon: '✋', label: 'Manual', desc: 'Manual touchpoint' },
  ];

  const toggleMethod = (type: string) => {
    const existing = stage.contactMethods?.find(cm => cm.type === type);
    let newMethods: ContactMethod[];
    
    if (existing) {
      newMethods = (stage.contactMethods || []).map(cm => 
        cm.type === type ? { ...cm, enabled: !cm.enabled } : cm
      );
    } else {
      newMethods = [
        ...(stage.contactMethods || []),
        {
          id: type,
          type: type as any,
          enabled: true,
          settings: {
            timing: 'immediate',
            frequency: 'once',
            maxPerDay: 3,
            followUpStyle: 'moderate',
            tone: 'professional',
            goal: 'nurturing',
          },
        },
      ];
    }
    onUpdate(stage.id, newMethods);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {stage.icon && <span className="text-2xl">{stage.icon}</span>}
              <div>
                <h2 className="text-lg font-bold text-white">{stage.label}</h2>
                <p className="text-xs text-slate-500">Configure contact methods</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {contactTypes.map(ct => {
              const isEnabled = stage.contactMethods?.find(cm => cm.type === ct.type)?.enabled;
              return (
                <button
                  key={ct.type}
                  onClick={() => toggleMethod(ct.type)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isEnabled
                      ? 'bg-primary-500/10 border-primary-500/50 hover:border-primary-400'
                      : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ct.icon}</span>
                    <div>
                      <div className={`text-sm font-medium ${isEnabled ? 'text-primary-400' : 'text-white'}`}>{ct.label}</div>
                      <div className="text-[11px] text-slate-500">{ct.desc}</div>
                    </div>
                  </div>
                  {isEnabled && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-400">Active</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Settings Hint */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>💡</span>
              Click a contact method to enable/disable. Configure timing and frequency in Settings tab.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

