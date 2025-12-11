// Pipeline Types - Clean Professional CRM System
import { LeadStatus } from '@/lib/validation';

// ============ ACTION NODE TYPES ============
export type ActionNodeType = 'email' | 'sms' | 'call' | 'meeting' | 'reminder' | 'wait' | 'condition';

export interface ActionNode {
  id: string;
  type: ActionNodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StageColor;
  // Template Integration
  templateId?: string;
  templateName?: string;
  // Content (when no template)
  subject?: string;
  message?: string;
  // Timing
  timing: 'immediate' | 'delayed' | 'conditional';
  delay?: TimerDelay;
  // Conditions
  condition?: ActionCondition;
  // Assignments
  assigneeType?: 'agent' | 'manager' | 'team';
  assigneeId?: string;
}

export interface ActionCondition {
  type: 'no-reply' | 'opened' | 'clicked' | 'replied' | 'booked' | 'always';
  withinTime?: TimerDelay;
}

export interface TimerDelay {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

// ============ PIPELINE STAGE ============
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
  column: number;
  row: number;
  // Actions attached to this stage
  actionIds: string[];
  // Auto-actions
  onEnter?: string[]; // Action IDs to trigger on enter
  onExit?: string[]; // Action IDs to trigger on exit
  // Follow-up
  followUpAfter?: TimerDelay;
  escalateAfter?: TimerDelay;
}

// ============ CONNECTIONS ============
export interface NodeConnection {
  id: string;
  fromId: string;
  toId: string;
  fromType: 'stage' | 'action';
  toType: 'stage' | 'action';
  label?: string;
  condition?: ActionCondition;
  style: 'solid' | 'dashed';
  animated?: boolean;
}

// ============ TEMPLATE ============
export interface Template {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'script';
  category: string;
  subject?: string;
  content: string;
  variables: string[];
  createdAt: string;
  usageCount: number;
}

// ============ LEAD PROFILE ============
export interface LeadProfile {
  id: string;
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Source
  source: string;
  campaign?: string;
  tags: string[];
  // Vehicle (Automotive specific)
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: string;
  budget?: { min: number; max: number };
  tradeIn?: boolean;
  // Notes
  notes: LeadNote[];
  // Status
  currentStageId?: string;
  assignedTo?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
}

export interface LeadNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  pinned?: boolean;
}

// ============ WORKSPACE ============
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  actions: ActionNode[];
  connections: NodeConnection[];
  templates: Template[];
  settings: WorkflowSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSettings {
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  nodeSpacing: number;
  columnWidth: number;
}

// ============ COLORS ============
export type StageColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan' | 'orange' | 'pink' | 'teal' | 'indigo' | 'slate' | 'emerald';

export const STAGE_COLORS: Record<StageColor, { bg: string; border: string; text: string; accent: string }> = {
  blue: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd', accent: '#3b82f6' },
  green: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#86efac', accent: '#22c55e' },
  yellow: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)', text: '#fde047', accent: '#eab308' },
  red: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#fca5a5', accent: '#ef4444' },
  purple: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', text: '#d8b4fe', accent: '#a855f7' },
  cyan: { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.4)', text: '#67e8f9', accent: '#06b6d4' },
  orange: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', text: '#fdba74', accent: '#f97316' },
  pink: { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.4)', text: '#f9a8d4', accent: '#ec4899' },
  teal: { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.4)', text: '#5eead4', accent: '#14b8a6' },
  indigo: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', text: '#a5b4fc', accent: '#6366f1' },
  slate: { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)', text: '#cbd5e1', accent: '#64748b' },
  emerald: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#6ee7b7', accent: '#10b981' },
};

// ============ ACTION TYPE CONFIG ============
export const ACTION_TYPES: Record<ActionNodeType, { label: string; icon: string; color: StageColor }> = {
  email: { label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'blue' },
  sms: { label: 'SMS', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'cyan' },
  call: { label: 'Schedule Call', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', color: 'green' },
  meeting: { label: 'Meeting', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'purple' },
  reminder: { label: 'Reminder', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', color: 'orange' },
  wait: { label: 'Wait/Delay', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'slate' },
  condition: { label: 'Condition', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'yellow' },
};

// ============ DEAD LEAD REASONS ============
export const DEAD_REASONS = [
  { id: 'declined', label: 'Application Declined', followUp: false },
  { id: 'not-interested', label: 'Not Interested', followUp: false },
  { id: 'no-contact', label: 'No Response', followUp: true, followUpDays: 30 },
  { id: 'purchased-elsewhere', label: 'Purchased Elsewhere', followUp: false },
  { id: 'no-match', label: 'No Vehicle Match', followUp: true, followUpDays: 14 },
  { id: 'budget', label: 'Budget Issues', followUp: true, followUpDays: 60 },
  { id: 'timing', label: 'Bad Timing', followUp: true, followUpDays: 90 },
  { id: 'duplicate', label: 'Duplicate Lead', followUp: false },
];

// ============ TIMER PRESETS ============
export const TIMER_PRESETS: TimerDelay[] = [
  { value: 5, unit: 'minutes' },
  { value: 15, unit: 'minutes' },
  { value: 30, unit: 'minutes' },
  { value: 1, unit: 'hours' },
  { value: 2, unit: 'hours' },
  { value: 4, unit: 'hours' },
  { value: 24, unit: 'hours' },
  { value: 48, unit: 'hours' },
  { value: 1, unit: 'days' },
  { value: 3, unit: 'days' },
  { value: 7, unit: 'days' },
  { value: 14, unit: 'days' },
  { value: 1, unit: 'weeks' },
  { value: 2, unit: 'weeks' },
  { value: 4, unit: 'weeks' },
];

export const formatDelay = (delay: TimerDelay): string => {
  const { value, unit } = delay;
  if (value === 1) return `1 ${unit.slice(0, -1)}`;
  return `${value} ${unit}`;
};

// ============ DEFAULT SETTINGS ============
export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  zoom: 0.6,
  panX: 100,
  panY: 100,
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  nodeSpacing: 60,
  columnWidth: 320,
};

// ============ STORAGE KEYS ============
export const STORAGE_KEYS = {
  workflows: 'crm_workflows_v1',
  activeWorkflow: 'crm_active_workflow_v1',
  templates: 'crm_templates_v1',
};
