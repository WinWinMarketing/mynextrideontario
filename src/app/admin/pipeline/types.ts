// Pipeline Types - Complete Type System for CRM Pipeline

// ============ COLOR SYSTEM ============
export type StageColor = 
  | 'blue' | 'cyan' | 'teal' | 'emerald' | 'green' 
  | 'yellow' | 'amber' | 'orange' | 'red' | 'rose' 
  | 'pink' | 'purple' | 'violet' | 'indigo' | 'slate';

interface StageColorDef {
  id: StageColor;
  bg: string;
  border: string;
  text: string;
  light: string;
  glow?: string;
}

export const STAGE_COLORS: StageColorDef[] = [
  { id: 'blue', bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500', text: 'text-blue-400', light: 'bg-blue-500/10', glow: 'blue-500/20' },
  { id: 'cyan', bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500', text: 'text-cyan-400', light: 'bg-cyan-500/10', glow: 'cyan-500/20' },
  { id: 'teal', bg: 'from-teal-500/20 to-teal-600/10', border: 'border-teal-500', text: 'text-teal-400', light: 'bg-teal-500/10', glow: 'teal-500/20' },
  { id: 'emerald', bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500', text: 'text-emerald-400', light: 'bg-emerald-500/10', glow: 'emerald-500/20' },
  { id: 'green', bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500', text: 'text-green-400', light: 'bg-green-500/10', glow: 'green-500/20' },
  { id: 'yellow', bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500', text: 'text-yellow-400', light: 'bg-yellow-500/10', glow: 'yellow-500/20' },
  { id: 'amber', bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500', text: 'text-amber-400', light: 'bg-amber-500/10', glow: 'amber-500/20' },
  { id: 'orange', bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500', text: 'text-orange-400', light: 'bg-orange-500/10', glow: 'orange-500/20' },
  { id: 'red', bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500', text: 'text-red-400', light: 'bg-red-500/10', glow: 'red-500/20' },
  { id: 'rose', bg: 'from-rose-500/20 to-rose-600/10', border: 'border-rose-500', text: 'text-rose-400', light: 'bg-rose-500/10', glow: 'rose-500/20' },
  { id: 'pink', bg: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500', text: 'text-pink-400', light: 'bg-pink-500/10', glow: 'pink-500/20' },
  { id: 'purple', bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500', text: 'text-purple-400', light: 'bg-purple-500/10', glow: 'purple-500/20' },
  { id: 'violet', bg: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500', text: 'text-violet-400', light: 'bg-violet-500/10', glow: 'violet-500/20' },
  { id: 'indigo', bg: 'from-indigo-500/20 to-indigo-600/10', border: 'border-indigo-500', text: 'text-indigo-400', light: 'bg-indigo-500/10', glow: 'indigo-500/20' },
  { id: 'slate', bg: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500', text: 'text-slate-400', light: 'bg-slate-500/10', glow: 'slate-500/20' },
];

// Helper to get color by ID
export const getStageColor = (colorId: StageColor) => STAGE_COLORS.find(c => c.id === colorId) || STAGE_COLORS[0];

// ============ TIMER SYSTEM ============
export interface TimerDelay {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  label: string;
}

export const TIMER_PRESETS: TimerDelay[] = [
  { value: 15, unit: 'minutes', label: '15 minutes' },
  { value: 30, unit: 'minutes', label: '30 minutes' },
  { value: 1, unit: 'hours', label: '1 hour' },
  { value: 2, unit: 'hours', label: '2 hours' },
  { value: 4, unit: 'hours', label: '4 hours' },
  { value: 24, unit: 'hours', label: '24 hours' },
  { value: 48, unit: 'hours', label: '48 hours' },
  { value: 3, unit: 'days', label: '3 days' },
  { value: 1, unit: 'weeks', label: '1 week' },
  { value: 2, unit: 'weeks', label: '2 weeks' },
  { value: 1, unit: 'months', label: '1 month' },
  { value: 3, unit: 'months', label: '3 months' },
  { value: 6, unit: 'months', label: '6 months' },
];

// ============ INLINE ACTIONS ============
export interface InlineAction {
  id: string;
  type: 'sms' | 'email' | 'call' | 'reminder' | 'note' | 'webhook' | 'wait';
  label: string;
  content: string;
  subject?: string;
  enabled: boolean;
  autoSend?: boolean;
  delay?: TimerDelay;
  triggerOn?: 'enter' | 'exit' | 'manual' | 'timer';
  templateId?: string;
}

// ============ DEAD LEAD CATEGORIES ============
export const DEAD_LEAD_CATEGORIES = [
  { id: 'declined', label: 'Declined', icon: '🚫', color: 'red' as StageColor, description: 'Application was declined by lenders' },
  { id: 'not-interested', label: 'Not Interested', icon: '👎', color: 'red' as StageColor, description: 'Lead declined to proceed' },
  { id: 'negative-equity', label: 'Negative Equity', icon: '📉', color: 'rose' as StageColor, description: 'Upside down on current vehicle' },
  { id: 'no-contact', label: 'No Response', icon: '📵', color: 'orange' as StageColor, description: 'Could not reach after multiple attempts' },
  { id: 'already-purchased', label: 'Already Purchased', icon: '🚗', color: 'slate' as StageColor, description: 'Bought from another dealer' },
  { id: 'no-vehicle', label: 'No Vehicle Match', icon: '❌', color: 'amber' as StageColor, description: 'Couldn\'t find what they wanted' },
  { id: 'cannot-afford', label: 'Cannot Afford', icon: '💸', color: 'pink' as StageColor, description: 'Payment too high for budget' },
  { id: 'too-far', label: 'Too Far', icon: '📍', color: 'purple' as StageColor, description: 'Distance too far to visit' },
];

// ============ NODE SIZES ============
export const NODE_SIZES = {
  small: { width: 280, height: 240, stage: { w: 280, h: 240 }, message: { w: 220, h: 160 } },
  medium: { width: 360, height: 320, stage: { w: 360, h: 320 }, message: { w: 280, h: 200 } },
  large: { width: 420, height: 380, stage: { w: 420, h: 380 }, message: { w: 340, h: 260 } },
  xlarge: { width: 500, height: 460, stage: { w: 500, h: 460 }, message: { w: 400, h: 320 } },
};

// ============ PIPELINE STAGE ============
export interface PipelineStage {
  id: string;
  label: string;
  description?: string;
  statusId: 'new' | 'working' | 'circle-back' | 'approval' | 'dead';
  deadReason?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StageColor;
  icon: string;
  autoActions: string[];
  inlineActions: InlineAction[];
  reminderAfter?: TimerDelay;
  escalateAfter?: TimerDelay;
  row?: number;
  col?: number;
}

// ============ MESSAGE NODE ============
export interface MessageNode {
  id: string;
  type: 'email' | 'sms' | 'call' | 'notification' | 'wait' | 'webhook' | 'ai-response';
  label: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: StageColor;
  subject?: string;
  message: string;
  autoTrigger: boolean;
  triggerDelay?: TimerDelay;
  triggerCondition?: 'on-enter' | 'on-exit' | 'manual';
  linkedStageIds: string[];
  inlineActions: InlineAction[];
  templateId?: string;
}

// ============ CONNECTION ============
export interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromType: 'stage' | 'message';
  toType: 'stage' | 'message';
  fromAnchor: 'left' | 'right' | 'top' | 'bottom';
  toAnchor: 'left' | 'right' | 'top' | 'bottom';
  autoTrigger: boolean;
  triggerDelay?: TimerDelay;
  triggerCondition?: { type: 'always' | 'if-opened' | 'no-response'; days?: number };
  label?: string;
  style: 'solid' | 'dashed' | 'animated';
  color: string;
  thickness?: number;
  // Schema-first semantics (optional)
  strictPath?: StrictPathType;
}

// ============ TEXT LABEL ============
export interface TextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bgColor?: string;
  fontWeight?: string;
}

// ============ WORKSPACE SETTINGS ============
export interface WorkspaceSettings {
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  nodeSize: 'small' | 'medium' | 'large' | 'xlarge';
  showConnections: boolean;
  showLabels: boolean;
  animateConnections: boolean;
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  zoom: 0.35,
  panX: 80,
  panY: 80,
  gridSize: 40,
  snapToGrid: true,
  showGrid: true,
  nodeSize: 'large',
  showConnections: true,
  showLabels: true,
  animateConnections: true,
};

// ============ WORKSPACE PROFILE ============
export interface WorkspaceProfile {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  // Schema-first persistence (V3)
  version?: 2 | 3;
  schema?: WorkflowSchema;

  // Legacy persisted layout (V2). In V3 these are computed at runtime and should not be saved.
  stages?: PipelineStage[];
  messageNodes?: MessageNode[];
  connections?: NodeConnection[];
  labels?: TextLabel[];
  emailTemplates?: any[];
  settings: WorkspaceSettings;
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

// ============ PRESET ============
export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  complexity: 'starter' | 'standard' | 'advanced' | 'enterprise' | 'runway';
  category: string;
  estimatedSetupTime: string;
  features: string[];
  stages: PipelineStage[];
  messageNodes: MessageNode[];
  connections: NodeConnection[];
  labels: TextLabel[];
}

// ============ STORAGE KEYS ============
export const STORAGE_KEY = 'pipeline-profiles-v2';
export const ACTIVE_PROFILE_KEY = 'pipeline-active-profile';
export const MAX_PROFILES = 10;

// ============ LEAD UPLOAD ============
export interface LeadUploadField {
  source: string;
  target: string;
  required: boolean;
}

export interface LeadUploadConfig {
  fields: LeadUploadField[];
  defaultStatus: 'new' | 'working';
  autoAssign: boolean;
  sendWelcome: boolean;
}

export const DEFAULT_LEAD_MAPPING: LeadUploadField[] = [
  { source: 'first_name', target: 'firstName', required: true },
  { source: 'last_name', target: 'lastName', required: true },
  { source: 'email', target: 'email', required: true },
  { source: 'phone', target: 'phone', required: true },
  { source: 'vehicle_interest', target: 'vehicleInterest', required: false },
  { source: 'budget', target: 'budget', required: false },
  { source: 'down_payment', target: 'downPayment', required: false },
  { source: 'trade_in', target: 'tradeIn', required: false },
  { source: 'notes', target: 'notes', required: false },
];

// =====================================================================================
// SCHEMA-FIRST WORKFLOW ARCHITECTURE (V3)
// - Persistence stores schema only (no x/y coordinates)
// - UI computes layout + routing dynamically from schema
// =====================================================================================

export type WorkflowNodeType = 'Status_Node' | 'Action_Node' | 'Logic_Gate';
export type StrictPathType = 'Success' | 'Failure' | 'Neutral' | 'Loop';

export interface NodeGuidance {
  tutorial_title: string;
  tutorial_content: string; // markdown
  video_url: string; // can be empty string if not provided
}

export interface WorkflowNodeBase {
  id: string;
  type: WorkflowNodeType;
  label: string;
  icon?: string;
  guidance: NodeGuidance;
}

export interface WorkflowStatusNode extends WorkflowNodeBase {
  type: 'Status_Node';
  statusId: PipelineStage['statusId'];
  deadReason?: string;
  color: StageColor;
}

export interface WorkflowActionNode extends WorkflowNodeBase {
  type: 'Action_Node';
  actionType: MessageNode['type'];
  color: StageColor;
  templateId?: string;
  triggerDelay?: TimerDelay;
}

export interface WorkflowLogicGateNode extends WorkflowNodeBase {
  type: 'Logic_Gate';
  gateType: 'decision' | 'intent' | 'scheduler' | 'condition';
  color: StageColor;
  condition?: string;
}

export type WorkflowNode = WorkflowStatusNode | WorkflowActionNode | WorkflowLogicGateNode;

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  strict_path: StrictPathType;
  label?: string;
}

export interface WorkflowSchema {
  schemaVersion: 1;
  id: string;
  name: string;
  description?: string;
  entryNodeId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  // Optional ordered walkthrough; if omitted, UI derives a default success-path sequence
  tutorialSequence?: string[];
}

export interface WorkspaceProfileV3 {
  version: 3;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schema: WorkflowSchema;
  settings: WorkspaceSettings;
}

export interface SchemaPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  complexity: 'starter' | 'standard' | 'advanced' | 'enterprise';
  category: string;
  estimatedSetupTime: string;
  features: string[];
  schema: WorkflowSchema;
}

export const strictPathColor = (strictPath: StrictPathType) => {
  switch (strictPath) {
    case 'Success':
      return '#22c55e'; // green
    case 'Failure':
      return '#ef4444'; // red
    case 'Loop':
      return '#94a3b8'; // gray (slate)
    case 'Neutral':
    default:
      return '#94a3b8';
  }
};

export function validateWorkflowEdge(schema: WorkflowSchema, edge: WorkflowEdge): { ok: true } | { ok: false; reason: string } {
  const from = schema.nodes.find(n => n.id === edge.from);
  const to = schema.nodes.find(n => n.id === edge.to);
  if (!from) return { ok: false, reason: `Edge.from node not found: ${edge.from}` };
  if (!to) return { ok: false, reason: `Edge.to node not found: ${edge.to}` };
  if (!edge.strict_path) return { ok: false, reason: `Edge.strict_path is required` };

  // Connector logic (state-machine style):
  // - Disallow Status_Node -> Status_Node (forces an Action/Logic step between states)
  // - Status nodes can connect to Action nodes OR Logic gates
  // - Status nodes can be targeted by Action nodes OR Logic gates
  if (from.type === 'Status_Node' && to.type === 'Status_Node') {
    return { ok: false, reason: `Invalid edge: Status_Node cannot connect directly to Status_Node (insert an Action_Node)` };
  }
  if (from.type === 'Status_Node' && to.type !== 'Action_Node' && to.type !== 'Logic_Gate') {
    return { ok: false, reason: `Invalid edge: Status_Node can only connect to Action_Node or Logic_Gate (got ${to.type})` };
  }
  if (to.type === 'Status_Node' && from.type !== 'Action_Node' && from.type !== 'Logic_Gate') {
    return { ok: false, reason: `Invalid edge: Status_Node can only be targeted by Action_Node or Logic_Gate (got ${from.type})` };
  }

  return { ok: true };
}

export function deriveTutorialSequence(schema: WorkflowSchema, maxSteps = 30): string[] {
  if (schema.tutorialSequence?.length) return schema.tutorialSequence;

  const edgesFrom = (id: string) => schema.edges.filter(e => e.from === id);
  const visited = new Set<string>();
  const seq: string[] = [];

  let current = schema.entryNodeId;
  for (let i = 0; i < maxSteps; i++) {
    if (!current || visited.has(current)) break;
    visited.add(current);
    seq.push(current);

    // Prefer Success, then Neutral, then Loop, then Failure (so the story follows the main path)
    const outgoing = edgesFrom(current);
    const pick =
      outgoing.find(e => e.strict_path === 'Success') ||
      outgoing.find(e => e.strict_path === 'Neutral') ||
      outgoing.find(e => e.strict_path === 'Loop') ||
      outgoing.find(e => e.strict_path === 'Failure');
    current = pick?.to || '';
  }

  return seq;
}
