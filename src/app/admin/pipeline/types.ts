// ============================================================
// PIPELINE TYPES - Clean Architecture for Flow-Based CRM
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
}

export const STAGE_COLORS: ColorDefinition[] = [
  { id: 'blue', bg: 'bg-blue-500/15', bgSolid: 'bg-blue-500', border: 'border-blue-500/40', text: 'text-blue-400', accent: '#3b82f6' },
  { id: 'cyan', bg: 'bg-cyan-500/15', bgSolid: 'bg-cyan-500', border: 'border-cyan-500/40', text: 'text-cyan-400', accent: '#06b6d4' },
  { id: 'teal', bg: 'bg-teal-500/15', bgSolid: 'bg-teal-500', border: 'border-teal-500/40', text: 'text-teal-400', accent: '#14b8a6' },
  { id: 'emerald', bg: 'bg-emerald-500/15', bgSolid: 'bg-emerald-500', border: 'border-emerald-500/40', text: 'text-emerald-400', accent: '#10b981' },
  { id: 'green', bg: 'bg-green-500/15', bgSolid: 'bg-green-500', border: 'border-green-500/40', text: 'text-green-400', accent: '#22c55e' },
  { id: 'yellow', bg: 'bg-yellow-500/15', bgSolid: 'bg-yellow-500', border: 'border-yellow-500/40', text: 'text-yellow-400', accent: '#eab308' },
  { id: 'amber', bg: 'bg-amber-500/15', bgSolid: 'bg-amber-500', border: 'border-amber-500/40', text: 'text-amber-400', accent: '#f59e0b' },
  { id: 'orange', bg: 'bg-orange-500/15', bgSolid: 'bg-orange-500', border: 'border-orange-500/40', text: 'text-orange-400', accent: '#f97316' },
  { id: 'red', bg: 'bg-red-500/15', bgSolid: 'bg-red-500', border: 'border-red-500/40', text: 'text-red-400', accent: '#ef4444' },
  { id: 'rose', bg: 'bg-rose-500/15', bgSolid: 'bg-rose-500', border: 'border-rose-500/40', text: 'text-rose-400', accent: '#f43f5e' },
  { id: 'pink', bg: 'bg-pink-500/15', bgSolid: 'bg-pink-500', border: 'border-pink-500/40', text: 'text-pink-400', accent: '#ec4899' },
  { id: 'purple', bg: 'bg-purple-500/15', bgSolid: 'bg-purple-500', border: 'border-purple-500/40', text: 'text-purple-400', accent: '#a855f7' },
  { id: 'violet', bg: 'bg-violet-500/15', bgSolid: 'bg-violet-500', border: 'border-violet-500/40', text: 'text-violet-400', accent: '#8b5cf6' },
  { id: 'indigo', bg: 'bg-indigo-500/15', bgSolid: 'bg-indigo-500', border: 'border-indigo-500/40', text: 'text-indigo-400', accent: '#6366f1' },
  { id: 'slate', bg: 'bg-slate-500/15', bgSolid: 'bg-slate-500', border: 'border-slate-500/40', text: 'text-slate-400', accent: '#64748b' },
];

export const getColor = (id: StageColor): ColorDefinition => 
  STAGE_COLORS.find(c => c.id === id) || STAGE_COLORS[0];

// ============ TIMING ============
export interface TimerConfig {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

export const formatTimer = (t: TimerConfig): string => 
  `${t.value} ${t.unit}${t.value !== 1 ? '' : t.unit.slice(0, -1)}`;

// ============ ACTION TYPES ============
export type ActionType = 'email' | 'sms' | 'call' | 'reminder' | 'webhook';

export interface ActionConfig {
  id: string;
  type: ActionType;
  templateId: string;
  enabled: boolean;
  waitBefore?: TimerConfig;
  condition?: 'always' | 'no-response' | 'if-opened';
}

// ============ STAGE ============
export type StageStatus = 'new' | 'working' | 'circle-back' | 'approval' | 'dead';

export interface Stage {
  id: string;
  label: string;
  status: StageStatus;
  deadReason?: string;
  color: StageColor;
  icon: string;
  description?: string;
  position: { x: number; y: number };
  actions: ActionConfig[];
}

// ============ CONNECTION ============
export interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: 'default' | 'no-response' | 'success' | 'failure';
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

// ============ VIEW MODE ============
export type ViewMode = 'builder' | 'nodes';

// ============ DEAD LEAD CATEGORIES ============
export const DEAD_LEAD_CATEGORIES = [
  { id: 'declined', label: 'Declined', icon: '✕', color: 'red' as StageColor, description: 'Application declined' },
  { id: 'not-interested', label: 'Not Interested', icon: '−', color: 'red' as StageColor, description: 'Lead not interested' },
  { id: 'negative-equity', label: 'Negative Equity', icon: '↓', color: 'rose' as StageColor, description: 'Upside down on trade' },
  { id: 'no-contact', label: 'No Response', icon: '○', color: 'orange' as StageColor, description: 'Could not reach' },
  { id: 'already-purchased', label: 'Already Purchased', icon: '✓', color: 'slate' as StageColor, description: 'Bought elsewhere' },
  { id: 'no-vehicle', label: 'No Match', icon: '?', color: 'amber' as StageColor, description: 'No matching vehicle' },
  { id: 'cannot-afford', label: 'Budget Issue', icon: '$', color: 'pink' as StageColor, description: 'Payment too high' },
];

// ============ PRESET STAGES ============
export const STAGE_PRESETS = [
  { label: 'New Lead', status: 'new' as StageStatus, icon: '→', color: 'blue' as StageColor },
  { label: 'Contacted', status: 'working' as StageStatus, icon: '◎', color: 'cyan' as StageColor },
  { label: 'Qualified', status: 'working' as StageStatus, icon: '✓', color: 'green' as StageColor },
  { label: 'Meeting Set', status: 'working' as StageStatus, icon: '◇', color: 'purple' as StageColor },
  { label: 'Proposal', status: 'approval' as StageStatus, icon: '□', color: 'emerald' as StageColor },
  { label: 'Won', status: 'approval' as StageStatus, icon: '★', color: 'emerald' as StageColor },
];

// ============ ACTION PRESETS ============
export const ACTION_PRESETS = [
  { type: 'email' as ActionType, label: 'Email', icon: '✉' },
  { type: 'sms' as ActionType, label: 'SMS', icon: '⬚' },
  { type: 'call' as ActionType, label: 'Call', icon: '◯' },
  { type: 'reminder' as ActionType, label: 'Reminder', icon: '⏱' },
];

// ============ STORAGE KEYS ============
export const STORAGE_KEY = 'pipeline-workflows-v3';
export const ACTIVE_WORKFLOW_KEY = 'pipeline-active-workflow';

// ============ DEFAULT WORKFLOW - HOURGLASS PATTERN ============
// New Lead at center-left, branches spread right like hourglass
export const createDefaultWorkflow = (): Workflow => ({
  id: `workflow-${Date.now()}`,
  name: 'New Pipeline',
  stages: [
    // Center focal point - NEW LEAD (larger implied by being central)
    { id: 'stage-new', label: 'New Lead', status: 'new', color: 'blue', icon: '📥', position: { x: 100, y: 300 }, actions: [] },
    
    // First branch out - Working stages (spread vertically)
    { id: 'stage-contacted', label: 'Contacted', status: 'working', color: 'cyan', icon: '📞', position: { x: 400, y: 150 }, actions: [] },
    { id: 'stage-qualified', label: 'Qualified', status: 'working', color: 'green', icon: '✓', position: { x: 400, y: 300 }, actions: [] },
    { id: 'stage-followup', label: 'Follow Up', status: 'circle-back', color: 'yellow', icon: '🔄', position: { x: 400, y: 450 }, actions: [] },
    
    // Second branch - Narrowing back (hourglass waist)
    { id: 'stage-meeting', label: 'Meeting Set', status: 'working', color: 'purple', icon: '📅', position: { x: 700, y: 220 }, actions: [] },
    { id: 'stage-proposal', label: 'Proposal', status: 'approval', color: 'violet', icon: '📋', position: { x: 700, y: 380 }, actions: [] },
    
    // Final convergence - Won (hourglass exit)
    { id: 'stage-won', label: 'Won', status: 'approval', color: 'emerald', icon: '🏆', position: { x: 1000, y: 300 }, actions: [] },
  ],
  connections: [
    // From New Lead - branching out
    { id: 'conn-1', from: 'stage-new', to: 'stage-contacted' },
    { id: 'conn-2', from: 'stage-new', to: 'stage-qualified' },
    { id: 'conn-3', from: 'stage-new', to: 'stage-followup' },
    
    // Working stages converge to meeting/proposal
    { id: 'conn-4', from: 'stage-contacted', to: 'stage-meeting' },
    { id: 'conn-5', from: 'stage-qualified', to: 'stage-meeting' },
    { id: 'conn-6', from: 'stage-qualified', to: 'stage-proposal' },
    { id: 'conn-7', from: 'stage-followup', to: 'stage-proposal' },
    
    // Final convergence to Won
    { id: 'conn-8', from: 'stage-meeting', to: 'stage-won' },
    { id: 'conn-9', from: 'stage-proposal', to: 'stage-won' },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ============ LEAD UPLOAD ============
export interface UploadMapping {
  sourceColumn: string;
  targetField: string;
}

export interface UploadConfig {
  mappings: UploadMapping[];
  skipFirstRow: boolean;
  defaultStage: string;
}

export const UPLOAD_FIELDS = [
  { id: 'fullName', label: 'Full Name', required: true, type: 'text' },
  { id: 'email', label: 'Email', required: true, type: 'email' },
  { id: 'phone', label: 'Phone', required: true, type: 'phone' },
  { id: 'vehicleInterest', label: 'Vehicle Interest', required: false, type: 'text' },
  { id: 'budget', label: 'Budget', required: false, type: 'currency' },
  { id: 'downPayment', label: 'Down Payment', required: false, type: 'currency' },
  { id: 'creditScore', label: 'Credit Score', required: false, type: 'number' },
  { id: 'employmentStatus', label: 'Employment Status', required: false, type: 'select' },
  { id: 'income', label: 'Monthly Income', required: false, type: 'currency' },
  { id: 'tradeIn', label: 'Trade-In Vehicle', required: false, type: 'text' },
  { id: 'tradeInValue', label: 'Trade-In Value', required: false, type: 'currency' },
  { id: 'source', label: 'Lead Source', required: false, type: 'text' },
  { id: 'notes', label: 'Notes', required: false, type: 'textarea' },
  { id: 'tags', label: 'Tags', required: false, type: 'tags' },
];

// ============ UPLOAD TEMPLATES ============
export interface UploadTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'universal' | 'automotive' | 'real-estate' | 'services' | 'custom';
  headers: string[];
  sampleRow: string[];
  mappings: Record<string, string>;
}

export const UPLOAD_TEMPLATES: UploadTemplate[] = [
  // Universal Templates
  {
    id: 'basic-lead',
    name: 'Basic Lead',
    description: 'Simple lead with name, email, phone',
    icon: '📋',
    category: 'universal',
    headers: ['Full Name', 'Email', 'Phone', 'Notes'],
    sampleRow: ['John Smith', 'john@email.com', '(416) 555-1234', 'Interested in services'],
    mappings: { 'Full Name': 'fullName', 'Email': 'email', 'Phone': 'phone', 'Notes': 'notes' },
  },
  {
    id: 'detailed-contact',
    name: 'Detailed Contact',
    description: 'Full contact info with source tracking',
    icon: '📇',
    category: 'universal',
    headers: ['Full Name', 'Email', 'Phone', 'Lead Source', 'Tags', 'Notes'],
    sampleRow: ['Jane Doe', 'jane@email.com', '(905) 555-5678', 'Facebook Ad', 'Hot Lead, VIP', 'Ready to purchase'],
    mappings: { 'Full Name': 'fullName', 'Email': 'email', 'Phone': 'phone', 'Lead Source': 'source', 'Tags': 'tags', 'Notes': 'notes' },
  },
  
  // Automotive Templates
  {
    id: 'auto-buyer',
    name: 'Auto Buyer Lead',
    description: 'Vehicle buyer with financing details',
    icon: '🚗',
    category: 'automotive',
    headers: ['Full Name', 'Email', 'Phone', 'Vehicle Interest', 'Budget', 'Down Payment', 'Credit Score'],
    sampleRow: ['Mike Johnson', 'mike@email.com', '(647) 555-9012', '2024 Honda CR-V', '$35,000', '$5,000', '720'],
    mappings: { 
      'Full Name': 'fullName', 'Email': 'email', 'Phone': 'phone', 
      'Vehicle Interest': 'vehicleInterest', 'Budget': 'budget', 
      'Down Payment': 'downPayment', 'Credit Score': 'creditScore' 
    },
  },
  {
    id: 'auto-tradein',
    name: 'Auto + Trade-In',
    description: 'Buyer with trade-in vehicle',
    icon: '🔄',
    category: 'automotive',
    headers: ['Full Name', 'Email', 'Phone', 'Vehicle Interest', 'Budget', 'Trade-In Vehicle', 'Trade-In Value', 'Notes'],
    sampleRow: ['Sarah Williams', 'sarah@email.com', '(416) 555-3456', '2024 Toyota RAV4', '$40,000', '2019 Ford Escape', '$15,000', 'Wants to upgrade'],
    mappings: { 
      'Full Name': 'fullName', 'Email': 'email', 'Phone': 'phone', 
      'Vehicle Interest': 'vehicleInterest', 'Budget': 'budget',
      'Trade-In Vehicle': 'tradeIn', 'Trade-In Value': 'tradeInValue', 'Notes': 'notes'
    },
  },
  {
    id: 'auto-financing',
    name: 'Financing Application',
    description: 'Full financing details',
    icon: '💰',
    category: 'automotive',
    headers: ['Full Name', 'Email', 'Phone', 'Employment Status', 'Monthly Income', 'Budget', 'Down Payment', 'Credit Score', 'Vehicle Interest'],
    sampleRow: ['David Brown', 'david@email.com', '(905) 555-7890', 'Full-time', '$5,500', '$30,000', '$3,000', '680', 'SUV or Crossover'],
    mappings: { 
      'Full Name': 'fullName', 'Email': 'email', 'Phone': 'phone',
      'Employment Status': 'employmentStatus', 'Monthly Income': 'income',
      'Budget': 'budget', 'Down Payment': 'downPayment', 
      'Credit Score': 'creditScore', 'Vehicle Interest': 'vehicleInterest'
    },
  },
  
  // Real Estate Templates
  {
    id: 'home-buyer',
    name: 'Home Buyer',
    description: 'Real estate buyer lead',
    icon: '🏠',
    category: 'real-estate',
    headers: ['Full Name', 'Email', 'Phone', 'Property Interest', 'Budget', 'Pre-Approved', 'Timeline', 'Notes'],
    sampleRow: ['Emily Chen', 'emily@email.com', '(416) 555-2468', 'Condo Downtown', '$600,000', 'Yes', '3 months', 'First-time buyer'],
    mappings: { 
      'Full Name': 'fullName', 'Email': 'email', 'Phone': 'phone',
      'Property Interest': 'vehicleInterest', 'Budget': 'budget', 'Notes': 'notes'
    },
  },
  
  // Service Templates
  {
    id: 'service-inquiry',
    name: 'Service Inquiry',
    description: 'General service request',
    icon: '🔧',
    category: 'services',
    headers: ['Full Name', 'Email', 'Phone', 'Service Needed', 'Preferred Date', 'Budget', 'Notes'],
    sampleRow: ['Chris Taylor', 'chris@email.com', '(647) 555-1357', 'Full Detail', '2024-01-15', '$200', 'Has appointment booked'],
    mappings: { 
      'Full Name': 'fullName', 'Email': 'email', 'Phone': 'phone',
      'Service Needed': 'vehicleInterest', 'Budget': 'budget', 'Notes': 'notes'
    },
  },
];

// ============ HEADER VALIDATION ============
export const validateHeaders = (headers: string[], template: UploadTemplate): { valid: boolean; missing: string[]; extra: string[] } => {
  const templateHeaders = new Set(template.headers.map(h => h.toLowerCase()));
  const inputHeaders = new Set(headers.map(h => h.toLowerCase()));
  
  const missing = template.headers.filter(h => !inputHeaders.has(h.toLowerCase()));
  const extra = headers.filter(h => !templateHeaders.has(h.toLowerCase()));
  
  const requiredFields = ['full name', 'email', 'phone'];
  const hasRequired = requiredFields.every(f => inputHeaders.has(f));
  
  return { valid: hasRequired && missing.length === 0, missing, extra };
};
