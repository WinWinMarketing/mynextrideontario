// Pipeline Presets - Super Advanced Library
import { PipelineStage, NodeConnection, TextLabel, EmailTemplate, DEFAULT_AUTOMATION, DEFAULT_CONTACT_SETTINGS, DEFAULT_EMAIL_TEMPLATES, StageColor, FollowUpMethod, MeetingType } from './types';
import { LeadStatus } from '@/lib/validation';

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  complexity: 'simple' | 'medium' | 'advanced';
  category?: string;
  stages: PipelineStage[];
  connections: NodeConnection[];
  labels: TextLabel[];
  emailTemplates: EmailTemplate[];
}

// Helpers
const cm = (types: string[]) => types.map(type => ({
  id: type, type: type as any, enabled: true, settings: DEFAULT_CONTACT_SETTINGS,
}));

const stage = (
  id: string, label: string, statusId: LeadStatus | 'dead', 
  x: number, y: number,
  icon: string, color: StageColor, 
  opts: { width?: number; height?: number; emailTemplateId?: string; followUpMethod?: FollowUpMethod; meetingType?: MeetingType; deadReason?: string; contacts?: string[] } = {}
): PipelineStage => ({
  id, label, statusId, x, y,
  width: opts.width || 240,
  height: opts.height || 200,
  color, icon,
  contactMethods: cm(opts.contacts || ['email']),
  automationSettings: DEFAULT_AUTOMATION,
  emailTemplateId: opts.emailTemplateId,
  followUpMethod: opts.followUpMethod,
  meetingType: opts.meetingType,
  deadReason: opts.deadReason,
});

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

const lbl = (id: string, text: string, x: number, y: number, fontSize = 16, color = '#94a3b8', bgColor?: string): TextLabel => ({
  id, text, x, y, fontSize, color, bgColor
});

// ================== ALL PRESETS ==================

export const ALL_PRESETS: Preset[] = [
  // ===== SIMPLE =====
  {
    id: 'basic-3',
    name: 'Basic 3-Stage',
    description: 'Simple New → Working → Done pipeline',
    icon: '📊',
    complexity: 'simple',
    stages: [
      stage('new', 'New Leads', 'new', 80, 180, '📥', 'blue', { emailTemplateId: 'welcome-1' }),
      stage('working', 'Working', 'working', 360, 180, '⚙️', 'yellow', { followUpMethod: 'email' }),
      stage('done', 'Done', 'approval', 640, 180, '✅', 'green'),
    ],
    connections: [conn('new', 'working'), conn('working', 'done')],
    labels: [],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  {
    id: 'basic-4',
    name: 'Basic 4-Stage',
    description: 'New → Contact → Follow Up → Done',
    icon: '📈',
    complexity: 'simple',
    stages: [
      stage('new', 'New', 'new', 60, 180, '📥', 'blue'),
      stage('contact', 'Contact', 'working', 290, 180, '📞', 'cyan', { followUpMethod: 'phone' }),
      stage('followup', 'Follow Up', 'circle-back', 520, 180, '🔄', 'yellow', { emailTemplateId: 'followup-1' }),
      stage('done', 'Done', 'approval', 750, 180, '✅', 'green'),
    ],
    connections: [conn('new', 'contact'), conn('contact', 'followup'), conn('followup', 'done')],
    labels: [],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== STANDARD =====
  {
    id: 'standard-funnel',
    name: 'Standard Funnel',
    description: '5-stage funnel with dead lead branch',
    icon: '🎯',
    complexity: 'medium',
    stages: [
      stage('new', 'New', 'new', 60, 160, '📥', 'blue', { emailTemplateId: 'welcome-1' }),
      stage('working', 'Working', 'working', 280, 100, '⚙️', 'yellow'),
      stage('followup', 'Follow Up', 'circle-back', 280, 240, '📞', 'cyan', { followUpMethod: 'phone' }),
      stage('closing', 'Closing', 'approval', 500, 160, '🎯', 'green', { meetingType: 'online-video' }),
      stage('dead', 'Dead', 'dead', 500, 300, '💀', 'red', { deadReason: 'not-interested' }),
    ],
    connections: [
      conn('new', 'working'),
      conn('new', 'followup', '', 'dashed'),
      conn('working', 'closing'),
      conn('followup', 'working'),
      conn('followup', 'dead', '', 'dashed'),
    ],
    labels: [],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== 4 FOLLOW-UPS =====
  {
    id: 'four-followups',
    name: '4 Follow-Up Sequence',
    description: 'Escalating follow-ups: Email → Call → Text → Final',
    icon: '📞',
    complexity: 'advanced',
    stages: [
      stage('new', 'New Lead', 'new', 40, 180, '📥', 'blue', { emailTemplateId: 'welcome-1' }),
      stage('fu1', 'Follow Up 1', 'working', 240, 180, '📧', 'cyan', { followUpMethod: 'email', emailTemplateId: 'followup-1' }),
      stage('fu2', 'Follow Up 2', 'working', 440, 180, '📞', 'yellow', { followUpMethod: 'phone' }),
      stage('fu3', 'Follow Up 3', 'circle-back', 640, 180, '💬', 'orange', { followUpMethod: 'text' }),
      stage('fu4', 'Final Try', 'circle-back', 840, 180, '📱', 'red', { followUpMethod: 'phone' }),
      stage('engaged', 'Engaged!', 'working', 540, 60, '🔥', 'green'),
      stage('dead', 'No Response', 'dead', 1040, 180, '💀', 'slate', { deadReason: 'no-contact' }),
    ],
    connections: [
      conn('new', 'fu1'),
      conn('fu1', 'fu2', '48h'),
      conn('fu2', 'fu3', '72h'),
      conn('fu3', 'fu4', '1 week'),
      conn('fu4', 'dead', 'No reply', 'dashed'),
      conn('fu1', 'engaged', 'Replied'),
      conn('fu2', 'engaged', 'Replied'),
      conn('fu3', 'engaged', 'Replied'),
      conn('fu4', 'engaged', 'Replied'),
    ],
    labels: [
      lbl('l1', '📞 4-Touch Follow-Up Sequence', 440, 30, 18, '#06b6d4'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== 6 FOLLOW-UPS =====
  {
    id: 'six-followups',
    name: '6 Follow-Up Sequence',
    description: 'Complete sequence: Email → Call → Text → Email → Call → Final',
    icon: '🔄',
    complexity: 'advanced',
    stages: [
      stage('new', 'New', 'new', 30, 180, '📥', 'blue'),
      stage('fu1', 'Email 1', 'working', 180, 180, '📧', 'blue', { followUpMethod: 'email', emailTemplateId: 'welcome-1' }),
      stage('fu2', 'Call 1', 'working', 330, 180, '📞', 'cyan', { followUpMethod: 'phone' }),
      stage('fu3', 'Text', 'working', 480, 180, '💬', 'yellow', { followUpMethod: 'text' }),
      stage('fu4', 'Email 2', 'circle-back', 630, 180, '📧', 'orange', { followUpMethod: 'email', emailTemplateId: 'followup-1' }),
      stage('fu5', 'Call 2', 'circle-back', 780, 180, '📞', 'red', { followUpMethod: 'phone' }),
      stage('fu6', 'Final', 'circle-back', 930, 180, '🔔', 'purple', { followUpMethod: 'email', emailTemplateId: 'reminder-1' }),
      stage('engaged', 'Engaged', 'working', 480, 50, '🔥', 'green'),
      stage('dead', 'Gone', 'dead', 1080, 180, '💀', 'slate', { deadReason: 'no-contact' }),
    ],
    connections: [
      conn('new', 'fu1'),
      conn('fu1', 'fu2', '24h'), conn('fu2', 'fu3', '48h'), conn('fu3', 'fu4', '72h'),
      conn('fu4', 'fu5', '1wk'), conn('fu5', 'fu6', '2wk'), conn('fu6', 'dead', ''),
      conn('fu1', 'engaged'), conn('fu2', 'engaged'), conn('fu3', 'engaged'),
      conn('fu4', 'engaged'), conn('fu5', 'engaged'), conn('fu6', 'engaged'),
    ],
    labels: [lbl('l1', '🔄 6-Touch Sequence', 480, 20, 16, '#f97316')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== HOT LEADS =====
  {
    id: 'hot-leads',
    name: 'Hot Lead Fast Track',
    description: 'Speed pipeline for urgent buyers - close same day',
    icon: '🔥',
    complexity: 'simple',
    stages: [
      stage('hot', '🔥 HOT', 'new', 80, 180, '🔥', 'orange', { width: 260 }),
      stage('qualify', 'Quick Call', 'working', 380, 180, '📞', 'yellow', { followUpMethod: 'phone', width: 260 }),
      stage('close', 'Close Today', 'approval', 680, 180, '🏆', 'green', { meetingType: 'test-drive', width: 260 }),
    ],
    connections: [conn('hot', 'qualify', 'NOW'), conn('qualify', 'close', 'Book')],
    labels: [lbl('l1', '🔥 SAME DAY CLOSE', 380, 80, 20, '#f97316')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== FULL FUNNEL =====
  {
    id: 'full-funnel',
    name: 'Full Sales Funnel',
    description: 'Complete pipeline with segmentation and multiple paths',
    icon: '🚀',
    complexity: 'advanced',
    stages: [
      stage('inbound', 'Inbound', 'new', 40, 180, '📥', 'blue', { emailTemplateId: 'welcome-1' }),
      stage('hot', 'Hot', 'working', 240, 80, '🔥', 'orange', { followUpMethod: 'phone' }),
      stage('warm', 'Warm', 'working', 240, 180, '☀️', 'yellow'),
      stage('cold', 'Cold', 'working', 240, 280, '❄️', 'cyan'),
      stage('nurture', 'Nurture', 'working', 440, 260, '🌱', 'teal', { followUpMethod: 'auto-sequence' }),
      stage('meeting', 'Meeting', 'working', 440, 120, '📅', 'purple', { meetingType: 'online-video' }),
      stage('proposal', 'Proposal', 'approval', 640, 180, '📋', 'indigo'),
      stage('won', 'Won!', 'approval', 840, 120, '🏆', 'green'),
      stage('lost', 'Lost', 'dead', 840, 260, '📦', 'red', { deadReason: 'competitor' }),
    ],
    connections: [
      conn('inbound', 'hot'), conn('inbound', 'warm'), conn('inbound', 'cold'),
      conn('hot', 'meeting'), conn('warm', 'meeting'), conn('cold', 'nurture'),
      conn('nurture', 'warm'), conn('meeting', 'proposal'),
      conn('proposal', 'won'), conn('proposal', 'lost', '', 'dashed'),
    ],
    labels: [lbl('l1', '🚀 Full Funnel', 400, 30, 18, '#a855f7')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== COLD NURTURING =====
  {
    id: 'cold-nurture',
    name: 'Cold Lead Nurturing',
    description: 'Long-term drip for cold leads over weeks',
    icon: '❄️',
    complexity: 'advanced',
    stages: [
      stage('cold', 'Cold Pool', 'new', 40, 180, '❄️', 'cyan'),
      stage('drip1', 'Week 1', 'working', 220, 120, '💧', 'blue', { followUpMethod: 'email' }),
      stage('drip2', 'Week 2', 'working', 220, 240, '💧', 'blue', { followUpMethod: 'email' }),
      stage('drip3', 'Week 3', 'working', 400, 180, '💧', 'teal', { followUpMethod: 'email' }),
      stage('warming', 'Warming', 'working', 580, 180, '☀️', 'yellow'),
      stage('active', 'Active', 'working', 760, 180, '🔥', 'orange'),
      stage('convert', 'Convert', 'approval', 940, 120, '✅', 'green'),
      stage('dormant', 'Dormant', 'dead', 940, 240, '💤', 'slate', { deadReason: 'not-ready' }),
    ],
    connections: [
      conn('cold', 'drip1'), conn('cold', 'drip2', '', 'dashed'),
      conn('drip1', 'drip3'), conn('drip2', 'drip3'),
      conn('drip3', 'warming', 'Opened'), conn('warming', 'active', 'Replied'),
      conn('active', 'convert'), conn('warming', 'dormant', '', 'dashed'),
    ],
    labels: [lbl('l1', '❄️ Cold Nurturing', 480, 50, 16, '#06b6d4')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== POST-PURCHASE =====
  {
    id: 'post-purchase',
    name: 'Post-Purchase Follow-Up',
    description: 'After sale: 1 week, 1 month, 3 months, 1 year check-ins',
    icon: '🎉',
    complexity: 'advanced',
    category: 'post-sale',
    stages: [
      stage('sold', '🎉 SOLD!', 'approval', 40, 180, '🎉', 'green'),
      stage('1week', '1 Week', 'working', 220, 180, '📞', 'blue', { followUpMethod: 'phone' }),
      stage('1month', '1 Month', 'working', 400, 180, '📧', 'cyan', { followUpMethod: 'email' }),
      stage('3month', '3 Months', 'working', 580, 180, '📞', 'yellow', { followUpMethod: 'phone' }),
      stage('1year', '1 Year', 'circle-back', 760, 180, '🎂', 'purple', { followUpMethod: 'email' }),
      stage('referral', 'Ask Referral', 'working', 940, 180, '🤝', 'orange'),
      stage('repeat', 'Repeat Sale?', 'approval', 1120, 180, '🔄', 'green'),
    ],
    connections: [
      conn('sold', '1week', 'Thank you'),
      conn('1week', '1month', 'Check in'),
      conn('1month', '3month', 'Service?'),
      conn('3month', '1year', 'Anniversary'),
      conn('1year', 'referral', 'Happy?'),
      conn('referral', 'repeat'),
    ],
    labels: [lbl('l1', '🎉 Post-Purchase Journey', 500, 80, 18, '#22c55e')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== COMPLETE LIFECYCLE =====
  {
    id: 'complete-lifecycle',
    name: 'Complete Customer Lifecycle',
    description: 'From first contact to repeat customer - the whole journey',
    icon: '♻️',
    complexity: 'advanced',
    category: 'post-sale',
    stages: [
      stage('lead', 'New Lead', 'new', 30, 200, '📥', 'blue'),
      stage('contact', 'Contact', 'working', 170, 200, '📞', 'cyan'),
      stage('qualify', 'Qualify', 'working', 310, 200, '✅', 'yellow'),
      stage('meeting', 'Meeting', 'working', 450, 200, '📅', 'purple', { meetingType: 'online-video' }),
      stage('proposal', 'Proposal', 'approval', 590, 200, '📋', 'indigo'),
      stage('sold', 'SOLD', 'approval', 730, 200, '🏆', 'green'),
      stage('1wk', '+1 Week', 'working', 870, 140, '📞', 'teal'),
      stage('1mo', '+1 Month', 'working', 1010, 140, '📧', 'cyan'),
      stage('1yr', '+1 Year', 'circle-back', 1150, 140, '🎂', 'yellow'),
      stage('referral', 'Referral', 'working', 1010, 260, '🤝', 'orange'),
      stage('repeat', 'Repeat', 'approval', 1150, 260, '🔄', 'green'),
    ],
    connections: [
      conn('lead', 'contact'), conn('contact', 'qualify'), conn('qualify', 'meeting'),
      conn('meeting', 'proposal'), conn('proposal', 'sold'),
      conn('sold', '1wk'), conn('1wk', '1mo'), conn('1mo', '1yr'),
      conn('1yr', 'referral'), conn('referral', 'repeat'),
    ],
    labels: [lbl('l1', '♻️ Complete Customer Lifecycle', 550, 60, 18, '#10b981')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== VIP CONCIERGE =====
  {
    id: 'vip-concierge',
    name: 'VIP Concierge',
    description: 'White-glove service for high-value starred leads',
    icon: '👑',
    complexity: 'advanced',
    stages: [
      stage('vip', '👑 VIP', 'new', 40, 180, '👑', 'yellow'),
      stage('call', 'Personal Call', 'working', 230, 120, '📞', 'purple', { followUpMethod: 'phone' }),
      stage('video', 'Video Call', 'working', 230, 240, '📹', 'indigo', { meetingType: 'online-video' }),
      stage('visit', 'Private Visit', 'working', 420, 180, '🏢', 'blue', { meetingType: 'in-person-office' }),
      stage('drive', 'Test Drive', 'working', 610, 180, '🚗', 'cyan', { meetingType: 'test-drive' }),
      stage('close', 'VIP Close', 'approval', 800, 180, '🏆', 'green'),
    ],
    connections: [
      conn('vip', 'call'), conn('vip', 'video', '', 'dashed'),
      conn('call', 'visit'), conn('video', 'visit'),
      conn('visit', 'drive'), conn('drive', 'close'),
    ],
    labels: [lbl('l1', '👑 VIP Concierge', 420, 60, 20, '#eab308')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== EMOTIONAL BUYER =====
  {
    id: 'emotional',
    name: 'Emotional Buyer',
    description: 'For relationship-driven buyers who need trust',
    icon: '💝',
    complexity: 'medium',
    stages: [
      stage('interest', 'Interested', 'new', 60, 180, '👋', 'blue'),
      stage('rapport', 'Build Rapport', 'working', 280, 180, '🤝', 'pink', { followUpMethod: 'phone' }),
      stage('trust', 'Trust Built', 'working', 500, 180, '💗', 'purple', { meetingType: 'online-video' }),
      stage('ready', 'Ready!', 'approval', 720, 180, '🎉', 'green', { meetingType: 'in-person-office' }),
    ],
    connections: [conn('interest', 'rapport'), conn('rapport', 'trust'), conn('trust', 'ready')],
    labels: [lbl('l1', '💝 Emotional Journey', 390, 80, 16, '#ec4899')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== ANALYTICAL BUYER =====
  {
    id: 'analytical',
    name: 'Analytical Buyer',
    description: 'For detail-oriented buyers who need data',
    icon: '🧠',
    complexity: 'medium',
    stages: [
      stage('research', 'Research', 'new', 60, 180, '🔍', 'blue'),
      stage('compare', 'Compare', 'working', 280, 180, '📊', 'indigo', { followUpMethod: 'email' }),
      stage('analyze', 'Analyze', 'working', 500, 180, '🧮', 'purple'),
      stage('decide', 'Decision', 'approval', 720, 180, '✅', 'green'),
    ],
    connections: [conn('research', 'compare'), conn('compare', 'analyze'), conn('analyze', 'decide')],
    labels: [lbl('l1', '🧠 Analytical Process', 390, 80, 16, '#6366f1')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== URGENT BUYER =====
  {
    id: 'urgent',
    name: 'Urgent Buyer',
    description: 'For impulsive buyers - move FAST',
    icon: '⚡',
    complexity: 'simple',
    stages: [
      stage('urgent', '⚡ URGENT', 'new', 80, 180, '⚡', 'yellow'),
      stage('options', 'Options', 'working', 340, 180, '🚗', 'orange', { followUpMethod: 'phone' }),
      stage('book', 'Book NOW', 'approval', 600, 180, '📅', 'green', { meetingType: 'test-drive' }),
    ],
    connections: [conn('urgent', 'options', 'Call NOW'), conn('options', 'book', 'Same day')],
    labels: [lbl('l1', '⚡ ACT NOW', 340, 80, 20, '#eab308')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== RE-ENGAGEMENT =====
  {
    id: 're-engage',
    name: 'Re-Engagement',
    description: 'Bring back dormant/old leads',
    icon: '🔁',
    complexity: 'medium',
    stages: [
      stage('dormant', 'Dormant', 'dead', 60, 180, '💤', 'slate'),
      stage('reach', 'Reach Out', 'working', 260, 180, '📧', 'blue', { emailTemplateId: 're-engage-1' }),
      stage('replied', 'Replied!', 'working', 460, 180, '💬', 'green'),
      stage('requalify', 'Re-Qualify', 'working', 660, 180, '🔍', 'yellow'),
      stage('active', 'Active', 'new', 860, 180, '🔥', 'orange'),
    ],
    connections: [
      conn('dormant', 'reach'), conn('reach', 'replied'),
      conn('reach', 'dormant', '', 'dashed'), conn('replied', 'requalify'),
      conn('requalify', 'active'),
    ],
    labels: [lbl('l1', '🔁 Re-Engagement', 460, 80, 16, '#3b82f6')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== DEAD MANAGEMENT =====
  {
    id: 'dead-mgmt',
    name: 'Dead Lead Management',
    description: 'Organize and potentially revive dead leads',
    icon: '💀',
    complexity: 'medium',
    stages: [
      stage('all-dead', 'All Dead', 'dead', 60, 180, '💀', 'slate'),
      stage('not-interested', 'Not Interested', 'dead', 260, 100, '🚫', 'red', { deadReason: 'not-interested' }),
      stage('bad-timing', 'Bad Timing', 'dead', 260, 180, '⏰', 'yellow', { deadReason: 'bad-timing' }),
      stage('competitor', 'Competitor', 'dead', 260, 260, '🏃', 'orange', { deadReason: 'competitor' }),
      stage('revive', 'Revive?', 'circle-back', 460, 180, '🔄', 'cyan'),
      stage('back', 'Back!', 'new', 660, 180, '🎉', 'green'),
    ],
    connections: [
      conn('all-dead', 'not-interested'), conn('all-dead', 'bad-timing'), conn('all-dead', 'competitor'),
      conn('bad-timing', 'revive', '3mo'), conn('revive', 'back'),
    ],
    labels: [lbl('l1', '💀 Dead Management', 350, 40, 16, '#ef4444')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== APPOINTMENT FOCUSED =====
  {
    id: 'appointments',
    name: 'Appointment Setter',
    description: 'Focus on booking meetings',
    icon: '📅',
    complexity: 'medium',
    stages: [
      stage('lead', 'Lead', 'new', 60, 180, '📥', 'blue'),
      stage('contact', 'Contact', 'working', 240, 180, '📞', 'cyan'),
      stage('phone', 'Phone Apt', 'working', 420, 100, '📱', 'yellow', { meetingType: 'online-phone' }),
      stage('video', 'Video Apt', 'working', 420, 180, '📹', 'purple', { meetingType: 'online-video' }),
      stage('office', 'Office', 'working', 420, 260, '🏢', 'indigo', { meetingType: 'in-person-office' }),
      stage('drive', 'Test Drive', 'approval', 620, 180, '🚗', 'green', { meetingType: 'test-drive' }),
    ],
    connections: [
      conn('lead', 'contact'), conn('contact', 'phone'), conn('contact', 'video'), conn('contact', 'office'),
      conn('phone', 'drive'), conn('video', 'drive'), conn('office', 'drive'),
    ],
    labels: [lbl('l1', '📅 Appointments', 350, 40, 16, '#a855f7')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== REFERRAL MACHINE =====
  {
    id: 'referral-machine',
    name: 'Referral Machine',
    description: 'Turn happy customers into referral sources',
    icon: '🤝',
    complexity: 'advanced',
    category: 'post-sale',
    stages: [
      stage('happy', 'Happy Customer', 'approval', 40, 180, '😊', 'green'),
      stage('ask', 'Ask Referral', 'working', 230, 120, '🙏', 'blue', { followUpMethod: 'phone' }),
      stage('review', 'Ask Review', 'working', 230, 240, '⭐', 'yellow', { followUpMethod: 'email' }),
      stage('referred', 'Got Referral', 'working', 420, 120, '👥', 'purple'),
      stage('reviewed', 'Got Review', 'working', 420, 240, '🌟', 'orange'),
      stage('new-lead', 'New Lead!', 'new', 610, 180, '🎯', 'green'),
      stage('reward', 'Reward', 'approval', 800, 180, '🎁', 'pink'),
    ],
    connections: [
      conn('happy', 'ask'), conn('happy', 'review'),
      conn('ask', 'referred'), conn('review', 'reviewed'),
      conn('referred', 'new-lead'), conn('referred', 'reward'),
    ],
    labels: [lbl('l1', '🤝 Referral Machine', 400, 60, 18, '#8b5cf6')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== BUDGET CONSCIOUS =====
  {
    id: 'budget-buyer',
    name: 'Budget Buyer',
    description: 'For price-sensitive buyers - value focus',
    icon: '💰',
    complexity: 'medium',
    stages: [
      stage('budget', 'Budget Lead', 'new', 60, 180, '💰', 'yellow'),
      stage('options', 'Value Options', 'working', 280, 180, '📊', 'blue'),
      stage('compare', 'Price Compare', 'working', 500, 180, '🔍', 'cyan'),
      stage('finance', 'Finance Talk', 'working', 720, 180, '💳', 'purple'),
      stage('deal', 'Best Deal', 'approval', 940, 180, '🤝', 'green'),
    ],
    connections: [
      conn('budget', 'options'), conn('options', 'compare'),
      conn('compare', 'finance'), conn('finance', 'deal'),
    ],
    labels: [lbl('l1', '💰 Budget Buyer', 500, 80, 16, '#eab308')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },
];

export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📁' },
  { id: 'simple', label: 'Simple', icon: '📊' },
  { id: 'medium', label: 'Standard', icon: '📈' },
  { id: 'advanced', label: 'Advanced', icon: '🚀' },
  { id: 'post-sale', label: 'Post-Sale', icon: '🎉' },
];
