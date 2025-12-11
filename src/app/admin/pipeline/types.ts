// Pipeline Types - Professional CRM System
import { LeadStatus } from '@/lib/validation';

// ============ MESSAGE NODE (Connectable Template Box) ============
export interface MessageNode {
  id: string;
  type: 'email' | 'sms' | 'call' | 'notification' | 'wait' | 'condition';
  label: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StageColor;
  // Content
  subject?: string;
  message: string;
  // Automation
  autoTrigger: boolean;
  triggerDelay?: TimerDelay;
  triggerCondition?: 'on-enter' | 'on-exit' | 'manual';
  // Linked stages
  linkedStageIds: string[];
}

export interface TimerDelay {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  label: string;
}

// ============ WORKSPACE PROFILE ============
export interface WorkspaceProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  stages: PipelineStage[];
  messageNodes: MessageNode[];
  connections: NodeConnection[];
  labels: TextLabel[];
  emailTemplates: EmailTemplate[];
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showConnections: boolean;
  defaultStageWidth: number;
  defaultStageHeight: number;
  compactMode: boolean;
  gridView: boolean;
}

// ============ STAGE/NODE ============
export interface PipelineStage {
  id: string;
  label: string;
  description?: string;
  statusId: LeadStatus | 'dead';
  deadReason?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StageColor;
  icon: string;
  // Automation
  autoActions: AutoAction[];
  // Timing
  reminderAfter?: TimerDelay;
  escalateAfter?: TimerDelay;
  // Stats
  leadCount?: number;
}

export interface AutoAction {
  id: string;
  type: 'send-email' | 'send-sms' | 'create-task' | 'notify' | 'move-stage' | 'wait';
  templateId?: string;
  delay?: TimerDelay;
  enabled: boolean;
}

export type StageColor = 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'cyan' | 'orange' | 'pink' | 'teal' | 'indigo' | 'slate' | 'emerald' | 'rose' | 'amber';

// ============ CONNECTIONS WITH TIMERS ============
export interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromType: 'stage' | 'message';
  toType: 'stage' | 'message';
  fromAnchor: 'right' | 'bottom';
  toAnchor: 'left' | 'top';
  // Automation Timer
  autoTrigger: boolean;
  triggerDelay?: TimerDelay;
  triggerCondition?: ConnectionCondition;
  // Styling
  label?: string;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

export interface ConnectionCondition {
  type: 'always' | 'if-opened' | 'if-clicked' | 'if-replied' | 'no-response' | 'positive-response' | 'negative-response';
  waitTime?: TimerDelay;
}

// ============ LABELS ============
export interface TextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bgColor?: string;
}

// ============ EMAIL TEMPLATES ============
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string[];
}

// ============ ANALYTICS ============
export interface PipelineAnalytics {
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  deadLeadRate: number;
  averageTimeToClose: number;
  stageBreakdown: { stageId: string; label: string; count: number; percentage: number }[];
  deadReasonBreakdown: { reason: string; count: number; percentage: number }[];
  resurrectedLeads: number;
  pendingFollowUps: number;
  scheduledMessages: number;
}

// ============ DEAD LEAD CATEGORIES ============
export const DEAD_LEAD_CATEGORIES = [
  { id: 'not-interested', label: 'Not Interested', icon: '🚫', color: 'red' as StageColor, description: 'Lead explicitly declined' },
  { id: 'no-contact', label: 'No Response', icon: '📵', color: 'orange' as StageColor, description: 'Unable to reach after multiple attempts' },
  { id: 'bad-timing', label: 'Bad Timing', icon: '⏰', color: 'yellow' as StageColor, description: 'Not ready now, contact later', resurrectAfter: { value: 3, unit: 'months' as const, label: '3 months' } },
  { id: 'competitor', label: 'Went Competitor', icon: '🏃', color: 'slate' as StageColor, description: 'Chose another provider' },
  { id: 'budget', label: 'Budget Issue', icon: '💸', color: 'pink' as StageColor, description: 'Cannot afford right now', resurrectAfter: { value: 6, unit: 'months' as const, label: '6 months' } },
  { id: 'credit', label: 'Credit Issues', icon: '📊', color: 'amber' as StageColor, description: 'Credit not approved', resurrectAfter: { value: 6, unit: 'months' as const, label: '6 months' } },
  { id: 'location', label: 'Wrong Location', icon: '📍', color: 'teal' as StageColor, description: 'Not in service area' },
  { id: 'duplicate', label: 'Duplicate Lead', icon: '👥', color: 'slate' as StageColor, description: 'Same person, different entry' },
  { id: 'fake', label: 'Fake/Spam', icon: '🚫', color: 'red' as StageColor, description: 'Invalid lead data' },
];

// ============ TIMER PRESETS ============
export const TIMER_PRESETS: TimerDelay[] = [
  { value: 15, unit: 'minutes', label: '15 minutes' },
  { value: 30, unit: 'minutes', label: '30 minutes' },
  { value: 1, unit: 'hours', label: '1 hour' },
  { value: 2, unit: 'hours', label: '2 hours' },
  { value: 4, unit: 'hours', label: '4 hours' },
  { value: 24, unit: 'hours', label: '24 hours' },
  { value: 48, unit: 'hours', label: '48 hours' },
  { value: 72, unit: 'hours', label: '72 hours' },
  { value: 1, unit: 'weeks', label: '1 week' },
  { value: 2, unit: 'weeks', label: '2 weeks' },
  { value: 1, unit: 'months', label: '1 month' },
  { value: 3, unit: 'months', label: '3 months' },
  { value: 6, unit: 'months', label: '6 months' },
];

// ============ PRESET INTERFACE ============
export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  complexity: 'starter' | 'standard' | 'advanced' | 'enterprise';
  category: string;
  stages: PipelineStage[];
  messageNodes: MessageNode[];
  connections: NodeConnection[];
  labels: TextLabel[];
  estimatedSetupTime: string;
  features: string[];
}

// ============ COLORS ============
export const STAGE_COLORS: { id: StageColor; name: string; bg: string; bgSolid: string; border: string; text: string }[] = [
  { id: 'blue', name: 'Blue', bg: 'from-blue-500/40 to-blue-600/30', bgSolid: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-300' },
  { id: 'yellow', name: 'Yellow', bg: 'from-yellow-500/40 to-yellow-600/30', bgSolid: 'bg-yellow-500', border: 'border-yellow-400', text: 'text-yellow-300' },
  { id: 'green', name: 'Green', bg: 'from-emerald-500/40 to-emerald-600/30', bgSolid: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-300' },
  { id: 'emerald', name: 'Emerald', bg: 'from-emerald-500/40 to-emerald-600/30', bgSolid: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-300' },
  { id: 'red', name: 'Red', bg: 'from-red-500/40 to-red-600/30', bgSolid: 'bg-red-500', border: 'border-red-400', text: 'text-red-300' },
  { id: 'rose', name: 'Rose', bg: 'from-rose-500/40 to-rose-600/30', bgSolid: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-300' },
  { id: 'purple', name: 'Purple', bg: 'from-purple-500/40 to-purple-600/30', bgSolid: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-300' },
  { id: 'cyan', name: 'Cyan', bg: 'from-cyan-500/40 to-cyan-600/30', bgSolid: 'bg-cyan-500', border: 'border-cyan-400', text: 'text-cyan-300' },
  { id: 'orange', name: 'Orange', bg: 'from-orange-500/40 to-orange-600/30', bgSolid: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-300' },
  { id: 'amber', name: 'Amber', bg: 'from-amber-500/40 to-amber-600/30', bgSolid: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-300' },
  { id: 'pink', name: 'Pink', bg: 'from-pink-500/40 to-pink-600/30', bgSolid: 'bg-pink-500', border: 'border-pink-400', text: 'text-pink-300' },
  { id: 'teal', name: 'Teal', bg: 'from-teal-500/40 to-teal-600/30', bgSolid: 'bg-teal-500', border: 'border-teal-400', text: 'text-teal-300' },
  { id: 'indigo', name: 'Indigo', bg: 'from-indigo-500/40 to-indigo-600/30', bgSolid: 'bg-indigo-500', border: 'border-indigo-400', text: 'text-indigo-300' },
  { id: 'slate', name: 'Slate', bg: 'from-slate-500/40 to-slate-600/30', bgSolid: 'bg-slate-500', border: 'border-slate-400', text: 'text-slate-300' },
];

// ============ EMOJI BANK ============
export const EMOJI_BANK = [
  '📥', '📤', '✅', '❌', '🔄', '⚡', '🎯', '🏆', '🔥', '☀️',
  '❄️', '⭐', '✨', '💎', '🎉', '🚀', '✉️', '📧', '📞', '💬',
  '📱', '🗣️', '👋', '🤝', '📅', '📝', '📋', '📊', '📈', '💡',
  '⚙️', '👤', '👥', '💼', '💰', '💵', '💳', '📦', '🎁', '⏰',
  '⏳', '📆', '🔔', '📢', '⚠️', '🚨', '💯', '🆕', '🚗', '🚙',
  '🏠', '🏢', '📍', '🔗', '💀', '👻', '🚫', '📵', '🏃', '💸',
  '🤷', '👑', '🎂', '🙏', '📹', '🌱', '💤', '🔧', '💭', '👁️',
];

// ============ DEFAULTS ============
export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  zoom: 0.45,
  panX: 50,
  panY: 50,
  showGrid: true,
  showConnections: true,
  defaultStageWidth: 340,
  defaultStageHeight: 300,
  compactMode: false,
  gridView: true,
};

export const MAX_PROFILES = 10;
export const STORAGE_KEY = 'pipeline_pro_v3';
export const ACTIVE_PROFILE_KEY = 'pipeline_pro_active_v3';
