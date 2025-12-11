// Pipeline Presets - All nodes properly connected with larger sizes
import { Preset, PipelineStage, NodeConnection, TextLabel, EmailTemplate, DEFAULT_AUTOMATION, DEFAULT_CONTACT_SETTINGS, DEFAULT_EMAIL_TEMPLATES } from './types';
import { LeadStatus } from '@/lib/validation';

// Helper for contact methods
const cm = (types: string[], overrides: any = {}) => types.map(type => ({
  id: type, type: type as any, enabled: true, settings: { ...DEFAULT_CONTACT_SETTINGS, ...overrides },
}));

// Create stage helper - MUCH LARGER default sizes
const stage = (
  id: string, label: string, statusId: LeadStatus | 'dead', x: number, y: number,
  icon: string, color: any, contactTypes: string[] = ['email'],
  contactOverrides: any = {}, opts: any = {}
): PipelineStage => ({
  id, label, statusId, x, y,
  width: opts.width || 360, // LARGER DEFAULT
  height: opts.height || 340, // LARGER DEFAULT
  color, icon,
  contactMethods: cm(contactTypes, contactOverrides),
  automationSettings: DEFAULT_AUTOMATION,
  emailTemplateId: opts.emailTemplateId,
  followUpMethod: opts.followUpMethod,
  meetingType: opts.meetingType,
  deadReason: opts.deadReason,
});

// Connection helper - proper anchors for visual connections
const conn = (from: string, to: string, label?: string, condition?: any, style: any = 'solid'): NodeConnection => ({
  id: `${from}-${to}`,
  fromStageId: from,
  toStageId: to,
  fromAnchor: 'right',
  toAnchor: 'left',
  label,
  condition,
  style,
  color: style === 'dashed' ? '#94a3b8' : '#3b82f6',
});

// ============ PRESETS ============

export const ALL_PRESETS: Preset[] = [
  // SIMPLE 3-STAGE
  {
    id: 'simple',
    name: 'Simple Pipeline',
    description: 'Basic 3-stage funnel. Perfect for beginners.',
    icon: '📊',
    complexity: 'simple',
    stages: [
      stage('new', 'New Leads', 'new', 8, 50, '📥', 'blue', ['email'], { tone: 'friendly' }, { width: 380, height: 380, emailTemplateId: 'welcome-1' }),
      stage('working', 'Working', 'working', 42, 50, '⚙️', 'yellow', ['email', 'phone'], {}, { width: 380, height: 380, emailTemplateId: 'followup-1' }),
      stage('done', 'Completed', 'approval', 76, 50, '✅', 'green', ['email', 'phone'], { tone: 'friendly' }, { width: 360, height: 340, emailTemplateId: 'closing-1' }),
    ],
    connections: [
      conn('new', 'working', 'Engage'),
      conn('working', 'done', 'Close'),
    ],
    labels: [
      { id: 'l1', text: 'Simple Sales Pipeline', x: 42, y: 8, fontSize: 24, color: '#94a3b8' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // STANDARD 5-STAGE
  {
    id: 'standard',
    name: 'Standard Pipeline',
    description: '5 stages with follow-up branch and email sequences.',
    icon: '📈',
    complexity: 'medium',
    stages: [
      stage('inbox', 'Inbox', 'new', 5, 45, '📥', 'blue', ['email'], { timing: 'immediate' }, { width: 340, height: 380, emailTemplateId: 'welcome-1' }),
      stage('engaged', 'Engaged', 'working', 30, 25, '💬', 'yellow', ['email', 'phone'], {}, { width: 320, height: 300, followUpMethod: 'email' }),
      stage('followup', 'Follow Up', 'circle-back', 30, 70, '📞', 'cyan', ['phone', 'text'], { timing: 'scheduled' }, { width: 320, height: 280, followUpMethod: 'phone', emailTemplateId: 'followup-1' }),
      stage('closing', 'Closing', 'approval', 58, 45, '🎯', 'green', ['phone', 'meeting'], { goal: 'closing' }, { width: 360, height: 360, meetingType: 'online-video', emailTemplateId: 'closing-1' }),
      stage('archive', 'Archive', 'dead', 85, 45, '📦', 'slate', [], {}, { width: 280, height: 260, deadReason: 'not-interested' }),
    ],
    connections: [
      conn('inbox', 'engaged', 'Responded'),
      conn('inbox', 'followup', 'No response 48h', { type: 'no-response', value: 48 }, 'dashed'),
      conn('engaged', 'closing', 'Ready to buy'),
      conn('followup', 'engaged', 'Re-engaged', { type: 'replied' }),
      conn('closing', 'archive', 'Lost', { type: 'negative' }, 'dashed'),
    ],
    labels: [
      { id: 'l1', text: 'Standard Sales Pipeline', x: 45, y: 5, fontSize: 24, color: '#94a3b8' },
      { id: 'l2', text: 'Main Flow →', x: 18, y: 25, fontSize: 14, color: '#64748b' },
      { id: 'l3', text: 'Recovery ↓', x: 18, y: 55, fontSize: 14, color: '#64748b' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // HOT LEAD FAST TRACK
  {
    id: 'hot-track',
    name: 'Hot Lead Fast Track',
    description: 'Speed pipeline for ready-to-buy leads. Close within 24h.',
    icon: '🔥',
    complexity: 'simple',
    stages: [
      stage('hot', 'Hot Lead', 'new', 8, 50, '🔥', 'orange', ['phone', 'text'], { timing: 'immediate', tone: 'urgent' }, { width: 380, height: 400 }),
      stage('qualify', 'Quick Qualify', 'working', 40, 50, '✅', 'yellow', ['phone'], { goal: 'closing' }, { width: 380, height: 400, meetingType: 'online-phone' }),
      stage('close', 'Close Deal', 'approval', 72, 50, '🏆', 'green', ['phone', 'meeting'], { tone: 'urgent', goal: 'closing' }, { width: 380, height: 400, meetingType: 'test-drive', emailTemplateId: 'closing-1' }),
    ],
    connections: [
      conn('hot', 'qualify', 'Within 1 hour'),
      conn('qualify', 'close', 'Same day'),
    ],
    labels: [
      { id: 'l1', text: '🔥 HOT LEAD PIPELINE', x: 40, y: 10, fontSize: 28, color: '#f97316' },
      { id: 'l2', text: 'Goal: Close within 24 hours', x: 40, y: 92, fontSize: 16, color: '#fb923c' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // COLD NURTURE
  {
    id: 'cold-nurture',
    name: 'Cold Lead Nurturing',
    description: 'Long-term drip campaign for cold leads.',
    icon: '❄️',
    complexity: 'advanced',
    stages: [
      stage('cold', 'Cold Pool', 'new', 3, 50, '❄️', 'cyan', ['email'], { timing: 'delayed', delay: 72, followUpStyle: 'gentle' }, { width: 320, height: 360, emailTemplateId: 'reminder-1' }),
      stage('drip1', 'Drip Week 1', 'working', 22, 30, '💧', 'blue', ['email'], { frequency: 'weekly' }, { width: 280, height: 260 }),
      stage('drip2', 'Drip Week 2', 'working', 22, 70, '💧', 'blue', ['email'], { frequency: 'weekly' }, { width: 280, height: 260 }),
      stage('warming', 'Warming Up', 'working', 42, 50, '☀️', 'yellow', ['email', 'text'], { tone: 'friendly' }, { width: 340, height: 340, followUpMethod: 'text' }),
      stage('active', 'Re-Engaged', 'working', 62, 50, '🔥', 'orange', ['phone', 'email'], {}, { width: 340, height: 340, emailTemplateId: 're-engage-1' }),
      stage('convert', 'Converted!', 'approval', 82, 30, '🎯', 'green', ['phone', 'meeting'], { goal: 'closing' }, { width: 300, height: 280, meetingType: 'online-video' }),
      stage('dormant', 'Stay Cold', 'dead', 82, 70, '💤', 'slate', [], {}, { width: 280, height: 240, deadReason: 'not-ready' }),
    ],
    connections: [
      conn('cold', 'drip1', 'Start drip'),
      conn('cold', 'drip2', 'Alt path', undefined, 'dashed'),
      conn('drip1', 'warming', 'Opened', { type: 'opened' }),
      conn('drip2', 'warming', 'Clicked', { type: 'clicked' }),
      conn('warming', 'active', 'Replied', { type: 'replied' }),
      conn('active', 'convert', 'Ready!'),
      conn('warming', 'dormant', 'No response', { type: 'no-response', value: 168 }, 'dashed'),
    ],
    labels: [
      { id: 'l1', text: '❄️ Cold Lead Nurturing', x: 42, y: 5, fontSize: 24, color: '#06b6d4' },
      { id: 'l2', text: 'Email Drip Zone', x: 22, y: 50, fontSize: 12, color: '#64748b' },
      { id: 'l3', text: 'Warm Zone', x: 52, y: 50, fontSize: 12, color: '#64748b' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // FULL FUNNEL - ADVANCED
  {
    id: 'full-funnel',
    name: 'Full Sales Funnel',
    description: 'Complete pipeline with all stages and meeting types.',
    icon: '🚀',
    complexity: 'advanced',
    stages: [
      stage('inbound', 'Inbound', 'new', 3, 40, '📥', 'blue', ['email'], {}, { width: 300, height: 340, emailTemplateId: 'welcome-1' }),
      stage('qualify', 'Qualify', 'working', 18, 20, '✅', 'green', ['email', 'phone'], {}, { width: 280, height: 260 }),
      stage('segment-hot', 'Hot Segment', 'working', 18, 55, '🔥', 'orange', ['phone'], { tone: 'urgent' }, { width: 280, height: 260 }),
      stage('segment-warm', 'Warm Segment', 'working', 18, 80, '☀️', 'yellow', ['email'], {}, { width: 280, height: 240 }),
      stage('nurture', 'Nurture', 'working', 38, 40, '🌱', 'teal', ['email'], { followUpStyle: 'gentle' }, { width: 300, height: 300, emailTemplateId: 'followup-1' }),
      stage('meeting', 'Meeting', 'working', 38, 75, '📅', 'purple', ['meeting'], {}, { width: 300, height: 280, meetingType: 'online-video' }),
      stage('negotiate', 'Negotiate', 'working', 58, 40, '🤝', 'indigo', ['phone', 'meeting'], { goal: 'closing' }, { width: 320, height: 320, meetingType: 'in-person-office' }),
      stage('proposal', 'Proposal', 'working', 58, 75, '📋', 'purple', ['email'], {}, { width: 300, height: 280, emailTemplateId: 'closing-1' }),
      stage('won', 'Won!', 'approval', 78, 30, '🏆', 'green', ['email', 'phone'], {}, { width: 280, height: 280 }),
      stage('lost', 'Lost', 'dead', 78, 65, '📦', 'red', [], {}, { width: 260, height: 240, deadReason: 'competitor' }),
      stage('archive', 'Archive', 'dead', 78, 88, '🗃️', 'slate', [], {}, { width: 240, height: 200, deadReason: 'not-interested' }),
    ],
    connections: [
      conn('inbound', 'qualify', 'Review'),
      conn('qualify', 'segment-hot', 'Hot!'),
      conn('qualify', 'segment-warm', 'Warm'),
      conn('segment-hot', 'meeting', 'Book'),
      conn('segment-warm', 'nurture', 'Drip'),
      conn('nurture', 'meeting', 'Ready'),
      conn('meeting', 'negotiate', 'Interested'),
      conn('negotiate', 'proposal', 'Send'),
      conn('proposal', 'won', 'Accepted'),
      conn('proposal', 'lost', 'Declined', { type: 'negative' }, 'dashed'),
      conn('nurture', 'archive', 'Cold', { type: 'no-response', value: 336 }, 'dashed'),
    ],
    labels: [
      { id: 'l1', text: '🚀 Full Sales Funnel', x: 40, y: 3, fontSize: 26, color: '#a855f7' },
      { id: 'l2', text: 'Qualification', x: 10, y: 15, fontSize: 12, color: '#64748b' },
      { id: 'l3', text: 'Engagement', x: 38, y: 30, fontSize: 12, color: '#64748b' },
      { id: 'l4', text: 'Closing', x: 68, y: 25, fontSize: 12, color: '#64748b' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },
];

// Preset categories
export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All Presets', icon: '📁' },
  { id: 'simple', label: 'Simple', icon: '📊' },
  { id: 'medium', label: 'Standard', icon: '📈' },
  { id: 'advanced', label: 'Advanced', icon: '🚀' },
];
