// Super Robust Pipeline Presets - Advanced Automation Flows
import { PipelineStage, NodeConnection, TextLabel, EmailTemplate, DEFAULT_AUTOMATION, DEFAULT_EMAIL_TEMPLATES, StageColor, FollowUpMethod, MeetingType } from './types';
import { LeadStatus } from '@/lib/validation';

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  complexity: 'simple' | 'medium' | 'advanced' | 'expert';
  category?: string;
  stages: PipelineStage[];
  connections: NodeConnection[];
  labels: TextLabel[];
  emailTemplates: EmailTemplate[];
  tags?: string[];
}

// Helpers
const stage = (id: string, label: string, statusId: LeadStatus | 'dead', x: number, y: number, icon: string, color: StageColor, 
  opts: { w?: number; h?: number; email?: string; followUp?: FollowUpMethod; meeting?: MeetingType; dead?: string; sms?: string; call?: string; notification?: boolean } = {}
): PipelineStage => ({
  id, label, statusId, x, y, width: opts.w || 280, height: opts.h || 260, color, icon,
  contactMethods: [], automationSettings: { ...DEFAULT_AUTOMATION, pushNotifications: opts.notification ?? true },
  emailTemplateId: opts.email, followUpMethod: opts.followUp, meetingType: opts.meeting, deadReason: opts.dead,
});

const conn = (from: string, to: string, label?: string, dashed = false): NodeConnection => ({
  id: `${from}-${to}`, fromStageId: from, toStageId: to, fromAnchor: 'right', toAnchor: 'left', label, style: dashed ? 'dashed' : 'solid', color: dashed ? '#64748b' : '#3b82f6',
});

const lbl = (id: string, text: string, x: number, y: number, size = 16, color = '#94a3b8', bg?: string): TextLabel => ({ id, text, x, y, fontSize: size, color, bgColor: bg });

// ============ PRESETS ============
export const ALL_PRESETS: Preset[] = [
  // ========================================
  // EXPERT: COMPLETE FUNNEL WITH DEAD LEADS
  // ========================================
  {
    id: 'complete-ultimate',
    name: '🚀 ULTIMATE Sales Funnel',
    description: 'The most complete pipeline with dead lead categorization, full follow-up sequence, meeting types, and closing stages. Maximum automation.',
    icon: '🚀',
    complexity: 'expert',
    category: 'complete',
    tags: ['complete', 'automation', 'dead-leads', 'meetings'],
    stages: [
      // Dead Leads Section (LEFT SIDE)
      stage('dead-not-interested', '🚫 Not Interested', 'dead', 40, 60, '🚫', 'red', { w: 220, h: 200, dead: 'not-interested' }),
      stage('dead-no-contact', '📵 No Contact', 'dead', 40, 280, '📵', 'orange', { w: 220, h: 200, dead: 'no-contact' }),
      stage('dead-bad-timing', '⏰ Bad Timing', 'dead', 40, 500, '⏰', 'yellow', { w: 220, h: 200, dead: 'bad-timing' }),
      stage('dead-competitor', '🏃 Went Competitor', 'dead', 40, 720, '🏃', 'slate', { w: 220, h: 200, dead: 'competitor' }),
      stage('dead-budget', '💸 Budget Issue', 'dead', 40, 940, '💸', 'pink', { w: 220, h: 200, dead: 'no-money' }),
      
      // Main Pipeline (CENTER TO RIGHT)
      stage('new', '📥 NEW LEADS', 'new', 360, 300, '📥', 'blue', { w: 300, h: 320, email: 'email-welcome-1' }),
      
      // First Contact Sequence
      stage('contacted-1', '📧 Email Sent', 'working', 700, 150, '📧', 'cyan', { w: 260, h: 220, email: 'email-welcome-1', followUp: 'email' }),
      stage('contacted-2', '📞 Call Made', 'working', 700, 400, '📞', 'cyan', { w: 260, h: 220, followUp: 'phone' }),
      stage('contacted-3', '💬 SMS Sent', 'working', 700, 650, '💬', 'cyan', { w: 260, h: 220, followUp: 'text' }),
      
      // Qualified
      stage('qualified', '✅ Qualified', 'working', 1000, 300, '✅', 'green', { w: 280, h: 260 }),
      
      // Meeting Types
      stage('meeting-video', '📹 Video Call', 'working', 1320, 80, '📹', 'purple', { w: 240, h: 200, meeting: 'online-video' }),
      stage('meeting-phone', '📱 Phone Appt', 'working', 1320, 300, '📱', 'purple', { w: 240, h: 200, meeting: 'online-phone' }),
      stage('meeting-office', '🏢 Office Visit', 'working', 1320, 520, '🏢', 'purple', { w: 240, h: 200, meeting: 'in-person-office' }),
      stage('meeting-testdrive', '🚗 Test Drive', 'working', 1320, 740, '🚗', 'purple', { w: 240, h: 200, meeting: 'test-drive' }),
      
      // Closing
      stage('proposal', '📋 Proposal Sent', 'approval', 1600, 200, '📋', 'yellow', { w: 260, h: 220, email: 'email-closing-1' }),
      stage('negotiation', '💬 Negotiating', 'approval', 1600, 450, '💬', 'orange', { w: 260, h: 220 }),
      stage('closing', '🎯 Closing', 'approval', 1900, 300, '🎯', 'green', { w: 260, h: 240, email: 'email-closing-2' }),
      
      // Won
      stage('won', '🏆 WON!', 'approval', 2200, 300, '🏆', 'green', { w: 240, h: 220 }),
    ],
    connections: [
      // New to Contact
      conn('new', 'contacted-1'), conn('new', 'contacted-2', '', true), conn('new', 'contacted-3', '', true),
      // Contact to Dead
      conn('contacted-1', 'dead-no-contact', '', true), conn('contacted-2', 'dead-no-contact', '', true),
      conn('new', 'dead-not-interested', '', true),
      // Contact to Qualified
      conn('contacted-1', 'qualified'), conn('contacted-2', 'qualified'), conn('contacted-3', 'qualified'),
      // Qualified to Meeting
      conn('qualified', 'meeting-video'), conn('qualified', 'meeting-phone'), 
      conn('qualified', 'meeting-office'), conn('qualified', 'meeting-testdrive'),
      conn('qualified', 'dead-bad-timing', '', true),
      // Meeting to Proposal
      conn('meeting-video', 'proposal'), conn('meeting-phone', 'proposal'),
      conn('meeting-office', 'proposal'), conn('meeting-testdrive', 'proposal'),
      conn('meeting-video', 'dead-competitor', '', true),
      // Proposal to Negotiation/Closing
      conn('proposal', 'negotiation'), conn('proposal', 'closing'),
      conn('proposal', 'dead-budget', '', true),
      conn('negotiation', 'closing'), conn('negotiation', 'dead-competitor', '', true),
      // Close to Won
      conn('closing', 'won'),
    ],
    labels: [
      lbl('l1', '💀 DEAD LEADS', 80, 20, 18, '#ef4444', '#1e293b'),
      lbl('l2', '🚀 ACTIVE PIPELINE', 1100, 20, 20, '#3b82f6'),
      lbl('l3', '📅 MEETINGS', 1350, 20, 16, '#a855f7'),
      lbl('l4', '🎯 CLOSING', 1800, 20, 16, '#22c55e'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // EXPERT: MAXIMUM FOLLOW-UP SEQUENCE
  // ========================================
  {
    id: 'max-followup-sequence',
    name: '📞 10-Touch Follow-Up Machine',
    description: 'Maximum persistence follow-up system: Email → Call → SMS → WhatsApp → Repeat. Dead leads categorized on left.',
    icon: '📞',
    complexity: 'expert',
    category: 'followup',
    tags: ['followup', 'persistence', 'automation', 'sms', 'whatsapp'],
    stages: [
      // Dead Leads (LEFT)
      stage('dead-ghost', '👻 Ghosted', 'dead', 40, 150, '👻', 'slate', { w: 200, h: 180, dead: 'no-contact' }),
      stage('dead-declined', '❌ Declined', 'dead', 40, 350, '❌', 'red', { w: 200, h: 180, dead: 'not-interested' }),
      stage('dead-later', '⏳ Maybe Later', 'dead', 40, 550, '⏳', 'yellow', { w: 200, h: 180, dead: 'bad-timing' }),
      
      // Entry Point
      stage('new', '📥 NEW LEADS', 'new', 300, 300, '📥', 'blue', { w: 280, h: 280, email: 'email-welcome-1' }),
      
      // Touch 1-2: Email
      stage('fu1', '📧 Touch 1 (Email)', 'working', 620, 150, '📧', 'cyan', { w: 220, h: 180, email: 'email-welcome-1', followUp: 'email' }),
      stage('fu2', '📧 Touch 2 (Email)', 'working', 620, 350, '📧', 'cyan', { w: 220, h: 180, email: 'email-followup-24h', followUp: 'email' }),
      
      // Touch 3-4: Phone
      stage('fu3', '📞 Touch 3 (Call)', 'working', 880, 150, '📞', 'yellow', { w: 220, h: 180, followUp: 'phone' }),
      stage('fu4', '📞 Touch 4 (Call)', 'working', 880, 350, '📞', 'yellow', { w: 220, h: 180, followUp: 'phone' }),
      
      // Touch 5-6: SMS
      stage('fu5', '💬 Touch 5 (SMS)', 'circle-back', 1140, 150, '💬', 'orange', { w: 220, h: 180, followUp: 'text' }),
      stage('fu6', '💬 Touch 6 (SMS)', 'circle-back', 1140, 350, '💬', 'orange', { w: 220, h: 180, followUp: 'text' }),
      
      // Touch 7-8: WhatsApp
      stage('fu7', '📱 Touch 7 (WhatsApp)', 'circle-back', 1400, 150, '📱', 'green', { w: 220, h: 180, followUp: 'whatsapp' }),
      stage('fu8', '📱 Touch 8 (WhatsApp)', 'circle-back', 1400, 350, '📱', 'green', { w: 220, h: 180, followUp: 'whatsapp' }),
      
      // Touch 9-10: Final
      stage('fu9', '🔔 Touch 9 (Final Email)', 'circle-back', 1660, 220, '🔔', 'red', { w: 220, h: 180, email: 'email-gentle-2', followUp: 'email' }),
      stage('fu10', '⏰ Touch 10 (Last Call)', 'circle-back', 1660, 420, '⏰', 'purple', { w: 220, h: 180, followUp: 'phone' }),
      
      // Outcomes
      stage('engaged', '🔥 ENGAGED!', 'working', 1920, 150, '🔥', 'green', { w: 220, h: 200 }),
      stage('meeting-set', '📅 Meeting Set', 'working', 1920, 380, '📅', 'purple', { w: 220, h: 200, meeting: 'online-video' }),
      stage('closed', '🏆 CLOSED', 'approval', 2180, 260, '🏆', 'green', { w: 220, h: 200 }),
    ],
    connections: [
      // New to Touch 1
      conn('new', 'fu1'),
      // Touch sequence
      conn('fu1', 'fu2', '24h'), conn('fu2', 'fu3', '48h'),
      conn('fu3', 'fu4', '72h'), conn('fu4', 'fu5', '1wk'),
      conn('fu5', 'fu6', '3d'), conn('fu6', 'fu7', '1wk'),
      conn('fu7', 'fu8', '3d'), conn('fu8', 'fu9', '1wk'),
      conn('fu9', 'fu10', '2wk'),
      // To engaged from any touch
      conn('fu1', 'engaged'), conn('fu2', 'engaged'), conn('fu3', 'engaged'),
      conn('fu4', 'engaged'), conn('fu5', 'engaged'), conn('fu6', 'engaged'),
      conn('fu7', 'engaged'), conn('fu8', 'engaged'), conn('fu9', 'engaged'),
      conn('fu10', 'engaged'),
      // To dead
      conn('fu10', 'dead-ghost', '', true),
      conn('new', 'dead-declined', '', true),
      conn('fu5', 'dead-later', '', true),
      // Engaged to meeting
      conn('engaged', 'meeting-set'),
      // Meeting to closed
      conn('meeting-set', 'closed'),
    ],
    labels: [
      lbl('l1', '💀 DEAD', 80, 100, 16, '#64748b', '#1e293b'),
      lbl('l2', '📞 10-TOUCH FOLLOW-UP SEQUENCE', 900, 50, 20, '#06b6d4'),
      lbl('l3', '📧→📞→💬→📱→🔔', 900, 85, 14, '#94a3b8'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // ADVANCED: DEAD LEAD RESURRECTION
  // ========================================
  {
    id: 'dead-resurrection-advanced',
    name: '💀 Dead Lead Resurrection Pro',
    description: 'Advanced dead lead revival system. Categorize → Analyze → Revive with targeted campaigns.',
    icon: '💀',
    complexity: 'advanced',
    category: 'dead-leads',
    tags: ['dead-leads', 'resurrection', 're-engagement'],
    stages: [
      // Incoming Dead
      stage('all-dead', '💀 All Dead Leads', 'dead', 40, 350, '💀', 'slate', { w: 260, h: 300 }),
      
      // Categories
      stage('cat-timing', '⏰ Bad Timing', 'dead', 360, 80, '⏰', 'yellow', { w: 220, h: 180, dead: 'bad-timing' }),
      stage('cat-money', '💰 Budget Issue', 'dead', 360, 280, '💰', 'orange', { w: 220, h: 180, dead: 'no-money' }),
      stage('cat-interest', '🤷 Lost Interest', 'dead', 360, 480, '🤷', 'red', { w: 220, h: 180, dead: 'not-interested' }),
      stage('cat-competitor', '🏃 Went Competitor', 'dead', 360, 680, '🏃', 'purple', { w: 220, h: 180, dead: 'competitor' }),
      
      // Revival Strategies
      stage('revive-wait3mo', '📆 Wait 3 Months', 'circle-back', 640, 80, '📆', 'cyan', { w: 220, h: 180, email: 'email-reengage-1' }),
      stage('revive-offer', '🎁 Special Offer', 'circle-back', 640, 280, '🎁', 'green', { w: 220, h: 180, email: 'email-reengage-2' }),
      stage('revive-checkin', '👋 Friendly Check', 'circle-back', 640, 480, '👋', 'blue', { w: 220, h: 180, email: 'email-gentle-1', followUp: 'phone' }),
      stage('revive-referral', '🤝 Ask Referral', 'circle-back', 640, 680, '🤝', 'pink', { w: 220, h: 180, email: 'email-postsale-referral' }),
      
      // Second Attempt
      stage('attempt2-email', '📧 Re-engage Email', 'circle-back', 920, 180, '📧', 'yellow', { w: 220, h: 180, email: 'email-reengage-3', followUp: 'email' }),
      stage('attempt2-call', '📞 Re-engage Call', 'circle-back', 920, 380, '📞', 'orange', { w: 220, h: 180, followUp: 'phone' }),
      stage('attempt2-sms', '💬 Re-engage SMS', 'circle-back', 920, 580, '💬', 'red', { w: 220, h: 180, followUp: 'text' }),
      
      // Outcomes
      stage('back-active', '🎯 BACK ACTIVE!', 'new', 1200, 200, '🎯', 'green', { w: 240, h: 200 }),
      stage('referral-given', '🤝 Gave Referral', 'working', 1200, 430, '🤝', 'purple', { w: 240, h: 200 }),
      stage('archive', '📦 Archive', 'dead', 1200, 660, '📦', 'slate', { w: 240, h: 200, dead: 'archive' }),
    ],
    connections: [
      // Sort into categories
      conn('all-dead', 'cat-timing'), conn('all-dead', 'cat-money'),
      conn('all-dead', 'cat-interest'), conn('all-dead', 'cat-competitor'),
      // Category to revival strategy
      conn('cat-timing', 'revive-wait3mo'), conn('cat-money', 'revive-offer'),
      conn('cat-interest', 'revive-checkin'), conn('cat-competitor', 'revive-referral'),
      // Revival to second attempt
      conn('revive-wait3mo', 'attempt2-email'), conn('revive-offer', 'attempt2-email'),
      conn('revive-checkin', 'attempt2-call'), conn('revive-referral', 'attempt2-sms'),
      // Second attempt to outcomes
      conn('attempt2-email', 'back-active'), conn('attempt2-call', 'back-active'),
      conn('attempt2-sms', 'back-active'),
      conn('attempt2-email', 'archive', '', true), conn('attempt2-call', 'archive', '', true),
      conn('revive-referral', 'referral-given'),
      conn('attempt2-sms', 'referral-given'),
    ],
    labels: [
      lbl('l1', '💀 DEAD LEAD RESURRECTION', 600, 20, 22, '#ef4444'),
      lbl('l2', 'Categorize → Strategize → Revive', 600, 55, 14, '#64748b'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // ADVANCED: NEW LEAD MAXIMUM FLOW
  // ========================================
  {
    id: 'new-lead-max',
    name: '📥 New Lead Power Flow',
    description: 'Maximum conversion new lead handling. Immediate multi-channel contact, qualification, and fast-track to meeting.',
    icon: '📥',
    complexity: 'advanced',
    category: 'new-leads',
    tags: ['new-leads', 'fast', 'multi-channel', 'qualification'],
    stages: [
      // Dead on left
      stage('dead-fake', '🚫 Fake/Spam', 'dead', 40, 150, '🚫', 'red', { w: 200, h: 160, dead: 'fake' }),
      stage('dead-unqualified', '❌ Unqualified', 'dead', 40, 330, '❌', 'orange', { w: 200, h: 160, dead: 'unqualified' }),
      stage('dead-ghosted', '👻 No Response', 'dead', 40, 510, '👻', 'slate', { w: 200, h: 160, dead: 'no-contact' }),
      
      // New Lead Entry
      stage('incoming', '🆕 INCOMING', 'new', 300, 300, '🆕', 'blue', { w: 280, h: 280, notification: true }),
      
      // Immediate Response (within 5 min)
      stage('response-email', '⚡ Auto Email', 'working', 620, 100, '⚡', 'cyan', { w: 220, h: 180, email: 'email-welcome-1', followUp: 'email' }),
      stage('response-sms', '⚡ Auto SMS', 'working', 620, 300, '⚡', 'green', { w: 220, h: 180, followUp: 'text' }),
      stage('response-call', '📞 Call Now', 'working', 620, 500, '📞', 'yellow', { w: 220, h: 180, followUp: 'phone' }),
      
      // Qualification
      stage('qualify-basic', '📋 Basic Info', 'working', 880, 150, '📋', 'purple', { w: 220, h: 180 }),
      stage('qualify-needs', '🎯 Needs Assessment', 'working', 880, 350, '🎯', 'purple', { w: 220, h: 180 }),
      stage('qualify-budget', '💰 Budget Check', 'working', 880, 550, '💰', 'purple', { w: 220, h: 180 }),
      
      // Qualified Tracks
      stage('hot-lead', '🔥 HOT LEAD', 'working', 1140, 150, '🔥', 'orange', { w: 220, h: 180 }),
      stage('warm-lead', '☀️ Warm Lead', 'working', 1140, 350, '☀️', 'yellow', { w: 220, h: 180 }),
      stage('cold-lead', '❄️ Cold Lead', 'circle-back', 1140, 550, '❄️', 'cyan', { w: 220, h: 180 }),
      
      // Meeting Fast Track
      stage('meeting-same-day', '🚀 Same Day Meet', 'working', 1400, 150, '🚀', 'green', { w: 220, h: 180, meeting: 'test-drive' }),
      stage('meeting-scheduled', '📅 Meeting Set', 'working', 1400, 350, '📅', 'green', { w: 220, h: 180, meeting: 'online-video' }),
      stage('nurture', '🌱 Nurture Track', 'circle-back', 1400, 550, '🌱', 'cyan', { w: 220, h: 180, email: 'email-followup-1week' }),
      
      // Closing
      stage('closing', '🎯 CLOSING', 'approval', 1660, 250, '🎯', 'green', { w: 240, h: 200 }),
      stage('won', '🏆 WON!', 'approval', 1920, 250, '🏆', 'green', { w: 220, h: 180 }),
    ],
    connections: [
      // Incoming to responses
      conn('incoming', 'response-email'), conn('incoming', 'response-sms'), conn('incoming', 'response-call'),
      // Responses to qualification
      conn('response-email', 'qualify-basic'), conn('response-sms', 'qualify-basic'), conn('response-call', 'qualify-basic'),
      // Qualification flow
      conn('qualify-basic', 'qualify-needs'), conn('qualify-needs', 'qualify-budget'),
      conn('qualify-basic', 'dead-fake', '', true), conn('qualify-needs', 'dead-unqualified', '', true),
      // Budget to lead type
      conn('qualify-budget', 'hot-lead'), conn('qualify-budget', 'warm-lead'), conn('qualify-budget', 'cold-lead'),
      // Lead type to action
      conn('hot-lead', 'meeting-same-day'), conn('warm-lead', 'meeting-scheduled'), conn('cold-lead', 'nurture'),
      // Meetings to closing
      conn('meeting-same-day', 'closing'), conn('meeting-scheduled', 'closing'),
      conn('nurture', 'meeting-scheduled', '', true), conn('nurture', 'dead-ghosted', '', true),
      // Closing to won
      conn('closing', 'won'),
    ],
    labels: [
      lbl('l1', '📥 NEW LEAD POWER FLOW', 900, 20, 22, '#3b82f6'),
      lbl('l2', '5-Min Response → Qualify → Convert', 900, 55, 14, '#64748b'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // ADVANCED: POST-PURCHASE COMPLETE
  // ========================================
  {
    id: 'post-purchase-complete',
    name: '🎉 Complete Post-Purchase Journey',
    description: 'Full customer retention cycle: Thank you → Check-ins → Referrals → Repeat business.',
    icon: '🎉',
    complexity: 'advanced',
    category: 'post-sale',
    tags: ['post-sale', 'retention', 'referral', 'repeat'],
    stages: [
      // Entry
      stage('sold', '🎉 SOLD!', 'approval', 40, 300, '🎉', 'green', { w: 260, h: 260 }),
      
      // Immediate
      stage('day1-thanks', '🙏 Thank You (Day 1)', 'working', 360, 200, '🙏', 'blue', { w: 220, h: 180, email: 'email-postsale-thanks' }),
      stage('day1-call', '📞 Delivery Call', 'working', 360, 400, '📞', 'cyan', { w: 220, h: 180, followUp: 'phone' }),
      
      // Week 1
      stage('1week', '📧 1 Week Check', 'working', 620, 300, '📧', 'cyan', { w: 220, h: 180, email: 'email-postsale-1week', followUp: 'email' }),
      
      // Month 1
      stage('1month', '📞 1 Month Call', 'working', 880, 200, '📞', 'yellow', { w: 220, h: 180, followUp: 'phone' }),
      stage('1month-review', '⭐ Ask Review', 'working', 880, 400, '⭐', 'yellow', { w: 220, h: 180, email: 'email-review-request' }),
      
      // 3 Months
      stage('3month', '📞 3 Month Check', 'working', 1140, 200, '📞', 'orange', { w: 220, h: 180, followUp: 'phone' }),
      stage('3month-referral', '🤝 Ask Referral', 'working', 1140, 400, '🤝', 'purple', { w: 220, h: 180, email: 'email-postsale-referral' }),
      
      // 6 Months
      stage('6month', '📧 6 Month Update', 'circle-back', 1400, 300, '📧', 'pink', { w: 220, h: 180, email: 'email-postsale-6month', followUp: 'email' }),
      
      // 1 Year
      stage('1year', '🎂 1 Year Anniversary', 'circle-back', 1660, 200, '🎂', 'purple', { w: 220, h: 180, email: 'email-postsale-1year' }),
      stage('1year-upgrade', '🚀 Upgrade Offer', 'circle-back', 1660, 400, '🚀', 'green', { w: 220, h: 180, email: 'email-upgrade-offer' }),
      
      // Outcomes
      stage('referral-received', '🤝 Got Referral!', 'working', 1920, 150, '🤝', 'green', { w: 220, h: 180 }),
      stage('repeat-customer', '🔄 Repeat Customer', 'approval', 1920, 350, '🔄', 'green', { w: 220, h: 180 }),
      stage('ambassador', '👑 Brand Ambassador', 'approval', 1920, 550, '👑', 'yellow', { w: 220, h: 180 }),
    ],
    connections: [
      conn('sold', 'day1-thanks'), conn('sold', 'day1-call'),
      conn('day1-thanks', '1week'), conn('day1-call', '1week'),
      conn('1week', '1month'), conn('1week', '1month-review'),
      conn('1month', '3month'), conn('1month-review', '3month'),
      conn('3month', '3month-referral'), conn('3month', '6month'),
      conn('3month-referral', 'referral-received'),
      conn('6month', '1year'), conn('6month', '1year-upgrade'),
      conn('1year', 'repeat-customer'), conn('1year-upgrade', 'repeat-customer'),
      conn('referral-received', 'ambassador'),
      conn('repeat-customer', 'ambassador'),
    ],
    labels: [
      lbl('l1', '🎉 POST-PURCHASE JOURNEY', 900, 80, 22, '#22c55e'),
      lbl('l2', 'Day 1 → Week 1 → Month 1 → 3mo → 6mo → 1yr', 900, 115, 14, '#64748b'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // MEDIUM: MEETING-FOCUSED PIPELINE
  // ========================================
  {
    id: 'meeting-focused-pro',
    name: '📅 Meeting-Focused Pro',
    description: 'All roads lead to meetings: Video, Phone, Office, Test Drive. Perfect for high-touch sales.',
    icon: '📅',
    complexity: 'medium',
    category: 'meetings',
    tags: ['meetings', 'high-touch', 'in-person'],
    stages: [
      stage('dead', '💀 Dead', 'dead', 40, 300, '💀', 'red', { w: 200, h: 180 }),
      
      stage('lead', '📥 New Lead', 'new', 300, 300, '📥', 'blue', { w: 280, h: 280, email: 'email-welcome-1' }),
      stage('contact', '📞 First Contact', 'working', 620, 300, '📞', 'cyan', { w: 260, h: 240, followUp: 'phone' }),
      
      stage('mtg-video', '📹 Video Call', 'working', 940, 80, '📹', 'purple', { w: 240, h: 200, meeting: 'online-video' }),
      stage('mtg-phone', '📱 Phone Apt', 'working', 940, 300, '📱', 'purple', { w: 240, h: 200, meeting: 'online-phone' }),
      stage('mtg-office', '🏢 Office Visit', 'working', 940, 520, '🏢', 'purple', { w: 240, h: 200, meeting: 'in-person-office' }),
      
      stage('test-drive', '🚗 Test Drive', 'approval', 1260, 200, '🚗', 'green', { w: 260, h: 220, meeting: 'test-drive' }),
      stage('proposal', '📋 Proposal', 'approval', 1260, 440, '📋', 'yellow', { w: 260, h: 220, email: 'email-closing-1' }),
      
      stage('close', '🏆 CLOSED', 'approval', 1560, 300, '🏆', 'green', { w: 240, h: 220, email: 'email-closing-2' }),
    ],
    connections: [
      conn('lead', 'contact'), conn('lead', 'dead', '', true),
      conn('contact', 'mtg-video'), conn('contact', 'mtg-phone'), conn('contact', 'mtg-office'),
      conn('contact', 'dead', '', true),
      conn('mtg-video', 'test-drive'), conn('mtg-phone', 'test-drive'), conn('mtg-office', 'test-drive'),
      conn('mtg-video', 'proposal'), conn('mtg-phone', 'proposal'),
      conn('test-drive', 'close'), conn('proposal', 'close'),
    ],
    labels: [
      lbl('l1', '📅 MEETING-FOCUSED PIPELINE', 900, 20, 20, '#a855f7'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // MEDIUM: HOT LEAD SPEED TRACK
  // ========================================
  {
    id: 'hot-speed-track',
    name: '🔥 Hot Lead Speed Track',
    description: 'Same-day close for urgent buyers. Immediate contact → Meet today → Close today.',
    icon: '🔥',
    complexity: 'medium',
    category: 'hot-leads',
    tags: ['hot', 'urgent', 'same-day', 'fast'],
    stages: [
      stage('lost', '❌ Lost', 'dead', 40, 300, '❌', 'red', { w: 200, h: 180 }),
      
      stage('hot', '🔥 HOT LEAD', 'new', 300, 300, '🔥', 'orange', { w: 300, h: 300 }),
      stage('call-now', '📞 CALL NOW', 'working', 660, 200, '📞', 'yellow', { w: 280, h: 240, followUp: 'phone' }),
      stage('sms-now', '💬 SMS NOW', 'working', 660, 460, '💬', 'green', { w: 280, h: 240, followUp: 'text' }),
      
      stage('meet-today', '🚀 Meet TODAY', 'working', 1000, 300, '🚀', 'cyan', { w: 280, h: 260, meeting: 'test-drive' }),
      stage('close-today', '🎯 Close TODAY', 'approval', 1340, 300, '🎯', 'green', { w: 280, h: 260, email: 'email-closing-2' }),
      stage('won', '🏆 WON!', 'approval', 1680, 300, '🏆', 'green', { w: 240, h: 220 }),
    ],
    connections: [
      conn('hot', 'call-now', 'ASAP'), conn('hot', 'sms-now', 'ASAP'),
      conn('call-now', 'meet-today', 'Today'), conn('sms-now', 'meet-today', 'Today'),
      conn('call-now', 'lost', '', true), conn('sms-now', 'lost', '', true),
      conn('meet-today', 'close-today', 'Now'), conn('close-today', 'won'),
    ],
    labels: [
      lbl('l1', '🔥 SAME DAY CLOSE', 800, 100, 24, '#f97316'),
      lbl('l2', 'Response time = Everything', 800, 140, 14, '#64748b'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // SIMPLE: BASIC 4-STAGE
  // ========================================
  {
    id: 'simple-4-stage',
    name: '📊 Simple 4-Stage',
    description: 'Basic pipeline: New → Contact → Qualify → Close. Perfect for beginners.',
    icon: '📊',
    complexity: 'simple',
    category: 'basic',
    tags: ['simple', 'beginner', 'basic'],
    stages: [
      stage('new', '📥 NEW', 'new', 80, 300, '📥', 'blue', { w: 300, h: 320, email: 'email-welcome-1' }),
      stage('contacted', '📞 Contacted', 'working', 440, 300, '📞', 'cyan', { w: 280, h: 280, followUp: 'phone' }),
      stage('qualified', '✅ Qualified', 'working', 780, 300, '✅', 'yellow', { w: 280, h: 280 }),
      stage('closed', '🏆 Closed', 'approval', 1120, 300, '🏆', 'green', { w: 280, h: 280 }),
    ],
    connections: [
      conn('new', 'contacted'), conn('contacted', 'qualified'), conn('qualified', 'closed'),
    ],
    labels: [],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // SIMPLE: WITH DEAD SORTING
  // ========================================
  {
    id: 'simple-with-dead',
    name: '💀 Simple + Dead Sorting',
    description: 'Basic pipeline with dead lead tracking on the left.',
    icon: '💀',
    complexity: 'simple',
    category: 'basic',
    tags: ['simple', 'dead-leads'],
    stages: [
      stage('dead', '💀 Dead Leads', 'dead', 40, 300, '💀', 'red', { w: 240, h: 260 }),
      
      stage('new', '📥 NEW', 'new', 340, 300, '📥', 'blue', { w: 280, h: 300, email: 'email-welcome-1' }),
      stage('working', '⚙️ Working', 'working', 680, 300, '⚙️', 'yellow', { w: 280, h: 280 }),
      stage('done', '✅ Done', 'approval', 1020, 300, '✅', 'green', { w: 280, h: 280 }),
    ],
    connections: [
      conn('new', 'working'), conn('working', 'done'),
      conn('new', 'dead', '', true), conn('working', 'dead', '', true),
    ],
    labels: [],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // SIMPLE: VIP CONCIERGE
  // ========================================
  {
    id: 'vip-concierge',
    name: '👑 VIP Concierge',
    description: 'White-glove treatment for high-value leads. Personal touch at every step.',
    icon: '👑',
    complexity: 'medium',
    category: 'vip',
    tags: ['vip', 'luxury', 'high-touch'],
    stages: [
      stage('vip-in', '👑 VIP Inquiry', 'new', 40, 300, '👑', 'yellow', { w: 280, h: 280, email: 'email-welcome-2' }),
      stage('vip-call', '📞 Personal Call', 'working', 380, 180, '📞', 'purple', { w: 260, h: 220, followUp: 'phone' }),
      stage('vip-video', '📹 Video Consult', 'working', 380, 420, '📹', 'indigo', { w: 260, h: 220, meeting: 'online-video' }),
      stage('vip-visit', '🏢 Private Showing', 'working', 700, 300, '🏢', 'blue', { w: 260, h: 240, meeting: 'in-person-office' }),
      stage('vip-drive', '🚗 VIP Test Drive', 'working', 1020, 300, '🚗', 'cyan', { w: 260, h: 240, meeting: 'test-drive' }),
      stage('vip-close', '🏆 VIP Closing', 'approval', 1340, 300, '🏆', 'green', { w: 280, h: 260, email: 'email-closing-2' }),
    ],
    connections: [
      conn('vip-in', 'vip-call'), conn('vip-in', 'vip-video', '', true),
      conn('vip-call', 'vip-visit'), conn('vip-video', 'vip-visit'),
      conn('vip-visit', 'vip-drive'), conn('vip-drive', 'vip-close'),
    ],
    labels: [
      lbl('l1', '👑 VIP CONCIERGE SERVICE', 700, 100, 22, '#eab308'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },

  // ========================================
  // ADVANCED: COLD LEAD NURTURING
  // ========================================
  {
    id: 'cold-nurturing',
    name: '❄️ Cold Lead Nurturing',
    description: 'Long-term email drip campaign for cold leads over 8+ weeks.',
    icon: '❄️',
    complexity: 'advanced',
    category: 'nurturing',
    tags: ['cold', 'drip', 'nurturing', 'long-term'],
    stages: [
      stage('cold', '❄️ Cold Pool', 'new', 40, 300, '❄️', 'cyan', { w: 260, h: 280 }),
      
      stage('drip1', '💧 Week 1', 'working', 360, 150, '💧', 'blue', { w: 220, h: 180, email: 'email-followup-24h', followUp: 'email' }),
      stage('drip2', '💧 Week 2', 'working', 360, 350, '💧', 'blue', { w: 220, h: 180, email: 'email-followup-48h', followUp: 'email' }),
      stage('drip3', '💧 Week 3', 'working', 360, 550, '💧', 'blue', { w: 220, h: 180, email: 'email-followup-1week', followUp: 'email' }),
      
      stage('drip4', '💧 Week 4', 'working', 620, 150, '💧', 'teal', { w: 220, h: 180, email: 'email-gentle-1', followUp: 'email' }),
      stage('drip5', '💧 Week 5', 'circle-back', 620, 350, '💧', 'teal', { w: 220, h: 180, email: 'email-gentle-2', followUp: 'email' }),
      stage('drip6', '💧 Week 6', 'circle-back', 620, 550, '💧', 'teal', { w: 220, h: 180, email: 'email-reengage-1', followUp: 'email' }),
      
      stage('drip7', '💧 Week 7', 'circle-back', 880, 250, '💧', 'yellow', { w: 220, h: 180, email: 'email-reengage-2', followUp: 'email' }),
      stage('drip8', '💧 Week 8', 'circle-back', 880, 450, '💧', 'orange', { w: 220, h: 180, email: 'email-reengage-3', followUp: 'phone' }),
      
      stage('warming', '☀️ Warming Up', 'working', 1140, 200, '☀️', 'orange', { w: 240, h: 200 }),
      stage('convert', '🎯 CONVERTED', 'approval', 1140, 420, '🎯', 'green', { w: 240, h: 200 }),
      
      stage('dormant', '💤 Dormant', 'dead', 1400, 300, '💤', 'slate', { w: 220, h: 180, dead: 'not-ready' }),
    ],
    connections: [
      conn('cold', 'drip1'), conn('cold', 'drip2', '', true), conn('cold', 'drip3', '', true),
      conn('drip1', 'drip4'), conn('drip2', 'drip5'), conn('drip3', 'drip6'),
      conn('drip4', 'drip7'), conn('drip5', 'drip7'), conn('drip6', 'drip8'),
      conn('drip7', 'drip8'), conn('drip8', 'warming', 'Engaged'),
      conn('warming', 'convert'), conn('warming', 'dormant', '', true),
      conn('drip4', 'warming', 'Opened'), conn('drip5', 'warming', 'Clicked'),
    ],
    labels: [
      lbl('l1', '❄️ COLD LEAD NURTURING', 700, 60, 22, '#06b6d4'),
      lbl('l2', '8-Week Automated Drip Campaign', 700, 95, 14, '#64748b'),
    ],
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  },
];

export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📁' },
  { id: 'complete', label: 'Complete', icon: '🚀' },
  { id: 'followup', label: 'Follow-Up', icon: '📞' },
  { id: 'dead-leads', label: 'Dead Leads', icon: '💀' },
  { id: 'new-leads', label: 'New Leads', icon: '📥' },
  { id: 'post-sale', label: 'Post-Sale', icon: '🎉' },
  { id: 'meetings', label: 'Meetings', icon: '📅' },
  { id: 'hot-leads', label: 'Hot Leads', icon: '🔥' },
  { id: 'basic', label: 'Basic', icon: '📊' },
  { id: 'vip', label: 'VIP', icon: '👑' },
  { id: 'nurturing', label: 'Nurturing', icon: '🌱' },
];

// Complexity filter helper
export const getPresetsByComplexity = (complexity: string) => {
  if (complexity === 'all') return ALL_PRESETS;
  return ALL_PRESETS.filter(p => p.complexity === complexity);
};

// Category filter helper
export const getPresetsByCategory = (category: string) => {
  if (category === 'all') return ALL_PRESETS;
  return ALL_PRESETS.filter(p => p.category === category);
};
