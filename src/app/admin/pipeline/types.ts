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
  color?: string;
  icon?: string;
  contactMethods?: ContactMethod[];
  automationSettings?: AutomationSettings;
}

export interface ContactMethod {
  id: string;
  type: 'email' | 'phone' | 'text' | 'whatsapp' | 'meeting' | 'reminder' | 'manual';
  enabled: boolean;
  settings: ContactMethodSettings;
}

export interface ContactMethodSettings {
  timing: 'immediate' | 'delayed' | 'scheduled';
  delay?: number; // in hours
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
  noResponseDelay: number; // in hours
  reminderEnabled: boolean;
  reminderFrequency: number; // in hours
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
}

export interface ConnectionCondition {
  type: 'opened' | 'clicked' | 'replied' | 'no-response' | 'delay' | 'always';
  value?: number; // for delay in hours
}

export interface NodeTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: TemplateCategory;
  preview: 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'cyan' | 'orange' | 'grey';
  defaultStatusId: LeadStatus | 'dead';
  contactMethods: ContactMethod[];
  suggestedConnections: string[];
}

export type TemplateCategory = 
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
  icon: string;
  complexity: 'simple' | 'medium' | 'advanced' | 'power-user';
  tags: string[];
}

export type PresetCategory = 
  | 'personality-types'
  | 'agent-styles'
  | 'pipeline-purposes'
  | 'complexity-levels';

export interface DragState {
  isDragging: boolean;
  dragType: 'stage' | 'lead' | 'connection' | null;
  draggedItem: any;
  startPosition: { x: number; y: number };
}

export interface SelectionState {
  selectedStages: Set<string>;
  selectedLeads: Set<string>;
  selectionBox: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
}

export interface PipelineMode {
  type: 'node' | 'dragdrop';
  subMode: 'default' | 'connecting' | 'selecting' | 'resizing';
}

