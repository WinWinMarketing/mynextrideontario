'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { NodeTemplate, Preset, TemplateCategory, PipelineStage, NodeConnection } from './types';
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { ALL_PRESETS, PRESET_CATEGORIES } from './presets';

interface PipelineSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddStage: (template: NodeTemplate) => void;
  onApplyPreset: (stages: PipelineStage[], connections: NodeConnection[]) => void;
  onOpenSettings: () => void;
}

type TabType = 'templates' | 'presets' | 'settings';

export function PipelineSidebar({ isOpen, onToggle, onAddStage, onApplyPreset, onOpenSettings }: PipelineSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [activePresetCategory, setActivePresetCategory] = useState<string | 'all'>('all');
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = ALL_TEMPLATES.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch = !searchQuery || 
      t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredPresets = ALL_PRESETS.filter(p => {
    const matchesCategory = activePresetCategory === 'all' || p.category === activePresetCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getPreviewColor = (preview: string) => {
    const colors: Record<string, string> = {
      'blue': 'from-blue-500/20 to-blue-600/30 border-blue-500/40',
      'yellow': 'from-yellow-500/20 to-yellow-600/30 border-yellow-500/40',
      'green': 'from-emerald-500/20 to-emerald-600/30 border-emerald-500/40',
      'red': 'from-red-500/20 to-red-600/30 border-red-500/40',
      'purple': 'from-purple-500/20 to-purple-600/30 border-purple-500/40',
      'cyan': 'from-cyan-500/20 to-cyan-600/30 border-cyan-500/40',
      'orange': 'from-orange-500/20 to-orange-600/30 border-orange-500/40',
      'grey': 'from-slate-500/20 to-slate-600/30 border-slate-500/40',
    };
    return colors[preview] || colors.blue;
  };

  const getComplexityBadge = (complexity: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      'simple': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
      'medium': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      'advanced': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      'power-user': { bg: 'bg-red-500/20', text: 'text-red-400' },
    };
    return badges[complexity] || badges.simple;
  };

  return (
    <>
      {/* Tab Handle */}
      <motion.button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-7 h-24 bg-slate-900/95 hover:bg-slate-800 border border-slate-700 border-l-0 rounded-r-2xl flex items-center justify-center transition-all shadow-xl backdrop-blur-xl"
        animate={{ x: isOpen ? 340 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.svg
          className="w-4 h-4 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </motion.svg>
      </motion.button>

      {/* Sidebar Panel */}
      <motion.div
        className="fixed left-0 top-0 bottom-0 z-40 w-[340px] bg-slate-950/98 backdrop-blur-2xl border-r border-slate-800/80 shadow-2xl flex flex-col"
        initial={{ x: -340 }}
        animate={{ x: isOpen ? 0 : -340 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/50">
          <h2 className="text-lg font-bold text-white mb-1">Pipeline Builder</h2>
          <p className="text-xs text-slate-500">Drag templates to canvas</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/50">
          {(['templates', 'presets', 'settings'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'text-primary-400 border-b-2 border-primary-400 bg-primary-400/5'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
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

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'templates' && (
            <>
              {/* Category Pills */}
              <div className="px-4 py-3 border-b border-slate-800/30 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeCategory === 'all'
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activeCategory === cat.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
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
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-sm">No templates found</p>
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <motion.div
                      key={template.id}
                      className="relative perspective-1000"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <AnimatePresence mode="wait">
                        {flippedCard === template.id ? (
                          <motion.div
                            key="back"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 min-h-[100px]"
                          >
                            <p className="text-sm text-slate-300 mb-3 leading-relaxed">{template.description}</p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {template.contactMethods.map(cm => (
                                <span key={cm.id} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 capitalize">
                                  {cm.type}
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={() => setFlippedCard(null)}
                              className="text-xs text-primary-400 hover:text-primary-300 font-medium"
                            >
                              ← Back to card
                            </button>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="front"
                            initial={{ rotateY: -90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => onAddStage(template)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br ${getPreviewColor(template.preview)} border backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-${template.preview}-500/10`}
                          >
                            <div className="w-14 h-12 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-center text-2xl flex-shrink-0">
                              {template.icon}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{template.label}</div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">{template.description}</div>
                              <div className="flex items-center gap-2 mt-1.5">
                                {template.contactMethods.slice(0, 3).map(cm => (
                                  <div key={cm.id} className="w-5 h-5 rounded bg-slate-800/80 flex items-center justify-center text-[10px]">
                                    {cm.type === 'email' ? '✉️' : cm.type === 'phone' ? '📞' : cm.type === 'text' ? '💬' : '📱'}
                                  </div>
                                ))}
                                {template.contactMethods.length > 3 && (
                                  <span className="text-[10px] text-slate-500">+{template.contactMethods.length - 3}</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setFlippedCard(template.id); }}
                              className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0"
                            >
                              <span className="text-xs font-bold">i</span>
                            </button>
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'presets' && (
            <>
              {/* Preset Category Pills */}
              <div className="px-4 py-3 border-b border-slate-800/30 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActivePresetCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activePresetCategory === 'all'
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {PRESET_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActivePresetCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activePresetCategory === cat.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-custom">
                {filteredPresets.map(preset => (
                  <motion.button
                    key={preset.id}
                    onClick={() => onApplyPreset(preset.stages, preset.connections)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-primary-500/50 hover:bg-slate-900/80 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">{preset.name}</h3>
                          <p className="text-[11px] text-slate-500">{preset.stages.length} stages</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getComplexityBadge(preset.complexity).bg} ${getComplexityBadge(preset.complexity).text}`}>
                        {preset.complexity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{preset.description}</p>
                    
                    {/* Mini Preview */}
                    <div className="flex items-center gap-1.5">
                      {preset.stages.slice(0, 5).map((stage, i) => (
                        <div
                          key={stage.id}
                          className="flex-1 h-2 rounded-full bg-primary-500/30 relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-y-0 left-0 bg-primary-500"
                            initial={{ width: 0 }}
                            whileInView={{ width: '100%' }}
                            transition={{ delay: i * 0.1, duration: 0.3 }}
                          />
                        </div>
                      ))}
                      {preset.stages.length > 5 && (
                        <span className="text-[10px] text-slate-600 ml-1">+{preset.stages.length - 5}</span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {preset.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800/50 text-[10px] text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-custom">
              {/* Hotkeys */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Keyboard Shortcuts</h3>
                <div className="space-y-2">
                  {[
                    { key: 'R', action: 'Reset view' },
                    { key: 'M', action: 'Toggle mode' },
                    { key: 'S', action: 'Toggle sidebar' },
                    { key: 'Del', action: 'Delete selected' },
                    { key: 'Ctrl+A', action: 'Select all' },
                    { key: 'Ctrl+D', action: 'Duplicate' },
                    { key: 'Ctrl+Z', action: 'Undo' },
                    { key: 'Space', action: 'Pan canvas' },
                  ].map(({ key, action }) => (
                    <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50">
                      <span className="text-xs text-slate-400">{action}</span>
                      <kbd className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-slate-300 font-mono border border-slate-700">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communication Settings */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Communication</h3>
                <div className="space-y-3">
                  <button
                    onClick={onOpenSettings}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-500/30 text-left hover:border-primary-400/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-xl">✉️</div>
                      <div>
                        <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">Email Templates</h4>
                        <p className="text-[11px] text-slate-500">Configure email sequences</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-left hover:border-slate-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">⏰</div>
                      <div>
                        <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">Reminders</h4>
                        <p className="text-[11px] text-slate-500">Follow-up notifications</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-left hover:border-slate-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">🔔</div>
                      <div>
                        <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">Push Notifications</h4>
                        <p className="text-[11px] text-slate-500">Real-time alerts</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Automation */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Automation</h3>
                <div className="space-y-3">
                  {[
                    { icon: '🤖', label: 'Auto-Assignment', desc: 'Route leads automatically' },
                    { icon: '📊', label: 'Lead Scoring', desc: 'Predict lead quality' },
                    { icon: '🔄', label: 'Workflow Rules', desc: 'Custom automation logic' },
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
            <span>v2.0 Pipeline Builder</span>
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

