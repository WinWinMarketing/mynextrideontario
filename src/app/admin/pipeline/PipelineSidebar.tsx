'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { NodeTemplate, Preset, TemplateCategory, PipelineStage, NodeConnection, TextLabel, StageColor, EMOJI_BANK, STAGE_COLORS, ALL_HOTKEYS, DEFAULT_AUTOMATION_SETTINGS, DEFAULT_CONTACT_SETTINGS } from './types';
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES, CUSTOM_TEMPLATE } from './templates';
import { ALL_PRESETS, PRESET_CATEGORIES } from './presets';
import { LeadStatus } from '@/lib/validation';

interface PipelineSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddStage: (template: NodeTemplate) => void;
  onAddCustomStage: (stage: Partial<PipelineStage>) => void;
  onApplyPreset: (stages: PipelineStage[], connections: NodeConnection[], labels: TextLabel[], zoom: number) => void;
  onOpenFeedback: () => void;
}

type TabType = 'templates' | 'presets' | 'hotkeys' | 'settings';

export function PipelineSidebar({ isOpen, onToggle, onAddStage, onAddCustomStage, onApplyPreset, onOpenFeedback }: PipelineSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [activePresetCategory, setActivePresetCategory] = useState<string | 'all'>('all');
  const [activeHotkeyCategory, setActiveHotkeyCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  
  // Custom node builder state
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('⭐');
  const [customColor, setCustomColor] = useState<StageColor>('blue');
  const [customStatus, setCustomStatus] = useState<LeadStatus | 'dead'>('working');
  const [customContactMethods, setCustomContactMethods] = useState<string[]>([]);
  const [customReminders, setCustomReminders] = useState(false);
  const [customAutoSend, setCustomAutoSend] = useState(false);

  const filteredTemplates = ALL_TEMPLATES.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch = !searchQuery || t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredPresets = ALL_PRESETS.filter(p => {
    const matchesCategory = activePresetCategory === 'all' || p.category === activePresetCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredHotkeys = ALL_HOTKEYS.filter(h => {
    return activeHotkeyCategory === 'all' || h.category === activeHotkeyCategory;
  });

  const getColorClasses = (color: StageColor) => STAGE_COLORS.find(c => c.id === color) || STAGE_COLORS[0];

  const handleCreateCustom = () => {
    if (!customName.trim()) return;
    
    const contactMethods = customContactMethods.map(type => ({
      id: type,
      type: type as any,
      enabled: true,
      settings: { ...DEFAULT_CONTACT_SETTINGS },
    }));

    onAddCustomStage({
      label: customName,
      icon: customIcon,
      color: customColor,
      statusId: customStatus,
      contactMethods,
      automationSettings: {
        ...DEFAULT_AUTOMATION_SETTINGS,
        reminderEnabled: customReminders,
        autoSend: customAutoSend,
      },
    });

    // Reset form
    setCustomName('');
    setCustomIcon('⭐');
    setCustomColor('blue');
    setCustomStatus('working');
    setCustomContactMethods([]);
    setCustomReminders(false);
    setCustomAutoSend(false);
    setShowCustomBuilder(false);
  };

  const handleTemplateClick = (template: NodeTemplate) => {
    if (template.id === 'custom') {
      setShowCustomBuilder(true);
    } else {
      onAddStage(template);
    }
  };

  return (
    <>
      {/* Tab Handle */}
      <motion.button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-8 h-28 bg-slate-900/95 hover:bg-slate-800 border border-slate-700 border-l-0 rounded-r-2xl flex items-center justify-center transition-all shadow-2xl backdrop-blur-xl"
        animate={{ x: isOpen ? 380 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ rotate: isOpen ? 180 : 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </motion.svg>
      </motion.button>

      {/* Sidebar Panel - WIDER */}
      <motion.div
        className="fixed left-0 top-0 bottom-0 z-40 w-[380px] bg-slate-950/98 backdrop-blur-2xl border-r border-slate-800/80 shadow-2xl flex flex-col"
        initial={{ x: -380 }}
        animate={{ x: isOpen ? 0 : -380 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/50 bg-gradient-to-r from-slate-900 to-slate-950">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Pipeline Builder
          </h2>
          <p className="text-xs text-slate-500">Create powerful lead funnels</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/50">
          {(['templates', 'presets', 'hotkeys', 'settings'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setShowCustomBuilder(false); }}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'text-primary-400 border-b-2 border-primary-400 bg-primary-400/5'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
              }`}
            >
              {tab === 'hotkeys' ? '⌨️ Keys' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        {(activeTab === 'templates' || activeTab === 'presets') && !showCustomBuilder && (
          <div className="p-4 border-b border-slate-800/30">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && !showCustomBuilder && (
            <>
              {/* Category Pills */}
              <div className="px-4 py-3 border-b border-slate-800/30 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeCategory === 'all' ? 'bg-primary-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activeCategory === cat.id ? 'bg-primary-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-custom">
                {filteredTemplates.map(template => (
                  <motion.button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br ${getColorClasses(template.preview).bg} border ${getColorClasses(template.preview).border} backdrop-blur-sm transition-all hover:shadow-lg text-left ${
                      template.id === 'custom' ? 'ring-2 ring-primary-500/30 ring-offset-2 ring-offset-slate-950' : ''
                    }`}
                  >
                    <div className={`w-14 h-12 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-center text-2xl flex-shrink-0`}>
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{template.label}</span>
                        {template.id === 'custom' && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-[10px] font-bold">BUILD</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{template.description}</div>
                      {template.contactMethods.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          {template.contactMethods.slice(0, 4).map(cm => (
                            <div key={cm.id} className="w-5 h-5 rounded bg-slate-800/80 flex items-center justify-center text-[10px]">
                              {cm.type === 'email' ? '✉️' : cm.type === 'phone' ? '📞' : cm.type === 'text' ? '💬' : cm.type === 'meeting' ? '📅' : '📱'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {/* CUSTOM BUILDER */}
          {activeTab === 'templates' && showCustomBuilder && (
            <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Custom Node Builder
                </h3>
                <button onClick={() => setShowCustomBuilder(false)} className="text-xs text-slate-400 hover:text-white">
                  ← Back
                </button>
              </div>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Stage Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Hot Prospects"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Icon</label>
                  <div className="grid grid-cols-10 gap-1.5 max-h-32 overflow-y-auto scrollbar-custom p-2 bg-slate-900/30 rounded-xl border border-slate-800">
                    {EMOJI_BANK.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setCustomIcon(emoji)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                          customIcon === emoji ? 'bg-primary-500 ring-2 ring-primary-400' : 'bg-slate-800/50 hover:bg-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {STAGE_COLORS.map(color => (
                      <button
                        key={color.id}
                        onClick={() => setCustomColor(color.id)}
                        className={`h-10 rounded-xl bg-gradient-to-br ${color.bg} border-2 transition-all ${
                          customColor === color.id ? `${color.border} ring-2 ring-offset-2 ring-offset-slate-950 ring-${color.id}-400` : 'border-transparent hover:border-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Lead Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'new', label: 'New', icon: '📥' },
                      { id: 'working', label: 'Working', icon: '⚙️' },
                      { id: 'circle-back', label: 'Follow Up', icon: '🔄' },
                      { id: 'approval', label: 'Approved', icon: '✅' },
                      { id: 'dead', label: 'Dead', icon: '❌' },
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setCustomStatus(s.id as any)}
                        className={`p-2 rounded-xl text-xs font-medium transition-all ${
                          customStatus === s.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Methods */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Contact Methods</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'email', label: 'Email', icon: '✉️' },
                      { id: 'phone', label: 'Phone', icon: '📞' },
                      { id: 'text', label: 'Text/SMS', icon: '💬' },
                      { id: 'whatsapp', label: 'WhatsApp', icon: '📱' },
                      { id: 'meeting', label: 'Meeting', icon: '📅' },
                      { id: 'reminder', label: 'Reminder', icon: '⏰' },
                    ].map(cm => (
                      <button
                        key={cm.id}
                        onClick={() => {
                          setCustomContactMethods(prev =>
                            prev.includes(cm.id) ? prev.filter(x => x !== cm.id) : [...prev, cm.id]
                          );
                        }}
                        className={`p-3 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                          customContactMethods.includes(cm.id)
                            ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                            : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{cm.icon}</span>
                        {cm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Automation Options */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Automation</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={customReminders}
                        onChange={(e) => setCustomReminders(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm text-white">⏰ Reminders</span>
                        <p className="text-[10px] text-slate-500">Get notified for follow-ups</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={customAutoSend}
                        onChange={(e) => setCustomAutoSend(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm text-white">🤖 Auto-Send</span>
                        <p className="text-[10px] text-slate-500">Automatically send messages</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateCustom}
                  disabled={!customName.trim()}
                  className={`w-full py-4 rounded-xl font-semibold text-sm transition-all ${
                    customName.trim()
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  ⚡ Create Custom Stage
                </button>
              </div>
            </div>
          )}

          {/* PRESETS TAB */}
          {activeTab === 'presets' && (
            <>
              <div className="px-4 py-3 border-b border-slate-800/30 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActivePresetCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activePresetCategory === 'all' ? 'bg-primary-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {PRESET_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActivePresetCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activePresetCategory === cat.id ? 'bg-primary-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-custom">
                {filteredPresets.map(preset => (
                  <motion.button
                    key={preset.id}
                    onClick={() => onApplyPreset(preset.stages, preset.connections, preset.labels, preset.recommendedZoom)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-primary-500/50 hover:bg-slate-900/80 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">{preset.name}</h3>
                          <p className="text-[11px] text-slate-500">{preset.stages.length} stages • {preset.connections.length} connections</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        preset.complexity === 'simple' ? 'bg-emerald-500/20 text-emerald-400' :
                        preset.complexity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        preset.complexity === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {preset.complexity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{preset.description}</p>
                    
                    {/* Mini Preview */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {preset.stages.slice(0, 6).map((stage, i) => (
                        <div key={stage.id} className={`flex-1 h-2 rounded-full bg-gradient-to-r ${getColorClasses(stage.color).bg}`} />
                      ))}
                      {preset.stages.length > 6 && <span className="text-[10px] text-slate-600">+{preset.stages.length - 6}</span>}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {preset.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800/50 text-[10px] text-slate-500">{tag}</span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {/* HOTKEYS TAB */}
          {activeTab === 'hotkeys' && (
            <>
              <div className="px-4 py-3 border-b border-slate-800/30 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  {['all', 'navigation', 'view', 'editing', 'stages', 'leads', 'quick'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveHotkeyCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                        activeHotkeyCategory === cat ? 'bg-primary-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 flex items-center gap-2">
                    <span>💡</span>
                    Pro tip: You can use the pipeline entirely with keyboard!
                  </p>
                </div>

                <div className="space-y-1">
                  {filteredHotkeys.map((hotkey, i) => (
                    <div key={`${hotkey.key}-${i}`} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                      <span className="text-xs text-slate-400">{hotkey.description}</span>
                      <div className="flex items-center gap-1">
                        {hotkey.modifiers?.map(mod => (
                          <kbd key={mod} className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-slate-300 font-mono border border-slate-700">
                            {mod === 'ctrl' ? 'Ctrl' : mod === 'shift' ? 'Shift' : 'Alt'}
                          </kbd>
                        ))}
                        {hotkey.modifiers && hotkey.modifiers.length > 0 && <span className="text-slate-600 text-xs">+</span>}
                        <kbd className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-slate-300 font-mono border border-slate-700 min-w-[28px] text-center">
                          {hotkey.key === 'ArrowUp' ? '↑' : hotkey.key === 'ArrowDown' ? '↓' : hotkey.key === 'ArrowLeft' ? '←' : hotkey.key === 'ArrowRight' ? '→' : hotkey.key}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-custom">
              {/* Feedback */}
              <button
                onClick={onOpenFeedback}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-primary-600/20 to-purple-600/20 border border-primary-500/30 text-left hover:border-primary-400/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-2xl">💬</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">Send Feedback</h4>
                    <p className="text-[11px] text-slate-500">Help us improve the pipeline</p>
                  </div>
                </div>
              </button>

              {/* Communication Settings */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📧</span> Communication
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: '✉️', label: 'Email Templates', desc: 'Configure email sequences' },
                    { icon: '💬', label: 'SMS/Text Setup', desc: 'Connect phone number' },
                    { icon: '📞', label: 'Call Scheduling', desc: 'Auto-schedule calls' },
                  ].map(item => (
                    <button key={item.label} className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-left hover:border-slate-700 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">{item.icon}</div>
                        <div>
                          <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">{item.label}</h4>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Automation Settings */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>🤖</span> Automation
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: '⏰', label: 'Reminders', desc: 'Follow-up notifications' },
                    { icon: '🔔', label: 'Push Notifications', desc: 'Real-time alerts' },
                    { icon: '📊', label: 'Auto Reports', desc: 'Daily/weekly summaries' },
                  ].map(item => (
                    <button key={item.label} className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-left hover:border-slate-700 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">{item.icon}</div>
                        <div>
                          <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">{item.label}</h4>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Settings */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>🎨</span> Display
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: '📐', label: 'Grid Settings', desc: 'Snap, size, visibility' },
                    { icon: '🎯', label: 'Default Sizes', desc: 'Stage dimensions' },
                    { icon: '🌙', label: 'Theme', desc: 'Dark, darker, midnight' },
                  ].map(item => (
                    <button key={item.label} className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-left hover:border-slate-700 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">{item.icon}</div>
                        <div>
                          <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">{item.label}</h4>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-950/50">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>v2.0 Pipeline Pro</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Connected
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
