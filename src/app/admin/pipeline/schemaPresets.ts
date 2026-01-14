import type {
  SchemaPreset,
  WorkflowSchema,
  WorkflowEdge,
  NodeGuidance,
  WorkflowStatusNode,
  WorkflowActionNode,
  WorkflowLogicGateNode,
  StageColor,
  StrictPathType,
  TimerDelay,
} from './types';

// =====================================================================================
// Schema-first "Robust 6" preset library (enterprise-grade)
// - No coordinates persisted
// - Nodes include guidance (tutorial markdown + optional video url)
// - Edges include strict_path (Success/Failure/Neutral/Loop)
// =====================================================================================

const guidance = (tutorial_title: string, tutorial_content: string, video_url = ''): NodeGuidance => ({
  tutorial_title,
  tutorial_content,
  video_url,
});

const delay = (value: number, unit: TimerDelay['unit']): TimerDelay => ({
  value,
  unit,
  label: `${value} ${unit}`,
});

const statusNode = (opts: {
  id: string;
  label: string;
  icon: string;
  color: StageColor;
  statusId: WorkflowStatusNode['statusId'];
  deadReason?: string;
  guidance: NodeGuidance;
}): WorkflowStatusNode => ({
  id: opts.id,
  type: 'Status_Node',
  label: opts.label,
  icon: opts.icon,
  color: opts.color,
  statusId: opts.statusId,
  deadReason: opts.deadReason,
  guidance: opts.guidance,
});

const actionNode = (opts: {
  id: string;
  label: string;
  icon: string;
  color: StageColor;
  actionType: WorkflowActionNode['actionType'];
  templateId?: string;
  triggerDelay?: TimerDelay;
  guidance: NodeGuidance;
}): WorkflowActionNode => ({
  id: opts.id,
  type: 'Action_Node',
  label: opts.label,
  icon: opts.icon,
  color: opts.color,
  actionType: opts.actionType,
  templateId: opts.templateId,
  triggerDelay: opts.triggerDelay,
  guidance: opts.guidance,
});

const gateNode = (opts: {
  id: string;
  label: string;
  icon: string;
  color: StageColor;
  gateType: WorkflowLogicGateNode['gateType'];
  condition?: string;
  guidance: NodeGuidance;
}): WorkflowLogicGateNode => ({
  id: opts.id,
  type: 'Logic_Gate',
  label: opts.label,
  icon: opts.icon,
  color: opts.color,
  gateType: opts.gateType,
  condition: opts.condition,
  guidance: opts.guidance,
});

const edge = (from: string, to: string, strict_path: StrictPathType, label?: string): WorkflowEdge => ({
  id: `${from}__${strict_path}__${to}`,
  from,
  to,
  strict_path,
  label,
});

const schema = (opts: {
  id: string;
  name: string;
  description: string;
  entryNodeId: string;
  nodes: Array<WorkflowStatusNode | WorkflowActionNode | WorkflowLogicGateNode>;
  edges: WorkflowEdge[];
  tutorialSequence: string[];
}): WorkflowSchema => ({
  schemaVersion: 1,
  id: opts.id,
  name: opts.name,
  description: opts.description,
  entryNodeId: opts.entryNodeId,
  nodes: opts.nodes,
  edges: opts.edges,
  tutorialSequence: opts.tutorialSequence,
});

export const SCHEMA_PRESET_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📁' },
  { id: 'automotive', label: 'Automotive', icon: '🚗' },
  { id: 'saas', label: 'SaaS', icon: '🧩' },
  { id: 'real-estate', label: 'Real Estate', icon: '🏠' },
  { id: 'urgent-service', label: 'Urgent Service', icon: '🚨' },
  { id: 'event', label: 'Event', icon: '🎟️' },
  { id: 'outbound', label: 'Outbound', icon: '📨' },
] as const;

// -------------------------------------------------------------------------------------
// 1) High-Ticket Automotive (14-day multi-channel with intent branching)
// -------------------------------------------------------------------------------------
const highTicketAutomotive = (() => {
  const entry = statusNode({
    id: 'auto.entry.incoming',
    label: 'Incoming Lead',
    icon: '📥',
    color: 'blue',
    statusId: 'new',
    guidance: guidance(
      'Incoming Lead (Start)',
      [
        'Goal: respond within 5 minutes.',
        '',
        '- Confirm lead data (name, phone, email).',
        '- Start the first outreach sequence immediately.',
        '- If the lead is missing contact info, route to “Needs Info”.',
      ].join('\n'),
    ),
  });

  const actionCall1 = actionNode({
    id: 'auto.action.call1',
    label: 'SMS Reminder: Contact Lead (Attempt #1)',
    icon: '💬',
    color: 'yellow',
    actionType: 'sms',
    guidance: guidance(
      'Reminder: Contact Lead (Attempt #1)',
      [
        'This is an internal SMS reminder to you (not to the customer).',
        '',
        '- Manually call/contact the lead ASAP.',
        '- If you reached them: mark Contacted and continue.',
        '- If no answer: proceed to the email + wait loop.',
      ].join('\n'),
    ),
  });

  const statusContacted = statusNode({
    id: 'auto.status.contacted',
    label: 'Contacted',
    icon: '✅',
    color: 'teal',
    statusId: 'working',
    guidance: guidance(
      'Contacted',
      [
        'You made contact with the lead.',
        '',
        '- Confirm vehicle needs, budget, timeline.',
        '- Ask for best time to continue the conversation.',
      ].join('\n'),
    ),
  });

  const actionIntentGate = gateNode({
    id: 'auto.gate.intent',
    label: 'Intent Signal',
    icon: '🎯',
    color: 'purple',
    gateType: 'intent',
    condition: 'If reply indicates HIGH intent vs LOW intent',
    guidance: guidance(
      'Intent Signal (AI / Rules)',
      [
        'Classify the lead’s intent based on message content:',
        '',
        '- HIGH: wants pricing/appointment today',
        '- MED: browsing / comparing',
        '- LOW: no reply / vague',
      ].join('\n'),
    ),
  });

  const actionEmailFollow = actionNode({
    id: 'auto.action.email1',
    label: 'Send Follow-up Email',
    icon: '✉️',
    color: 'cyan',
    actionType: 'email',
    triggerDelay: delay(24, 'hours'),
    guidance: guidance(
      'Follow-up Email (24h)',
      [
        'Send a simple, high-signal follow-up email.',
        '',
        '- Include 2–3 options (or a question to narrow)',
        '- Ask 1 easy-to-answer question',
        '- Set the next reminder for 48–72 hours if no reply',
      ].join('\n'),
    ),
  });

  const actionWait4h = actionNode({
    id: 'auto.action.wait4h',
    label: 'Wait 4 hours',
    icon: '⏱️',
    color: 'slate',
    actionType: 'wait',
    triggerDelay: delay(4, 'hours'),
    guidance: guidance(
      'Wait 4 hours (Loop bubble)',
      [
        'This is a retry loop.',
        '',
        '- Wait 4 hours',
        '- Then attempt another manual outreach (attempt #2)',
      ].join('\n'),
    ),
  });

  const actionCall2 = actionNode({
    id: 'auto.action.call2',
    label: 'SMS Reminder: Contact Lead (Attempt #2)',
    icon: '💬',
    color: 'yellow',
    actionType: 'sms',
    guidance: guidance(
      'Reminder: Contact Lead (Attempt #2)',
      [
        'This is an internal SMS reminder to you (not to the customer).',
        '',
        '- Manually call/contact at a different time of day than attempt #1.',
        '- If no answer: route to the dead-zone or long-term nurture (your choice).',
      ].join('\n'),
    ),
  });

  const statusQualified = statusNode({
    id: 'auto.status.qualified',
    label: 'Qualified',
    icon: '🧾',
    color: 'emerald',
    statusId: 'working',
    guidance: guidance(
      'Qualified',
      [
        'Lead meets basic requirements.',
        '',
        '- Confirm financing needs.',
        '- Confirm preferred vehicle and alternatives.',
        '- Move to appointment scheduling.',
      ].join('\n'),
    ),
  });

  const actionSchedule = actionNode({
    id: 'auto.action.schedule',
    label: 'Schedule Appointment',
    icon: '📅',
    color: 'purple',
    actionType: 'notification',
    guidance: guidance(
      'Schedule Appointment',
      [
        'Schedule an appointment (manual).',
        '',
        '- Offer 2 time options.',
        '- Confirm location and expectations.',
      ].join('\n'),
    ),
  });

  const statusMeeting = statusNode({
    id: 'auto.status.meeting',
    label: 'Appointment Booked',
    icon: '📅',
    color: 'purple',
    statusId: 'working',
    guidance: guidance(
      'Appointment Booked',
      [
        'Appointment set.',
        '',
        '- Send confirmation and reminder.',
        '- Prepare inventory matches.',
      ].join('\n'),
    ),
  });

  const actionNoShowLoop = actionNode({
    id: 'auto.action.noshow',
    label: 'No-Show Re-engage',
    icon: '🔁',
    color: 'slate',
    actionType: 'sms',
    triggerDelay: delay(24, 'hours'),
    guidance: guidance(
      'No-Show Re-engage Loop',
      [
        'If they no-show, re-engage gently after 24 hours.',
        '',
        '- Offer a new time',
        '- Ask if they want a virtual option',
      ].join('\n'),
    ),
  });

  const actionClose = actionNode({
    id: 'auto.action.close',
    label: 'Close / Delivery',
    icon: '✅',
    color: 'emerald',
    actionType: 'notification',
    guidance: guidance(
      'Close / Delivery',
      [
        'Bridge step between “Appointment Booked” and “Closed Won”.',
        '',
        '- Confirm delivery details',
        '- Confirm paperwork',
        '- Confirm next steps',
      ].join('\n'),
    ),
  });

  const statusClosedWon = statusNode({
    id: 'auto.status.won',
    label: 'Closed Won',
    icon: '🏆',
    color: 'emerald',
    statusId: 'approval',
    guidance: guidance(
      'Closed Won',
      [
        'Deal completed.',
        '',
        '- Trigger post-sale follow-up',
        '- Request review + referral',
      ].join('\n'),
    ),
  });

  const deadNoResponse = statusNode({
    id: 'auto.dead.noresponse',
    label: 'Dead: No Response',
    icon: '⛔',
    color: 'red',
    statusId: 'dead',
    deadReason: 'no-contact',
    guidance: guidance(
      'Dead Zone: No Response',
      [
        'Lead did not respond after the full 14-day sequence.',
        '',
        '- Move to long-term nurture list',
        '- Do not spam; respect opt-out',
      ].join('\n'),
    ),
  });

  // Edges must respect: Status -> Action; Action -> Status
  const edges = [
    edge(entry.id, actionCall1.id, 'Success', 'Start outreach'),
    edge(actionCall1.id, statusContacted.id, 'Success', 'Answered'),
    edge(actionCall1.id, actionEmailFollow.id, 'Failure', 'No answer → email'),

    edge(statusContacted.id, actionIntentGate.id, 'Success', 'Classify intent'),
    edge(actionIntentGate.id, actionSchedule.id, 'Success', 'High intent → schedule'),
    edge(actionIntentGate.id, actionEmailFollow.id, 'Neutral', 'Medium intent → email'),
    edge(actionIntentGate.id, actionWait4h.id, 'Loop', 'Low/no reply → retry'),

    edge(actionEmailFollow.id, statusQualified.id, 'Success', 'Positive reply'),
    edge(actionEmailFollow.id, actionWait4h.id, 'Loop', 'No reply → wait'),

    edge(actionWait4h.id, actionCall2.id, 'Loop', 'Retry outreach'),
    edge(actionCall2.id, statusQualified.id, 'Success', 'Answered'),
    edge(actionCall2.id, deadNoResponse.id, 'Failure', 'No response → dead'),

    edge(statusQualified.id, actionSchedule.id, 'Success', 'Book appointment'),
    edge(actionSchedule.id, statusMeeting.id, 'Success', 'Booked'),
    edge(statusMeeting.id, actionNoShowLoop.id, 'Loop', 'If no-show'),
    edge(actionNoShowLoop.id, statusMeeting.id, 'Loop', 'Re-booked'),
    edge(statusMeeting.id, actionClose.id, 'Success', 'Ready to close'),
    edge(actionClose.id, statusClosedWon.id, 'Success', 'Completed'),
  ];

  return schema({
    id: 'schema.automotive.high-ticket',
    name: 'High-Ticket Automotive (14-Day)',
    description: 'Multi-channel outreach with intent branching, retry loops, and a clean dead-zone basement.',
    entryNodeId: entry.id,
    nodes: [
      entry,
      actionCall1,
      statusContacted,
      actionIntentGate,
      actionEmailFollow,
      actionWait4h,
      actionCall2,
      statusQualified,
      actionSchedule,
      statusMeeting,
      actionNoShowLoop,
      actionClose,
      statusClosedWon,
      deadNoResponse,
    ],
    edges,
    tutorialSequence: [
      entry.id,
      actionCall1.id,
      statusContacted.id,
      actionIntentGate.id,
      actionEmailFollow.id,
      statusQualified.id,
      actionSchedule.id,
      statusMeeting.id,
      statusClosedWon.id,
      deadNoResponse.id,
    ],
  });
})();

// -------------------------------------------------------------------------------------
// 2) SaaS Trial-to-Paid (feature adoption triggers)
// -------------------------------------------------------------------------------------
const saasTrialToPaid = (() => {
  const entry = statusNode({
    id: 'saas.entry.trial',
    label: 'Trial Started',
    icon: '🚀',
    color: 'blue',
    statusId: 'new',
    guidance: guidance('Trial Started', 'Goal: get the user to first value within 24 hours.'),
  });

  const actionWelcome = actionNode({
    id: 'saas.action.welcome',
    label: 'Send Welcome Email',
    icon: '✉️',
    color: 'cyan',
    actionType: 'email',
    guidance: guidance(
      'Welcome Email',
      [
        'Send onboarding email with 1 clear next step:',
        '',
        '- Link to “First Setup”',
        '- 2-minute video (optional)',
      ].join('\n'),
    ),
  });

  const statusOnboarded = statusNode({
    id: 'saas.status.onboarded',
    label: 'Onboarding Started',
    icon: '🧭',
    color: 'teal',
    statusId: 'working',
    guidance: guidance('Onboarding Started', 'Track whether they log in and complete setup.'),
  });

  const actionCheckLogin = gateNode({
    id: 'saas.gate.login',
    label: 'Logged In?',
    icon: '🔎',
    color: 'purple',
    gateType: 'condition',
    condition: 'If no login within 48 hours',
    guidance: guidance('Login Check', 'If no login after 48 hours, trigger re-engagement.'),
  });

  const actionReengage = actionNode({
    id: 'saas.action.reengage',
    label: 'Re-engagement Email',
    icon: '📨',
    color: 'yellow',
    actionType: 'email',
    triggerDelay: delay(48, 'hours'),
    guidance: guidance('Re-engagement', 'Short email: “Need help getting started?” + 1 CTA.'),
  });

  const statusActivated = statusNode({
    id: 'saas.status.activated',
    label: 'Activated (First Value)',
    icon: '✅',
    color: 'emerald',
    statusId: 'working',
    guidance: guidance('Activated', 'User hit first value milestone.'),
  });

  const actionUpgrade = actionNode({
    id: 'saas.action.upgrade',
    label: 'Upgrade Prompt',
    icon: '💳',
    color: 'emerald',
    actionType: 'notification',
    guidance: guidance('Upgrade Prompt', 'Ask for upgrade once activation achieved.'),
  });

  const statusPaid = statusNode({
    id: 'saas.status.paid',
    label: 'Paid Customer',
    icon: '🏆',
    color: 'emerald',
    statusId: 'approval',
    guidance: guidance('Paid Customer', 'Hand off to Customer Success + retention flow.'),
  });

  const deadExpired = statusNode({
    id: 'saas.dead.expired',
    label: 'Dead: Trial Expired',
    icon: '⛔',
    color: 'red',
    statusId: 'dead',
    deadReason: 'no-contact',
    guidance: guidance('Trial Expired', 'Move to a low-frequency nurture list.'),
  });

  const edges = [
    edge(entry.id, actionWelcome.id, 'Success'),
    edge(actionWelcome.id, statusOnboarded.id, 'Success'),
    edge(statusOnboarded.id, actionCheckLogin.id, 'Success'),
    edge(actionCheckLogin.id, statusActivated.id, 'Success', 'Logged in + setup'),
    edge(actionCheckLogin.id, actionReengage.id, 'Loop', 'No login → re-engage'),
    edge(actionReengage.id, actionCheckLogin.id, 'Loop', 'Re-check login'),
    edge(statusActivated.id, actionUpgrade.id, 'Success'),
    edge(actionUpgrade.id, statusPaid.id, 'Success'),
    edge(actionUpgrade.id, deadExpired.id, 'Failure', 'No upgrade → expire'),
  ];

  return schema({
    id: 'schema.saas.trial-to-paid',
    name: 'SaaS Trial → Paid',
    description: 'Feature-adoption triggers with re-engagement loops and a clean expiration path.',
    entryNodeId: entry.id,
    nodes: [entry, actionWelcome, statusOnboarded, actionCheckLogin, actionReengage, statusActivated, actionUpgrade, statusPaid, deadExpired],
    edges,
    tutorialSequence: [entry.id, actionWelcome.id, statusOnboarded.id, actionCheckLogin.id, statusActivated.id, actionUpgrade.id, statusPaid.id, deadExpired.id],
  });
})();

// -------------------------------------------------------------------------------------
// 3) Real Estate Long-Term Nurture (6-month loops + market reports)
// -------------------------------------------------------------------------------------
const realEstateNurture = (() => {
  const entry = statusNode({
    id: 're.entry.new',
    label: 'New Lead',
    icon: '📥',
    color: 'blue',
    statusId: 'new',
    guidance: guidance('New Lead', 'Respond fast, then start nurture loops if they aren’t ready.'),
  });

  const actionQualify = actionNode({
    id: 're.action.qualify',
    label: 'SMS Reminder: Qualification Outreach',
    icon: '💬',
    color: 'yellow',
    actionType: 'sms',
    guidance: guidance('Reminder: Qualification Outreach', 'Internal reminder to contact the lead and ask timeline, budget, and location preferences.'),
  });

  const statusNurture = statusNode({
    id: 're.status.nurture',
    label: 'Nurture',
    icon: '🌱',
    color: 'teal',
    statusId: 'circle-back',
    guidance: guidance('Nurture', 'Long-term relationship building with periodic value.'),
  });

  const actionMarketReport = actionNode({
    id: 're.action.market',
    label: 'Monthly Market Report',
    icon: '📈',
    color: 'yellow',
    actionType: 'email',
    triggerDelay: delay(1, 'months'),
    guidance: guidance('Monthly Market Report', 'Send market report + invite questions.'),
  });

  const actionCheckIn6mo = actionNode({
    id: 're.action.checkin6',
    label: 'SMS Reminder: 6-Month Check-In',
    icon: '💬',
    color: 'slate',
    actionType: 'sms',
    triggerDelay: delay(6, 'months'),
    guidance: guidance('Reminder: 6-Month Check-In', 'Internal reminder to personally check in and re-evaluate needs and readiness.'),
  });

  const statusAppointment = statusNode({
    id: 're.status.appt',
    label: 'Appointment Set',
    icon: '📅',
    color: 'purple',
    statusId: 'working',
    guidance: guidance('Appointment Set', 'Book showing / consultation.'),
  });

  const actionOfferPrep = actionNode({
    id: 're.action.offer',
    label: 'Prepare Offer',
    icon: '📝',
    color: 'emerald',
    actionType: 'notification',
    guidance: guidance('Prepare Offer', 'Collect docs and prepare the offer package.'),
  });

  const statusClosed = statusNode({
    id: 're.status.closed',
    label: 'Closed',
    icon: '🏆',
    color: 'emerald',
    statusId: 'approval',
    guidance: guidance('Closed', 'Celebrate and ask for a referral/review.'),
  });

  const deadNotInterested = statusNode({
    id: 're.dead.no',
    label: 'Dead: Not Interested',
    icon: '⛔',
    color: 'red',
    statusId: 'dead',
    deadReason: 'not-interested',
    guidance: guidance('Not Interested', 'Respect the decision. Keep only low-frequency opt-in content.'),
  });

  const edges = [
    edge(entry.id, actionQualify.id, 'Success'),
    edge(actionQualify.id, statusAppointment.id, 'Success', 'Ready now'),
    edge(actionQualify.id, statusNurture.id, 'Neutral', 'Not ready → nurture'),
    edge(statusNurture.id, actionMarketReport.id, 'Loop', 'Monthly loop'),
    edge(actionMarketReport.id, statusNurture.id, 'Loop', 'Continue nurture'),
    edge(statusNurture.id, actionCheckIn6mo.id, 'Loop', '6-month check-in'),
    edge(actionCheckIn6mo.id, statusAppointment.id, 'Success', 'Now ready'),
    edge(actionCheckIn6mo.id, deadNotInterested.id, 'Failure', 'Opt-out'),
    edge(statusAppointment.id, actionOfferPrep.id, 'Success'),
    edge(actionOfferPrep.id, statusClosed.id, 'Success'),
  ];

  return schema({
    id: 'schema.realestate.nurture',
    name: 'Real Estate Long-Term Nurture',
    description: 'Monthly value loops + 6-month check-ins that convert when timing is right.',
    entryNodeId: entry.id,
    nodes: [entry, actionQualify, statusNurture, actionMarketReport, actionCheckIn6mo, statusAppointment, actionOfferPrep, statusClosed, deadNotInterested],
    edges,
    tutorialSequence: [entry.id, actionQualify.id, statusNurture.id, actionMarketReport.id, actionCheckIn6mo.id, statusAppointment.id, actionOfferPrep.id, statusClosed.id, deadNotInterested.id],
  });
})();

// -------------------------------------------------------------------------------------
// 4) Emergency / Urgent Service (5-minute rapid response + escalation)
// -------------------------------------------------------------------------------------
const urgentService = (() => {
  const entry = statusNode({
    id: 'svc.entry.incoming',
    label: 'Incoming Request',
    icon: '🚨',
    color: 'red',
    statusId: 'new',
    guidance: guidance('Incoming Request', 'Goal: contact within 5 minutes and dispatch quickly.'),
  });

  const actionCall = actionNode({
    id: 'svc.action.call1',
    label: 'SMS Reminder: Contact Now',
    icon: '💬',
    color: 'orange',
    actionType: 'sms',
    guidance: guidance('Reminder: Contact Now', 'Internal reminder: contact the customer immediately. If no answer, start the rapid retry loop.'),
  });

  const actionRapidLoop = actionNode({
    id: 'svc.action.rapid',
    label: 'Wait 5 min → Retry',
    icon: '⏱️',
    color: 'slate',
    actionType: 'wait',
    triggerDelay: delay(5, 'minutes'),
    guidance: guidance('Rapid Loop', 'Retry every 5 minutes until contact or escalation.'),
  });

  const actionEscalate = actionNode({
    id: 'svc.action.escalate',
    label: 'Escalate to Agent #2',
    icon: '👥',
    color: 'purple',
    actionType: 'notification',
    guidance: guidance('Escalation', 'If the first outreach fails, notify a second agent to attempt contact.'),
  });

  const statusDispatched = statusNode({
    id: 'svc.status.dispatched',
    label: 'Dispatched',
    icon: '🚚',
    color: 'emerald',
    statusId: 'working',
    guidance: guidance('Dispatched', 'Team dispatched; keep customer informed.'),
  });

  const actionUpdateEmail = actionNode({
    id: 'svc.action.eta-email',
    label: 'Send ETA Email',
    icon: '✉️',
    color: 'yellow',
    actionType: 'email',
    guidance: guidance('ETA Email', 'Send ETA and what to expect (email).'),
  });

  const statusCompleted = statusNode({
    id: 'svc.status.done',
    label: 'Completed',
    icon: '✅',
    color: 'emerald',
    statusId: 'approval',
    guidance: guidance('Completed', 'Job completed. Trigger review request.'),
  });

  const deadNoContact = statusNode({
    id: 'svc.dead.nocontact',
    label: 'Dead: No Contact',
    icon: '⛔',
    color: 'red',
    statusId: 'dead',
    deadReason: 'no-contact',
    guidance: guidance('No Contact', 'Could not reach customer after retries and escalation.'),
  });

  const edges = [
    edge(entry.id, actionCall.id, 'Success'),
    edge(actionCall.id, statusDispatched.id, 'Success', 'Answered'),
    edge(actionCall.id, actionRapidLoop.id, 'Loop', 'No answer'),
    edge(actionRapidLoop.id, actionCall.id, 'Loop', 'Retry outreach'),
    edge(actionRapidLoop.id, actionEscalate.id, 'Neutral', 'Escalate'),
    edge(actionEscalate.id, statusDispatched.id, 'Success', 'Agent #2 reached'),
    edge(actionEscalate.id, deadNoContact.id, 'Failure', 'Still no contact'),
    edge(statusDispatched.id, actionUpdateEmail.id, 'Success'),
    edge(actionUpdateEmail.id, statusCompleted.id, 'Success'),
  ];

  return schema({
    id: 'schema.service.urgent',
    name: 'Emergency / Urgent Service',
    description: '5-minute rapid response loops with escalation and clean termination.',
    entryNodeId: entry.id,
    nodes: [entry, actionCall, actionRapidLoop, actionEscalate, statusDispatched, actionUpdateEmail, statusCompleted, deadNoContact],
    edges,
    tutorialSequence: [entry.id, actionCall.id, actionRapidLoop.id, actionEscalate.id, statusDispatched.id, actionUpdateEmail.id, statusCompleted.id, deadNoContact.id],
  });
})();

// -------------------------------------------------------------------------------------
// 5) Event / Webinar Funnel (pre reminders → attendance → post follow-up branching)
// -------------------------------------------------------------------------------------
const webinarFunnel = (() => {
  const entry = statusNode({
    id: 'evt.entry.registered',
    label: 'Registered',
    icon: '📝',
    color: 'blue',
    statusId: 'new',
    guidance: guidance('Registered', 'Send reminders and confirm attendance.'),
  });

  const actionReminder1 = actionNode({
    id: 'evt.action.rem1',
    label: 'Reminder (24h)',
    icon: '⏱️',
    color: 'yellow',
    actionType: 'email',
    triggerDelay: delay(24, 'hours'),
    guidance: guidance('Reminder 24h', 'Send reminder with calendar link.'),
  });

  const statusReady = statusNode({
    id: 'evt.status.ready',
    label: 'Ready for Event',
    icon: '📅',
    color: 'purple',
    statusId: 'working',
    guidance: guidance('Ready', 'Final reminder + attendance check.'),
  });

  const actionAttendGate = gateNode({
    id: 'evt.gate.attend',
    label: 'Attended?',
    icon: '🎥',
    color: 'purple',
    gateType: 'decision',
    condition: 'Attendance check from webinar platform',
    guidance: guidance('Attendance Check', 'Branch: Attendee vs No-Show.'),
  });

  const actionFollowAttendee = actionNode({
    id: 'evt.action.attendee',
    label: 'Attendee Follow-up',
    icon: '📨',
    color: 'emerald',
    actionType: 'email',
    guidance: guidance('Attendee Follow-up', 'Send slides + a CTA to book an appointment.'),
  });

  const actionFollowNoShow = actionNode({
    id: 'evt.action.noshow',
    label: 'No-Show Follow-up',
    icon: '📼',
    color: 'slate',
    actionType: 'email',
    guidance: guidance('No-Show Follow-up', 'Send replay link + “want a recap?” CTA.'),
  });

  const statusQualified = statusNode({
    id: 'evt.status.qualified',
    label: 'Qualified',
    icon: '✅',
    color: 'emerald',
    statusId: 'working',
    guidance: guidance('Qualified', 'They engaged post-event and want next steps.'),
  });

  const statusDead = statusNode({
    id: 'evt.dead.cold',
    label: 'Dead: Cold',
    icon: '⛔',
    color: 'red',
    statusId: 'dead',
    deadReason: 'no-contact',
    guidance: guidance('Cold', 'No engagement after reminders and follow-ups.'),
  });

  const edges = [
    edge(entry.id, actionReminder1.id, 'Success'),
    edge(actionReminder1.id, statusReady.id, 'Success'),
    edge(statusReady.id, actionAttendGate.id, 'Success'),
    edge(actionAttendGate.id, actionFollowAttendee.id, 'Success', 'Attended'),
    edge(actionAttendGate.id, actionFollowNoShow.id, 'Failure', 'No-show'),
    edge(actionFollowAttendee.id, statusQualified.id, 'Success'),
    edge(actionFollowNoShow.id, statusQualified.id, 'Neutral', 'Replayed / asked'),
    edge(actionFollowNoShow.id, statusDead.id, 'Failure', 'No engagement'),
  ];

  return schema({
    id: 'schema.event.webinar',
    name: 'Event / Webinar Funnel',
    description: 'Reminders → attendance branch → tailored follow-up with clear conversion path.',
    entryNodeId: entry.id,
    nodes: [entry, actionReminder1, statusReady, actionAttendGate, actionFollowAttendee, actionFollowNoShow, statusQualified, statusDead],
    edges,
    tutorialSequence: [entry.id, actionReminder1.id, statusReady.id, actionAttendGate.id, actionFollowAttendee.id, actionFollowNoShow.id, statusQualified.id, statusDead.id],
  });
})();

// -------------------------------------------------------------------------------------
// 6) Cold Outbound (Strict Compliance + opt-out routing to dead zone)
// -------------------------------------------------------------------------------------
const coldOutboundCompliance = (() => {
  const entry = statusNode({
    id: 'out.entry.prospect',
    label: 'Prospect Imported',
    icon: '📥',
    color: 'blue',
    statusId: 'new',
    guidance: guidance('Prospect Imported', 'Validate consent and verify addresses before sending.'),
  });

  const actionVerify = actionNode({
    id: 'out.action.verify',
    label: 'Verify Email + Consent',
    icon: '🛡️',
    color: 'slate',
    actionType: 'notification',
    guidance: guidance(
      'Verification',
      [
        'Compliance checks:',
        '',
        '- Valid email format',
        '- Consent / lawful basis',
        '- Suppression list / opt-out list',
      ].join('\n'),
    ),
  });

  const statusVerified = statusNode({
    id: 'out.status.verified',
    label: 'Verified',
    icon: '✅',
    color: 'emerald',
    statusId: 'working',
    guidance: guidance('Verified', 'Only verified prospects enter the sequence.'),
  });

  const actionEmail1 = actionNode({
    id: 'out.action.email1',
    label: 'Email #1',
    icon: '✉️',
    color: 'cyan',
    actionType: 'email',
    guidance: guidance('Email #1', 'Short email, 1 question, opt-out language included.'),
  });

  const actionWait2d = actionNode({
    id: 'out.action.wait2d',
    label: 'Wait 2 days',
    icon: '⏱️',
    color: 'slate',
    actionType: 'wait',
    triggerDelay: delay(2, 'days'),
    guidance: guidance('Wait', 'Pause between touches (compliance + deliverability).'),
  });

  const actionEmail2 = actionNode({
    id: 'out.action.email2',
    label: 'Email #2',
    icon: '✉️',
    color: 'cyan',
    actionType: 'email',
    guidance: guidance('Email #2', 'Follow-up with a single new value point.'),
  });

  const statusEngaged = statusNode({
    id: 'out.status.engaged',
    label: 'Engaged',
    icon: '💬',
    color: 'yellow',
    statusId: 'working',
    guidance: guidance('Engaged', 'They replied or clicked, route to qualification.'),
  });

  const actionQualify = actionNode({
    id: 'out.action.qualify',
    label: 'SMS Reminder: Qualification Outreach',
    icon: '💬',
    color: 'yellow',
    actionType: 'sms',
    guidance: guidance('Reminder: Qualification Outreach', 'Internal reminder: confirm need, timeline, and fit (manual contact).'),
  });

  const statusConverted = statusNode({
    id: 'out.status.converted',
    label: 'Converted',
    icon: '🏆',
    color: 'emerald',
    statusId: 'approval',
    guidance: guidance('Converted', 'Hand off to onboarding / fulfillment.'),
  });

  const deadOptOut = statusNode({
    id: 'out.dead.optout',
    label: 'Dead: Opt-out',
    icon: '⛔',
    color: 'red',
    statusId: 'dead',
    deadReason: 'not-interested',
    guidance: guidance('Opt-out', 'Immediately suppress future outreach to this contact.'),
  });

  const edges = [
    edge(entry.id, actionVerify.id, 'Success'),
    edge(actionVerify.id, statusVerified.id, 'Success'),
    edge(actionVerify.id, deadOptOut.id, 'Failure', 'Not compliant'),
    edge(statusVerified.id, actionEmail1.id, 'Success'),
    edge(actionEmail1.id, actionWait2d.id, 'Neutral'),
    edge(actionWait2d.id, actionEmail2.id, 'Neutral'),
    edge(actionEmail2.id, statusEngaged.id, 'Success', 'Replied'),
    edge(actionEmail2.id, deadOptOut.id, 'Failure', 'Opt-out'),
    edge(statusEngaged.id, actionQualify.id, 'Success'),
    edge(actionQualify.id, statusConverted.id, 'Success'),
  ];

  return schema({
    id: 'schema.outbound.compliance',
    name: 'Cold Outbound (Compliance)',
    description: 'Verified-only outreach with strict opt-out routing into the dead-zone basement.',
    entryNodeId: entry.id,
    nodes: [entry, actionVerify, statusVerified, actionEmail1, actionWait2d, actionEmail2, statusEngaged, actionQualify, statusConverted, deadOptOut],
    edges,
    tutorialSequence: [entry.id, actionVerify.id, statusVerified.id, actionEmail1.id, actionEmail2.id, statusEngaged.id, actionQualify.id, statusConverted.id, deadOptOut.id],
  });
})();

export const ALL_SCHEMA_PRESETS: SchemaPreset[] = [
  {
    id: 'robust-automotive',
    name: 'High-Ticket Automotive',
    description: '14-day multi-channel outreach with intent branching, retry loops, and clean dead-zone routing.',
    icon: '🚗',
    complexity: 'enterprise',
    category: 'automotive',
    estimatedSetupTime: '30–45 min',
    features: ['State-machine schema', 'Intent branching', 'Retry loops', 'Dead-zone basement'],
    schema: highTicketAutomotive,
  },
  {
    id: 'robust-saas',
    name: 'SaaS Trial-to-Paid',
    description: 'Adoption triggers with re-engagement and expiry routing.',
    icon: '🧩',
    complexity: 'advanced',
    category: 'saas',
    estimatedSetupTime: '20–30 min',
    features: ['Activation milestones', 'Re-engagement loop', 'Upgrade trigger'],
    schema: saasTrialToPaid,
  },
  {
    id: 'robust-realestate',
    name: 'Real Estate Long-Term Nurture',
    description: 'Monthly market report loop + 6-month check-in for long-cycle buyers/sellers.',
    icon: '🏠',
    complexity: 'enterprise',
    category: 'real-estate',
    estimatedSetupTime: '25–40 min',
    features: ['Monthly value loop', '6-month check-in', 'Appointment conversion'],
    schema: realEstateNurture,
  },
  {
    id: 'robust-urgent',
    name: 'Emergency / Urgent Service',
    description: '5-minute rapid response retry loop with escalation to a second agent.',
    icon: '🚨',
    complexity: 'advanced',
    category: 'urgent-service',
    estimatedSetupTime: '15–25 min',
    features: ['Rapid retry loop', 'Escalation path', 'Dispatch updates'],
    schema: urgentService,
  },
  {
    id: 'robust-event',
    name: 'Event / Webinar Funnel',
    description: 'Reminder sequence → attendance branch → tailored follow-up.',
    icon: '🎟️',
    complexity: 'standard',
    category: 'event',
    estimatedSetupTime: '15–25 min',
    features: ['Attendance branching', 'Replay follow-up', 'Qualification path'],
    schema: webinarFunnel,
  },
  {
    id: 'robust-outbound',
    name: 'Cold Outbound (Strict Compliance)',
    description: 'Verified-only sequences with opt-out routing into the dead zone.',
    icon: '📨',
    complexity: 'enterprise',
    category: 'outbound',
    estimatedSetupTime: '20–30 min',
    features: ['Verification gate', 'Opt-out suppression', 'Compliance-first'],
    schema: coldOutboundCompliance,
  },
];


