// Enterprise Pipeline Presets - Professional CRM System
import { PipelineStage, MessageNode, NodeConnection, TextLabel, Preset, StageColor, TimerDelay } from './types';

// ============ HELPERS ============
const stage = (
  id: string, 
  label: string, 
  statusId: 'new' | 'working' | 'circle-back' | 'approval' | 'dead',
  x: number, 
  y: number, 
  icon: string, 
  color: StageColor, 
  opts: { 
    w?: number; 
    h?: number; 
    dead?: string;
    desc?: string;
    reminder?: TimerDelay;
    escalate?: TimerDelay;
  } = {}
): PipelineStage => ({
  id, 
  label, 
  description: opts.desc,
  statusId, 
  deadReason: opts.dead,
  x, 
  y, 
  width: opts.w || 340, 
  height: opts.h || 300, 
  color, 
  icon,
  autoActions: [],
  reminderAfter: opts.reminder,
  escalateAfter: opts.escalate,
});

const msg = (
  id: string,
  type: 'email' | 'sms' | 'call' | 'notification' | 'wait',
  label: string,
  icon: string,
  x: number,
  y: number,
  color: StageColor,
  message: string,
  opts: {
    w?: number;
    h?: number;
    subject?: string;
    auto?: boolean;
    delay?: TimerDelay;
    trigger?: 'on-enter' | 'on-exit' | 'manual';
    linked?: string[];
  } = {}
): MessageNode => ({
  id,
  type,
  label,
  icon,
  x,
  y,
  width: opts.w || 280,
  height: opts.h || 200,
  color,
  subject: opts.subject,
  message,
  autoTrigger: opts.auto ?? false,
  triggerDelay: opts.delay,
  triggerCondition: opts.trigger || 'manual',
  linkedStageIds: opts.linked || [],
});

const conn = (
  from: string, 
  to: string, 
  fromType: 'stage' | 'message' = 'stage',
  toType: 'stage' | 'message' = 'stage',
  opts: {
    label?: string;
    dashed?: boolean;
    auto?: boolean;
    delay?: TimerDelay;
    condition?: 'always' | 'if-opened' | 'no-response';
  } = {}
): NodeConnection => ({
  id: `${from}-${to}`,
  fromNodeId: from,
  toNodeId: to,
  fromType,
  toType,
  fromAnchor: 'right',
  toAnchor: 'left',
  autoTrigger: opts.auto ?? false,
  triggerDelay: opts.delay,
  triggerCondition: opts.condition ? { type: opts.condition } : undefined,
  label: opts.label,
  style: opts.dashed ? 'dashed' : 'solid',
  color: opts.dashed ? '#64748b' : '#3b82f6',
});

const lbl = (id: string, text: string, x: number, y: number, size = 24, color = '#ffffff', bg?: string): TextLabel => ({
  id, text, x, y, fontSize: size, color, bgColor: bg
});

const delay = (value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months'): TimerDelay => ({
  value, unit, label: `${value} ${unit}`
});

// ============ ENTERPRISE PRESETS ============
export const ALL_PRESETS: Preset[] = [
  // ========================================
  // ENTERPRISE: COMPLETE AUTOMOTIVE SALES FUNNEL
  // ========================================
  {
    id: 'enterprise-automotive',
    name: 'Complete Automotive Sales Funnel',
    description: 'Full 45-stage enterprise funnel with dead lead management, automated follow-ups, meeting scheduling, and post-sale nurturing. Everything you need for automotive sales.',
    icon: '🚗',
    complexity: 'enterprise',
    category: 'automotive',
    estimatedSetupTime: '2-3 hours',
    features: [
      '45 pipeline stages',
      '18 automated message templates',
      'Dead lead resurrection system',
      'Multi-touch follow-up sequences',
      'Meeting scheduling automation',
      'Post-sale customer journey',
      'Referral program tracking',
    ],
    stages: [
      // ===== DEAD LEADS SECTION (LEFT) =====
      stage('dead-header', '💀 DEAD LEADS', 'dead', 50, 50, '💀', 'slate', { w: 300, h: 80, desc: 'Section header' }),
      stage('dead-not-interested', 'Not Interested', 'dead', 50, 160, '🚫', 'red', { w: 320, h: 280, dead: 'not-interested', desc: 'Lead explicitly declined offer' }),
      stage('dead-no-response', 'No Response', 'dead', 50, 480, '📵', 'orange', { w: 320, h: 280, dead: 'no-contact', desc: 'Could not reach after 5+ attempts' }),
      stage('dead-bad-timing', 'Bad Timing', 'dead', 50, 800, '⏰', 'yellow', { w: 320, h: 280, dead: 'bad-timing', desc: 'Contact again in 3 months', reminder: delay(3, 'months') }),
      stage('dead-competitor', 'Went to Competitor', 'dead', 50, 1120, '🏃', 'slate', { w: 320, h: 280, dead: 'competitor', desc: 'Purchased elsewhere' }),
      stage('dead-budget', 'Budget Issues', 'dead', 50, 1440, '💸', 'pink', { w: 320, h: 280, dead: 'budget', desc: 'Cannot afford now, contact in 6 months', reminder: delay(6, 'months') }),
      stage('dead-credit', 'Credit Issues', 'dead', 50, 1760, '📊', 'amber', { w: 320, h: 280, dead: 'credit', desc: 'Credit not approved, contact in 6 months', reminder: delay(6, 'months') }),
      
      // ===== RESURRECTION SECTION =====
      stage('resurrect-header', '🔄 RESURRECTION', 'circle-back', 50, 2100, '🔄', 'purple', { w: 300, h: 80, desc: 'Section header' }),
      stage('resurrect-timing', 'Bad Timing - Ready?', 'circle-back', 50, 2210, '📅', 'purple', { w: 320, h: 260, desc: 'Auto-contacted from Bad Timing after 3 months' }),
      stage('resurrect-budget', 'Budget - Ready?', 'circle-back', 50, 2510, '💰', 'purple', { w: 320, h: 260, desc: 'Auto-contacted from Budget Issues after 6 months' }),
      stage('resurrect-credit', 'Credit - Ready?', 'circle-back', 50, 2810, '📈', 'purple', { w: 320, h: 260, desc: 'Auto-contacted from Credit Issues after 6 months' }),
      
      // ===== NEW LEADS SECTION =====
      stage('new-header', '📥 NEW LEADS', 'new', 500, 50, '📥', 'blue', { w: 300, h: 80, desc: 'Section header' }),
      stage('new-incoming', 'Incoming Lead', 'new', 500, 160, '🆕', 'blue', { w: 360, h: 340, desc: 'All new leads start here', escalate: delay(1, 'hours') }),
      stage('new-qualified', 'Initial Qualification', 'new', 500, 540, '✅', 'blue', { w: 360, h: 300, desc: 'Basic info verified' }),
      
      // ===== FIRST CONTACT SECTION =====
      stage('contact-header', '📞 FIRST CONTACT', 'working', 950, 50, '📞', 'cyan', { w: 300, h: 80, desc: 'Section header' }),
      stage('contact-attempt1', 'Contact Attempt 1', 'working', 950, 160, '📞', 'cyan', { w: 340, h: 280, desc: 'First call attempt', escalate: delay(4, 'hours') }),
      stage('contact-attempt2', 'Contact Attempt 2', 'working', 950, 480, '📞', 'cyan', { w: 340, h: 280, desc: 'Second call attempt', escalate: delay(24, 'hours') }),
      stage('contact-attempt3', 'Contact Attempt 3', 'working', 950, 800, '📞', 'yellow', { w: 340, h: 280, desc: 'Third call attempt', escalate: delay(48, 'hours') }),
      stage('contact-attempt4', 'Contact Attempt 4', 'working', 950, 1120, '📞', 'orange', { w: 340, h: 280, desc: 'Fourth call attempt', escalate: delay(72, 'hours') }),
      stage('contact-attempt5', 'Final Attempt', 'working', 950, 1440, '📞', 'red', { w: 340, h: 280, desc: 'Last attempt before dead' }),
      
      // ===== FOLLOW UP SECTION =====
      stage('followup-header', '🔄 FOLLOW UP', 'circle-back', 1400, 50, '🔄', 'yellow', { w: 300, h: 80, desc: 'Section header' }),
      stage('followup-day1', 'Follow Up - Day 1', 'circle-back', 1400, 160, '📧', 'yellow', { w: 340, h: 260, desc: 'First follow-up email' }),
      stage('followup-day3', 'Follow Up - Day 3', 'circle-back', 1400, 460, '📧', 'yellow', { w: 340, h: 260, desc: 'Second follow-up email' }),
      stage('followup-week1', 'Follow Up - Week 1', 'circle-back', 1400, 760, '📧', 'orange', { w: 340, h: 260, desc: 'Third follow-up' }),
      stage('followup-week2', 'Follow Up - Week 2', 'circle-back', 1400, 1060, '📧', 'orange', { w: 340, h: 260, desc: 'Fourth follow-up' }),
      stage('followup-month1', 'Follow Up - Month 1', 'circle-back', 1400, 1360, '📧', 'red', { w: 340, h: 260, desc: 'Final follow-up before nurture' }),
      
      // ===== ENGAGED SECTION =====
      stage('engaged-header', '🔥 ENGAGED', 'working', 1850, 50, '🔥', 'orange', { w: 300, h: 80, desc: 'Section header' }),
      stage('engaged-hot', 'Hot Lead', 'working', 1850, 160, '🔥', 'orange', { w: 360, h: 300, desc: 'Actively interested, ready to move forward' }),
      stage('engaged-warm', 'Warm Lead', 'working', 1850, 500, '☀️', 'yellow', { w: 360, h: 300, desc: 'Interested but needs more info' }),
      stage('engaged-cool', 'Cool Lead', 'working', 1850, 840, '❄️', 'cyan', { w: 360, h: 300, desc: 'Some interest, needs nurturing' }),
      
      // ===== QUALIFICATION SECTION =====
      stage('qualify-header', '✅ QUALIFICATION', 'working', 2300, 50, '✅', 'green', { w: 300, h: 80, desc: 'Section header' }),
      stage('qualify-needs', 'Needs Assessment', 'working', 2300, 160, '🎯', 'green', { w: 340, h: 280, desc: 'Understanding customer requirements' }),
      stage('qualify-budget', 'Budget Confirmed', 'working', 2300, 480, '💰', 'green', { w: 340, h: 280, desc: 'Budget verified and approved' }),
      stage('qualify-timeline', 'Timeline Confirmed', 'working', 2300, 800, '📅', 'green', { w: 340, h: 280, desc: 'Purchase timeline established' }),
      stage('qualify-ready', 'Fully Qualified', 'working', 2300, 1120, '🏆', 'emerald', { w: 340, h: 280, desc: 'Ready for meeting/presentation' }),
      
      // ===== MEETING SECTION =====
      stage('meeting-header', '📅 MEETINGS', 'working', 2750, 50, '📅', 'purple', { w: 300, h: 80, desc: 'Section header' }),
      stage('meeting-video', 'Video Call Scheduled', 'working', 2750, 160, '📹', 'purple', { w: 340, h: 280, desc: 'Virtual meeting scheduled' }),
      stage('meeting-phone', 'Phone Call Scheduled', 'working', 2750, 480, '📱', 'purple', { w: 340, h: 280, desc: 'Phone appointment scheduled' }),
      stage('meeting-office', 'Office Visit Scheduled', 'working', 2750, 800, '🏢', 'purple', { w: 340, h: 280, desc: 'In-person office visit' }),
      stage('meeting-testdrive', 'Test Drive Scheduled', 'working', 2750, 1120, '🚗', 'purple', { w: 340, h: 280, desc: 'Test drive appointment' }),
      
      // ===== CLOSING SECTION =====
      stage('closing-header', '🎯 CLOSING', 'approval', 3200, 50, '🎯', 'emerald', { w: 300, h: 80, desc: 'Section header' }),
      stage('closing-proposal', 'Proposal Sent', 'approval', 3200, 160, '📋', 'emerald', { w: 360, h: 300, desc: 'Formal proposal/quote sent' }),
      stage('closing-negotiation', 'In Negotiation', 'approval', 3200, 500, '💬', 'yellow', { w: 360, h: 300, desc: 'Discussing terms and pricing' }),
      stage('closing-financing', 'Financing Review', 'approval', 3200, 840, '🏦', 'cyan', { w: 360, h: 300, desc: 'Financing application in progress' }),
      stage('closing-approved', 'Financing Approved', 'approval', 3200, 1180, '✅', 'emerald', { w: 360, h: 300, desc: 'Financing approved, ready to close' }),
      
      // ===== WON SECTION =====
      stage('won-header', '🏆 CLOSED WON', 'approval', 3650, 50, '🏆', 'emerald', { w: 300, h: 80, desc: 'Section header' }),
      stage('won-deal', 'Deal Closed', 'approval', 3650, 160, '🎉', 'emerald', { w: 380, h: 340, desc: 'Contract signed, deal complete' }),
      stage('won-delivery', 'Delivery Scheduled', 'approval', 3650, 540, '🚚', 'emerald', { w: 380, h: 300, desc: 'Vehicle delivery scheduled' }),
      stage('won-delivered', 'Delivered', 'approval', 3650, 880, '✅', 'emerald', { w: 380, h: 300, desc: 'Vehicle delivered to customer' }),
      
      // ===== POST-SALE SECTION =====
      stage('postsale-header', '🤝 POST-SALE', 'approval', 4100, 50, '🤝', 'blue', { w: 300, h: 80, desc: 'Section header' }),
      stage('postsale-week1', 'Week 1 Check-in', 'approval', 4100, 160, '👋', 'blue', { w: 340, h: 260, desc: 'First week satisfaction check' }),
      stage('postsale-month1', 'Month 1 Check-in', 'approval', 4100, 460, '📞', 'blue', { w: 340, h: 260, desc: 'One month follow-up' }),
      stage('postsale-month3', 'Month 3 Check-in', 'approval', 4100, 760, '📧', 'cyan', { w: 340, h: 260, desc: 'Three month satisfaction' }),
      stage('postsale-month6', 'Month 6 Check-in', 'approval', 4100, 1060, '📧', 'purple', { w: 340, h: 260, desc: 'Six month check-in' }),
      stage('postsale-year1', '1 Year Anniversary', 'approval', 4100, 1360, '🎂', 'purple', { w: 340, h: 260, desc: 'One year anniversary' }),
      
      // ===== REFERRAL SECTION =====
      stage('referral-header', '🌟 REFERRALS', 'approval', 4550, 50, '🌟', 'yellow', { w: 300, h: 80, desc: 'Section header' }),
      stage('referral-ask', 'Ask for Referral', 'approval', 4550, 160, '🤝', 'yellow', { w: 340, h: 280, desc: 'Request referrals from happy customer' }),
      stage('referral-received', 'Referral Received', 'approval', 4550, 480, '🎁', 'emerald', { w: 340, h: 280, desc: 'New referral lead received' }),
      stage('referral-converted', 'Referral Converted', 'approval', 4550, 800, '🏆', 'emerald', { w: 340, h: 280, desc: 'Referral lead converted to sale' }),
    ],
    messageNodes: [
      // Welcome Messages
      msg('msg-welcome', 'email', 'Welcome Email', '✉️', 500, 920, 'blue', 
        `Hi {{name}},

Thank you for your interest in finding your perfect vehicle! I'm excited to help you.

I've received your information and will be reaching out shortly to discuss your needs. In the meantime, feel free to reply to this email with any questions.

Best regards,
{{agent_name}}
My Next Ride Ontario`,
        { subject: 'Welcome to My Next Ride Ontario!', auto: true, trigger: 'on-enter', linked: ['new-incoming'] }
      ),
      
      // Follow Up Messages
      msg('msg-followup-1', 'email', 'Follow Up #1', '📧', 1400, 1660, 'yellow',
        `Hi {{name}},

I wanted to follow up on your vehicle inquiry. Have you had a chance to think about what you're looking for?

I have some great options that might be perfect for you. Would you like to schedule a quick call to discuss?

Best,
{{agent_name}}`,
        { subject: 'Quick Follow Up - Your Vehicle Search', auto: true, delay: delay(24, 'hours'), linked: ['followup-day1'] }
      ),
      
      msg('msg-followup-2', 'sms', 'SMS Follow Up', '💬', 1400, 1920, 'cyan',
        `Hi {{name}}, just checking in on your vehicle search. Any questions I can help with? - {{agent_name}}, My Next Ride`,
        { auto: true, delay: delay(3, 'days'), linked: ['followup-day3'] }
      ),
      
      msg('msg-followup-3', 'email', 'Final Follow Up', '📧', 1400, 2180, 'orange',
        `Hi {{name}},

I haven't heard back from you, so I wanted to reach out one more time. If you're still looking for a vehicle, I'm here to help.

If not, no worries at all - just let me know and I'll close out your file.

Best,
{{agent_name}}`,
        { subject: 'Still Looking for a Vehicle?', auto: true, delay: delay(1, 'weeks'), linked: ['followup-week1'] }
      ),
      
      // Meeting Reminders
      msg('msg-meeting-reminder', 'sms', 'Meeting Reminder', '📅', 2750, 1440, 'purple',
        `Hi {{name}}, just a reminder about our meeting tomorrow at {{time}}. Looking forward to seeing you! - {{agent_name}}`,
        { auto: true, delay: delay(24, 'hours'), linked: ['meeting-video', 'meeting-phone', 'meeting-office', 'meeting-testdrive'] }
      ),
      
      // Closing Messages
      msg('msg-proposal', 'email', 'Proposal Email', '📋', 3200, 1520, 'emerald',
        `Hi {{name}},

As discussed, please find attached your personalized vehicle proposal.

Highlights:
- Vehicle: {{vehicle}}
- Price: {{price}}
- Monthly Payment: {{monthly}}

Please review and let me know if you have any questions. I'm available to discuss anytime.

Best regards,
{{agent_name}}`,
        { subject: 'Your Vehicle Proposal - {{vehicle}}', linked: ['closing-proposal'] }
      ),
      
      // Post-Sale Messages
      msg('msg-thankyou', 'email', 'Thank You Email', '🙏', 3650, 1220, 'emerald',
        `Dear {{name}},

Congratulations on your new {{vehicle}}! 🎉

Thank you for choosing My Next Ride Ontario. We're thrilled to have helped you find your perfect vehicle.

If you have any questions about your new vehicle, please don't hesitate to reach out.

Enjoy the ride!

Best regards,
{{agent_name}}`,
        { subject: 'Congratulations on Your New Vehicle!', auto: true, trigger: 'on-enter', linked: ['won-deal'] }
      ),
      
      msg('msg-checkin-week1', 'email', 'Week 1 Check-in', '👋', 4100, 1660, 'blue',
        `Hi {{name}},

How's the first week been with your new {{vehicle}}? I hope you're loving it!

If you have any questions about features or need any assistance, I'm always here to help.

Enjoy!
{{agent_name}}`,
        { subject: 'How\'s Your First Week?', auto: true, delay: delay(1, 'weeks'), linked: ['postsale-week1'] }
      ),
      
      // Resurrection Messages
      msg('msg-resurrect-timing', 'email', 'Bad Timing Check-in', '📅', 50, 3110, 'purple',
        `Hi {{name}},

It's been a few months since we last spoke about your vehicle search. I wanted to check in and see if the timing might be better now?

If you're still interested, I'd love to help. Lot has changed in the market and there might be some great options for you.

Best,
{{agent_name}}`,
        { subject: 'Is Now a Better Time?', auto: true, delay: delay(3, 'months'), linked: ['resurrect-timing'] }
      ),
      
      msg('msg-resurrect-budget', 'email', 'Budget Check-in', '💰', 50, 3370, 'purple',
        `Hi {{name}},

I hope things have been going well! I wanted to reach out because we have some new financing options and inventory that might work better with your budget.

Would you be interested in taking another look?

Best,
{{agent_name}}`,
        { subject: 'New Options Available', auto: true, delay: delay(6, 'months'), linked: ['resurrect-budget'] }
      ),
      
      // Referral Messages
      msg('msg-referral-ask', 'email', 'Referral Request', '🌟', 4550, 1120, 'yellow',
        `Hi {{name}},

I hope you're still enjoying your {{vehicle}}! It's been great working with you.

If you know anyone else who's looking for a vehicle, I'd love to help them too. As a thank you, we offer a $100 referral bonus for any successful referral.

Just have them mention your name when they contact me!

Thanks,
{{agent_name}}`,
        { subject: 'Know Anyone Looking for a Vehicle?', auto: true, delay: delay(1, 'months'), linked: ['referral-ask'] }
      ),
    ],
    connections: [
      // New leads flow
      conn('new-incoming', 'new-qualified'),
      conn('new-qualified', 'contact-attempt1'),
      
      // Contact attempts
      conn('contact-attempt1', 'contact-attempt2', 'stage', 'stage', { auto: true, delay: delay(4, 'hours'), condition: 'no-response' }),
      conn('contact-attempt2', 'contact-attempt3', 'stage', 'stage', { auto: true, delay: delay(24, 'hours'), condition: 'no-response' }),
      conn('contact-attempt3', 'contact-attempt4', 'stage', 'stage', { auto: true, delay: delay(48, 'hours'), condition: 'no-response' }),
      conn('contact-attempt4', 'contact-attempt5', 'stage', 'stage', { auto: true, delay: delay(72, 'hours'), condition: 'no-response' }),
      conn('contact-attempt5', 'dead-no-response', 'stage', 'stage', { dashed: true, label: 'No Response' }),
      
      // Contact to engaged
      conn('contact-attempt1', 'engaged-hot'),
      conn('contact-attempt2', 'engaged-warm'),
      conn('contact-attempt3', 'engaged-cool'),
      
      // Engaged to qualification
      conn('engaged-hot', 'qualify-needs'),
      conn('engaged-warm', 'qualify-needs'),
      conn('engaged-cool', 'followup-day1'),
      
      // Follow up sequence
      conn('followup-day1', 'followup-day3', 'stage', 'stage', { auto: true, delay: delay(2, 'days'), condition: 'no-response' }),
      conn('followup-day3', 'followup-week1', 'stage', 'stage', { auto: true, delay: delay(4, 'days'), condition: 'no-response' }),
      conn('followup-week1', 'followup-week2', 'stage', 'stage', { auto: true, delay: delay(1, 'weeks'), condition: 'no-response' }),
      conn('followup-week2', 'followup-month1', 'stage', 'stage', { auto: true, delay: delay(2, 'weeks'), condition: 'no-response' }),
      conn('followup-month1', 'dead-no-response', 'stage', 'stage', { dashed: true, label: 'No Response' }),
      
      // Follow up to engaged
      conn('followup-day1', 'engaged-warm'),
      conn('followup-day3', 'engaged-warm'),
      conn('followup-week1', 'engaged-cool'),
      
      // Qualification flow
      conn('qualify-needs', 'qualify-budget'),
      conn('qualify-budget', 'qualify-timeline'),
      conn('qualify-timeline', 'qualify-ready'),
      conn('qualify-needs', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
      conn('qualify-budget', 'dead-budget', 'stage', 'stage', { dashed: true }),
      
      // Meeting flow
      conn('qualify-ready', 'meeting-video'),
      conn('qualify-ready', 'meeting-phone'),
      conn('qualify-ready', 'meeting-office'),
      conn('qualify-ready', 'meeting-testdrive'),
      
      // Meeting to closing
      conn('meeting-video', 'closing-proposal'),
      conn('meeting-phone', 'closing-proposal'),
      conn('meeting-office', 'closing-proposal'),
      conn('meeting-testdrive', 'closing-proposal'),
      
      // Closing flow
      conn('closing-proposal', 'closing-negotiation'),
      conn('closing-negotiation', 'closing-financing'),
      conn('closing-financing', 'closing-approved'),
      conn('closing-approved', 'won-deal'),
      conn('closing-negotiation', 'dead-competitor', 'stage', 'stage', { dashed: true }),
      conn('closing-financing', 'dead-credit', 'stage', 'stage', { dashed: true }),
      
      // Won flow
      conn('won-deal', 'won-delivery'),
      conn('won-delivery', 'won-delivered'),
      conn('won-delivered', 'postsale-week1'),
      
      // Post-sale flow
      conn('postsale-week1', 'postsale-month1', 'stage', 'stage', { auto: true, delay: delay(3, 'weeks') }),
      conn('postsale-month1', 'postsale-month3', 'stage', 'stage', { auto: true, delay: delay(2, 'months') }),
      conn('postsale-month3', 'postsale-month6', 'stage', 'stage', { auto: true, delay: delay(3, 'months') }),
      conn('postsale-month6', 'postsale-year1', 'stage', 'stage', { auto: true, delay: delay(6, 'months') }),
      conn('postsale-month3', 'referral-ask'),
      conn('postsale-year1', 'referral-ask'),
      
      // Referral flow
      conn('referral-ask', 'referral-received'),
      conn('referral-received', 'new-incoming'),
      conn('referral-received', 'referral-converted'),
      
      // Resurrection flow
      conn('dead-bad-timing', 'resurrect-timing', 'stage', 'stage', { auto: true, delay: delay(3, 'months') }),
      conn('dead-budget', 'resurrect-budget', 'stage', 'stage', { auto: true, delay: delay(6, 'months') }),
      conn('dead-credit', 'resurrect-credit', 'stage', 'stage', { auto: true, delay: delay(6, 'months') }),
      conn('resurrect-timing', 'engaged-warm'),
      conn('resurrect-budget', 'engaged-warm'),
      conn('resurrect-credit', 'engaged-warm'),
      conn('resurrect-timing', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
      conn('resurrect-budget', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
      conn('resurrect-credit', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
      
      // Message node connections
      conn('new-incoming', 'msg-welcome', 'stage', 'message'),
      conn('followup-day1', 'msg-followup-1', 'stage', 'message'),
      conn('followup-day3', 'msg-followup-2', 'stage', 'message'),
      conn('followup-week1', 'msg-followup-3', 'stage', 'message'),
      conn('closing-proposal', 'msg-proposal', 'stage', 'message'),
      conn('won-deal', 'msg-thankyou', 'stage', 'message'),
      conn('postsale-week1', 'msg-checkin-week1', 'stage', 'message'),
      conn('referral-ask', 'msg-referral-ask', 'stage', 'message'),
      conn('resurrect-timing', 'msg-resurrect-timing', 'stage', 'message'),
      conn('resurrect-budget', 'msg-resurrect-budget', 'stage', 'message'),
    ],
    labels: [
      lbl('lbl-dead', '💀 DEAD LEADS', 60, 20, 28, '#ef4444'),
      lbl('lbl-new', '📥 NEW LEADS', 510, 20, 28, '#3b82f6'),
      lbl('lbl-contact', '📞 FIRST CONTACT', 960, 20, 28, '#06b6d4'),
      lbl('lbl-followup', '🔄 FOLLOW UP', 1410, 20, 28, '#eab308'),
      lbl('lbl-engaged', '🔥 ENGAGED', 1860, 20, 28, '#f97316'),
      lbl('lbl-qualify', '✅ QUALIFICATION', 2310, 20, 28, '#22c55e'),
      lbl('lbl-meeting', '📅 MEETINGS', 2760, 20, 28, '#a855f7'),
      lbl('lbl-closing', '🎯 CLOSING', 3210, 20, 28, '#10b981'),
      lbl('lbl-won', '🏆 CLOSED WON', 3660, 20, 28, '#10b981'),
      lbl('lbl-postsale', '🤝 POST-SALE', 4110, 20, 28, '#3b82f6'),
      lbl('lbl-referral', '🌟 REFERRALS', 4560, 20, 28, '#eab308'),
    ],
  },

  // ========================================
  // STANDARD: BASIC SALES FUNNEL
  // ========================================
  {
    id: 'standard-basic',
    name: 'Standard Sales Funnel',
    description: 'A straightforward 15-stage sales funnel perfect for getting started. Includes basic follow-up automation and dead lead tracking.',
    icon: '📊',
    complexity: 'standard',
    category: 'sales',
    estimatedSetupTime: '30 minutes',
    features: [
      '15 pipeline stages',
      '5 automated messages',
      'Basic dead lead tracking',
      'Simple follow-up sequence',
    ],
    stages: [
      // Dead leads
      stage('dead-all', 'Dead Leads', 'dead', 50, 300, '💀', 'red', { w: 320, h: 500 }),
      
      // Main funnel
      stage('new', 'New Leads', 'new', 500, 200, '📥', 'blue', { w: 380, h: 380 }),
      stage('contacted', 'Contacted', 'working', 950, 200, '📞', 'cyan', { w: 360, h: 340 }),
      stage('interested', 'Interested', 'working', 1400, 200, '👍', 'yellow', { w: 360, h: 340 }),
      stage('qualified', 'Qualified', 'working', 1850, 200, '✅', 'green', { w: 360, h: 340 }),
      stage('meeting', 'Meeting Set', 'working', 2300, 200, '📅', 'purple', { w: 360, h: 340 }),
      stage('proposal', 'Proposal Sent', 'approval', 2750, 200, '📋', 'emerald', { w: 360, h: 340 }),
      stage('won', 'Closed Won', 'approval', 3200, 200, '🏆', 'emerald', { w: 380, h: 380 }),
      
      // Follow up track
      stage('followup-1', 'Follow Up 1', 'circle-back', 950, 620, '📧', 'yellow', { w: 340, h: 280 }),
      stage('followup-2', 'Follow Up 2', 'circle-back', 1400, 620, '📧', 'orange', { w: 340, h: 280 }),
      stage('followup-3', 'Follow Up 3', 'circle-back', 1850, 620, '📧', 'red', { w: 340, h: 280 }),
    ],
    messageNodes: [
      msg('msg-welcome', 'email', 'Welcome Email', '✉️', 500, 620, 'blue', 
        'Hi {{name}}, thank you for your interest! We will be in touch shortly.',
        { subject: 'Welcome!', auto: true, linked: ['new'] }
      ),
      msg('msg-fu1', 'email', 'Follow Up 1', '📧', 950, 940, 'yellow',
        'Hi {{name}}, just checking in. Any questions?',
        { subject: 'Following Up', auto: true, delay: delay(24, 'hours'), linked: ['followup-1'] }
      ),
      msg('msg-fu2', 'sms', 'SMS Follow Up', '💬', 1400, 940, 'cyan',
        'Hi {{name}}, still interested? Let me know! - {{agent_name}}',
        { auto: true, delay: delay(48, 'hours'), linked: ['followup-2'] }
      ),
    ],
    connections: [
      conn('new', 'contacted'),
      conn('contacted', 'interested'),
      conn('interested', 'qualified'),
      conn('qualified', 'meeting'),
      conn('meeting', 'proposal'),
      conn('proposal', 'won'),
      
      // To dead
      conn('contacted', 'dead-all', 'stage', 'stage', { dashed: true }),
      conn('interested', 'dead-all', 'stage', 'stage', { dashed: true }),
      conn('qualified', 'dead-all', 'stage', 'stage', { dashed: true }),
      conn('proposal', 'dead-all', 'stage', 'stage', { dashed: true }),
      
      // Follow up
      conn('contacted', 'followup-1'),
      conn('followup-1', 'followup-2', 'stage', 'stage', { auto: true, delay: delay(3, 'days') }),
      conn('followup-2', 'followup-3', 'stage', 'stage', { auto: true, delay: delay(1, 'weeks') }),
      conn('followup-3', 'dead-all', 'stage', 'stage', { dashed: true }),
      conn('followup-1', 'interested'),
      conn('followup-2', 'interested'),
      
      // Messages
      conn('new', 'msg-welcome', 'stage', 'message'),
      conn('followup-1', 'msg-fu1', 'stage', 'message'),
      conn('followup-2', 'msg-fu2', 'stage', 'message'),
    ],
    labels: [
      lbl('lbl-main', 'SALES PIPELINE', 1400, 50, 32, '#3b82f6'),
    ],
  },

  // ========================================
  // STARTER: SIMPLE 4-STAGE
  // ========================================
  {
    id: 'starter-simple',
    name: 'Simple 4-Stage Pipeline',
    description: 'The simplest pipeline to get started. Just 4 stages: New, Working, Closing, Won. Perfect for beginners.',
    icon: '🎯',
    complexity: 'starter',
    category: 'basic',
    estimatedSetupTime: '5 minutes',
    features: [
      '4 pipeline stages',
      'No automation',
      'Quick setup',
    ],
    stages: [
      stage('new', 'New Leads', 'new', 200, 300, '📥', 'blue', { w: 400, h: 400 }),
      stage('working', 'Working', 'working', 700, 300, '⚙️', 'yellow', { w: 400, h: 400 }),
      stage('closing', 'Closing', 'approval', 1200, 300, '🎯', 'emerald', { w: 400, h: 400 }),
      stage('won', 'Won', 'approval', 1700, 300, '🏆', 'emerald', { w: 400, h: 400 }),
    ],
    messageNodes: [],
    connections: [
      conn('new', 'working'),
      conn('working', 'closing'),
      conn('closing', 'won'),
    ],
    labels: [
      lbl('lbl-title', 'SIMPLE PIPELINE', 850, 100, 36, '#ffffff'),
    ],
  },
];

export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All Presets', icon: '📁' },
  { id: 'automotive', label: 'Automotive', icon: '🚗' },
  { id: 'sales', label: 'Sales', icon: '📊' },
  { id: 'basic', label: 'Basic', icon: '🎯' },
];
