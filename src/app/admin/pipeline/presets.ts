// Pipeline Presets - Complete library with auto-connected nodes
import { PipelineStage, NodeConnection, TextLabel, EmailTemplate, DEFAULT_AUTOMATION, DEFAULT_CONTACT_SETTINGS, DEFAULT_EMAIL_TEMPLATES, StageColor, FollowUpMethod, MeetingType } from './types';
import { LeadStatus } from '@/lib/validation';

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  complexity: 'simple' | 'medium' | 'advanced';
  stages: PipelineStage[];
  connections: NodeConnection[];
  labels: TextLabel[];
  emailTemplates: EmailTemplate[];
}

// Helper for contact methods
const cm = (types: string[], overrides: any = {}) => types.map(type => ({
  id: type, type: type as any, enabled: true, settings: { ...DEFAULT_CONTACT_SETTINGS, ...overrides },
}));

// Create stage helper - tighter spacing, proper sizes
const stage = (
  id: string, label: string, statusId: LeadStatus | 'dead', 
  x: number, y: number,
  icon: string, color: StageColor, 
  contactTypes: string[] = ['email'],
  opts: { width?: number; height?: number; emailTemplateId?: string; followUpMethod?: FollowUpMethod; meetingType?: MeetingType; deadReason?: string } = {}
): PipelineStage => ({
  id, label, statusId, 
  x, y,
  width: opts.width || 260,
  height: opts.height || 220,
  color, icon,
  contactMethods: cm(contactTypes),
  automationSettings: DEFAULT_AUTOMATION,
  emailTemplateId: opts.emailTemplateId,
  followUpMethod: opts.followUpMethod,
  meetingType: opts.meetingType,
  deadReason: opts.deadReason,
});

// Connection helper
const conn = (from: string, to: string, label?: string, style: 'solid' | 'dashed' = 'solid'): NodeConnection => ({
  id: `${from}-${to}`,
  fromStageId: from,
  toStageId: to,
  fromAnchor: 'right',
  toAnchor: 'left',
  label,
  style,
  color: style === 'dashed' ? '#64748b' : '#3b82f6',
});

// ============ ALL PRESETS ============

export const ALL_PRESETS: Preset[] = [
  // ============ SIMPLE PRESETS ============
  {
    id: 'simple-3',
    name: 'Simple 3-Stage',
    description: 'Basic funnel: New → Working → Done. Perfect for getting started.',
    icon: '📊',
    complexity: 'simple',
    stages: [
      stage('new', 'New Leads', 'new', 100, 200, '📥', 'blue', ['email'], { emailTemplateId: 'welcome-1' }),
      stage('working', 'Working', 'working', 420, 200, '⚙️', 'yellow', ['email', 'phone'], { followUpMethod: 'email' }),
      stage('done', 'Completed', 'approval', 740, 200, '✅', 'green', ['phone'], { meetingType: 'online-phone' }),
    ],
    connections: [
      conn('new', 'working', 'Engage'),
      conn('working', 'done', 'Close'),
    ],
    labels: [
      { id: 'l1', text: 'Simple Pipeline', x: 420, y: 80, fontSize: 22, color: '#64748b' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  {
    id: 'simple-4',
    name: 'Simple 4-Stage',
    description: 'Add a follow-up stage: New → Contact → Follow Up → Done.',
    icon: '📈',
    complexity: 'simple',
    stages: [
      stage('inbox', 'Inbox', 'new', 80, 200, '📥', 'blue', ['email'], { emailTemplateId: 'welcome-1' }),
      stage('contact', 'First Contact', 'working', 350, 200, '📞', 'cyan', ['phone', 'email']),
      stage('followup', 'Follow Up', 'circle-back', 620, 200, '🔄', 'yellow', ['email'], { followUpMethod: 'email', emailTemplateId: 'followup-1' }),
      stage('closed', 'Closed', 'approval', 890, 200, '🎯', 'green', ['phone']),
    ],
    connections: [
      conn('inbox', 'contact'),
      conn('contact', 'followup', 'No answer'),
      conn('followup', 'closed', 'Ready'),
    ],
    labels: [],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ============ STANDARD PRESETS ============
  {
    id: 'standard-funnel',
    name: 'Standard Sales Funnel',
    description: '5 stages with follow-up branch and dead lead tracking.',
    icon: '🎯',
    complexity: 'medium',
    stages: [
      stage('new', 'New', 'new', 80, 180, '📥', 'blue', ['email'], { emailTemplateId: 'welcome-1' }),
      stage('working', 'Working', 'working', 350, 120, '⚙️', 'yellow', ['email', 'phone']),
      stage('followup', 'Follow Up', 'circle-back', 350, 280, '📞', 'cyan', ['phone'], { followUpMethod: 'phone', emailTemplateId: 'followup-1' }),
      stage('closing', 'Closing', 'approval', 620, 180, '🎯', 'green', ['phone', 'meeting'], { meetingType: 'online-video' }),
      stage('dead', 'Dead', 'dead', 620, 340, '💀', 'red', [], { deadReason: 'not-interested' }),
    ],
    connections: [
      conn('new', 'working', 'Engaged'),
      conn('new', 'followup', 'No response', 'dashed'),
      conn('working', 'closing'),
      conn('followup', 'working', 'Re-engaged'),
      conn('followup', 'dead', 'Gave up', 'dashed'),
    ],
    labels: [
      { id: 'l1', text: 'Sales Funnel', x: 350, y: 50, fontSize: 20, color: '#64748b' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  {
    id: 'hot-lead-track',
    name: 'Hot Lead Fast Track',
    description: 'Speed pipeline for urgent buyers. Close within 24 hours.',
    icon: '🔥',
    complexity: 'simple',
    stages: [
      stage('hot', '🔥 Hot Lead', 'new', 100, 200, '🔥', 'orange', ['phone'], { width: 280 }),
      stage('qualify', 'Quick Qualify', 'working', 420, 200, '✅', 'yellow', ['phone'], { meetingType: 'online-phone', width: 280 }),
      stage('close', 'Same Day Close', 'approval', 740, 200, '🏆', 'green', ['meeting'], { meetingType: 'test-drive', width: 280, emailTemplateId: 'closing-1' }),
    ],
    connections: [
      conn('hot', 'qualify', 'Call NOW'),
      conn('qualify', 'close', 'Book appt'),
    ],
    labels: [
      { id: 'l1', text: '🔥 HOT LEADS - SAME DAY CLOSE', x: 420, y: 100, fontSize: 18, color: '#f97316' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ============ ADVANCED PRESETS ============
  {
    id: 'full-funnel',
    name: 'Full Sales Funnel',
    description: 'Complete pipeline with segmentation, nurturing, and multiple outcomes.',
    icon: '🚀',
    complexity: 'advanced',
    stages: [
      stage('inbound', 'Inbound', 'new', 60, 200, '📥', 'blue', ['email'], { emailTemplateId: 'welcome-1' }),
      stage('segment-hot', 'Hot', 'working', 320, 100, '🔥', 'orange', ['phone']),
      stage('segment-warm', 'Warm', 'working', 320, 200, '☀️', 'yellow', ['email', 'phone']),
      stage('segment-cold', 'Cold', 'working', 320, 300, '❄️', 'cyan', ['email']),
      stage('nurture', 'Nurture', 'working', 560, 280, '🌱', 'teal', ['email'], { followUpMethod: 'auto-sequence', emailTemplateId: 'followup-1' }),
      stage('meeting', 'Meeting', 'working', 560, 140, '📅', 'purple', ['meeting'], { meetingType: 'online-video' }),
      stage('closing', 'Closing', 'approval', 800, 180, '🎯', 'green', ['phone', 'meeting'], { emailTemplateId: 'closing-1' }),
      stage('won', 'Won! 🎉', 'approval', 1040, 120, '🏆', 'green', []),
      stage('lost', 'Lost', 'dead', 1040, 260, '📦', 'slate', [], { deadReason: 'competitor' }),
    ],
    connections: [
      conn('inbound', 'segment-hot'),
      conn('inbound', 'segment-warm'),
      conn('inbound', 'segment-cold'),
      conn('segment-hot', 'meeting'),
      conn('segment-warm', 'meeting'),
      conn('segment-cold', 'nurture'),
      conn('nurture', 'segment-warm', 'Warmed up'),
      conn('meeting', 'closing'),
      conn('closing', 'won'),
      conn('closing', 'lost', 'Declined', 'dashed'),
    ],
    labels: [
      { id: 'l1', text: '🚀 Full Sales Funnel', x: 500, y: 40, fontSize: 22, color: '#a855f7' },
      { id: 'l2', text: 'Segmentation', x: 320, y: 60, fontSize: 12, color: '#64748b' },
      { id: 'l3', text: 'Engagement', x: 560, y: 80, fontSize: 12, color: '#64748b' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  {
    id: 'cold-nurture',
    name: 'Cold Lead Nurturing',
    description: 'Long-term drip campaign with automated email sequences.',
    icon: '❄️',
    complexity: 'advanced',
    stages: [
      stage('cold-pool', 'Cold Pool', 'new', 60, 200, '❄️', 'cyan', ['email'], { emailTemplateId: 'reminder-1' }),
      stage('drip-1', 'Week 1 Drip', 'working', 300, 140, '💧', 'blue', ['email'], { followUpMethod: 'auto-sequence' }),
      stage('drip-2', 'Week 2 Drip', 'working', 300, 260, '💧', 'blue', ['email'], { followUpMethod: 'auto-sequence' }),
      stage('warming', 'Warming Up', 'working', 540, 200, '☀️', 'yellow', ['email', 'text']),
      stage('active', 'Re-Engaged', 'working', 780, 200, '🔥', 'orange', ['phone'], { emailTemplateId: 're-engage-1' }),
      stage('convert', 'Converted', 'approval', 1000, 140, '✅', 'green', ['phone', 'meeting']),
      stage('dormant', 'Dormant', 'dead', 1000, 280, '💤', 'slate', [], { deadReason: 'not-ready' }),
    ],
    connections: [
      conn('cold-pool', 'drip-1'),
      conn('cold-pool', 'drip-2', '', 'dashed'),
      conn('drip-1', 'warming', 'Opened'),
      conn('drip-2', 'warming', 'Clicked'),
      conn('warming', 'active', 'Replied'),
      conn('active', 'convert'),
      conn('warming', 'dormant', 'Silent', 'dashed'),
    ],
    labels: [
      { id: 'l1', text: '❄️ Cold Lead Nurturing', x: 500, y: 60, fontSize: 20, color: '#06b6d4' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ============ EMOTIONAL/PERSONALITY PRESETS ============
  {
    id: 'emotional-buyer',
    name: 'Emotional Buyer Journey',
    description: 'For relationship-driven buyers who need trust and rapport.',
    icon: '💝',
    complexity: 'medium',
    stages: [
      stage('interested', 'Interested', 'new', 80, 200, '👋', 'blue', ['email'], { emailTemplateId: 'welcome-1' }),
      stage('rapport', 'Build Rapport', 'working', 340, 200, '🤝', 'pink', ['phone'], { followUpMethod: 'phone' }),
      stage('trust', 'Trust Built', 'working', 600, 200, '💗', 'purple', ['meeting'], { meetingType: 'online-video' }),
      stage('ready', 'Ready to Buy', 'approval', 860, 200, '🎉', 'green', ['meeting'], { meetingType: 'in-person-office', emailTemplateId: 'closing-1' }),
    ],
    connections: [
      conn('interested', 'rapport', 'Personal call'),
      conn('rapport', 'trust', 'Multiple touchpoints'),
      conn('trust', 'ready', 'Feels comfortable'),
    ],
    labels: [
      { id: 'l1', text: '💝 Emotional Buyer Journey', x: 450, y: 100, fontSize: 18, color: '#ec4899' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  {
    id: 'analytical-buyer',
    name: 'Analytical Buyer Process',
    description: 'For detail-oriented buyers who need data and comparison.',
    icon: '🧠',
    complexity: 'medium',
    stages: [
      stage('research', 'Researching', 'new', 80, 200, '🔍', 'blue', ['email']),
      stage('compare', 'Comparing', 'working', 340, 200, '📊', 'indigo', ['email'], { emailTemplateId: 'followup-1' }),
      stage('analyze', 'Analyzing', 'working', 600, 200, '🧮', 'purple', ['email', 'phone']),
      stage('decide', 'Decision Made', 'approval', 860, 200, '✅', 'green', ['phone'], { meetingType: 'online-video' }),
    ],
    connections: [
      conn('research', 'compare', 'Send specs'),
      conn('compare', 'analyze', 'Answer questions'),
      conn('analyze', 'decide', 'Clear winner'),
    ],
    labels: [
      { id: 'l1', text: '🧠 Analytical Process', x: 450, y: 100, fontSize: 18, color: '#6366f1' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  {
    id: 'urgent-buyer',
    name: 'Urgent Buyer Sprint',
    description: 'For impulsive buyers who want to move FAST.',
    icon: '⚡',
    complexity: 'simple',
    stages: [
      stage('urgent', '⚡ URGENT', 'new', 80, 200, '⚡', 'yellow', ['phone']),
      stage('available', 'Show Options', 'working', 360, 200, '🚗', 'orange', ['phone'], { meetingType: 'online-phone' }),
      stage('book', 'Book Now', 'approval', 640, 200, '📅', 'green', ['meeting'], { meetingType: 'test-drive', emailTemplateId: 'closing-1' }),
    ],
    connections: [
      conn('urgent', 'available', 'Immediate call'),
      conn('available', 'book', 'Same day'),
    ],
    labels: [
      { id: 'l1', text: '⚡ URGENT - ACT NOW', x: 360, y: 100, fontSize: 20, color: '#eab308' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ============ VIP / HIGH VALUE ============
  {
    id: 'vip-concierge',
    name: 'VIP Concierge Service',
    description: 'White-glove treatment for starred/favorited high-value leads.',
    icon: '👑',
    complexity: 'advanced',
    stages: [
      stage('vip-new', 'VIP Inquiry', 'new', 60, 200, '👑', 'yellow', ['phone'], { width: 280 }),
      stage('vip-call', 'Personal Call', 'working', 360, 140, '📞', 'purple', ['phone'], { followUpMethod: 'phone', width: 280 }),
      stage('vip-video', 'Video Consult', 'working', 360, 280, '📹', 'indigo', ['meeting'], { meetingType: 'online-video', width: 280 }),
      stage('vip-visit', 'Private Showing', 'working', 660, 200, '🏢', 'blue', ['meeting'], { meetingType: 'in-person-office', width: 280 }),
      stage('vip-drive', 'Test Drive', 'working', 960, 140, '🚗', 'cyan', ['meeting'], { meetingType: 'test-drive', width: 280 }),
      stage('vip-close', 'VIP Closing', 'approval', 960, 280, '🏆', 'green', ['meeting'], { emailTemplateId: 'closing-1', width: 280 }),
    ],
    connections: [
      conn('vip-new', 'vip-call'),
      conn('vip-new', 'vip-video', 'Prefers video'),
      conn('vip-call', 'vip-visit'),
      conn('vip-video', 'vip-visit'),
      conn('vip-visit', 'vip-drive'),
      conn('vip-drive', 'vip-close'),
    ],
    labels: [
      { id: 'l1', text: '👑 VIP Concierge Service', x: 500, y: 60, fontSize: 22, color: '#eab308' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ============ RE-ENGAGEMENT ============
  {
    id: 're-engagement',
    name: 'Re-Engagement Campaign',
    description: 'Bring back old/dormant leads with targeted outreach.',
    icon: '🔁',
    complexity: 'medium',
    stages: [
      stage('dormant', 'Dormant List', 'dead', 80, 200, '💤', 'slate', ['email'], { deadReason: 'not-ready' }),
      stage('reach-out', 'Reach Out', 'working', 340, 140, '📧', 'blue', ['email'], { emailTemplateId: 're-engage-1' }),
      stage('responded', 'Responded!', 'working', 340, 280, '💬', 'green', ['phone']),
      stage('requalify', 'Re-Qualify', 'working', 600, 200, '🔍', 'yellow', ['phone'], { followUpMethod: 'phone' }),
      stage('back-active', 'Back Active', 'new', 860, 200, '🔥', 'orange', ['phone', 'meeting']),
    ],
    connections: [
      conn('dormant', 'reach-out'),
      conn('reach-out', 'responded', 'Replied'),
      conn('reach-out', 'dormant', 'No response', 'dashed'),
      conn('responded', 'requalify'),
      conn('requalify', 'back-active', 'Still interested'),
    ],
    labels: [
      { id: 'l1', text: '🔁 Re-Engagement', x: 450, y: 60, fontSize: 20, color: '#3b82f6' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ============ DEAD LEAD MANAGEMENT ============
  {
    id: 'dead-management',
    name: 'Dead Lead Management',
    description: 'Organize and potentially revive dead leads by reason.',
    icon: '💀',
    complexity: 'medium',
    stages: [
      stage('all-dead', 'All Dead', 'dead', 80, 200, '💀', 'slate', []),
      stage('not-interested', 'Not Interested', 'dead', 340, 100, '🚫', 'red', [], { deadReason: 'not-interested' }),
      stage('bad-timing', 'Bad Timing', 'dead', 340, 200, '⏰', 'yellow', [], { deadReason: 'bad-timing' }),
      stage('competitor', 'Went Competitor', 'dead', 340, 300, '🏃', 'orange', [], { deadReason: 'competitor' }),
      stage('revive', 'Try to Revive', 'circle-back', 600, 200, '🔄', 'cyan', ['email'], { emailTemplateId: 're-engage-1' }),
      stage('back', 'Back to Active', 'new', 860, 200, '🎉', 'green', ['phone']),
    ],
    connections: [
      conn('all-dead', 'not-interested'),
      conn('all-dead', 'bad-timing'),
      conn('all-dead', 'competitor'),
      conn('bad-timing', 'revive', 'After 3 months'),
      conn('revive', 'back', 'Interested again'),
    ],
    labels: [
      { id: 'l1', text: '💀 Dead Lead Management', x: 450, y: 40, fontSize: 20, color: '#ef4444' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ============ APPOINTMENT FOCUSED ============
  {
    id: 'appointment-setter',
    name: 'Appointment Setter',
    description: 'Focus on booking meetings: calls, video, in-person.',
    icon: '📅',
    complexity: 'medium',
    stages: [
      stage('lead', 'New Lead', 'new', 80, 200, '📥', 'blue', ['phone']),
      stage('contact', 'Made Contact', 'working', 320, 200, '📞', 'cyan', ['phone']),
      stage('phone-apt', 'Phone Appt', 'working', 560, 100, '📱', 'yellow', ['phone'], { meetingType: 'online-phone' }),
      stage('video-apt', 'Video Appt', 'working', 560, 200, '📹', 'purple', ['meeting'], { meetingType: 'online-video' }),
      stage('office-apt', 'Office Visit', 'working', 560, 300, '🏢', 'indigo', ['meeting'], { meetingType: 'in-person-office' }),
      stage('test-drive', 'Test Drive', 'approval', 800, 200, '🚗', 'green', ['meeting'], { meetingType: 'test-drive' }),
    ],
    connections: [
      conn('lead', 'contact'),
      conn('contact', 'phone-apt', 'Phone call'),
      conn('contact', 'video-apt', 'Video call'),
      conn('contact', 'office-apt', 'In person'),
      conn('phone-apt', 'test-drive'),
      conn('video-apt', 'test-drive'),
      conn('office-apt', 'test-drive'),
    ],
    labels: [
      { id: 'l1', text: '📅 Appointment Setter', x: 420, y: 40, fontSize: 20, color: '#a855f7' },
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },
];

// Preset categories
export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📁' },
  { id: 'simple', label: 'Simple', icon: '📊' },
  { id: 'medium', label: 'Standard', icon: '📈' },
  { id: 'advanced', label: 'Advanced', icon: '🚀' },
];
