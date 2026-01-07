// Universal Logic Engine Types - No-Code Operating System
// Supports any business structure with full customization

// ============ UNIVERSAL DATA STRUCTURE ============
// Every lead is JSON, not fixed columns - infinite custom fields

export interface UniversalLead {
  id: string;
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    partner_name?: string;
    income?: number;
    budget?: number;
    custom_fields: Record<string, any>;
  };
  metadata: {
    source: string;
    created_at: string;
    updated_at: string;
    current_node_id?: string;
    workflow_id?: string;
    tags: string[];
  };
}

// ============ NODE TYPES ============

export type NodeType = 
  | 'START'           // Entry points - API, Excel, Manual
  | 'EMAIL'           // Send email to lead
  | 'SMS'             // Send SMS to lead
  | 'INTERNAL_TASK'   // Self reminder - doesn't contact lead
  | 'DELAY'           // Wait before next action
  | 'DECISION'        // Conditional branching
  | 'SCHEDULER'       // Google Meets integration
  | 'CONTAINER'       // Multi-person households/teams
  | 'DATA_MAP'        // Excel/Sheets column mapping
  | 'CUSTOM'          // User-created node types
  | 'WEBHOOK'         // External integrations
  | 'AI_RESPONSE'     // AI-powered responses
  | 'END';            // Workflow termination

export type NodeShape = 'circle' | 'rectangle' | 'diamond' | 'sticky' | 'container' | 'hexagon';

// ============ CONNECTION STATES ============

export type ConnectionState = 'waiting' | 'active' | 'error' | 'success';

export interface Connection {
  id: string;
  from_node_id: string;
  to_node_id: string;
  from_socket: 'success' | 'failure' | 'timeout' | 'yes' | 'no' | 'booked' | 'no_show' | 'default';
  to_socket: 'input';
  state: ConnectionState;
  label?: string;
  conversion_rate?: number; // Shown at zoom out
  animated: boolean;
}

// ============ BASE NODE ============

export interface BaseNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  label: string;
  description?: string;
  icon: string;
  color: string;
  shape: NodeShape;
  locked: boolean;
  hidden_fields: string[];
  
  // Timing
  delay?: DelayConfig;
  timeout?: DelayConfig;
  
  // Template
  template_id?: string;
  template_preview?: string;
  
  // Connections
  input_sockets: string[];
  output_sockets: OutputSocket[];
}

export interface OutputSocket {
  id: string;
  label: string;
  type: 'success' | 'failure' | 'timeout' | 'yes' | 'no' | 'booked' | 'no_show' | 'default';
  color: string;
}

export interface DelayConfig {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  label: string;
}

// ============ SPECIFIC NODE TYPES ============

export interface StartNode extends BaseNode {
  type: 'START';
  shape: 'circle';
  entry_type: 'api' | 'excel_upload' | 'manual' | 'webhook' | 'form';
  data_mapping?: DataMapping;
}

export interface EmailNode extends BaseNode {
  type: 'EMAIL';
  shape: 'rectangle';
  subject_preview?: string;
  template_id?: string;
  send_delay?: DelayConfig;
  track_opens: boolean;
  track_clicks: boolean;
}

export interface SMSNode extends BaseNode {
  type: 'SMS';
  shape: 'rectangle';
  message_preview?: string;
  template_id?: string;
  send_delay?: DelayConfig;
}

export interface InternalTaskNode extends BaseNode {
  type: 'INTERNAL_TASK';
  shape: 'sticky';
  task_text: string;
  checklist: TaskItem[];
  notify_agent: boolean;
  action_target: 'SELF' | 'MANAGER' | 'TEAM';
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DelayNode extends BaseNode {
  type: 'DELAY';
  shape: 'diamond';
  delay_duration: DelayConfig;
  show_countdown: boolean;
  progress_animation: boolean;
}

export interface DecisionNode extends BaseNode {
  type: 'DECISION';
  shape: 'diamond';
  condition_type: 'replied' | 'signed' | 'opened_email' | 'clicked_link' | 'booked_meeting' | 'custom';
  custom_condition?: string;
  wait_for_condition: boolean;
  condition_timeout?: DelayConfig;
}

export interface SchedulerNode extends BaseNode {
  type: 'SCHEDULER';
  shape: 'rectangle';
  calendar_type: 'google_meet' | 'zoom' | 'calendly' | 'custom';
  calendar_link?: string;
  meeting_duration: number; // minutes
  buffer_time: number; // minutes
  available_slots?: AvailableSlot[];
}

export interface AvailableSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time: string;
  end_time: string;
}

export interface ContainerNode extends BaseNode {
  type: 'CONTAINER';
  shape: 'container';
  contained_leads: string[]; // Lead IDs
  group_type: 'household' | 'business_team' | 'committee' | 'custom';
  group_name: string;
  primary_contact_id?: string;
}

export interface DataMapNode extends BaseNode {
  type: 'DATA_MAP';
  shape: 'rectangle';
  source_type: 'excel' | 'google_sheets' | 'csv' | 'api';
  column_mappings: DataMapping;
  auto_create_fields: boolean;
}

export interface DataMapping {
  [column_name: string]: string; // column -> field name
}

export interface CustomNode extends BaseNode {
  type: 'CUSTOM';
  custom_type_id: string;
  custom_fields: CustomField[];
  custom_triggers: CustomTrigger[];
  custom_outputs: OutputSocket[];
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'variable';
  required: boolean;
  default_value?: any;
  options?: string[];
}

export interface CustomTrigger {
  id: string;
  name: string;
  event: string;
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

// ============ TEMPLATE SYSTEM ============

export interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'internal_reminder' | 'voice_script' | 'call_guide';
  category: string;
  subject?: string;
  content: string;
  variables: string[]; // {first_name}, {address}, etc.
  created_at: string;
  updated_at: string;
  usage_count: number;
}

// ============ WORKFLOW ============

export interface Workflow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  
  // Canvas state
  nodes: (StartNode | EmailNode | SMSNode | InternalTaskNode | DelayNode | DecisionNode | SchedulerNode | ContainerNode | DataMapNode | CustomNode | BaseNode)[];
  connections: Connection[];
  labels: CanvasLabel[];
  
  // View state
  zoom: number;
  pan: { x: number; y: number };
  
  // Settings
  settings: WorkflowSettings;
  
  // Analytics
  analytics: WorkflowAnalytics;
}

export interface CanvasLabel {
  id: string;
  text: string;
  position: { x: number; y: number };
  font_size: number;
  color: string;
  background?: string;
}

export interface WorkflowSettings {
  auto_save: boolean;
  save_interval: number; // seconds
  grid_visible: boolean;
  grid_size: number;
  snap_to_grid: boolean;
  snap_to_align: boolean;
  show_minimap: boolean;
  show_conversion_rates: boolean;
  animation_speed: 'slow' | 'normal' | 'fast';
}

export interface WorkflowAnalytics {
  total_leads_processed: number;
  active_leads: number;
  conversion_rate: number;
  average_time_to_complete: number; // hours
  node_stats: NodeStats[];
}

export interface NodeStats {
  node_id: string;
  leads_entered: number;
  leads_exited: number;
  average_time: number; // hours
  success_rate: number;
}

// ============ FEATURE FLAGS ============

export interface FeatureFlags {
  show_upload_leads: boolean;
  show_templates: boolean;
  show_google_meets: boolean;
  show_sms: boolean;
  show_multi_person_grouping: boolean;
  show_notes_panel: boolean;
  show_analytics: boolean;
  show_ai_features: boolean;
  show_webhooks: boolean;
  show_custom_nodes: boolean;
  complexity_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  show_upload_leads: true,
  show_templates: true,
  show_google_meets: true,
  show_sms: true,
  show_multi_person_grouping: true,
  show_notes_panel: true,
  show_analytics: true,
  show_ai_features: false,
  show_webhooks: false,
  show_custom_nodes: false,
  complexity_level: 'intermediate',
};

// ============ CANVAS PHYSICS ============

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  velocity: { x: number; y: number }; // For inertial scrolling
  is_panning: boolean;
  is_zooming: boolean;
  selected_nodes: string[];
  selected_connections: string[];
  dragging_node: string | null;
  connecting_from: { node_id: string; socket: string } | null;
  cursor_position: { x: number; y: number };
}

export const CANVAS_DEFAULTS = {
  min_zoom: 0.1,
  max_zoom: 5.0,
  grid_size: 20,
  grid_opacity: 0.1,
  inertia_decay: 0.95,
  snap_threshold: 10,
  connection_animation_speed: 2000, // ms for one pulse
};

// ============ NODE COLORS & SHAPES ============

export const NODE_COLORS = {
  START: { bg: '#22c55e', border: '#16a34a', text: '#ffffff' },
  EMAIL: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
  SMS: { bg: '#06b6d4', border: '#0891b2', text: '#ffffff' },
  INTERNAL_TASK: { bg: '#fbbf24', border: '#f59e0b', text: '#1f2937' },
  DELAY: { bg: '#a855f7', border: '#9333ea', text: '#ffffff' },
  DECISION: { bg: '#f97316', border: '#ea580c', text: '#ffffff' },
  SCHEDULER: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' },
  CONTAINER: { bg: '#64748b', border: '#475569', text: '#ffffff' },
  DATA_MAP: { bg: '#14b8a6', border: '#0d9488', text: '#ffffff' },
  CUSTOM: { bg: '#ec4899', border: '#db2777', text: '#ffffff' },
  WEBHOOK: { bg: '#6366f1', border: '#4f46e5', text: '#ffffff' },
  AI_RESPONSE: { bg: '#10b981', border: '#059669', text: '#ffffff' },
  END: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
};

export const NODE_ICONS = {
  START: '🚀',
  EMAIL: '✉️',
  SMS: '💬',
  INTERNAL_TASK: '📝',
  DELAY: '⏱️',
  DECISION: '🔀',
  SCHEDULER: '📅',
  CONTAINER: '👥',
  DATA_MAP: '📊',
  CUSTOM: '⚙️',
  WEBHOOK: '🔗',
  AI_RESPONSE: '🤖',
  END: '🏁',
};

// ============ CONNECTION COLORS ============

export const CONNECTION_COLORS = {
  waiting: '#64748b',
  active: '#3b82f6',
  error: '#ef4444',
  success: '#22c55e',
};

// ============ HELPER FUNCTIONS ============

export const createNode = (type: NodeType, position: { x: number; y: number }): BaseNode => {
  const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const colors = NODE_COLORS[type];
  const icon = NODE_ICONS[type];
  
  const shapeMap: Record<NodeType, NodeShape> = {
    START: 'circle',
    EMAIL: 'rectangle',
    SMS: 'rectangle',
    INTERNAL_TASK: 'sticky',
    DELAY: 'diamond',
    DECISION: 'diamond',
    SCHEDULER: 'rectangle',
    CONTAINER: 'container',
    DATA_MAP: 'rectangle',
    CUSTOM: 'hexagon',
    WEBHOOK: 'rectangle',
    AI_RESPONSE: 'rectangle',
    END: 'circle',
  };

  const defaultOutputs: Record<NodeType, OutputSocket[]> = {
    START: [{ id: 'out-default', label: 'Continue', type: 'default', color: colors.bg }],
    EMAIL: [
      { id: 'out-success', label: 'Sent', type: 'success', color: '#22c55e' },
      { id: 'out-failure', label: 'Failed', type: 'failure', color: '#ef4444' },
    ],
    SMS: [
      { id: 'out-success', label: 'Sent', type: 'success', color: '#22c55e' },
      { id: 'out-failure', label: 'Failed', type: 'failure', color: '#ef4444' },
    ],
    INTERNAL_TASK: [{ id: 'out-default', label: 'Done', type: 'default', color: colors.bg }],
    DELAY: [{ id: 'out-default', label: 'Continue', type: 'default', color: colors.bg }],
    DECISION: [
      { id: 'out-yes', label: 'Yes', type: 'yes', color: '#22c55e' },
      { id: 'out-no', label: 'No', type: 'no', color: '#ef4444' },
    ],
    SCHEDULER: [
      { id: 'out-booked', label: 'Booked', type: 'booked', color: '#22c55e' },
      { id: 'out-noshow', label: 'No Show', type: 'no_show', color: '#ef4444' },
    ],
    CONTAINER: [{ id: 'out-default', label: 'Continue', type: 'default', color: colors.bg }],
    DATA_MAP: [{ id: 'out-default', label: 'Mapped', type: 'default', color: colors.bg }],
    CUSTOM: [{ id: 'out-default', label: 'Continue', type: 'default', color: colors.bg }],
    WEBHOOK: [
      { id: 'out-success', label: 'Success', type: 'success', color: '#22c55e' },
      { id: 'out-failure', label: 'Error', type: 'failure', color: '#ef4444' },
    ],
    AI_RESPONSE: [{ id: 'out-default', label: 'Continue', type: 'default', color: colors.bg }],
    END: [],
  };

  const sizeMap: Record<NodeType, { width: number; height: number }> = {
    START: { width: 120, height: 120 },
    EMAIL: { width: 240, height: 160 },
    SMS: { width: 240, height: 140 },
    INTERNAL_TASK: { width: 220, height: 180 },
    DELAY: { width: 140, height: 140 },
    DECISION: { width: 160, height: 160 },
    SCHEDULER: { width: 260, height: 180 },
    CONTAINER: { width: 400, height: 300 },
    DATA_MAP: { width: 280, height: 200 },
    CUSTOM: { width: 200, height: 160 },
    WEBHOOK: { width: 220, height: 140 },
    AI_RESPONSE: { width: 240, height: 160 },
    END: { width: 100, height: 100 },
  };

  return {
    id,
    type,
    position,
    size: sizeMap[type],
    label: type.replace('_', ' '),
    icon,
    color: colors.bg,
    shape: shapeMap[type],
    locked: false,
    hidden_fields: [],
    input_sockets: ['input'],
    output_sockets: defaultOutputs[type],
  };
};

export const createConnection = (
  from_node_id: string,
  from_socket: string,
  to_node_id: string
): Connection => {
  return {
    id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    from_node_id,
    to_node_id,
    from_socket: from_socket as any,
    to_socket: 'input',
    state: 'waiting',
    animated: true,
  };
};







