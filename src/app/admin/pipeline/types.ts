// Pipeline Types - Complete System with Notifications
import { LeadStatus } from '@/lib/validation';

// WORKSPACE PROFILE
export interface WorkspaceProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  stages: PipelineStage[];
  connections: NodeConnection[];
  labels: TextLabel[];
  emailTemplates: EmailTemplate[];
  notifications: PipelineNotification[];
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
  autoOrganize: boolean;
}

// STAGE/NODE
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
  emailTemplateId?: string;
  followUpMethod?: FollowUpMethod;
  meetingType?: MeetingType;
  linkedNotifications?: string[];
  linkedEmails?: string[];
}

export type StageColor = 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'cyan' | 'orange' | 'pink' | 'teal' | 'indigo' | 'slate';

export type FollowUpMethod = 'email' | 'phone' | 'text' | 'whatsapp' | 'meeting' | 'manual' | 'auto-sequence' | 'none';

export type MeetingType = 'online-video' | 'online-phone' | 'in-person-office' | 'in-person-location' | 'test-drive' | 'none';

// NOTIFICATIONS
export interface PipelineNotification {
  id: string;
  type: 'reminder' | 'alert' | 'followup' | 'meeting' | 'deadline';
  title: string;
  message: string;
  icon: string;
  linkedStageId?: string;
  linkedLeadId?: string;
  timing: NotificationTiming;
  isActive: boolean;
  createdAt: string;
  dismissedAt?: string;
}

export interface NotificationTiming {
  type: 'immediate' | 'delay' | 'scheduled' | 'before-event';
  delayMinutes?: number;
  delayHours?: number;
  delayDays?: number;
  scheduledTime?: string;
  beforeEventMinutes?: number;
  repeat?: 'none' | 'daily' | 'weekly' | 'custom';
  repeatInterval?: number;
}

// CONTACT METHODS
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

// CONNECTIONS
export interface NodeConnection {
  id: string;
  fromStageId: string;
  toStageId: string;
  fromAnchor: 'right' | 'bottom';
  toAnchor: 'left' | 'top';
  condition?: ConnectionCondition;
  label?: string;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

export interface ConnectionCondition {
  type: 'always' | 'opened' | 'clicked' | 'replied' | 'no-response' | 'delay' | 'positive' | 'negative';
  value?: number;
  label?: string;
}

// LABELS
export interface TextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bgColor?: string;
}

// EMAIL TEMPLATES
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'follow-up' | 'reminder' | 'closing' | 're-engagement' | 'custom';
  variables: string[];
}

// TEMPLATES FOR ADDING NODES
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
  defaultWidth: number;
  defaultHeight: number;
}

export type TemplateCategory = 'custom' | 'lead-stages' | 'communication' | 'automation' | 'meetings' | 'advanced';

// DEAD LEAD CATEGORIES
export const DEAD_LEAD_CATEGORIES = [
  { id: 'not-interested', label: 'Not Interested', icon: '🚫', color: 'red' as StageColor },
  { id: 'no-contact', label: 'No Contact', icon: '📵', color: 'orange' as StageColor },
  { id: 'bad-timing', label: 'Bad Timing', icon: '⏰', color: 'yellow' as StageColor },
  { id: 'competitor', label: 'Went Competitor', icon: '🏃', color: 'slate' as StageColor },
  { id: 'no-money', label: 'Budget Issue', icon: '💸', color: 'pink' as StageColor },
  { id: 'fake', label: 'Fake/Spam', icon: '🚫', color: 'red' as StageColor },
  { id: 'unqualified', label: 'Unqualified', icon: '❌', color: 'orange' as StageColor },
  { id: 'not-ready', label: 'Not Ready', icon: '⏳', color: 'yellow' as StageColor },
  { id: 'archive', label: 'Archived', icon: '📦', color: 'slate' as StageColor },
];

// PRESET
export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  complexity: 'simple' | 'medium' | 'advanced' | 'expert';
  stages: PipelineStage[];
  connections: NodeConnection[];
  labels: TextLabel[];
  emailTemplates: EmailTemplate[];
  category?: string;
  tags?: string[];
}

// CONSTANTS
export const STAGE_COLORS: { id: StageColor; name: string; bg: string; border: string; text: string; glow: string }[] = [
  { id: 'blue', name: 'Blue', bg: 'from-blue-500/30 to-blue-600/20', border: 'border-blue-400/60', text: 'text-blue-300', glow: 'shadow-blue-500/30' },
  { id: 'yellow', name: 'Yellow', bg: 'from-yellow-500/30 to-yellow-600/20', border: 'border-yellow-400/60', text: 'text-yellow-300', glow: 'shadow-yellow-500/30' },
  { id: 'green', name: 'Green', bg: 'from-emerald-500/30 to-emerald-600/20', border: 'border-emerald-400/60', text: 'text-emerald-300', glow: 'shadow-emerald-500/30' },
  { id: 'red', name: 'Red', bg: 'from-red-500/30 to-red-600/20', border: 'border-red-400/60', text: 'text-red-300', glow: 'shadow-red-500/30' },
  { id: 'purple', name: 'Purple', bg: 'from-purple-500/30 to-purple-600/20', border: 'border-purple-400/60', text: 'text-purple-300', glow: 'shadow-purple-500/30' },
  { id: 'cyan', name: 'Cyan', bg: 'from-cyan-500/30 to-cyan-600/20', border: 'border-cyan-400/60', text: 'text-cyan-300', glow: 'shadow-cyan-500/30' },
  { id: 'orange', name: 'Orange', bg: 'from-orange-500/30 to-orange-600/20', border: 'border-orange-400/60', text: 'text-orange-300', glow: 'shadow-orange-500/30' },
  { id: 'pink', name: 'Pink', bg: 'from-pink-500/30 to-pink-600/20', border: 'border-pink-400/60', text: 'text-pink-300', glow: 'shadow-pink-500/30' },
  { id: 'teal', name: 'Teal', bg: 'from-teal-500/30 to-teal-600/20', border: 'border-teal-400/60', text: 'text-teal-300', glow: 'shadow-teal-500/30' },
  { id: 'indigo', name: 'Indigo', bg: 'from-indigo-500/30 to-indigo-600/20', border: 'border-indigo-400/60', text: 'text-indigo-300', glow: 'shadow-indigo-500/30' },
  { id: 'slate', name: 'Slate', bg: 'from-slate-500/30 to-slate-600/20', border: 'border-slate-400/60', text: 'text-slate-300', glow: 'shadow-slate-500/30' },
];

export const EMOJI_BANK = [
  '📥', '📤', '✅', '❌', '⏸️', '▶️', '🔄', '⚡', '🎯', '🏆',
  '🔥', '☀️', '❄️', '💨', '🌡️', '⭐', '✨', '💎', '🎉', '🚀',
  '✉️', '📧', '📞', '💬', '📱', '📲', '🗣️', '👋', '🤝', '📅',
  '📝', '📋', '📊', '📈', '📉', '🔍', '🔎', '💡', '⚙️', '🛠️',
  '👤', '👥', '🧑‍💼', '👨‍💻', '👩‍💻', '🤵', '👔', '💼', '🎭', '🧠',
  '💰', '💵', '💳', '🏦', '📦', '🎁', '🏷️', '💲', '📑', '🧾',
  '⏰', '⏳', '📆', '🗓️', '⌛', '🕐', '🕑', '🕒', '🕓', '🕔',
  '🔔', '🔕', '📢', '📣', '⚠️', '🚨', '❗', '❓', '💯', '🆕',
  '🚗', '🚙', '🏎️', '🚕', '🛻', '🚐', '🏍️', '🛵', '✈️', '🚁',
  '🏠', '🏢', '🏪', '🏬', '🏭', '🗺️', '📍', '🧭', '🌐', '🔗',
  '💀', '👻', '🚫', '📵', '🏃', '💸', '🤷', '👑', '🎂', '🙏',
  '📹', '📱', '🌱', '💤', '🔧', '💭', '🤝', '👁️', '⏱️', '🎊',
];

export const MEETING_TYPES: { id: MeetingType; label: string; icon: string; desc: string }[] = [
  { id: 'online-video', label: 'Video Call', icon: '📹', desc: 'Zoom, Google Meet, etc.' },
  { id: 'online-phone', label: 'Phone Call', icon: '📞', desc: 'Scheduled phone call' },
  { id: 'in-person-office', label: 'Office Visit', icon: '🏢', desc: 'Meet at your office' },
  { id: 'in-person-location', label: 'Meet Anywhere', icon: '📍', desc: 'Coffee shop, etc.' },
  { id: 'test-drive', label: 'Test Drive', icon: '🚗', desc: 'Vehicle test drive' },
  { id: 'none', label: 'No Meeting', icon: '❌', desc: 'No meeting required' },
];

export const FOLLOW_UP_METHODS: { id: FollowUpMethod; label: string; icon: string }[] = [
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'phone', label: 'Phone Call', icon: '📞' },
  { id: 'text', label: 'Text/SMS', icon: '💬' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { id: 'meeting', label: 'Meeting', icon: '📅' },
  { id: 'manual', label: 'Manual Task', icon: '✋' },
  { id: 'auto-sequence', label: 'Auto Sequence', icon: '🤖' },
  { id: 'none', label: 'No Follow-up', icon: '❌' },
];

export const NOTIFICATION_TYPES = [
  { id: 'reminder', label: 'Reminder', icon: '🔔', color: 'blue' },
  { id: 'alert', label: 'Alert', icon: '⚠️', color: 'yellow' },
  { id: 'followup', label: 'Follow-up Due', icon: '📞', color: 'cyan' },
  { id: 'meeting', label: 'Meeting', icon: '📅', color: 'purple' },
  { id: 'deadline', label: 'Deadline', icon: '⏰', color: 'red' },
];

export const NOTIFICATION_TIMING_OPTIONS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' },
];

export const DEFAULT_AUTOMATION: AutomationSettings = {
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

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  zoom: 0.5,
  panX: 100,
  panY: 80,
  showGrid: true,
  showConnections: true,
  defaultStageWidth: 280,
  defaultStageHeight: 260,
  compactMode: false,
  gridView: false,
  autoOrganize: false,
};

// DEFAULT EMAIL TEMPLATES
export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome-1',
    name: 'Welcome - Warm Intro',
    subject: 'Welcome to My Next Ride Ontario, {{name}}!',
    body: `Hi {{name}},

Thank you for reaching out about finding your next vehicle! I'm excited to help you find the perfect match.

I noticed you're interested in a {{vehicle}}. I have access to a wide network of dealers and 17 different lenders, so we can find options that fit your budget and preferences.

I'll be reviewing your application and will reach out within 24 hours with some options tailored just for you.

In the meantime, feel free to reply to this email if you have any questions!

Best regards,
My Next Ride Ontario Team`,
    category: 'welcome',
    variables: ['{{name}}', '{{vehicle}}'],
  },
  {
    id: 'followup-1',
    name: 'Follow Up - 48 Hours',
    subject: 'Quick follow up on your vehicle search, {{name}}',
    body: `Hi {{name}},

I wanted to follow up on my previous message about your vehicle search.

I've been looking into options for the {{vehicle}} you mentioned, and I have a few possibilities that might interest you.

Would you have a few minutes for a quick call this week? I'd love to discuss what I've found and answer any questions you might have.

Just reply to this email with a time that works for you, or give me a call at your convenience.

Looking forward to hearing from you!

Best,
My Next Ride Ontario Team`,
    category: 'follow-up',
    variables: ['{{name}}', '{{vehicle}}'],
  },
  {
    id: 'reminder-1',
    name: 'Gentle Reminder',
    subject: 'Still looking for your {{vehicle}}, {{name}}?',
    body: `Hi {{name}},

I hope this message finds you well! I wanted to check in and see if you're still in the market for a {{vehicle}}.

If your situation has changed or you've found something already, no worries at all - just let me know and I'll update my records.

But if you're still searching, I'm here to help whenever you're ready. The market is always changing, and I might have some new options that could work for you.

Feel free to reach out anytime!

Best regards,
My Next Ride Ontario Team`,
    category: 'reminder',
    variables: ['{{name}}', '{{vehicle}}'],
  },
  {
    id: 'closing-1',
    name: 'Ready to Close',
    subject: 'Great news about your {{vehicle}}, {{name}}!',
    body: `Hi {{name}},

I have some exciting news! I've found a {{vehicle}} that matches what you're looking for, and I've secured some great financing options.

Here are the details:
- Vehicle: {{vehicle}}
- Monthly Payment: Starting from {{budget}}/month
- Down Payment: Flexible options available

This is a great opportunity, and I'd love to walk you through everything.

Can we schedule a call or meeting to discuss the next steps?

Best,
My Next Ride Ontario Team`,
    category: 'closing',
    variables: ['{{name}}', '{{vehicle}}', '{{budget}}'],
  },
  {
    id: 're-engage-1',
    name: 'Re-Engagement',
    subject: "It's been a while, {{name}} - Let's reconnect!",
    body: `Hi {{name}},

It's been a while since we last connected about your vehicle search. I hope everything is going well!

I wanted to reach out because:
1. The market has changed since we last spoke
2. New inventory is available
3. There might be better financing options now

If you're still interested in finding your perfect vehicle, I'd love to help. No pressure at all - just reply to this email and we can catch up.

Wishing you all the best,
My Next Ride Ontario Team`,
    category: 're-engagement',
    variables: ['{{name}}'],
  },
];

export const MAX_PROFILES = 10;
export const STORAGE_KEY = 'pipeline_profiles_v2';
export const ACTIVE_PROFILE_KEY = 'pipeline_active_profile_v2';
export const AUTO_SAVE_INTERVAL = 500; // Save every 500ms of inactivity
