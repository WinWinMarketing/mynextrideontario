// Pipeline Types and Interfaces
import { LeadStatus } from '@/lib/validation';

export interface PipelineStage {
  id: string;
  label: string;
  statusId: LeadStatus | 'dead';
  deadReason?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StageColor;
  icon: string;
  contactMethods: ContactMethod[];
  automationSettings: AutomationSettings;
  displayMode: 'single' | 'double' | 'compact';
  maxVisibleLeads: number;
}

export type StageColor = 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'cyan' | 'orange' | 'pink' | 'teal' | 'indigo' | 'slate';

export interface ContactMethod {
  id: string;
  type: 'email' | 'phone' | 'text' | 'whatsapp' | 'meeting' | 'reminder' | 'manual';
  enabled: boolean;
  settings: ContactMethodSettings;
}

export interface ContactMethodSettings {
  timing: 'immediate' | 'delayed' | 'scheduled';
  delay?: number;
  scheduledTime?: string;
  frequency: 'once' | 'daily' | 'weekly' | 'custom';
  maxPerDay: number;
  followUpStyle: 'aggressive' | 'moderate' | 'gentle';
  tone: 'professional' | 'friendly' | 'casual' | 'urgent';
  goal: 'nurturing' | 'urgency' | 'relationship' | 'closing';
  templateId?: string;
}

export interface AutomationSettings {
  autoSend: boolean;
  maxMessagesPerDay: number;
  noResponseAction: 'retry' | 'escalate' | 'archive' | 'notify';
  noResponseDelay: number;
  reminderEnabled: boolean;
  reminderFrequency: number;
  pushNotifications: boolean;
}

export interface NodeConnection {
  id: string;
  fromStageId: string;
  toStageId: string;
  condition?: ConnectionCondition;
  contactMethod?: string;
  style: 'solid' | 'dashed' | 'dotted';
  animated: boolean;
  label?: string;
}

export interface ConnectionCondition {
  type: 'opened' | 'clicked' | 'replied' | 'no-response' | 'delay' | 'always';
  value?: number;
}

export interface TextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export interface NodeTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: TemplateCategory;
  preview: StageColor;
  defaultStatusId: LeadStatus | 'dead';
  contactMethods: ContactMethod[];
  suggestedConnections: string[];
}

export type TemplateCategory = 
  | 'custom'
  | 'lead-stages'
  | 'communication'
  | 'automation'
  | 'segmentation'
  | 'conditionals'
  | 'contact-methods'
  | 'advanced';

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  subcategory?: string;
  stages: PipelineStage[];
  connections: NodeConnection[];
  labels: TextLabel[];
  icon: string;
  complexity: 'simple' | 'medium' | 'advanced' | 'power-user';
  tags: string[];
  recommendedZoom: number;
}

export type PresetCategory = 
  | 'personality-types'
  | 'agent-styles'
  | 'pipeline-purposes'
  | 'complexity-levels';

export interface PipelineSettings {
  zoom: number;
  pan: { x: number; y: number };
  sidebarWidth: number;
  defaultStageWidth: number;
  defaultStageHeight: number;
  gridSnap: boolean;
  gridSize: number;
  showConnections: boolean;
  animateConnections: boolean;
  theme: 'dark' | 'darker' | 'midnight';
}

export interface HotkeyAction {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt')[];
  action: string;
  description: string;
  category: 'navigation' | 'editing' | 'view' | 'stages' | 'leads' | 'quick';
}

// SVG Emoji Bank
export const EMOJI_BANK = [
  // Status
  '📥', '📤', '✅', '❌', '⏸️', '▶️', '🔄', '⚡', '🎯', '🏆',
  // Heat
  '🔥', '☀️', '❄️', '💨', '🌡️', '⭐', '✨', '💎', '🎉', '🚀',
  // Communication
  '✉️', '📧', '📞', '💬', '📱', '📲', '🗣️', '👋', '🤝', '📅',
  // Actions
  '📝', '📋', '📊', '📈', '📉', '🔍', '🔎', '💡', '⚙️', '🛠️',
  // People
  '👤', '👥', '🧑‍💼', '👨‍💻', '👩‍💻', '🤵', '👔', '💼', '🎭', '🧠',
  // Money
  '💰', '💵', '💳', '🏦', '📦', '🎁', '🏷️', '💲', '📑', '🧾',
  // Time
  '⏰', '⏳', '📆', '🗓️', '⌛', '🕐', '🕑', '🕒', '🕓', '🕔',
  // Alerts
  '🔔', '🔕', '📢', '📣', '⚠️', '🚨', '❗', '❓', '💯', '🆕',
  // Categories
  '🅰️', '🅱️', '🔢', '🔤', '#️⃣', '*️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣',
  // Misc
  '🎨', '🖼️', '📁', '📂', '🗂️', '🗃️', '💾', '🔒', '🔓', '🔑',
];

export const STAGE_COLORS: { id: StageColor; name: string; bg: string; border: string; text: string }[] = [
  { id: 'blue', name: 'Blue', bg: 'from-blue-500/25 to-blue-600/15', border: 'border-blue-500/50', text: 'text-blue-400' },
  { id: 'yellow', name: 'Yellow', bg: 'from-yellow-500/25 to-yellow-600/15', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  { id: 'green', name: 'Green', bg: 'from-emerald-500/25 to-emerald-600/15', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  { id: 'red', name: 'Red', bg: 'from-red-500/25 to-red-600/15', border: 'border-red-500/50', text: 'text-red-400' },
  { id: 'purple', name: 'Purple', bg: 'from-purple-500/25 to-purple-600/15', border: 'border-purple-500/50', text: 'text-purple-400' },
  { id: 'cyan', name: 'Cyan', bg: 'from-cyan-500/25 to-cyan-600/15', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  { id: 'orange', name: 'Orange', bg: 'from-orange-500/25 to-orange-600/15', border: 'border-orange-500/50', text: 'text-orange-400' },
  { id: 'pink', name: 'Pink', bg: 'from-pink-500/25 to-pink-600/15', border: 'border-pink-500/50', text: 'text-pink-400' },
  { id: 'teal', name: 'Teal', bg: 'from-teal-500/25 to-teal-600/15', border: 'border-teal-500/50', text: 'text-teal-400' },
  { id: 'indigo', name: 'Indigo', bg: 'from-indigo-500/25 to-indigo-600/15', border: 'border-indigo-500/50', text: 'text-indigo-400' },
  { id: 'slate', name: 'Slate', bg: 'from-slate-500/25 to-slate-600/15', border: 'border-slate-500/50', text: 'text-slate-400' },
];

// All hotkeys
export const ALL_HOTKEYS: HotkeyAction[] = [
  // Navigation
  { key: 'ArrowUp', action: 'panUp', description: 'Pan canvas up', category: 'navigation' },
  { key: 'ArrowDown', action: 'panDown', description: 'Pan canvas down', category: 'navigation' },
  { key: 'ArrowLeft', action: 'panLeft', description: 'Pan canvas left', category: 'navigation' },
  { key: 'ArrowRight', action: 'panRight', description: 'Pan canvas right', category: 'navigation' },
  { key: 'Home', action: 'goToStart', description: 'Go to first stage', category: 'navigation' },
  { key: 'End', action: 'goToEnd', description: 'Go to last stage', category: 'navigation' },
  { key: 'Tab', action: 'nextStage', description: 'Select next stage', category: 'navigation' },
  { key: 'Tab', modifiers: ['shift'], action: 'prevStage', description: 'Select previous stage', category: 'navigation' },
  
  // View
  { key: 'r', action: 'resetView', description: 'Reset view', category: 'view' },
  { key: 'p', action: 'predict', description: 'Predict/fit all in view', category: 'view' },
  { key: 'f', action: 'fitSelected', description: 'Fit selected in view', category: 'view' },
  { key: '+', action: 'zoomIn', description: 'Zoom in', category: 'view' },
  { key: '=', action: 'zoomIn', description: 'Zoom in', category: 'view' },
  { key: '-', action: 'zoomOut', description: 'Zoom out', category: 'view' },
  { key: '0', action: 'zoom100', description: 'Zoom to 100%', category: 'view' },
  { key: '1', action: 'zoom50', description: 'Zoom to 50%', category: 'view' },
  { key: '2', action: 'zoom75', description: 'Zoom to 75%', category: 'view' },
  { key: '3', action: 'zoom125', description: 'Zoom to 125%', category: 'view' },
  { key: 'g', action: 'toggleGrid', description: 'Toggle grid', category: 'view' },
  { key: 'c', action: 'toggleConnections', description: 'Toggle connections', category: 'view' },
  
  // Editing
  { key: 'a', modifiers: ['ctrl'], action: 'selectAll', description: 'Select all stages', category: 'editing' },
  { key: 'd', modifiers: ['ctrl'], action: 'duplicate', description: 'Duplicate selected', category: 'editing' },
  { key: 'z', modifiers: ['ctrl'], action: 'undo', description: 'Undo', category: 'editing' },
  { key: 'y', modifiers: ['ctrl'], action: 'redo', description: 'Redo', category: 'editing' },
  { key: 'Delete', action: 'delete', description: 'Delete selected', category: 'editing' },
  { key: 'Backspace', action: 'delete', description: 'Delete selected', category: 'editing' },
  { key: 'Escape', action: 'deselect', description: 'Deselect all', category: 'editing' },
  { key: 'Enter', action: 'editSelected', description: 'Edit selected stage', category: 'editing' },
  { key: 'F2', action: 'rename', description: 'Rename selected', category: 'editing' },
  
  // Stages
  { key: 'n', action: 'newStage', description: 'New custom stage', category: 'stages' },
  { key: 'l', action: 'newLabel', description: 'New text label', category: 'stages' },
  { key: 'w', action: 'increaseWidth', description: 'Increase stage width', category: 'stages' },
  { key: 'w', modifiers: ['shift'], action: 'decreaseWidth', description: 'Decrease stage width', category: 'stages' },
  { key: 'h', action: 'increaseHeight', description: 'Increase stage height', category: 'stages' },
  { key: 'h', modifiers: ['shift'], action: 'decreaseHeight', description: 'Decrease stage height', category: 'stages' },
  { key: '[', action: 'sendBack', description: 'Send to back', category: 'stages' },
  { key: ']', action: 'bringFront', description: 'Bring to front', category: 'stages' },
  
  // Leads
  { key: 'v', action: 'viewLeadDetails', description: 'View lead details', category: 'leads' },
  { key: 's', action: 'starLead', description: 'Star/unstar lead', category: 'leads' },
  { key: 'e', action: 'emailLead', description: 'Email selected lead', category: 'leads' },
  { key: 't', action: 'textLead', description: 'Text selected lead', category: 'leads' },
  
  // Quick Actions
  { key: 'm', action: 'toggleMode', description: 'Toggle Node/D&D mode', category: 'quick' },
  { key: 's', modifiers: ['ctrl'], action: 'save', description: 'Save pipeline', category: 'quick' },
  { key: 'b', action: 'toggleSidebar', description: 'Toggle sidebar', category: 'quick' },
  { key: '/', action: 'search', description: 'Search', category: 'quick' },
  { key: '?', action: 'showHelp', description: 'Show help', category: 'quick' },
  { key: 'q', action: 'quickAdd', description: 'Quick add stage', category: 'quick' },
  { key: 'Space', action: 'panMode', description: 'Hold to pan', category: 'quick' },
];

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  autoSend: false,
  maxMessagesPerDay: 3,
  noResponseAction: 'retry',
  noResponseDelay: 48,
  reminderEnabled: true,
  reminderFrequency: 24,
  pushNotifications: true,
};

export const DEFAULT_CONTACT_SETTINGS: ContactMethodSettings = {
  timing: 'immediate',
  frequency: 'once',
  maxPerDay: 3,
  followUpStyle: 'moderate',
  tone: 'professional',
  goal: 'nurturing',
};
