// WinWin Pipeline Presets - Professional Lead Management System
// Goal: 20-50% productivity boost through smart automation + easy lead management
import { PipelineStage, MessageNode, NodeConnection, TextLabel, Preset, StageColor, TimerDelay, InlineAction } from './types';

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
    inlineActions?: InlineAction[];
    row?: number;
    col?: number;
  } = {}
): PipelineStage => ({
  id, 
  label, 
  description: opts.desc,
  statusId, 
  deadReason: opts.dead,
  x, 
  y, 
  width: opts.w || 420, 
  height: opts.h || 380, 
  color, 
  icon,
  autoActions: [],
  inlineActions: opts.inlineActions || [],
  reminderAfter: opts.reminder,
  escalateAfter: opts.escalate,
  row: opts.row,
  col: opts.col,
});

const msg = (
  id: string,
  type: 'email' | 'sms' | 'call' | 'notification' | 'wait' | 'webhook' | 'ai-response',
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
    inlineActions?: InlineAction[];
  } = {}
): MessageNode => ({
  id,
  type,
  label,
  icon,
  x,
  y,
  width: opts.w || 340,
  height: opts.h || 260,
  color,
  subject: opts.subject,
  message,
  autoTrigger: opts.auto ?? false,
  triggerDelay: opts.delay,
  triggerCondition: opts.trigger || 'manual',
  linkedStageIds: opts.linked || [],
  inlineActions: opts.inlineActions || [],
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
    animated?: boolean;
    thickness?: number;
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
  style: opts.animated ? 'animated' : (opts.dashed ? 'dashed' : 'solid'),
  color: opts.dashed ? '#64748b' : '#3b82f6',
  thickness: opts.thickness,
});

const lbl = (id: string, text: string, x: number, y: number, size = 28, color = '#ffffff', bg?: string, weight = '800'): TextLabel => ({
  id, text, x, y, fontSize: size, color, bgColor: bg, fontWeight: weight
});

const delay = (value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months'): TimerDelay => ({
  value, unit, label: `${value} ${unit}`
});

// ============ INLINE ACTION TEMPLATES ============
const smsAction = (id: string, label: string, content: string, auto = false, delayOpt?: TimerDelay): InlineAction => ({
  id, type: 'sms', label, content, enabled: true, autoSend: auto, delay: delayOpt, triggerOn: auto ? 'enter' : 'manual'
});

const emailAction = (id: string, label: string, subject: string, content: string, auto = false, delayOpt?: TimerDelay): InlineAction => ({
  id, type: 'email', label, content, subject, enabled: true, autoSend: auto, delay: delayOpt, triggerOn: auto ? 'enter' : 'manual'
});

const reminderAction = (id: string, label: string, content: string, delayOpt: TimerDelay): InlineAction => ({
  id, type: 'reminder', label, content, enabled: true, delay: delayOpt, triggerOn: 'timer'
});

const noteAction = (id: string, label: string, content: string): InlineAction => ({
  id, type: 'note', label, content, enabled: true, triggerOn: 'manual'
});

// ============ RUNWAY ENTERPRISE PRESETS ============
export const ALL_PRESETS: Preset[] = [
  // ========================================
  // RUNWAY: ULTIMATE AUTOMOTIVE FUNNEL (30+ nodes)
  // ========================================
  {
    id: 'runway-ultimate',
    name: '⭐ WinWin Ultimate Funnel',
    description: 'The most comprehensive funnel with full automation, dead lead resurrection, and complete customer lifecycle management. For power users who want maximum automation with full control.',
    icon: '🚀',
    complexity: 'runway',
    category: 'automotive',
    estimatedSetupTime: '2-3 hours',
    features: [
      '32 premium pipeline stages',
      '20+ message nodes with automation',
      'Inline SMS & Email on every stage',
      'Dead lead resurrection system',
      'Multi-touch 7-day follow-up sequence',
      'Meeting & test drive automation',
      'Post-sale nurturing journey',
      'Referral program tracking',
      'Real-time analytics',
    ],
    stages: [
      // ===== ROW 1: DEAD LEADS (Left column) =====
      stage('dead-declined', '🚫 Declined', 'dead', 50, 100, '🚫', 'red', { 
        w: 400, h: 360, dead: 'declined', desc: 'Application was declined',
        inlineActions: [
          smsAction('sms-declined', 'Send Sorry SMS', 'Hi {{name}}, unfortunately we couldn\'t get you approved this time. We\'ll reach out in 6 months when your situation may have changed. - My Next Ride'),
          emailAction('email-declined', 'Declined Email', 'Application Update', 'Hi {{name}},\n\nThank you for your interest. Unfortunately, we were unable to secure financing at this time.\n\nWe recommend:\n1. Reviewing your credit report\n2. Reducing existing debt\n3. Building credit over 6 months\n\nWe\'ll check back with you then.\n\nBest,\nMy Next Ride Ontario'),
          reminderAction('remind-declined', 'Contact in 6 months', 'Re-engage declined lead', delay(6, 'months')),
        ]
      }),
      stage('dead-not-interested', '👎 Not Interested', 'dead', 50, 500, '👎', 'red', { 
        w: 400, h: 360, dead: 'not-interested', desc: 'Lead declined offer',
        inlineActions: [
          emailAction('email-notint', 'Future Check Email', 'No Problem!', 'Hi {{name}},\n\nTotally understand! If things change in the future, we\'re always here to help.\n\nBest wishes,\nMy Next Ride Ontario'),
        ]
      }),
      stage('dead-negative-equity', '📉 Negative Equity', 'dead', 50, 900, '📉', 'rose', { 
        w: 400, h: 360, dead: 'negative-equity', desc: 'Upside down on trade',
        inlineActions: [
          noteAction('note-equity', 'Equity Notes', 'Document: Vehicle value, payoff amount, negative equity gap, potential solutions discussed.'),
        ]
      }),
      stage('dead-no-response', '📵 No Response', 'dead', 50, 1300, '📵', 'orange', { 
        w: 400, h: 360, dead: 'no-contact', desc: 'Could not reach after 7+ attempts',
        inlineActions: [
          reminderAction('remind-noresp', 'Try again in 30 days', 'Attempt contact again', delay(1, 'months')),
        ]
      }),
      stage('dead-purchased', '🚗 Already Purchased', 'dead', 50, 1700, '🚗', 'slate', { 
        w: 400, h: 360, dead: 'already-purchased', desc: 'Bought elsewhere',
        inlineActions: [
          emailAction('email-congrats', 'Congrats Email', 'Congrats on Your Purchase!', 'Hi {{name}},\n\nCongrats on your new vehicle! Even though you didn\'t buy from us, if you ever need service recommendations or want to upgrade in the future, we\'re here.\n\nBest,\nMy Next Ride Ontario'),
        ]
      }),
      stage('dead-no-vehicle', '❌ No Vehicle Match', 'dead', 50, 2100, '❌', 'amber', { 
        w: 400, h: 360, dead: 'no-vehicle', desc: 'Couldn\'t find what they want',
        inlineActions: [
          reminderAction('remind-vehicle', 'New inventory check', 'Check if matching vehicle came in', delay(2, 'weeks')),
        ]
      }),
      stage('dead-cannot-afford', '💸 Cannot Afford', 'dead', 50, 2500, '💸', 'pink', { 
        w: 400, h: 360, dead: 'cannot-afford', desc: 'Payment too high',
        inlineActions: [
          emailAction('email-afford', 'Budget Options', 'Let\'s Find Something That Works', 'Hi {{name}},\n\nI understand budget is a concern. Let me look for more affordable options - perhaps a different year or model.\n\nWhat monthly payment would be comfortable for you?\n\nBest,\nMy Next Ride Ontario'),
          reminderAction('remind-afford', 'Check back in 3 months', 'Situation may have changed', delay(3, 'months')),
        ]
      }),
      
      // ===== ROW 2: NEW LEADS & FIRST CONTACT =====
      stage('new-incoming', '📥 Incoming Lead', 'new', 550, 100, '📥', 'blue', { 
        w: 440, h: 420, desc: 'All new leads start here - respond within 5 min',
        escalate: delay(15, 'minutes'),
        inlineActions: [
          smsAction('sms-welcome', 'Welcome SMS', 'Hi {{name}}, thanks for your interest in My Next Ride Ontario! I\'m looking at your application now and will call you shortly. - {{agent}}', true),
          emailAction('email-welcome', 'Welcome Email', 'Welcome to My Next Ride Ontario!', 'Hi {{name}},\n\nThank you for your interest in finding your perfect vehicle! 🚗\n\nI\'ve received your information and I\'m excited to help you. Here\'s what happens next:\n\n1. I\'ll review your application\n2. Search our inventory for the best options\n3. Call you within the hour to discuss\n\nIn the meantime, feel free to reply with any questions!\n\nBest regards,\n{{agent}}\nMy Next Ride Ontario', true),
          noteAction('note-new', 'Lead Notes', 'Source: _____\nVehicle interest: _____\nBudget: _____\nTimeline: _____\nTrade-in: Yes/No'),
        ]
      }),
      stage('new-qualified', '✅ Qualified Lead', 'new', 550, 560, '✅', 'blue', { 
        w: 440, h: 380, desc: 'Basic info verified, ready for contact',
        inlineActions: [
          noteAction('note-qual', 'Qualification Notes', 'Income: _____\nEmployment: _____\nCredit profile: _____\nDown payment: _____'),
        ]
      }),
      
      // ===== ROW 3: CONTACT ATTEMPTS =====
      stage('contact-1', '📞 Call #1', 'working', 1050, 100, '📞', 'cyan', { 
        w: 420, h: 360, desc: 'First call attempt - aim for same day',
        escalate: delay(2, 'hours'),
        inlineActions: [
          smsAction('sms-c1', 'Intro SMS', 'Hi {{name}}, this is {{agent}} from My Next Ride Ontario! I saw your application and would love to help. When\'s a good time to chat?'),
          noteAction('note-c1', 'Call Notes', 'Called at: _____\nResult: Answered / VM / No Answer\nNotes: _____'),
          reminderAction('remind-c1', 'Follow-up reminder', 'Try calling again', delay(2, 'hours')),
        ]
      }),
      stage('contact-2', '📞 Call #2', 'working', 1050, 500, '📞', 'cyan', { 
        w: 420, h: 360, desc: 'Second call - try different time of day',
        escalate: delay(4, 'hours'),
        inlineActions: [
          smsAction('sms-c2', 'Follow-up SMS', 'Hey {{name}}, tried calling earlier. Let me know when you\'re free to chat about your vehicle search! - {{agent}}'),
          noteAction('note-c2', 'Call #2 Notes', 'Called at: _____\nResult: _____\nTried: Morning / Afternoon / Evening'),
        ]
      }),
      stage('contact-3', '📞 Call #3', 'working', 1050, 900, '📞', 'yellow', { 
        w: 420, h: 360, desc: 'Third call attempt',
        escalate: delay(24, 'hours'),
        inlineActions: [
          smsAction('sms-c3', 'Gentle Nudge', '{{name}}, still interested in finding a vehicle? I have some great options! Let me know. - {{agent}}'),
          emailAction('email-c3', 'Quick Check-in', 'Quick Question', 'Hi {{name}},\n\nI\'ve tried reaching you a couple times. Just wanted to make sure you got my messages!\n\nAre you still looking for a {{vehicle}}? I have some options I think you\'ll love.\n\nJust reply to this email or give me a call when you have a moment.\n\nBest,\n{{agent}}'),
        ]
      }),
      stage('contact-4', '📞 Call #4', 'working', 1050, 1300, '📞', 'orange', { 
        w: 420, h: 360, desc: 'Fourth attempt - different approach',
        escalate: delay(48, 'hours'),
        inlineActions: [
          smsAction('sms-c4', 'Different Approach', 'Hi {{name}}, hope all is well! If you\'re still in the market, I\'d love to help. Just text back whenever is convenient. 🚗'),
          emailAction('email-c4', 'New Options', 'Some New Options For You', 'Hi {{name}},\n\nI wanted to let you know we just got some new inventory that might be perfect for you.\n\nWould you like me to send over some details?\n\nBest,\n{{agent}}'),
        ]
      }),
      stage('contact-5', '📞 Call #5', 'working', 1050, 1700, '📞', 'orange', { 
        w: 420, h: 360, desc: 'Fifth attempt',
        inlineActions: [
          smsAction('sms-c5', 'Last Check', 'Hi {{name}}, one more try! 🙏 Let me know if you\'re still interested. If not, no worries! - {{agent}}'),
        ]
      }),
      stage('contact-final', '📞 Final Attempt', 'working', 1050, 2100, '📞', 'red', { 
        w: 420, h: 360, desc: 'Last attempt before moving to no-response',
        inlineActions: [
          emailAction('email-final', 'Final Email', 'Should I Close Your File?', 'Hi {{name}},\n\nI haven\'t been able to reach you, so I wanted to check one last time before closing out your application.\n\nIf you\'re still interested, just reply and I\'ll keep your file active. If not, no problem at all!\n\nBest,\n{{agent}}\nMy Next Ride Ontario'),
          smsAction('sms-final', 'Final SMS', 'Hi {{name}}, last message from me unless I hear back. If you\'re still looking for a vehicle, just text back. Thanks! - {{agent}}'),
        ]
      }),
      
      // ===== ROW 4: ENGAGED LEADS =====
      stage('engaged-hot', '🔥 HOT Lead', 'working', 1550, 100, '🔥', 'orange', { 
        w: 440, h: 400, desc: 'Actively interested, high intent to buy',
        inlineActions: [
          smsAction('sms-hot', 'Hot Lead SMS', '{{name}}, great talking to you! I\'m pulling together the best options now. When can you come see them?'),
          noteAction('note-hot', 'Hot Lead Notes', 'Interest level: 🔥🔥🔥\nBuying timeline: _____\nBudget confirmed: _____\nPre-approved: Yes/No'),
          reminderAction('remind-hot', 'Follow up TODAY', 'Don\'t let this one cool off!', delay(4, 'hours')),
        ]
      }),
      stage('engaged-warm', '☀️ Warm Lead', 'working', 1550, 540, '☀️', 'yellow', { 
        w: 440, h: 380, desc: 'Interested but needs more nurturing',
        inlineActions: [
          emailAction('email-warm', 'Value Email', 'Why My Next Ride?', 'Hi {{name}},\n\nThought you might want to know why customers choose us:\n\n✅ Access to 17+ lenders\n✅ Wide dealer network\n✅ Competitive rates\n✅ No-hassle process\n\nReady to take the next step?\n\nBest,\n{{agent}}'),
          smsAction('sms-warm', 'Warm SMS', 'Hi {{name}}, thinking about you! Any questions about the vehicles we discussed?'),
        ]
      }),
      stage('engaged-cool', '❄️ Cool Lead', 'working', 1550, 960, '❄️', 'cyan', { 
        w: 440, h: 380, desc: 'Some interest, long-term nurture needed',
        inlineActions: [
          emailAction('email-cool', 'Stay in Touch', 'Staying in Touch', 'Hi {{name}},\n\nJust wanted to stay in touch! I\'m here whenever you\'re ready to move forward.\n\nIn the meantime, if you have any questions, don\'t hesitate to reach out.\n\nBest,\n{{agent}}'),
          reminderAction('remind-cool', 'Check in 2 weeks', 'Follow up with cool lead', delay(2, 'weeks')),
        ]
      }),
      
      // ===== ROW 5: QUALIFICATION =====
      stage('qual-needs', '🎯 Needs Assessment', 'working', 2050, 100, '🎯', 'green', { 
        w: 420, h: 360, desc: 'Understanding exactly what they want',
        inlineActions: [
          noteAction('note-needs', 'Needs Checklist', 'Vehicle type: Sedan / SUV / Truck / Van\nBrand preference: _____\nMust-have features: _____\nNice-to-have: _____\nDeal breakers: _____'),
        ]
      }),
      stage('qual-budget', '💰 Budget Confirmed', 'working', 2050, 500, '💰', 'green', { 
        w: 420, h: 360, desc: 'Monthly payment and down payment confirmed',
        inlineActions: [
          noteAction('note-budget', 'Budget Details', 'Target monthly: $______\nMax monthly: $______\nDown payment: $______\nTrade-in: $______ (Payoff: $______)\nFinancing: Pre-approved / Need approval'),
        ]
      }),
      stage('qual-timeline', '📅 Timeline Set', 'working', 2050, 900, '📅', 'green', { 
        w: 420, h: 360, desc: 'Purchase timeline established',
        inlineActions: [
          noteAction('note-timeline', 'Timeline', 'Buying: This week / This month / 2-3 months / Just looking\nReason for timeline: _____\nUrgency: High / Medium / Low'),
          smsAction('sms-timeline', 'Timeline SMS', 'Perfect! Based on your timeline, I\'ll start putting together the best options for you. Stay tuned! 🚗'),
        ]
      }),
      stage('qual-ready', '🏆 Fully Qualified', 'working', 2050, 1300, '🏆', 'emerald', { 
        w: 420, h: 380, desc: 'Ready to schedule meeting/test drive',
        inlineActions: [
          smsAction('sms-ready', 'Ready SMS', '{{name}}, great news! I\'ve found some perfect options for you. When can you come in for a test drive?'),
          emailAction('email-ready', 'Options Ready', 'Your Personalized Options Are Ready!', 'Hi {{name}},\n\nGreat news! Based on everything we discussed, I\'ve put together a selection of vehicles that match your needs perfectly.\n\nI\'d love to walk you through them in person. When works best for you?\n\nAvailable times:\n• [Insert available times]\n\nLooking forward to it!\n\nBest,\n{{agent}}'),
        ]
      }),
      
      // ===== ROW 6: MEETINGS =====
      stage('meet-video', '📹 Video Call Set', 'working', 2550, 100, '📹', 'purple', { 
        w: 420, h: 360, desc: 'Virtual meeting scheduled',
        inlineActions: [
          smsAction('sms-video-remind', 'Video Reminder', 'Hi {{name}}, reminder about our video call tomorrow at {{time}}! Looking forward to it. - {{agent}}', false, delay(24, 'hours')),
          emailAction('email-video', 'Video Call Details', 'Your Video Call is Confirmed!', 'Hi {{name}},\n\nYour video call is confirmed for:\n📅 {{date}}\n🕐 {{time}}\n\nI\'ll be showing you:\n• Available vehicles that match your needs\n• Financing options\n• Special deals\n\nSee you then!\n\nBest,\n{{agent}}'),
        ]
      }),
      stage('meet-phone', '📱 Phone Appt Set', 'working', 2550, 500, '📱', 'purple', { 
        w: 420, h: 360, desc: 'Phone appointment scheduled',
        inlineActions: [
          smsAction('sms-phone-remind', 'Phone Reminder', 'Hi {{name}}, just a reminder I\'ll be calling you tomorrow at {{time}}! - {{agent}}', false, delay(24, 'hours')),
        ]
      }),
      stage('meet-office', '🏢 Office Visit Set', 'working', 2550, 900, '🏢', 'purple', { 
        w: 420, h: 360, desc: 'In-person office visit scheduled',
        inlineActions: [
          emailAction('email-office', 'Office Visit Confirmed', 'Your Visit is Confirmed!', 'Hi {{name}},\n\nLooking forward to seeing you!\n\n📅 {{date}} at {{time}}\n📍 [Address]\n\nPlease bring:\n✅ Driver\'s license\n✅ Proof of income (if financing)\n✅ Trade-in keys (if applicable)\n\nSee you soon!\n\nBest,\n{{agent}}'),
          smsAction('sms-office-remind', 'Visit Reminder', 'Hi {{name}}, see you tomorrow at {{time}}! Let me know if you need directions. - {{agent}}', false, delay(24, 'hours')),
          smsAction('sms-office-1hr', '1 Hour Reminder', '{{name}}, see you in 1 hour! I have everything ready for you. 🚗', false, delay(1, 'hours')),
        ]
      }),
      stage('meet-testdrive', '🚗 Test Drive Set', 'working', 2550, 1300, '🚗', 'violet', { 
        w: 420, h: 380, desc: 'Test drive scheduled',
        inlineActions: [
          smsAction('sms-td-confirm', 'Test Drive Confirmed', '{{name}}, your test drive is confirmed for {{date}} at {{time}}! The {{vehicle}} will be ready and waiting. Can\'t wait! 🚗'),
          emailAction('email-td', 'Test Drive Details', 'Your Test Drive is Ready!', 'Hi {{name}},\n\n🎉 Your test drive is confirmed!\n\n📅 {{date}} at {{time}}\n🚗 Vehicle: {{vehicle}}\n📍 Location: [Address]\n\nI\'ll be there to answer all your questions and help you get a feel for the vehicle.\n\nSee you soon!\n\nBest,\n{{agent}}'),
          smsAction('sms-td-remind', 'Test Drive Reminder', 'Excited for your test drive tomorrow! The {{vehicle}} is cleaned up and ready for you. See you at {{time}}! 🔥', false, delay(24, 'hours')),
        ]
      }),
      
      // ===== ROW 7: CLOSING =====
      stage('close-proposal', '📋 Proposal Sent', 'approval', 3050, 100, '📋', 'emerald', { 
        w: 440, h: 380, desc: 'Formal proposal/quote sent',
        inlineActions: [
          emailAction('email-proposal', 'Send Proposal', 'Your Personalized Vehicle Proposal', 'Hi {{name}},\n\nAs discussed, here\'s your personalized proposal:\n\n🚗 VEHICLE\n{{vehicle}}\n\n💰 PRICING\n• Price: {{price}}\n• Down Payment: {{down}}\n• Monthly: {{monthly}}/mo\n• Term: {{term}} months\n• Rate: {{rate}}%\n\n✅ INCLUDED\n• Full inspection\n• 30-day warranty\n• CARFAX report\n\nReady to move forward? Just reply or give me a call!\n\nBest,\n{{agent}}'),
          smsAction('sms-proposal', 'Proposal SMS', 'Just sent over your proposal! Let me know if you have any questions. Ready when you are! 🚗'),
          reminderAction('remind-proposal', 'Follow up on proposal', 'Check if they\'ve reviewed', delay(24, 'hours')),
        ]
      }),
      stage('close-negotiate', '💬 In Negotiation', 'approval', 3050, 520, '💬', 'yellow', { 
        w: 440, h: 360, desc: 'Discussing terms and pricing',
        inlineActions: [
          noteAction('note-negotiate', 'Negotiation Notes', 'Original offer: $_____\nCountered: $_____\nCurrent: $_____\nSticking points: _____\nAuthority to approve: $______ below'),
        ]
      }),
      stage('close-financing', '🏦 Financing Review', 'approval', 3050, 920, '🏦', 'cyan', { 
        w: 440, h: 360, desc: 'Financing application in progress',
        inlineActions: [
          smsAction('sms-financing', 'Financing Update', 'Good news {{name}}! Your financing application is being processed. I\'ll update you as soon as I hear back! 🤞'),
          emailAction('email-financing', 'Financing Submitted', 'Your Financing Application is Submitted!', 'Hi {{name}},\n\nGreat news! Your financing application has been submitted to our lending partners.\n\nWhat happens next:\n1. Lenders review your application (usually 1-2 hours)\n2. I\'ll receive approval options\n3. I\'ll call you with the best rates\n\nI\'ll be in touch soon!\n\nBest,\n{{agent}}'),
        ]
      }),
      stage('close-approved', '✅ Finance Approved', 'approval', 3050, 1320, '✅', 'emerald', { 
        w: 440, h: 380, desc: 'Financing approved - ready to close',
        inlineActions: [
          smsAction('sms-approved', 'Approved SMS', '🎉 APPROVED! {{name}}, you\'re approved for your {{vehicle}}! When can you come in to finalize? I\'m excited for you!', true),
          emailAction('email-approved', 'Approval Email', '🎉 You\'re Approved!', 'Hi {{name}},\n\n🎉 CONGRATULATIONS! 🎉\n\nYou\'ve been approved for financing on your {{vehicle}}!\n\n💰 APPROVED TERMS\n• Monthly: {{monthly}}/mo\n• Down: {{down}}\n• Rate: {{rate}}%\n• Term: {{term}} months\n\nNext steps:\n1. Sign paperwork\n2. Complete down payment\n3. Drive away in your new vehicle!\n\nWhen can you come in?\n\nBest,\n{{agent}}', true),
        ]
      }),
      
      // ===== ROW 8: WON =====
      stage('won-deal', '🎉 Deal Closed', 'approval', 3550, 100, '🎉', 'emerald', { 
        w: 460, h: 420, desc: 'Contract signed, deal complete!',
        inlineActions: [
          emailAction('email-congrats', 'Congratulations!', 'Congratulations on Your New Vehicle!', 'Dear {{name}},\n\n🎉 CONGRATULATIONS! 🎉\n\nYou\'re now the proud owner of a {{vehicle}}!\n\nThank you for choosing My Next Ride Ontario. It was a pleasure working with you.\n\nHere\'s what you should know:\n• First service: 5,000 km or 3 months\n• Warranty info included in your packet\n• My contact info for any questions\n\nEnjoy the ride!\n\n{{agent}}\nMy Next Ride Ontario', true),
          smsAction('sms-congrats', 'Congrats SMS', '🎉 Congrats {{name}}!! Enjoy your new {{vehicle}}! If you ever need anything, I\'m just a text away. Drive safe! - {{agent}}', true),
        ]
      }),
      stage('won-delivery', '🚚 Delivery Scheduled', 'approval', 3550, 560, '🚚', 'emerald', { 
        w: 460, h: 360, desc: 'Vehicle delivery date set',
        inlineActions: [
          smsAction('sms-delivery', 'Delivery Reminder', 'Hi {{name}}, your {{vehicle}} will be delivered on {{date}} at {{time}}. Can\'t wait for you to get behind the wheel! 🚗'),
        ]
      }),
      stage('won-delivered', '✅ Delivered!', 'approval', 3550, 960, '✅', 'emerald', { 
        w: 460, h: 360, desc: 'Vehicle delivered to customer',
        inlineActions: [
          smsAction('sms-delivered', 'Enjoy!', 'Your {{vehicle}} is officially yours! Enjoy every mile. Remember, I\'m here if you ever need anything. 🚗💨'),
        ]
      }),
      
      // ===== ROW 9: POST-SALE =====
      stage('post-week1', '📱 Week 1 Check', 'approval', 4050, 100, '📱', 'blue', { 
        w: 400, h: 340, desc: 'First week satisfaction check',
        inlineActions: [
          smsAction('sms-week1', 'Week 1 SMS', 'Hi {{name}}! How\'s the first week been with your {{vehicle}}? Any questions? - {{agent}}', true, delay(1, 'weeks')),
          emailAction('email-week1', 'Week 1 Email', 'How\'s Your First Week?', 'Hi {{name}},\n\nIt\'s been a week since you got your {{vehicle}}! How\'s it going?\n\nIf you have any questions about features or anything else, I\'m always here to help.\n\nEnjoy the ride!\n\n{{agent}}', true, delay(1, 'weeks')),
        ]
      }),
      stage('post-month1', '📧 Month 1 Check', 'approval', 4050, 480, '📧', 'blue', { 
        w: 400, h: 340, desc: 'One month follow-up',
        inlineActions: [
          emailAction('email-month1', 'Month 1 Email', 'One Month with Your {{vehicle}}!', 'Hi {{name}},\n\nCan you believe it\'s been a month already?\n\nI hope you\'re loving your {{vehicle}}! By now you\'ve probably discovered all its features.\n\nQuick favor: If you know anyone looking for a vehicle, I\'d love to help them too. Referrals mean a lot!\n\nDrive safe!\n\n{{agent}}', true, delay(1, 'months')),
        ]
      }),
      stage('post-month3', '🔧 Month 3 Service', 'approval', 4050, 860, '🔧', 'cyan', { 
        w: 400, h: 340, desc: 'Three month check / service reminder',
        inlineActions: [
          smsAction('sms-month3', '3 Month SMS', 'Hi {{name}}! How\'s the {{vehicle}} treating you? First service should be coming up soon. Need any recommendations?', true, delay(3, 'months')),
        ]
      }),
      stage('post-year1', '🎂 1 Year Anniversary', 'approval', 4050, 1240, '🎂', 'purple', { 
        w: 400, h: 360, desc: 'One year anniversary',
        inlineActions: [
          emailAction('email-year1', 'Anniversary Email', 'Happy 1 Year Anniversary!', 'Hi {{name}},\n\n🎂 Happy Anniversary!\n\nIt\'s been exactly one year since you got your {{vehicle}}!\n\nI hope it\'s been treating you well. If you\'re ever thinking about upgrading or know someone who needs a vehicle, I\'m always here.\n\nThank you for being a valued customer!\n\nBest,\n{{agent}}\nMy Next Ride Ontario', true, delay(1, 'years')),
          smsAction('sms-year1', 'Anniversary SMS', '🎂 Happy 1 year anniversary with your {{vehicle}}! Hope it\'s been a great year. Here for you if you ever need anything! - {{agent}}', true),
        ]
      }),
      
      // ===== ROW 10: REFERRALS =====
      stage('ref-ask', '🤝 Ask Referral', 'approval', 4550, 100, '🤝', 'yellow', { 
        w: 420, h: 360, desc: 'Request referrals from happy customer',
        inlineActions: [
          emailAction('email-referral', 'Referral Request', 'Know Anyone Looking for a Vehicle?', 'Hi {{name}},\n\nI hope you\'re still loving your {{vehicle}}!\n\nQuick question: Do you know anyone else who might be in the market for a vehicle?\n\nAs a thank you for any successful referral, I offer a $100 gift card. 🎁\n\nJust have them mention your name when they contact me!\n\nThanks,\n{{agent}}'),
          smsAction('sms-referral', 'Referral SMS', 'Hey {{name}}! Know anyone looking for a car? Send them my way and I\'ll give you $100 when they buy! 🎁 - {{agent}}'),
        ]
      }),
      stage('ref-received', '🎁 Referral Received', 'approval', 4550, 500, '🎁', 'emerald', { 
        w: 420, h: 340, desc: 'New referral lead received',
        inlineActions: [
          smsAction('sms-ref-thanks', 'Thank Referrer', 'Hi {{referrer}}! Thanks so much for referring {{name}}! I\'ll take great care of them. Your $100 gift card is on the way once they purchase! 🙏'),
        ]
      }),
      stage('ref-converted', '🏆 Referral Converted', 'approval', 4550, 880, '🏆', 'emerald', { 
        w: 420, h: 340, desc: 'Referral converted to sale',
        inlineActions: [
          smsAction('sms-ref-reward', 'Reward SMS', '🎉 {{referrer}}, your referral {{name}} just bought! Your $100 gift card is on the way. THANK YOU! 🙏'),
        ]
      }),
    ],
    messageNodes: [
      // Welcome sequence
      msg('msg-auto-welcome', 'email', '✉️ Auto Welcome', '✉️', 550, 1000, 'blue',
        'Automatic welcome email sent when lead enters pipeline',
        { w: 360, h: 200, auto: true, trigger: 'on-enter', linked: ['new-incoming'] }
      ),
      
      // Follow-up sequence nodes
      msg('msg-seq-1', 'email', '📧 Sequence #1', '📧', 1550, 1380, 'yellow',
        'First automated follow-up if no response after 24 hours',
        { w: 360, h: 200, auto: true, delay: delay(24, 'hours'), linked: ['engaged-warm'] }
      ),
      msg('msg-seq-2', 'sms', '💬 Sequence #2', '💬', 1550, 1620, 'cyan',
        'SMS follow-up after 48 hours',
        { w: 360, h: 200, auto: true, delay: delay(48, 'hours'), linked: ['engaged-warm'] }
      ),
      msg('msg-seq-3', 'email', '📧 Sequence #3', '📧', 1550, 1860, 'orange',
        'Third follow-up after 3 days',
        { w: 360, h: 200, auto: true, delay: delay(3, 'days'), linked: ['engaged-cool'] }
      ),
      msg('msg-seq-4', 'sms', '💬 Sequence #4', '💬', 1550, 2100, 'orange',
        'SMS check-in after 5 days',
        { w: 360, h: 200, auto: true, delay: delay(5, 'days'), linked: ['engaged-cool'] }
      ),
      msg('msg-seq-5', 'email', '📧 Final Sequence', '📧', 1550, 2340, 'red',
        'Final follow-up after 7 days',
        { w: 360, h: 200, auto: true, delay: delay(7, 'days'), linked: ['engaged-cool'] }
      ),
      
      // Meeting reminders
      msg('msg-meet-24h', 'sms', '⏰ 24hr Reminder', '⏰', 2550, 1720, 'purple',
        'Automatic reminder 24 hours before meeting',
        { w: 360, h: 200, auto: true, delay: delay(24, 'hours'), linked: ['meet-video', 'meet-phone', 'meet-office', 'meet-testdrive'] }
      ),
      msg('msg-meet-1h', 'sms', '⏰ 1hr Reminder', '⏰', 2550, 1960, 'violet',
        'Automatic reminder 1 hour before meeting',
        { w: 360, h: 200, auto: true, delay: delay(1, 'hours'), linked: ['meet-office', 'meet-testdrive'] }
      ),
      
      // Post-meeting
      msg('msg-post-meet', 'email', '🤝 Post-Meeting', '🤝', 2550, 2200, 'emerald',
        'Thank you email after meeting',
        { w: 360, h: 200, auto: true, trigger: 'on-exit', linked: ['meet-video', 'meet-phone', 'meet-office', 'meet-testdrive'] }
      ),
      
      // Closing automation
      msg('msg-approval', 'email', '🎉 Approval Alert', '🎉', 3050, 1740, 'emerald',
        'Automatic email when financing is approved',
        { w: 360, h: 200, auto: true, trigger: 'on-enter', linked: ['close-approved'] }
      ),
      
      // Post-sale automation
      msg('msg-post-1', 'email', '📱 Week 1 Auto', '📱', 4050, 1640, 'blue',
        'Automatic week 1 check-in',
        { w: 360, h: 200, auto: true, delay: delay(1, 'weeks'), linked: ['won-delivered', 'post-week1'] }
      ),
      msg('msg-post-2', 'email', '📧 Month 1 Auto', '📧', 4050, 1880, 'blue',
        'Automatic month 1 follow-up',
        { w: 360, h: 200, auto: true, delay: delay(1, 'months'), linked: ['post-week1', 'post-month1'] }
      ),
      msg('msg-post-3', 'sms', '🔧 Month 3 Auto', '🔧', 4050, 2120, 'cyan',
        'Service reminder at 3 months',
        { w: 360, h: 200, auto: true, delay: delay(3, 'months'), linked: ['post-month1', 'post-month3'] }
      ),
      msg('msg-post-4', 'email', '🎂 Year 1 Auto', '🎂', 4050, 2360, 'purple',
        '1 year anniversary email',
        { w: 360, h: 200, auto: true, delay: delay(12, 'months'), linked: ['post-month3', 'post-year1'] }
      ),
      
      // Referral automation
      msg('msg-ref-ask', 'email', '🤝 Ask Referral', '🤝', 4550, 1260, 'yellow',
        'Referral request email',
        { w: 360, h: 200, auto: true, delay: delay(2, 'months'), linked: ['post-month1', 'ref-ask'] }
      ),
    ],
    connections: [
      // New leads flow
      conn('new-incoming', 'new-qualified'),
      conn('new-qualified', 'contact-1'),
      
      // Contact attempts cascade
      conn('contact-1', 'contact-2', 'stage', 'stage', { auto: true, delay: delay(4, 'hours'), condition: 'no-response' }),
      conn('contact-2', 'contact-3', 'stage', 'stage', { auto: true, delay: delay(8, 'hours'), condition: 'no-response' }),
      conn('contact-3', 'contact-4', 'stage', 'stage', { auto: true, delay: delay(24, 'hours'), condition: 'no-response' }),
      conn('contact-4', 'contact-5', 'stage', 'stage', { auto: true, delay: delay(48, 'hours'), condition: 'no-response' }),
      conn('contact-5', 'contact-final', 'stage', 'stage', { auto: true, delay: delay(72, 'hours'), condition: 'no-response' }),
      conn('contact-final', 'dead-no-response', 'stage', 'stage', { dashed: true, label: 'No Response' }),
      
      // Contact to engaged
      conn('contact-1', 'engaged-hot'),
      conn('contact-2', 'engaged-hot'),
      conn('contact-3', 'engaged-warm'),
      conn('contact-4', 'engaged-warm'),
      conn('contact-5', 'engaged-cool'),
      
      // Engaged flow
      conn('engaged-hot', 'qual-needs'),
      conn('engaged-warm', 'qual-needs'),
      conn('engaged-cool', 'qual-needs'),
      
      // Qualification flow
      conn('qual-needs', 'qual-budget'),
      conn('qual-budget', 'qual-timeline'),
      conn('qual-timeline', 'qual-ready'),
      conn('qual-needs', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
      conn('qual-budget', 'dead-cannot-afford', 'stage', 'stage', { dashed: true }),
      
      // Meeting scheduling
      conn('qual-ready', 'meet-video'),
      conn('qual-ready', 'meet-phone'),
      conn('qual-ready', 'meet-office'),
      conn('qual-ready', 'meet-testdrive'),
      
      // Meetings to closing
      conn('meet-video', 'close-proposal'),
      conn('meet-phone', 'close-proposal'),
      conn('meet-office', 'close-proposal'),
      conn('meet-testdrive', 'close-proposal'),
      
      // Closing flow
      conn('close-proposal', 'close-negotiate'),
      conn('close-negotiate', 'close-financing'),
      conn('close-financing', 'close-approved'),
      conn('close-approved', 'won-deal'),
      conn('close-negotiate', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
      conn('close-financing', 'dead-declined', 'stage', 'stage', { dashed: true }),
      
      // Won flow
      conn('won-deal', 'won-delivery'),
      conn('won-delivery', 'won-delivered'),
      conn('won-delivered', 'post-week1'),
      
      // Post-sale flow
      conn('post-week1', 'post-month1', 'stage', 'stage', { auto: true, delay: delay(3, 'weeks') }),
      conn('post-month1', 'post-month3', 'stage', 'stage', { auto: true, delay: delay(2, 'months') }),
      conn('post-month3', 'post-year1', 'stage', 'stage', { auto: true, delay: delay(9, 'months') }),
      conn('post-month1', 'ref-ask'),
      conn('post-year1', 'ref-ask'),
      
      // Referral flow
      conn('ref-ask', 'ref-received'),
      conn('ref-received', 'new-incoming'),
      conn('ref-received', 'ref-converted'),
      
      // Message connections
      conn('new-incoming', 'msg-auto-welcome', 'stage', 'message'),
      conn('engaged-warm', 'msg-seq-1', 'stage', 'message'),
      conn('engaged-warm', 'msg-seq-2', 'stage', 'message'),
      conn('engaged-cool', 'msg-seq-3', 'stage', 'message'),
      conn('engaged-cool', 'msg-seq-4', 'stage', 'message'),
      conn('engaged-cool', 'msg-seq-5', 'stage', 'message'),
      conn('meet-video', 'msg-meet-24h', 'stage', 'message'),
      conn('meet-phone', 'msg-meet-24h', 'stage', 'message'),
      conn('meet-office', 'msg-meet-24h', 'stage', 'message'),
      conn('meet-testdrive', 'msg-meet-24h', 'stage', 'message'),
      conn('meet-office', 'msg-meet-1h', 'stage', 'message'),
      conn('meet-testdrive', 'msg-meet-1h', 'stage', 'message'),
      conn('close-approved', 'msg-approval', 'stage', 'message'),
      conn('won-delivered', 'msg-post-1', 'stage', 'message'),
      conn('post-week1', 'msg-post-2', 'stage', 'message'),
      conn('post-month1', 'msg-post-3', 'stage', 'message'),
      conn('post-month3', 'msg-post-4', 'stage', 'message'),
      conn('post-month1', 'msg-ref-ask', 'stage', 'message'),
    ],
    labels: [
      lbl('lbl-dead', '💀 DEAD LEADS', 60, 40, 32, '#ef4444', undefined, '800'),
      lbl('lbl-new', '📥 NEW LEADS', 560, 40, 32, '#3b82f6', undefined, '800'),
      lbl('lbl-contact', '📞 CONTACT ATTEMPTS', 1060, 40, 32, '#06b6d4', undefined, '800'),
      lbl('lbl-engaged', '🔥 ENGAGED', 1560, 40, 32, '#f97316', undefined, '800'),
      lbl('lbl-qual', '✅ QUALIFICATION', 2060, 40, 32, '#22c55e', undefined, '800'),
      lbl('lbl-meet', '📅 MEETINGS', 2560, 40, 32, '#a855f7', undefined, '800'),
      lbl('lbl-close', '🎯 CLOSING', 3060, 40, 32, '#10b981', undefined, '800'),
      lbl('lbl-won', '🏆 WON', 3560, 40, 32, '#10b981', undefined, '800'),
      lbl('lbl-post', '🤝 POST-SALE', 4060, 40, 32, '#3b82f6', undefined, '800'),
      lbl('lbl-ref', '⭐ REFERRALS', 4560, 40, 32, '#eab308', undefined, '800'),
    ],
  },

  // ========================================
  // ADVANCED: 20-NODE FUNNEL
  // ========================================
  {
    id: 'advanced-20',
    name: '⚡ Advanced 20-Stage Funnel',
    description: 'A comprehensive 20-stage funnel with inline SMS/Email actions, follow-up sequences, and dead lead tracking. Perfect for growing teams.',
    icon: '⚡',
    complexity: 'advanced',
    category: 'sales',
    estimatedSetupTime: '45 minutes',
    features: [
      '20 pipeline stages',
      '10 message nodes',
      'Inline SMS & Email on stages',
      '5-touch follow-up sequence',
      'Dead lead categories',
    ],
    stages: [
      // Dead leads
      stage('dead-not-interested', '👎 Not Interested', 'dead', 50, 200, '👎', 'red', { w: 380, h: 320, dead: 'not-interested' }),
      stage('dead-no-response', '📵 No Response', 'dead', 50, 560, '📵', 'orange', { w: 380, h: 320, dead: 'no-contact' }),
      stage('dead-budget', '💸 Budget Issue', 'dead', 50, 920, '💸', 'pink', { w: 380, h: 320, dead: 'cannot-afford' }),
      
      // New leads
      stage('new', '📥 New Lead', 'new', 500, 200, '📥', 'blue', { 
        w: 420, h: 400,
        inlineActions: [
          smsAction('sms-new', 'Welcome SMS', 'Hi {{name}}, thanks for your interest! I\'ll be in touch soon. - {{agent}}', true),
          emailAction('email-new', 'Welcome Email', 'Welcome!', 'Hi {{name}},\n\nThanks for reaching out! I\'ll call you shortly.\n\n{{agent}}', true),
        ]
      }),
      
      // Contact stages
      stage('contact-1', '📞 Contact #1', 'working', 1000, 200, '📞', 'cyan', { 
        w: 400, h: 360,
        inlineActions: [
          smsAction('sms-c1', 'Intro SMS', 'Hi {{name}}, tried calling. When\'s a good time to chat?'),
        ]
      }),
      stage('contact-2', '📞 Contact #2', 'working', 1000, 600, '📞', 'yellow', { w: 400, h: 360 }),
      stage('contact-3', '📞 Contact #3', 'working', 1000, 1000, '📞', 'orange', { w: 400, h: 360 }),
      
      // Engaged
      stage('hot', '🔥 Hot Lead', 'working', 1500, 200, '🔥', 'orange', { w: 420, h: 380 }),
      stage('warm', '☀️ Warm Lead', 'working', 1500, 620, '☀️', 'yellow', { w: 420, h: 380 }),
      
      // Qualified
      stage('qualified', '✅ Qualified', 'working', 2000, 200, '✅', 'green', { w: 420, h: 380 }),
      stage('meeting-set', '📅 Meeting Set', 'working', 2000, 620, '📅', 'purple', { w: 420, h: 380 }),
      
      // Closing
      stage('proposal', '📋 Proposal', 'approval', 2500, 200, '📋', 'emerald', { w: 420, h: 380 }),
      stage('negotiating', '💬 Negotiating', 'approval', 2500, 620, '💬', 'yellow', { w: 420, h: 380 }),
      stage('financing', '🏦 Financing', 'approval', 2500, 1040, '🏦', 'cyan', { w: 420, h: 380 }),
      
      // Won
      stage('won', '🏆 Won', 'approval', 3000, 200, '🏆', 'emerald', { 
        w: 440, h: 420,
        inlineActions: [
          emailAction('email-congrats', 'Congrats!', 'Congratulations!', 'Congrats on your new vehicle!', true),
        ]
      }),
      
      // Post-sale
      stage('delivered', '🚚 Delivered', 'approval', 3000, 660, '🚚', 'emerald', { w: 440, h: 360 }),
      stage('follow-up', '📱 Follow Up', 'approval', 3500, 200, '📱', 'blue', { w: 400, h: 360 }),
      stage('referral', '⭐ Get Referral', 'approval', 3500, 600, '⭐', 'yellow', { w: 400, h: 360 }),
    ],
    messageNodes: [
      msg('msg-welcome', 'email', 'Welcome Email', '✉️', 500, 640, 'blue', 'Auto welcome email', { auto: true }),
      msg('msg-fu1', 'sms', 'Follow Up #1', '💬', 1000, 1400, 'cyan', 'First follow up SMS', { auto: true, delay: delay(24, 'hours') }),
      msg('msg-fu2', 'email', 'Follow Up #2', '📧', 1000, 1680, 'yellow', 'Second follow up email', { auto: true, delay: delay(48, 'hours') }),
      msg('msg-meeting', 'sms', 'Meeting Reminder', '📅', 2000, 1040, 'purple', 'Meeting reminder SMS', { auto: true }),
      msg('msg-congrats', 'email', 'Congratulations!', '🎉', 3000, 1100, 'emerald', 'Deal closed email', { auto: true }),
    ],
    connections: [
      conn('new', 'contact-1'),
      conn('contact-1', 'contact-2', 'stage', 'stage', { auto: true, delay: delay(4, 'hours') }),
      conn('contact-2', 'contact-3', 'stage', 'stage', { auto: true, delay: delay(24, 'hours') }),
      conn('contact-3', 'dead-no-response', 'stage', 'stage', { dashed: true }),
      conn('contact-1', 'hot'),
      conn('contact-2', 'warm'),
      conn('hot', 'qualified'),
      conn('warm', 'qualified'),
      conn('qualified', 'meeting-set'),
      conn('meeting-set', 'proposal'),
      conn('proposal', 'negotiating'),
      conn('negotiating', 'financing'),
      conn('financing', 'won'),
      conn('won', 'delivered'),
      conn('delivered', 'follow-up'),
      conn('follow-up', 'referral'),
      conn('negotiating', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
      conn('qualified', 'dead-budget', 'stage', 'stage', { dashed: true }),
    ],
    labels: [
      lbl('lbl-title', 'ADVANCED 20-STAGE FUNNEL', 1500, 50, 36, '#ffffff'),
    ],
  },

  // ========================================
  // STANDARD: 12-NODE SIMPLE
  // ========================================
  {
    id: 'standard-12',
    name: '📊 Standard 12-Stage',
    description: 'A clean, straightforward 12-stage funnel. Easy to understand, quick to set up.',
    icon: '📊',
    complexity: 'standard',
    category: 'sales',
    estimatedSetupTime: '20 minutes',
    features: [
      '12 pipeline stages',
      '4 message nodes',
      'Basic automation',
    ],
    stages: [
      stage('dead', '💀 Dead Leads', 'dead', 50, 400, '💀', 'red', { w: 380, h: 500 }),
      stage('new', '📥 New', 'new', 500, 300, '📥', 'blue', { w: 420, h: 420 }),
      stage('contacted', '📞 Contacted', 'working', 1000, 300, '📞', 'cyan', { w: 400, h: 380 }),
      stage('interested', '👍 Interested', 'working', 1500, 300, '👍', 'yellow', { w: 400, h: 380 }),
      stage('qualified', '✅ Qualified', 'working', 2000, 300, '✅', 'green', { w: 400, h: 380 }),
      stage('meeting', '📅 Meeting', 'working', 2500, 300, '📅', 'purple', { w: 400, h: 380 }),
      stage('proposal', '📋 Proposal', 'approval', 3000, 300, '📋', 'emerald', { w: 400, h: 380 }),
      stage('won', '🏆 Won', 'approval', 3500, 300, '🏆', 'emerald', { w: 420, h: 420 }),
    ],
    messageNodes: [
      msg('msg-welcome', 'email', 'Welcome', '✉️', 500, 760, 'blue', 'Welcome email'),
      msg('msg-fu', 'sms', 'Follow Up', '💬', 1000, 720, 'cyan', 'Follow up SMS'),
    ],
    connections: [
      conn('new', 'contacted'),
      conn('contacted', 'interested'),
      conn('interested', 'qualified'),
      conn('qualified', 'meeting'),
      conn('meeting', 'proposal'),
      conn('proposal', 'won'),
      conn('contacted', 'dead', 'stage', 'stage', { dashed: true }),
      conn('interested', 'dead', 'stage', 'stage', { dashed: true }),
    ],
    labels: [
      lbl('lbl-title', 'STANDARD PIPELINE', 1750, 100, 40, '#3b82f6'),
    ],
  },

  // ========================================
  // STARTER: 5-STAGE BASIC
  // ========================================
  {
    id: 'starter-5',
    name: '🎯 Starter 5-Stage',
    description: 'The simplest pipeline. 5 stages: New → Contact → Qualify → Close → Won. Perfect for beginners.',
    icon: '🎯',
    complexity: 'starter',
    category: 'basic',
    estimatedSetupTime: '5 minutes',
    features: [
      '5 pipeline stages',
      'No automation',
      'Super quick setup',
    ],
    stages: [
      stage('new', '📥 New', 'new', 200, 400, '📥', 'blue', { w: 460, h: 460 }),
      stage('contact', '📞 Contact', 'working', 750, 400, '📞', 'cyan', { w: 460, h: 460 }),
      stage('qualify', '✅ Qualify', 'working', 1300, 400, '✅', 'yellow', { w: 460, h: 460 }),
      stage('close', '🎯 Close', 'approval', 1850, 400, '🎯', 'emerald', { w: 460, h: 460 }),
      stage('won', '🏆 Won', 'approval', 2400, 400, '🏆', 'emerald', { w: 460, h: 460 }),
    ],
    messageNodes: [],
    connections: [
      conn('new', 'contact'),
      conn('contact', 'qualify'),
      conn('qualify', 'close'),
      conn('close', 'won'),
    ],
    labels: [
      lbl('lbl-title', 'STARTER PIPELINE', 1100, 200, 44, '#ffffff'),
    ],
  },
];

// ========================================
// HOURGLASS FLOW: Centered branching layout
// ========================================
const HOURGLASS_PRESET: Preset = {
  id: 'hourglass-flow',
  name: '🔷 Hourglass Flow',
  description: 'Elegant centered layout with New Lead in the middle branching outward like an hourglass. Clear visual hierarchy, easy to follow from center outward.',
  icon: '🔷',
  complexity: 'standard',
  category: 'sales',
  estimatedSetupTime: '15 minutes',
  features: [
    'Centered New Lead focus',
    'Branching visual flow',
    'Clean hourglass shape',
    'Dead leads on left',
    'Won deals on right',
    'Easy to understand at a glance',
  ],
  stages: [
    // CENTER - New Lead (the focal point)
    stage('new-lead', '📥 NEW LEAD', 'new', 1200, 800, '📥', 'blue', { 
      w: 500, h: 500, desc: 'All new leads start here',
      inlineActions: [
        smsAction('sms-welcome', 'Welcome SMS', 'Hi {{name}}, thanks for your interest! I\'ll be in touch shortly. - My Next Ride Ontario', true),
        emailAction('email-welcome', 'Welcome Email', 'Welcome to My Next Ride!', 'Hi {{name}},\n\nThank you for reaching out! We\'re excited to help you find your perfect vehicle.\n\nI\'ll call you within the hour.\n\nBest,\nMy Next Ride Ontario', true),
      ]
    }),

    // UPPER LEFT BRANCH - Contact attempts (fan out upward left)
    stage('call-1', '📞 Call #1', 'working', 600, 400, '📞', 'cyan', { 
      w: 380, h: 340,
      inlineActions: [smsAction('sms-c1', 'Intro SMS', 'Hi {{name}}, tried calling. When\'s good to chat?')]
    }),
    stage('call-2', '📞 Call #2', 'working', 200, 200, '📞', 'yellow', { w: 360, h: 320 }),
    stage('call-3', '📞 Call #3', 'working', 200, 600, '📞', 'orange', { w: 360, h: 320 }),

    // UPPER RIGHT BRANCH - Engaged/Qualification (fan out upward right)  
    stage('engaged', '🔥 Engaged', 'working', 1800, 400, '🔥', 'orange', { 
      w: 400, h: 360,
      inlineActions: [noteAction('note-engaged', 'Engagement Notes', 'Interest level: _____\nTimeline: _____\nBudget: _____')]
    }),
    stage('qualified', '✅ Qualified', 'working', 2200, 200, '✅', 'green', { w: 380, h: 340 }),
    stage('meeting-set', '📅 Meeting Set', 'working', 2200, 600, '📅', 'purple', { w: 380, h: 340 }),

    // LOWER LEFT BRANCH - Dead leads (fan out downward left)
    stage('dead-no-response', '📵 No Response', 'dead', 200, 1000, '📵', 'red', { w: 360, h: 320, dead: 'no-contact' }),
    stage('dead-not-interested', '👎 Not Interested', 'dead', 200, 1400, '👎', 'red', { w: 360, h: 320, dead: 'not-interested' }),
    stage('dead-other', '💀 Other', 'dead', 600, 1200, '💀', 'slate', { w: 360, h: 320, dead: 'declined' }),

    // LOWER RIGHT BRANCH - Closing/Won (fan out downward right)
    stage('proposal', '📋 Proposal', 'approval', 1800, 1200, '📋', 'emerald', { 
      w: 400, h: 360,
      inlineActions: [emailAction('email-proposal', 'Send Proposal', 'Your Vehicle Proposal', 'Hi {{name}},\n\nAttached is your personalized proposal...\n\nBest,\nMy Next Ride Ontario')]
    }),
    stage('negotiation', '💬 Negotiation', 'approval', 2200, 1000, '💬', 'yellow', { w: 380, h: 340 }),
    stage('won', '🏆 WON!', 'approval', 2200, 1400, '🏆', 'emerald', { 
      w: 420, h: 400,
      inlineActions: [
        smsAction('sms-congrats', 'Congrats SMS', '🎉 Congrats {{name}}! Enjoy your new vehicle!', true),
        emailAction('email-congrats', 'Congrats Email', 'Congratulations!', 'Hi {{name}},\n\n🎉 Congratulations on your new vehicle!\n\nThank you for choosing us.\n\nBest,\nMy Next Ride Ontario', true),
      ]
    }),
  ],
  messageNodes: [
    msg('msg-welcome', 'email', '✉️ Auto Welcome', '✉️', 1200, 400, 'blue', 'Automatic welcome email', { auto: true, linked: ['new-lead'] }),
    msg('msg-follow', 'sms', '💬 Follow-up', '💬', 600, 800, 'cyan', 'Follow-up SMS after no answer', { auto: true, delay: delay(24, 'hours') }),
    msg('msg-proposal', 'email', '📋 Proposal Email', '📋', 1800, 800, 'emerald', 'Send proposal details', { linked: ['proposal'] }),
  ],
  connections: [
    // From center outward - upper branches
    conn('new-lead', 'call-1'),
    conn('new-lead', 'engaged'),
    conn('call-1', 'call-2'),
    conn('call-1', 'call-3'),
    conn('engaged', 'qualified'),
    conn('engaged', 'meeting-set'),
    
    // From center outward - lower branches  
    conn('new-lead', 'dead-other', 'stage', 'stage', { dashed: true }),
    conn('call-3', 'dead-no-response', 'stage', 'stage', { dashed: true }),
    conn('call-2', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
    
    conn('new-lead', 'proposal'),
    conn('qualified', 'proposal'),
    conn('meeting-set', 'proposal'),
    conn('proposal', 'negotiation'),
    conn('negotiation', 'won'),
    
    // Message connections
    conn('new-lead', 'msg-welcome', 'stage', 'message'),
    conn('call-1', 'msg-follow', 'stage', 'message'),
    conn('proposal', 'msg-proposal', 'stage', 'message'),
  ],
  labels: [
    lbl('lbl-center', '⭐ START HERE', 1200, 700, 32, '#3b82f6'),
    lbl('lbl-contact', 'CONTACT', 400, 100, 28, '#06b6d4'),
    lbl('lbl-qualify', 'QUALIFY', 2000, 100, 28, '#22c55e'),
    lbl('lbl-dead', 'DEAD LEADS', 200, 850, 24, '#ef4444'),
    lbl('lbl-close', 'CLOSING', 2000, 850, 28, '#10b981'),
  ],
};

// Add hourglass to presets array
ALL_PRESETS.push(HOURGLASS_PRESET);

// ========================================
// QUICK FOLLOW-UP: Fast response pipeline
// ========================================
const QUICK_FOLLOWUP_PRESET: Preset = {
  id: 'quick-followup',
  name: '⚡ Quick Follow-Up',
  description: 'Speed-focused pipeline for rapid lead response. Optimized for 5-minute response times with automated follow-ups.',
  icon: '⚡',
  complexity: 'standard',
  category: 'sales',
  estimatedSetupTime: '10 minutes',
  features: ['5-minute response goal', 'Auto SMS on entry', 'Rapid follow-up sequence', '24hr dead lead trigger'],
  stages: [
    stage('dead-no-response', '📵 No Response', 'dead', 50, 300, '📵', 'red', { w: 350, h: 300, dead: 'no-contact' }),
    stage('dead-not-interested', '👎 Not Interested', 'dead', 50, 650, '👎', 'red', { w: 350, h: 300, dead: 'not-interested' }),
    stage('new', '📥 NEW LEAD', 'new', 600, 450, '📥', 'blue', { 
      w: 450, h: 450,
      inlineActions: [
        smsAction('sms-instant', 'Instant SMS', 'Hi {{name}}, thanks for reaching out! I\'ll call you in the next 5 minutes. - My Next Ride', true),
      ]
    }),
    stage('contacted', '📞 Contacted', 'working', 1150, 300, '📞', 'cyan', { w: 380, h: 340 }),
    stage('interested', '🔥 Interested', 'working', 1150, 700, '🔥', 'orange', { w: 380, h: 340 }),
    stage('qualified', '✅ Qualified', 'working', 1650, 450, '✅', 'green', { w: 400, h: 380 }),
    stage('closing', '🎯 Closing', 'approval', 2150, 450, '🎯', 'emerald', { w: 400, h: 380 }),
    stage('won', '🏆 WON', 'approval', 2650, 450, '🏆', 'emerald', { w: 420, h: 420 }),
  ],
  messageNodes: [
    msg('msg-5min', 'sms', '⚡ 5-Min SMS', '⚡', 600, 100, 'blue', 'Instant response SMS', { auto: true }),
    msg('msg-1hr', 'email', '📧 1hr Follow', '📧', 1150, 100, 'cyan', '1 hour follow-up email', { auto: true, delay: delay(1, 'hours') }),
  ],
  connections: [
    conn('new', 'contacted'),
    conn('new', 'interested'),
    conn('contacted', 'qualified'),
    conn('interested', 'qualified'),
    conn('qualified', 'closing'),
    conn('closing', 'won'),
    conn('contacted', 'dead-no-response', 'stage', 'stage', { dashed: true }),
    conn('interested', 'dead-not-interested', 'stage', 'stage', { dashed: true }),
  ],
  labels: [lbl('lbl-title', 'QUICK FOLLOW-UP PIPELINE', 1400, 50, 36, '#3b82f6')],
};
ALL_PRESETS.push(QUICK_FOLLOWUP_PRESET);

// ========================================
// NURTURE SEQUENCE: Long-term follow-up
// ========================================
const NURTURE_PRESET: Preset = {
  id: 'nurture-sequence',
  name: '🌱 Nurture Sequence',
  description: 'Long-term nurturing pipeline for leads not ready to buy. Automated drip campaigns over weeks/months.',
  icon: '🌱',
  complexity: 'advanced',
  category: 'sales',
  estimatedSetupTime: '30 minutes',
  features: ['30-60-90 day drip', 'Re-engagement triggers', 'Cool lead warming', 'Birthday/anniversary reminders'],
  stages: [
    stage('cold', '❄️ Cold Lead', 'dead', 50, 400, '❄️', 'slate', { w: 360, h: 320, dead: 'no-contact' }),
    stage('new', '📥 New Lead', 'new', 500, 400, '📥', 'blue', { w: 400, h: 380 }),
    stage('week1', '📧 Week 1', 'working', 1000, 200, '📧', 'cyan', { w: 360, h: 300 }),
    stage('week2', '💬 Week 2', 'working', 1000, 550, '💬', 'teal', { w: 360, h: 300 }),
    stage('month1', '📆 Month 1', 'working', 1500, 200, '📆', 'yellow', { w: 360, h: 300 }),
    stage('month2', '📅 Month 2', 'working', 1500, 550, '📅', 'amber', { w: 360, h: 300 }),
    stage('reengaged', '🔥 Re-Engaged', 'working', 2000, 400, '🔥', 'orange', { w: 400, h: 380 }),
    stage('ready', '✅ Ready to Buy', 'approval', 2500, 400, '✅', 'emerald', { w: 420, h: 400 }),
  ],
  messageNodes: [
    msg('msg-w1', 'email', 'Week 1 Email', '📧', 1000, 900, 'cyan', 'First nurture email', { auto: true, delay: delay(1, 'weeks') }),
    msg('msg-w2', 'sms', 'Week 2 SMS', '💬', 1200, 900, 'teal', 'Week 2 check-in', { auto: true, delay: delay(2, 'weeks') }),
    msg('msg-m1', 'email', 'Month 1 Email', '📆', 1400, 900, 'yellow', 'Month 1 value email', { auto: true, delay: delay(1, 'months') }),
  ],
  connections: [
    conn('new', 'week1'),
    conn('new', 'week2'),
    conn('week1', 'month1'),
    conn('week2', 'month2'),
    conn('month1', 'reengaged'),
    conn('month2', 'reengaged'),
    conn('reengaged', 'ready'),
    conn('week1', 'cold', 'stage', 'stage', { dashed: true }),
    conn('week2', 'cold', 'stage', 'stage', { dashed: true }),
  ],
  labels: [lbl('lbl-title', 'NURTURE SEQUENCE', 1200, 50, 36, '#22c55e')],
};
ALL_PRESETS.push(NURTURE_PRESET);

// ========================================  
// APPOINTMENT SETTER: Meeting focused
// ========================================
const APPOINTMENT_PRESET: Preset = {
  id: 'appointment-setter',
  name: '📅 Appointment Setter',
  description: 'Pipeline optimized for booking meetings and test drives. Clear meeting-focused stages.',
  icon: '📅',
  complexity: 'standard',
  category: 'automotive',
  estimatedSetupTime: '15 minutes',
  features: ['Meeting reminder automation', 'No-show recovery', 'Test drive tracking', 'Calendar integration ready'],
  stages: [
    stage('no-show', '❌ No Show', 'dead', 50, 300, '❌', 'red', { w: 350, h: 300, dead: 'no-contact' }),
    stage('cancelled', '🚫 Cancelled', 'dead', 50, 650, '🚫', 'red', { w: 350, h: 300, dead: 'not-interested' }),
    stage('new', '📥 New Lead', 'new', 500, 450, '📥', 'blue', { w: 400, h: 400 }),
    stage('scheduling', '📞 Scheduling', 'working', 1000, 450, '📞', 'cyan', { w: 380, h: 360 }),
    stage('confirmed', '✅ Confirmed', 'working', 1500, 250, '✅', 'green', { w: 380, h: 340 }),
    stage('reminder-sent', '🔔 Reminder Sent', 'working', 1500, 650, '🔔', 'yellow', { w: 380, h: 340 }),
    stage('attended', '🤝 Attended', 'approval', 2000, 450, '🤝', 'emerald', { w: 400, h: 380 }),
    stage('test-drive', '🚗 Test Drive', 'approval', 2500, 300, '🚗', 'violet', { w: 400, h: 360 }),
    stage('deal', '🏆 Deal Closed', 'approval', 2500, 650, '🏆', 'emerald', { w: 420, h: 400 }),
  ],
  messageNodes: [
    msg('msg-confirm', 'sms', 'Confirm SMS', '✅', 1500, 50, 'green', 'Appointment confirmation', { auto: true }),
    msg('msg-remind', 'sms', '24hr Reminder', '🔔', 1700, 50, 'yellow', '24 hour reminder', { auto: true, delay: delay(24, 'hours') }),
  ],
  connections: [
    conn('new', 'scheduling'),
    conn('scheduling', 'confirmed'),
    conn('scheduling', 'reminder-sent'),
    conn('confirmed', 'attended'),
    conn('reminder-sent', 'attended'),
    conn('attended', 'test-drive'),
    conn('attended', 'deal'),
    conn('test-drive', 'deal'),
    conn('confirmed', 'no-show', 'stage', 'stage', { dashed: true }),
    conn('scheduling', 'cancelled', 'stage', 'stage', { dashed: true }),
  ],
  labels: [lbl('lbl-title', 'APPOINTMENT SETTER', 1200, 50, 36, '#a855f7')],
};
ALL_PRESETS.push(APPOINTMENT_PRESET);

// ========================================
// REFERRAL MACHINE: Post-sale referrals
// ========================================
const REFERRAL_PRESET: Preset = {
  id: 'referral-machine',
  name: '⭐ Referral Machine',
  description: 'Post-sale pipeline focused on generating referrals from happy customers.',
  icon: '⭐',
  complexity: 'standard',
  category: 'sales',
  estimatedSetupTime: '15 minutes',
  features: ['Post-sale check-ins', 'Referral ask sequence', 'Reward tracking', 'Review requests'],
  stages: [
    stage('no-referral', '😔 No Referral', 'dead', 50, 450, '😔', 'slate', { w: 350, h: 300, dead: 'not-interested' }),
    stage('delivered', '🚗 Delivered', 'new', 500, 450, '🚗', 'blue', { w: 400, h: 400 }),
    stage('week1-check', '📱 Week 1', 'working', 1000, 300, '📱', 'cyan', { w: 360, h: 320 }),
    stage('review-ask', '⭐ Review Ask', 'working', 1000, 650, '⭐', 'yellow', { w: 360, h: 320 }),
    stage('month1-check', '📧 Month 1', 'working', 1500, 450, '📧', 'teal', { w: 380, h: 360 }),
    stage('referral-ask', '🤝 Referral Ask', 'approval', 2000, 300, '🤝', 'orange', { w: 400, h: 360 }),
    stage('referral-received', '🎁 Referral In!', 'approval', 2000, 650, '🎁', 'emerald', { w: 400, h: 360 }),
    stage('reward-sent', '💰 Reward Sent', 'approval', 2500, 450, '💰', 'emerald', { w: 420, h: 400 }),
  ],
  messageNodes: [
    msg('msg-w1', 'sms', 'Week 1 Check', '📱', 1000, 100, 'cyan', 'How\'s the vehicle?', { auto: true, delay: delay(1, 'weeks') }),
    msg('msg-review', 'email', 'Review Request', '⭐', 1200, 100, 'yellow', 'Leave us a review!', { auto: true, delay: delay(2, 'weeks') }),
    msg('msg-ref', 'email', 'Referral Ask', '🤝', 2000, 100, 'orange', 'Know anyone who needs a car?', { auto: true, delay: delay(1, 'months') }),
  ],
  connections: [
    conn('delivered', 'week1-check'),
    conn('delivered', 'review-ask'),
    conn('week1-check', 'month1-check'),
    conn('review-ask', 'month1-check'),
    conn('month1-check', 'referral-ask'),
    conn('referral-ask', 'referral-received'),
    conn('referral-received', 'reward-sent'),
    conn('referral-ask', 'no-referral', 'stage', 'stage', { dashed: true }),
  ],
  labels: [lbl('lbl-title', 'REFERRAL MACHINE', 1200, 50, 36, '#f97316')],
};
ALL_PRESETS.push(REFERRAL_PRESET);

// ============ WINWIN PRESET LEVELS ============
// Level 1: Essential (starter) - 5 mins setup
// Level 2: Professional (standard) - 15-20 mins setup
// Level 3: Enterprise (advanced/runway) - 30+ mins setup

const complexityOrder = { 'starter': 1, 'standard': 2, 'advanced': 3, 'runway': 3 };

// Sort by WinWin level (easiest first)
ALL_PRESETS.sort((a, b) => {
  const orderA = complexityOrder[a.complexity as keyof typeof complexityOrder] ?? 2;
  const orderB = complexityOrder[b.complexity as keyof typeof complexityOrder] ?? 2;
  return orderA - orderB;
});

// Mark first as recommended
ALL_PRESETS.forEach((p, idx) => {
  if (idx === 0) (p as any).recommended = true;
});

// WinWin Preset Categories
export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: '📁' },
  { id: 'automotive', label: 'Automotive', icon: '🚗' },
  { id: 'sales', label: 'Sales', icon: '📊' },
  { id: 'basic', label: 'Essential', icon: '⭐' },
];

// WinWin Levels for display
export const WINWIN_LEVELS = {
  starter: { level: 1, name: 'Essential', color: 'emerald', description: 'Quick start templates' },
  standard: { level: 2, name: 'Professional', color: 'yellow', description: 'Full-featured workflows' },
  advanced: { level: 3, name: 'Enterprise', color: 'purple', description: 'Advanced automation' },
  runway: { level: 3, name: 'Enterprise', color: 'purple', description: 'Maximum automation' },
};
