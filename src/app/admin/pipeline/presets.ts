// Super Robust Pipeline Presets
import { PipelineStage, NodeConnection, TextLabel, EmailTemplate, DEFAULT_AUTOMATION, DEFAULT_EMAIL_TEMPLATES, StageColor, FollowUpMethod, MeetingType } from './types';
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
const stage = (id: string, label: string, statusId: LeadStatus | 'dead', x: number, y: number, icon: string, color: StageColor, 
  opts: { w?: number; h?: number; email?: string; followUp?: FollowUpMethod; meeting?: MeetingType; dead?: string; sms?: string; call?: string } = {}
): PipelineStage => ({
  id, label, statusId, x, y, width: opts.w || 220, height: opts.h || 190, color, icon,
  contactMethods: [], automationSettings: DEFAULT_AUTOMATION,
  emailTemplateId: opts.email, followUpMethod: opts.followUp, meetingType: opts.meeting, deadReason: opts.dead,
});

const conn = (from: string, to: string, label?: string, dashed = false): NodeConnection => ({
  id: `${from}-${to}`, fromStageId: from, toStageId: to, fromAnchor: 'right', toAnchor: 'left', label, style: dashed ? 'dashed' : 'solid', color: dashed ? '#64748b' : '#3b82f6',
});

const lbl = (id: string, text: string, x: number, y: number, size = 16, color = '#94a3b8', bg?: string): TextLabel => ({ id, text, x, y, fontSize: size, color, bgColor: bg });

// ============ PRESETS ============
export const ALL_PRESETS: Preset[] = [
  // ===== COMPLETE FUNNEL WITH DEAD LEADS =====
  {
    id: 'complete-with-dead',
    name: 'Complete Funnel + Dead Management',
    description: 'Full pipeline with dead lead categorization on the left. Incoming leads flow right, dead leads sorted on left.',
    icon: '🎯',
    complexity: 'advanced',
    stages: [
      // Dead Leads Section (LEFT)
      stage('dead-not-interested', 'Not Interested', 'dead', 40, 60, '🚫', 'red', { w: 200, h: 170, dead: 'not-interested' }),
      stage('dead-no-contact', 'No Contact', 'dead', 40, 250, '📵', 'orange', { w: 200, h: 170, dead: 'no-contact' }),
      stage('dead-bad-timing', 'Bad Timing', 'dead', 40, 440, '⏰', 'yellow', { w: 200, h: 170, dead: 'bad-timing' }),
      stage('dead-competitor', 'Went Competitor', 'dead', 40, 630, '🏃', 'slate', { w: 200, h: 170, dead: 'competitor' }),
      
      // Main Pipeline (RIGHT)
      stage('new', 'NEW LEADS', 'new', 320, 250, '📥', 'blue', { w: 260, h: 260, email: 'email-welcome-1' }),
      stage('contacted', 'Contacted', 'working', 620, 150, '📞', 'cyan', { w: 220, h: 200, followUp: 'phone' }),
      stage('qualified', 'Qualified', 'working', 620, 380, '✅', 'green', { w: 220, h: 200 }),
      stage('meeting', 'Meeting Set', 'working', 880, 250, '📅', 'purple', { w: 220, h: 200, meeting: 'online-video' }),
      stage('closing', 'Closing', 'approval', 1140, 250, '🎯', 'green', { w: 220, h: 200, email: 'email-closing-1' }),
      stage('won', 'WON! 🎉', 'approval', 1400, 250, '🏆', 'green', { w: 200, h: 180 }),
    ],
    connections: [
      conn('new', 'contacted'), conn('new', 'dead-not-interested', '', true),
      conn('contacted', 'qualified'), conn('contacted', 'dead-no-contact', '', true),
      conn('qualified', 'meeting'), conn('qualified', 'dead-bad-timing', '', true),
      conn('meeting', 'closing'), conn('meeting', 'dead-competitor', '', true),
      conn('closing', 'won'),
    ],
    labels: [
      lbl('l1', '💀 DEAD LEADS', 40, 20, 14, '#ef4444', '#1e293b'),
      lbl('l2', '🚀 ACTIVE PIPELINE', 800, 50, 18, '#3b82f6'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== 5-STAGE WITH FOLLOW UPS =====
  {
    id: 'followup-sequence',
    name: '5 Follow-Up Sequence',
    description: 'New leads with escalating follow-ups: Email → Call → Text → Email → Final. Dead leads sorted on left.',
    icon: '📞',
    complexity: 'advanced',
    stages: [
      // Dead on left
      stage('dead-gone', 'No Response', 'dead', 40, 200, '💀', 'slate', { w: 180, h: 160, dead: 'no-contact' }),
      stage('dead-lost', 'Lost Interest', 'dead', 40, 380, '👋', 'red', { w: 180, h: 160, dead: 'not-interested' }),
      
      // Main flow
      stage('new', 'NEW LEADS', 'new', 280, 200, '📥', 'blue', { w: 240, h: 240, email: 'email-welcome-1' }),
      stage('fu1', 'Follow Up 1', 'working', 560, 120, '📧', 'cyan', { email: 'email-followup-24h', followUp: 'email' }),
      stage('fu2', 'Follow Up 2', 'working', 560, 300, '📞', 'yellow', { followUp: 'phone' }),
      stage('fu3', 'Follow Up 3', 'circle-back', 800, 120, '💬', 'orange', { followUp: 'text' }),
      stage('fu4', 'Follow Up 4', 'circle-back', 800, 300, '📧', 'red', { email: 'email-followup-1week', followUp: 'email' }),
      stage('fu5', 'Final Try', 'circle-back', 1040, 200, '🔔', 'purple', { email: 'email-gentle-2' }),
      stage('engaged', 'ENGAGED!', 'working', 1280, 120, '🔥', 'green', { w: 200, h: 180 }),
      stage('closing', 'Closing', 'approval', 1280, 320, '🎯', 'green', { w: 200, h: 180, email: 'email-closing-1', meeting: 'online-video' }),
    ],
    connections: [
      conn('new', 'fu1'),
      conn('fu1', 'fu2', '48h'), conn('fu1', 'engaged'),
      conn('fu2', 'fu3', '72h'), conn('fu2', 'engaged'),
      conn('fu3', 'fu4', '1wk'), conn('fu3', 'engaged'),
      conn('fu4', 'fu5', '2wk'), conn('fu4', 'engaged'),
      conn('fu5', 'dead-gone', '', true), conn('fu5', 'engaged'),
      conn('engaged', 'closing'),
      conn('new', 'dead-lost', '', true),
    ],
    labels: [
      lbl('l1', '📞 5-TOUCH FOLLOW-UP', 700, 40, 16, '#06b6d4'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== POST-PURCHASE COMPLETE =====
  {
    id: 'post-purchase-full',
    name: 'Complete Post-Purchase Journey',
    description: 'Full cycle: 1 week, 1 month, 3 months, 6 months, 1 year follow-ups with referral system.',
    icon: '🎉',
    complexity: 'advanced',
    category: 'post-sale',
    stages: [
      stage('sold', '🎉 SOLD!', 'approval', 40, 200, '🎉', 'green', { w: 220, h: 200 }),
      stage('1week', '1 Week', 'working', 300, 200, '📞', 'blue', { email: 'email-postsale-1week', followUp: 'phone' }),
      stage('1month', '1 Month', 'working', 540, 200, '📧', 'cyan', { email: 'email-postsale-1month', followUp: 'email' }),
      stage('3month', '3 Months', 'working', 780, 200, '📞', 'yellow', { followUp: 'phone' }),
      stage('6month', '6 Months', 'circle-back', 1020, 200, '📧', 'orange', { followUp: 'email' }),
      stage('1year', '1 Year', 'circle-back', 1260, 200, '🎂', 'purple', { email: 'email-postsale-1year' }),
      stage('referral', 'Ask Referral', 'working', 1020, 380, '🤝', 'pink', { w: 200, h: 180 }),
      stage('repeat', 'Repeat Customer', 'approval', 1260, 380, '🔄', 'green', { w: 200, h: 180 }),
    ],
    connections: [
      conn('sold', '1week', 'Thank you'),
      conn('1week', '1month', 'Check in'),
      conn('1month', '3month', 'Service?'),
      conn('3month', '6month'),
      conn('6month', '1year', 'Anniversary'),
      conn('1year', 'referral'),
      conn('referral', 'repeat'),
    ],
    labels: [
      lbl('l1', '🎉 POST-PURCHASE JOURNEY', 600, 80, 18, '#22c55e'),
      lbl('l2', 'Timeline: 1wk → 1mo → 3mo → 6mo → 1yr', 600, 120, 12, '#64748b'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== DEAD LEAD RESURRECTION =====
  {
    id: 'dead-resurrection',
    name: 'Dead Lead Resurrection',
    description: 'Categorize dead leads and attempt to revive them with targeted re-engagement campaigns.',
    icon: '💀',
    complexity: 'advanced',
    stages: [
      // Incoming dead
      stage('all-dead', 'All Dead Leads', 'dead', 40, 250, '💀', 'slate', { w: 220, h: 220 }),
      
      // Categories
      stage('cat-timing', '⏰ Bad Timing', 'dead', 300, 80, '⏰', 'yellow', { w: 180, h: 150, dead: 'bad-timing' }),
      stage('cat-money', '💰 Budget Issue', 'dead', 300, 250, '💰', 'orange', { w: 180, h: 150, dead: 'no-money' }),
      stage('cat-interest', '🤷 Lost Interest', 'dead', 300, 420, '🤷', 'red', { w: 180, h: 150, dead: 'not-interested' }),
      
      // Revival attempts
      stage('revive-timing', 'Try in 3 Months', 'circle-back', 540, 80, '📆', 'cyan', { w: 180, h: 150, email: 'email-reengage-1' }),
      stage('revive-offer', 'Special Offer', 'circle-back', 540, 250, '🎁', 'purple', { w: 180, h: 150, email: 'email-reengage-2' }),
      stage('revive-check', 'Check Back', 'circle-back', 540, 420, '📞', 'blue', { w: 180, h: 150, followUp: 'phone' }),
      
      // Outcomes
      stage('back-active', 'BACK ACTIVE!', 'new', 780, 200, '🎯', 'green', { w: 200, h: 180 }),
      stage('truly-dead', 'Archive', 'dead', 780, 400, '📦', 'slate', { w: 180, h: 140, dead: 'archive' }),
    ],
    connections: [
      conn('all-dead', 'cat-timing'), conn('all-dead', 'cat-money'), conn('all-dead', 'cat-interest'),
      conn('cat-timing', 'revive-timing'), conn('cat-money', 'revive-offer'), conn('cat-interest', 'revive-check'),
      conn('revive-timing', 'back-active'), conn('revive-offer', 'back-active'), conn('revive-check', 'back-active'),
      conn('revive-timing', 'truly-dead', '', true), conn('revive-offer', 'truly-dead', '', true), conn('revive-check', 'truly-dead', '', true),
    ],
    labels: [
      lbl('l1', '💀 DEAD LEAD RESURRECTION', 400, 20, 18, '#ef4444'),
      lbl('l2', 'Sort → Categorize → Revive', 400, 50, 12, '#64748b'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== VIP CONCIERGE =====
  {
    id: 'vip-starred',
    name: 'VIP / Starred Lead Concierge',
    description: 'White-glove treatment for high-value starred leads. Personal touch at every step.',
    icon: '👑',
    complexity: 'advanced',
    stages: [
      stage('vip-in', '👑 VIP Inquiry', 'new', 40, 200, '👑', 'yellow', { w: 240, h: 220, email: 'email-welcome-2' }),
      stage('vip-call', 'Personal Call', 'working', 320, 120, '📞', 'purple', { w: 200, h: 180, followUp: 'phone' }),
      stage('vip-video', 'Video Consult', 'working', 320, 320, '📹', 'indigo', { w: 200, h: 180, meeting: 'online-video' }),
      stage('vip-visit', 'Private Showing', 'working', 560, 200, '🏢', 'blue', { w: 200, h: 180, meeting: 'in-person-office' }),
      stage('vip-drive', 'Test Drive', 'working', 800, 200, '🚗', 'cyan', { w: 200, h: 180, meeting: 'test-drive' }),
      stage('vip-close', 'VIP Closing', 'approval', 1040, 200, '🏆', 'green', { w: 220, h: 200, email: 'email-closing-2' }),
    ],
    connections: [
      conn('vip-in', 'vip-call'), conn('vip-in', 'vip-video', '', true),
      conn('vip-call', 'vip-visit'), conn('vip-video', 'vip-visit'),
      conn('vip-visit', 'vip-drive'), conn('vip-drive', 'vip-close'),
    ],
    labels: [
      lbl('l1', '👑 VIP CONCIERGE SERVICE', 500, 60, 20, '#eab308'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== SIMPLE 3-STAGE =====
  {
    id: 'simple-3',
    name: 'Simple 3-Stage',
    description: 'Basic: New → Working → Done. Perfect for beginners.',
    icon: '📊',
    complexity: 'simple',
    stages: [
      stage('new', 'NEW LEADS', 'new', 80, 200, '📥', 'blue', { w: 260, h: 260, email: 'email-welcome-1' }),
      stage('working', 'Working', 'working', 400, 200, '⚙️', 'yellow', { w: 240, h: 220, followUp: 'email' }),
      stage('done', 'Done', 'approval', 700, 200, '✅', 'green', { w: 220, h: 200 }),
    ],
    connections: [conn('new', 'working'), conn('working', 'done')],
    labels: [],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== SIMPLE WITH DEAD =====
  {
    id: 'simple-with-dead',
    name: 'Simple + Dead Sorting',
    description: 'Basic pipeline with dead lead categorization on left.',
    icon: '💀',
    complexity: 'simple',
    stages: [
      stage('dead-all', 'Dead Leads', 'dead', 40, 200, '💀', 'red', { w: 200, h: 200 }),
      stage('new', 'NEW LEADS', 'new', 300, 200, '📥', 'blue', { w: 260, h: 260, email: 'email-welcome-1' }),
      stage('working', 'Working', 'working', 600, 200, '⚙️', 'yellow', { w: 220, h: 200 }),
      stage('done', 'Done', 'approval', 860, 200, '✅', 'green', { w: 200, h: 180 }),
    ],
    connections: [
      conn('new', 'working'), conn('working', 'done'),
      conn('new', 'dead-all', '', true), conn('working', 'dead-all', '', true),
    ],
    labels: [],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== MEETING FOCUSED =====
  {
    id: 'meeting-focused',
    name: 'Meeting-Focused Pipeline',
    description: 'All roads lead to meetings: Phone, Video, Office, Test Drive.',
    icon: '📅',
    complexity: 'medium',
    stages: [
      stage('lead', 'New Lead', 'new', 40, 220, '📥', 'blue', { w: 220, h: 200, email: 'email-welcome-1' }),
      stage('contact', 'First Contact', 'working', 300, 220, '📞', 'cyan', { w: 200, h: 180, followUp: 'phone' }),
      
      stage('mtg-phone', 'Phone Apt', 'working', 540, 80, '📱', 'yellow', { w: 180, h: 150, meeting: 'online-phone' }),
      stage('mtg-video', 'Video Apt', 'working', 540, 220, '📹', 'purple', { w: 180, h: 150, meeting: 'online-video' }),
      stage('mtg-office', 'Office Visit', 'working', 540, 360, '🏢', 'indigo', { w: 180, h: 150, meeting: 'in-person-office' }),
      
      stage('test-drive', 'Test Drive', 'approval', 780, 220, '🚗', 'green', { w: 200, h: 180, meeting: 'test-drive' }),
      stage('close', 'CLOSE', 'approval', 1020, 220, '🏆', 'green', { w: 180, h: 160, email: 'email-closing-1' }),
    ],
    connections: [
      conn('lead', 'contact'),
      conn('contact', 'mtg-phone'), conn('contact', 'mtg-video'), conn('contact', 'mtg-office'),
      conn('mtg-phone', 'test-drive'), conn('mtg-video', 'test-drive'), conn('mtg-office', 'test-drive'),
      conn('test-drive', 'close'),
    ],
    labels: [lbl('l1', '📅 ALL ROADS → MEETING', 500, 30, 16, '#a855f7')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== HOT LEADS SPEED =====
  {
    id: 'hot-speed',
    name: 'Hot Lead Speed Track',
    description: 'Same-day close for urgent buyers. Call → Meet → Close.',
    icon: '🔥',
    complexity: 'simple',
    stages: [
      stage('hot', '🔥 HOT LEAD', 'new', 60, 200, '🔥', 'orange', { w: 260, h: 240 }),
      stage('call', 'CALL NOW', 'working', 360, 200, '📞', 'yellow', { w: 220, h: 200, followUp: 'phone' }),
      stage('meet', 'Same Day Meet', 'working', 620, 200, '🚗', 'cyan', { w: 220, h: 200, meeting: 'test-drive' }),
      stage('close', 'CLOSE TODAY', 'approval', 880, 200, '🏆', 'green', { w: 220, h: 200, email: 'email-closing-2' }),
    ],
    connections: [conn('hot', 'call', 'ASAP'), conn('call', 'meet', 'Today'), conn('meet', 'close', 'Now')],
    labels: [lbl('l1', '🔥 SAME DAY CLOSE', 500, 100, 20, '#f97316')],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ===== COLD NURTURE =====
  {
    id: 'cold-drip',
    name: 'Cold Lead Drip Campaign',
    description: 'Long-term email nurturing for cold leads over 4+ weeks.',
    icon: '❄️',
    complexity: 'advanced',
    stages: [
      stage('cold', '❄️ Cold Pool', 'new', 40, 200, '❄️', 'cyan', { w: 220, h: 220 }),
      stage('drip1', 'Week 1', 'working', 300, 120, '💧', 'blue', { w: 180, h: 150, email: 'email-followup-24h', followUp: 'email' }),
      stage('drip2', 'Week 2', 'working', 300, 290, '💧', 'blue', { w: 180, h: 150, email: 'email-followup-48h', followUp: 'email' }),
      stage('drip3', 'Week 3', 'working', 520, 200, '💧', 'teal', { w: 180, h: 150, email: 'email-followup-1week', followUp: 'email' }),
      stage('drip4', 'Week 4', 'circle-back', 740, 200, '💧', 'yellow', { w: 180, h: 150, email: 'email-gentle-1', followUp: 'email' }),
      stage('warming', 'Warming Up', 'working', 960, 200, '☀️', 'orange', { w: 200, h: 180 }),
      stage('convert', 'CONVERTED', 'approval', 1200, 140, '🎯', 'green', { w: 180, h: 150 }),
      stage('dormant', 'Dormant', 'dead', 1200, 300, '💤', 'slate', { w: 180, h: 150, dead: 'not-ready' }),
    ],
    connections: [
      conn('cold', 'drip1'), conn('cold', 'drip2', '', true),
      conn('drip1', 'drip3'), conn('drip2', 'drip3'),
      conn('drip3', 'drip4'), conn('drip4', 'warming', 'Opened'),
      conn('warming', 'convert'), conn('warming', 'dormant', '', true),
    ],
    labels: [lbl('l1', '❄️ COLD LEAD NURTURING', 600, 60, 18, '#06b6d4')],
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
