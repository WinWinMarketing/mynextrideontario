'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Lead } from '@/lib/validation';
import { PipelineStage, ContactMethod, STAGE_COLORS } from './types';

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
  const cardRef = useRef<HTMLDivElement>(null);

  const colorConfig = STAGE_COLORS.find(c => c.id === stage.color) || STAGE_COLORS[0];

  // FIXED: Smooth drag handling with proper event cleanup
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isResizing) return;
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = (moveEvent.clientX - startX) / zoom * 0.08;
      const dy = (moveEvent.clientY - startY) / zoom * 0.08;
      onMove(dx, dy);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isResizing, zoom, onMove]);

  // FIXED: Smooth resize handling
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    let lastX = e.clientX;
    let lastY = e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dw = (moveEvent.clientX - lastX) / zoom;
      const dh = (moveEvent.clientY - lastY) / zoom;
      lastX = moveEvent.clientX;
      lastY = moveEvent.clientY;
      onResize(dw, dh);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [zoom, onResize]);

  // Calculate display mode based on width
  const useDoubleColumn = stage.width > 280;
  const headerHeight = 60;
  const leadHeight = useDoubleColumn ? 44 : 50;
  const maxVisibleLeads = Math.floor((stage.height - headerHeight - 20) / leadHeight) * (useDoubleColumn ? 2 : 1);
  const visibleLeads = leads.slice(0, maxVisibleLeads);
  const hiddenCount = leads.length - visibleLeads.length;

  return (
    <motion.div
      ref={cardRef}
      className="stage-card absolute select-none"
      style={{ 
        left: `${stage.x}%`, 
        top: `${stage.y}%`, 
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging || isSelected ? 100 : 1,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: isDragging ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <motion.div
        onClick={onSelect}
        onMouseDown={handleDragStart}
        className={`
          relative rounded-2xl overflow-hidden backdrop-blur-xl
          bg-gradient-to-br ${colorConfig.bg}
          border-2 transition-colors duration-200
          ${isSelected ? `${colorConfig.border} ring-4 ring-offset-2 ring-offset-slate-950 ring-${stage.color}-500/30` : 'border-slate-700/50 hover:border-slate-600'}
          ${isDropTarget ? 'border-yellow-400 ring-4 ring-yellow-400/30 scale-[1.02]' : ''}
          ${isDragging ? 'cursor-grabbing shadow-2xl shadow-black/50' : 'cursor-grab'}
        `}
        style={{ width: stage.width, height: stage.height }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{stage.icon}</span>
            <span className="text-sm font-bold text-white truncate">{stage.label}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Contact Methods */}
            {stage.contactMethods && stage.contactMethods.filter(cm => cm.enabled).length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenContactMethods(stage.id); }}
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                {stage.contactMethods.filter(cm => cm.enabled).slice(0, 3).map(cm => (
                  <span key={cm.id} className="text-[10px]">
                    {cm.type === 'email' ? '✉️' : cm.type === 'phone' ? '📞' : cm.type === 'text' ? '💬' : cm.type === 'meeting' ? '📅' : '📱'}
                  </span>
                ))}
              </button>
            )}
            {/* Lead Count */}
            <motion.div
              key={leads.length}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className={`min-w-[32px] h-8 px-2.5 rounded-lg bg-slate-900/80 border ${colorConfig.border} flex items-center justify-center`}
            >
              <span className={`text-sm font-bold ${colorConfig.text}`}>{leads.length}</span>
            </motion.div>
          </div>
        </div>

        {/* Leads List - Supports double column */}
        <div className="p-2.5 overflow-hidden" style={{ height: stage.height - headerHeight }}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center text-3xl mb-2">
                {mode === 'node' ? '🎯' : '📥'}
              </div>
              <p className="text-xs text-slate-500">{mode === 'node' ? 'Route leads here' : 'Drop leads here'}</p>
            </div>
          ) : (
            <>
              <div className={`grid gap-2 ${useDoubleColumn ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {visibleLeads.map((lead, idx) => (
                  <motion.div
                    key={lead.id}
                    draggable
                    onDragStart={() => onDragLead(lead)}
                    onDragEnd={() => onDragLead(null)}
                    onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="lead-item group flex items-center gap-2 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-slate-700/50"
                    whileHover={{ x: 2 }}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorConfig.bg} border ${colorConfig.border} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-xs font-bold ${colorConfig.text}`}>
                        {lead.formData.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white font-medium truncate">{lead.formData.fullName}</div>
                      {!useDoubleColumn && (
                        <div className="text-[10px] text-slate-500 truncate">{lead.formData.vehicleType || 'No vehicle'}</div>
                      )}
                    </div>

                    {/* Star */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleStar(lead.id); }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all"
                    >
                      <span className={`text-xs ${starredLeads.has(lead.id) ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {starredLeads.has(lead.id) ? '★' : '☆'}
                      </span>
                    </button>
                  </motion.div>
                ))}
              </div>
              
              {hiddenCount > 0 && (
                <div className="text-center py-2">
                  <span className="text-[10px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                    +{hiddenCount} more
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Connection Points (Node Mode) */}
        {mode === 'node' && (
          <>
            {/* Input (left) */}
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600 hover:border-primary-400 hover:bg-primary-500/20 transition-all cursor-pointer" />
            
            {/* Output (right) */}
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
          className="resize-handle absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-end justify-end p-1"
          animate={{ opacity: isHovering || isResizing ? 1 : 0 }}
          onMouseDown={handleResizeStart}
        >
          <svg className="w-4 h-4 text-slate-500 hover:text-primary-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </motion.div>

        {/* Selection Glow */}
        {isSelected && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: `radial-gradient(circle at center, var(--tw-gradient-from) 0%, transparent 70%)`,
            '--tw-gradient-from': `rgba(59, 130, 246, 0.1)`,
          } as any} />
        )}
      </motion.div>
    </motion.div>
  );
}

// Contact Method Modal
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
    { type: 'phone', icon: '📞', label: 'Phone', desc: 'Schedule calls' },
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
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stage.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-white">{stage.label}</h2>
                <p className="text-xs text-slate-500">Configure contact methods</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
          </div>
        </div>

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
        </div>
      </motion.div>
    </motion.div>
  );
}
