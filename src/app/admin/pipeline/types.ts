// ============================================================
// ELEGANT PIPELINE TYPES - Clean, Professional Workflow System
// ============================================================

// ============ STAGE COLORS ============
export type StageColor = 
  | 'blue' | 'cyan' | 'teal' | 'emerald' | 'green' 
  | 'yellow' | 'amber' | 'orange' | 'red' | 'rose' 
  | 'pink' | 'purple' | 'violet' | 'indigo' | 'slate';

export interface ColorDefinition {
  id: StageColor;
  bg: string;
  bgSolid: string;
  border: string;
  text: string;
  accent: string;
  glow: string;
}

export const STAGE_COLORS: ColorDefinition[] = [
  { id: 'blue', bg: 'bg-blue-500/15', bgSolid: 'bg-blue-500', border: 'border-blue-500/40', text: 'text-blue-400', accent: '#3b82f6', glow: 'blue-500/20' },
  { id: 'cyan', bg: 'bg-cyan-500/15', bgSolid: 'bg-cyan-500', border: 'border-cyan-500/40', text: 'text-cyan-400', accent: '#06b6d4', glow: 'cyan-500/20' },
  { id: 'teal', bg: 'bg-teal-500/15', bgSolid: 'bg-teal-500', border: 'border-teal-500/40', text: 'text-teal-400', accent: '#14b8a6', glow: 'teal-500/20' },
  { id: 'emerald', bg: 'bg-emerald-500/15', bgSolid: 'bg-emerald-500', border: 'border-emerald-500/40', text: 'text-emerald-400', accent: '#10b981', glow: 'emerald-500/20' },
  { id: 'green', bg: 'bg-green-500/15', bgSolid: 'bg-green-500', border: 'border-green-500/40', text: 'text-green-400', accent: '#22c55e', glow: 'green-500/20' },
  { id: 'yellow', bg: 'bg-yellow-500/15', bgSolid: 'bg-yellow-500', border: 'border-yellow-500/40', text: 'text-yellow-400', accent: '#eab308', glow: 'yellow-500/20' },
  { id: 'amber', bg: 'bg-amber-500/15', bgSolid: 'bg-amber-500', border: 'border-amber-500/40', text: 'text-amber-400', accent: '#f59e0b', glow: 'amber-500/20' },
  { id: 'orange', bg: 'bg-orange-500/15', bgSolid: 'bg-orange-500', border: 'border-orange-500/40', text: 'text-orange-400', accent: '#f97316', glow: 'orange-500/20' },
  { id: 'red', bg: 'bg-red-500/15', bgSolid: 'bg-red-500', border: 'border-red-500/40', text: 'text-red-400', accent: '#ef4444', glow: 'red-500/20' },
  { id: 'rose', bg: 'bg-rose-500/15', bgSolid: 'bg-rose-500', border: 'border-rose-500/40', text: 'text-rose-400', accent: '#f43f5e', glow: 'rose-500/20' },
  { id: 'pink', bg: 'bg-pink-500/15', bgSolid: 'bg-pink-500', border: 'border-pink-500/40', text: 'text-pink-400', accent: '#ec4899', glow: 'pink-500/20' },
  { id: 'purple', bg: 'bg-purple-500/15', bgSolid: 'bg-purple-500', border: 'border-purple-500/40', text: 'text-purple-400', accent: '#a855f7', glow: 'purple-500/20' },
  { id: 'violet', bg: 'bg-violet-500/15', bgSolid: 'bg-violet-500', border: 'border-violet-500/40', text: 'text-violet-400', accent: '#8b5cf6', glow: 'violet-500/20' },
  { id: 'indigo', bg: 'bg-indigo-500/15', bgSolid: 'bg-indigo-500', border: 'border-indigo-500/40', text: 'text-indigo-400', accent: '#6366f1', glow: 'indigo-500/20' },
  { id: 'slate', bg: 'bg-slate-500/15', bgSolid: 'bg-slate-500', border: 'border-slate-500/40', text: 'text-slate-400', accent: '#64748b', glow: 'slate-500/20' },
];

export const getColor = (id: StageColor): ColorDefinition => 
  STAGE_COLORS.find(c => c.id === id) || STAGE_COLORS[0];

// ============ VIEW MODES ============
export type ViewMode = 'builder' | 'nodes';

// ============ TIMING ============
export interface TimerConfig {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

export const formatTimer = (t: TimerConfig): string => {
  if (!t || t.value === 0) return 'Immediate';
  return `${t.value} ${t.unit === 'minutes' ? 'min' : t.unit === 'hours' ? 'hr' : t.unit === 'days' ? 'd' : 'wk'}${t.value !== 1 ? 's' : ''}`;
};

// ============ ACTION TYPES ============
export type ActionType = 'email' | 'sms' | 'call' | 'reminder' | 'webhook' | 'wait';

export interface ActionConfig {
  id: string;
  type: ActionType;
  label: string;
  icon: string;
  templateId?: string;
  enabled: boolean;
  delay?: TimerConfig;
  subject?: string;
  message?: string;
  condition?: 'always' | 'no-response' | 'if-opened';
}

// ============ STAGE ============
export type StageStatus = 'new' | 'working' | 'circle-back' | 'approval' | 'dead';

export interface Stage {
  id: string;
  label: string;
  status: StageStatus;
  deadReason?: string;
  description?: string;
  color: StageColor;
  icon: string;
  position: { x: number; y: number };
  actions: ActionConfig[];
  order: number;
}

// ============ CONNECTION ============
export interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: 'default' | 'no-response' | 'success' | 'failure';
  animated?: boolean;
}

// ============ WORKFLOW ============
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  stages: Stage[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
}

// ============ DEAD LEAD CATEGORIES ============
export const DEAD_LEAD_CATEGORIES = [
  { id: 'declined', label: 'Declined', icon: '🚫', color: 'red' as StageColor, description: 'Application declined' },
  { id: 'not-interested', label: 'Not Interested', icon: '👎', color: 'red' as StageColor, description: 'Lead not interested' },
  { id: 'negative-equity', label: 'Negative Equity', icon: '📉', color: 'rose' as StageColor, description: 'Upside down on trade' },
  { id: 'no-contact', label: 'No Response', icon: '📵', color: 'orange' as StageColor, description: 'Could not reach' },
  { id: 'already-purchased', label: 'Already Purchased', icon: '🚗', color: 'slate' as StageColor, description: 'Bought elsewhere' },
  { id: 'no-vehicle', label: 'No Match', icon: '❌', color: 'amber' as StageColor, description: 'No matching vehicle' },
  { id: 'cannot-afford', label: 'Budget Issue', icon: '💸', color: 'pink' as StageColor, description: 'Payment too high' },
];

// ============ PRESET STAGES ============
export const STAGE_PRESETS = [
  { label: 'New Lead', status: 'new' as StageStatus, icon: '📥', color: 'blue' as StageColor },
  { label: 'Contacted', status: 'working' as StageStatus, icon: '📞', color: 'cyan' as StageColor },
  { label: 'Hot Lead', status: 'working' as StageStatus, icon: '🔥', color: 'orange' as StageColor },
  { label: 'Qualified', status: 'working' as StageStatus, icon: '✅', color: 'green' as StageColor },
  { label: 'Meeting Set', status: 'working' as StageStatus, icon: '📅', color: 'purple' as StageColor },
  { label: 'Proposal', status: 'approval' as StageStatus, icon: '📋', color: 'emerald' as StageColor },
  { label: 'Won', status: 'approval' as StageStatus, icon: '🏆', color: 'emerald' as StageColor },
];

// ============ ACTION PRESETS ============
export const ACTION_PRESETS = [
  { type: 'email' as ActionType, label: 'Send Email', icon: '✉️', color: 'blue' as StageColor },
  { type: 'sms' as ActionType, label: 'Send SMS', icon: '💬', color: 'cyan' as StageColor },
  { type: 'call' as ActionType, label: 'Call Reminder', icon: '📞', color: 'yellow' as StageColor },
  { type: 'reminder' as ActionType, label: 'Set Reminder', icon: '⏰', color: 'orange' as StageColor },
  { type: 'wait' as ActionType, label: 'Wait Timer', icon: '⏳', color: 'purple' as StageColor },
  { type: 'webhook' as ActionType, label: 'Webhook', icon: '🔗', color: 'indigo' as StageColor },
];

// ============ UPLOAD TEMPLATES ============
export interface UploadTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'universal' | 'automotive' | 'real-estate' | 'services' | 'custom';
  fields: UploadFieldMapping[];
}

export interface UploadFieldMapping {
  id: string;
  label: string;
  targetField: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select';
  aliases?: string[];
}

export const UPLOAD_TEMPLATES: UploadTemplate[] = [
  {
    id: 'universal-basic',
    name: 'Basic Lead',
    description: 'Simple lead with name, email, phone',
    icon: '📋',
    category: 'universal',
    fields: [
      { id: 'name', label: 'Full Name', targetField: 'fullName', required: true, type: 'text', aliases: ['name', 'full name', 'contact', 'customer'] },
      { id: 'email', label: 'Email', targetField: 'email', required: true, type: 'email', aliases: ['email', 'e-mail', 'mail'] },
      { id: 'phone', label: 'Phone', targetField: 'phone', required: true, type: 'phone', aliases: ['phone', 'tel', 'mobile', 'cell'] },
    ],
  },
  {
    id: 'automotive-full',
    name: 'Automotive Lead',
    description: 'Complete automotive lead with vehicle preferences',
    icon: '🚗',
    category: 'automotive',
    fields: [
      { id: 'name', label: 'Full Name', targetField: 'fullName', required: true, type: 'text', aliases: ['name', 'full name', 'customer'] },
      { id: 'email', label: 'Email', targetField: 'email', required: true, type: 'email', aliases: ['email', 'e-mail'] },
      { id: 'phone', label: 'Phone', targetField: 'phone', required: true, type: 'phone', aliases: ['phone', 'tel', 'mobile'] },
      { id: 'vehicle', label: 'Vehicle Interest', targetField: 'vehicleType', required: false, type: 'text', aliases: ['vehicle', 'car', 'interest'] },
      { id: 'budget', label: 'Budget', targetField: 'budget', required: false, type: 'text', aliases: ['budget', 'price range', 'payment'] },
      { id: 'timeline', label: 'Timeline', targetField: 'timeline', required: false, type: 'text', aliases: ['timeline', 'when', 'timing'] },
      { id: 'source', label: 'Lead Source', targetField: 'source', required: false, type: 'text', aliases: ['source', 'how did you hear', 'referral'] },
    ],
  },
  {
    id: 'real-estate',
    name: 'Real Estate Lead',
    description: 'Property buyer/seller lead format',
    icon: '🏠',
    category: 'real-estate',
    fields: [
      { id: 'name', label: 'Full Name', targetField: 'fullName', required: true, type: 'text' },
      { id: 'email', label: 'Email', targetField: 'email', required: true, type: 'email' },
      { id: 'phone', label: 'Phone', targetField: 'phone', required: true, type: 'phone' },
      { id: 'type', label: 'Buyer/Seller', targetField: 'leadType', required: false, type: 'select', aliases: ['type', 'buyer', 'seller'] },
      { id: 'location', label: 'Location Interest', targetField: 'location', required: false, type: 'text', aliases: ['location', 'area', 'neighborhood'] },
      { id: 'price', label: 'Price Range', targetField: 'priceRange', required: false, type: 'text', aliases: ['price', 'budget', 'range'] },
    ],
  },
  {
    id: 'services-general',
    name: 'Service Lead',
    description: 'General service inquiry lead',
    icon: '🛠️',
    category: 'services',
    fields: [
      { id: 'name', label: 'Full Name', targetField: 'fullName', required: true, type: 'text' },
      { id: 'email', label: 'Email', targetField: 'email', required: true, type: 'email' },
      { id: 'phone', label: 'Phone', targetField: 'phone', required: true, type: 'phone' },
      { id: 'service', label: 'Service Needed', targetField: 'service', required: false, type: 'text', aliases: ['service', 'need', 'request'] },
      { id: 'date', label: 'Preferred Date', targetField: 'preferredDate', required: false, type: 'date', aliases: ['date', 'when', 'appointment'] },
      { id: 'notes', label: 'Notes', targetField: 'notes', required: false, type: 'text', aliases: ['notes', 'comments', 'message'] },
    ],
  },
];

// ============ UPLOAD FIELDS ============
export const UPLOAD_FIELDS = [
  { id: 'fullName', label: 'Full Name', required: true },
  { id: 'email', label: 'Email', required: true },
  { id: 'phone', label: 'Phone', required: true },
  { id: 'vehicleType', label: 'Vehicle Interest', required: false },
  { id: 'budget', label: 'Budget', required: false },
  { id: 'timeline', label: 'Timeline', required: false },
  { id: 'source', label: 'Lead Source', required: false },
  { id: 'notes', label: 'Notes', required: false },
];

// ============ DEFAULT WORKFLOW ============
export const createDefaultWorkflow = (): Workflow => ({
  id: `workflow-${Date.now()}`,
  name: 'Sales Pipeline',
  stages: [
    { id: 'stage-1', label: 'New Lead', status: 'new', color: 'blue', icon: '📥', position: { x: 0, y: 0 }, actions: [], order: 0 },
    { id: 'stage-2', label: 'Contacted', status: 'working', color: 'cyan', icon: '📞', position: { x: 350, y: 0 }, actions: [], order: 1 },
    { id: 'stage-3', label: 'Qualified', status: 'working', color: 'green', icon: '✅', position: { x: 700, y: 0 }, actions: [], order: 2 },
    { id: 'stage-4', label: 'Proposal', status: 'approval', color: 'purple', icon: '📋', position: { x: 1050, y: 0 }, actions: [], order: 3 },
    { id: 'stage-5', label: 'Won', status: 'approval', color: 'emerald', icon: '🏆', position: { x: 1400, y: 0 }, actions: [], order: 4 },
  ],
  connections: [
    { id: 'conn-1', from: 'stage-1', to: 'stage-2' },
    { id: 'conn-2', from: 'stage-2', to: 'stage-3' },
    { id: 'conn-3', from: 'stage-3', to: 'stage-4' },
    { id: 'conn-4', from: 'stage-4', to: 'stage-5' },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ============ LAYOUT CONSTANTS ============
export const LAYOUT = {
  STAGE_WIDTH_COLLAPSED: 200,
  STAGE_WIDTH_EXPANDED: 320,
  STAGE_HEIGHT_COLLAPSED: 60,
  STAGE_HEIGHT_EXPANDED: 400,
  STAGE_SPACING: 80,
  ROW_HEIGHT: 500,
  CANVAS_PADDING: 100,
};
