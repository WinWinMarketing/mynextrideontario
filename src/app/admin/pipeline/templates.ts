// Comprehensive Templates Library
export interface MessageTemplate {
  id: string;
  category: 'email' | 'sms' | 'call' | 'meeting' | 'notification';
  useCase: string;
  name: string;
  subject?: string;
  message: string;
  icon: string;
  timing?: string;
}

// ============ EMAIL TEMPLATES ============
export const EMAIL_TEMPLATES: MessageTemplate[] = [
  // Welcome / First Contact
  { id: 'email-welcome-1', category: 'email', useCase: 'First Contact', name: 'Welcome - Warm', icon: '👋',
    subject: 'Welcome to My Next Ride Ontario, {{name}}!',
    message: `Hi {{name}},

Thank you for reaching out! I'm excited to help you find your perfect vehicle.

I noticed you're interested in a {{vehicle}}. With access to 17 lenders and a wide dealer network, we'll find options that fit your budget.

I'll review your application and reach out within 24 hours with personalized options.

Best regards,
My Next Ride Ontario` },
  
  { id: 'email-welcome-2', category: 'email', useCase: 'First Contact', name: 'Welcome - Professional', icon: '💼',
    subject: 'Your Vehicle Search - {{name}}',
    message: `Dear {{name}},

Thank you for your inquiry. We've received your application and our team is reviewing it now.

Based on your requirements for a {{vehicle}}, we'll identify suitable options from our network.

Expect to hear from us within 24 hours.

Professional regards,
My Next Ride Ontario Team` },

  // Follow Up
  { id: 'email-followup-24h', category: 'email', useCase: 'Follow Up', name: 'Follow Up - 24 Hours', icon: '🔄', timing: '24h',
    subject: 'Quick update on your vehicle search',
    message: `Hi {{name}},

Just following up on my previous message about your vehicle search.

I've been looking into options for the {{vehicle}} you mentioned and have a few possibilities.

Would you have a few minutes for a quick call this week?

Best,
My Next Ride Ontario` },

  { id: 'email-followup-48h', category: 'email', useCase: 'Follow Up', name: 'Follow Up - 48 Hours', icon: '📧', timing: '48h',
    subject: 'Still looking for your {{vehicle}}?',
    message: `Hey {{name}},

I wanted to check back in - are you still searching for a {{vehicle}}?

I have some new options that just came in that might be perfect for you.

Let me know if you'd like to discuss!

Cheers,
My Next Ride Ontario` },

  { id: 'email-followup-1week', category: 'email', useCase: 'Follow Up', name: 'Follow Up - 1 Week', icon: '📅', timing: '1 week',
    subject: 'Checking in, {{name}}',
    message: `Hi {{name}},

It's been about a week since we connected. I wanted to see if anything has changed with your vehicle search.

The market moves fast, and I may have new options that weren't available before.

Would love to catch up when you have a moment.

Best,
My Next Ride Ontario` },

  // Gentle Reminder
  { id: 'email-gentle-1', category: 'email', useCase: 'Gentle Reminder', name: 'Gentle Check-In', icon: '💭',
    subject: 'Just checking in...',
    message: `Hi {{name}},

Hope all is well! I just wanted to touch base and see how your vehicle search is going.

No pressure at all - just wanted you to know I'm here if you need anything.

Take care,
My Next Ride Ontario` },

  { id: 'email-gentle-2', category: 'email', useCase: 'Gentle Reminder', name: 'Still Here to Help', icon: '🤝',
    subject: 'Still here when you need us',
    message: `Hey {{name}},

I know things can get busy, so I just wanted to send a quick note.

Whenever you're ready to continue your vehicle search, I'm here to help. No rush!

Best wishes,
My Next Ride Ontario` },

  // Closing / Ready to Buy
  { id: 'email-closing-1', category: 'email', useCase: 'Closing', name: 'Found Your Match!', icon: '🎯',
    subject: 'Great news about your {{vehicle}}!',
    message: `Hi {{name}},

I have some exciting news! I've found a {{vehicle}} that matches exactly what you're looking for.

Here are the details:
- Vehicle: {{vehicle}}
- Financing: Options starting from {{budget}}/month
- Down Payment: Flexible

Can we schedule a call or meeting to discuss next steps?

Best,
My Next Ride Ontario` },

  { id: 'email-closing-2', category: 'email', useCase: 'Closing', name: 'Ready to Move Forward', icon: '🏆',
    subject: 'Let\'s get you into your new vehicle!',
    message: `{{name}},

Everything is lined up and ready to go!

I have your {{vehicle}} secured and the financing approved. All we need is to set up a time for you to come see it.

When works best for you? I can make myself available.

Let's make this happen!
My Next Ride Ontario` },

  // Re-engagement
  { id: 'email-reengage-1', category: 'email', useCase: 'Re-engagement', name: 'Been a While', icon: '🔁',
    subject: 'It\'s been a while, {{name}}!',
    message: `Hi {{name}},

It's been some time since we last connected about your vehicle search.

I wanted to reach out because:
- The market has new inventory
- There may be better financing now
- I have some options I think you'd love

If you're still interested, I'd love to reconnect. No pressure!

Best,
My Next Ride Ontario` },

  { id: 'email-reengage-2', category: 'email', useCase: 'Re-engagement', name: 'New Opportunities', icon: '✨',
    subject: 'New options available, {{name}}',
    message: `Hey {{name}},

Just wanted to let you know we have some exciting new inventory that might be perfect for you.

Things change fast in this market, and something that wasn't possible before might be now.

Worth a quick chat?

Cheers,
My Next Ride Ontario` },

  // Post Purchase
  { id: 'email-postsale-1week', category: 'email', useCase: 'Post Purchase', name: '1 Week Check-In', icon: '🎉', timing: '1 week',
    subject: 'How\'s your new {{vehicle}}?',
    message: `Hi {{name}},

Congratulations again on your new {{vehicle}}! 🎉

I wanted to check in and see how everything is going. Any questions about your vehicle?

If you ever need anything - service recommendations, questions about features - I'm always here to help.

Enjoy the ride!
My Next Ride Ontario` },

  { id: 'email-postsale-1month', category: 'email', useCase: 'Post Purchase', name: '1 Month Check-In', icon: '📆', timing: '1 month',
    subject: 'One month with your {{vehicle}}!',
    message: `Hey {{name}},

Can you believe it's been a month already?

Just checking in to see how you're enjoying your {{vehicle}}. By now you've probably discovered all the features!

If you have any friends or family looking for a vehicle, I'd love to help them too. 

Drive safe!
My Next Ride Ontario` },

  { id: 'email-postsale-1year', category: 'email', useCase: 'Post Purchase', name: '1 Year Anniversary', icon: '🎂', timing: '1 year',
    subject: 'Happy 1 Year Anniversary, {{name}}!',
    message: `Hi {{name}},

Happy anniversary with your {{vehicle}}! 🎂

It's been a whole year already. I hope it's been treating you well!

If you're ever thinking about upgrading, trading in, or know someone who needs a vehicle, I'm always here.

Thank you for being a valued customer!

Best,
My Next Ride Ontario` },
];

// ============ SMS TEMPLATES ============
export const SMS_TEMPLATES: MessageTemplate[] = [
  // First Contact
  { id: 'sms-intro-1', category: 'sms', useCase: 'First Contact', name: 'Introduction', icon: '👋',
    message: `Hi {{name}}, this is from My Next Ride Ontario! I saw your application for a {{vehicle}} and wanted to reach out. When's a good time to chat?` },

  { id: 'sms-intro-2', category: 'sms', useCase: 'First Contact', name: 'Quick Hello', icon: '📱',
    message: `Hey {{name}}! Thanks for your inquiry. I have some great options for you. Can I call you today?` },

  // Follow Up
  { id: 'sms-followup-1', category: 'sms', useCase: 'Follow Up', name: 'Quick Check', icon: '🔄',
    message: `Hi {{name}}, just checking in on your vehicle search. Any questions I can help with?` },

  { id: 'sms-followup-2', category: 'sms', useCase: 'Follow Up', name: 'Missed Call', icon: '📞',
    message: `Hey {{name}}, tried calling earlier. Let me know when you're free to chat about your {{vehicle}}!` },

  { id: 'sms-followup-3', category: 'sms', useCase: 'Follow Up', name: 'Gentle Nudge', icon: '💭',
    message: `{{name}}, still interested in finding your perfect vehicle? I'm here when you're ready 🚗` },

  // Urgent
  { id: 'sms-urgent-1', category: 'sms', useCase: 'Urgent', name: 'Hot Deal', icon: '🔥',
    message: `{{name}}! Found something perfect for you - won't last long! Can you call me ASAP?` },

  { id: 'sms-urgent-2', category: 'sms', useCase: 'Urgent', name: 'Time Sensitive', icon: '⚡',
    message: `Hey {{name}}, I have a {{vehicle}} that just came in - exactly what you wanted. Available today!` },

  // Meeting
  { id: 'sms-meeting-confirm', category: 'sms', useCase: 'Meeting', name: 'Confirm Appointment', icon: '📅',
    message: `Hi {{name}}, confirming our meeting tomorrow. Looking forward to showing you some great options!` },

  { id: 'sms-meeting-reminder', category: 'sms', useCase: 'Meeting', name: 'Reminder', icon: '🔔',
    message: `Reminder: We have an appointment today! See you soon 🚗` },

  // Post Sale
  { id: 'sms-postsale-thanks', category: 'sms', useCase: 'Post Sale', name: 'Thank You', icon: '🎉',
    message: `{{name}}, congrats on your new ride! 🎉 If you ever need anything, don't hesitate to reach out!` },

  { id: 'sms-postsale-referral', category: 'sms', useCase: 'Post Sale', name: 'Ask Referral', icon: '🤝',
    message: `Hey {{name}}! How's the {{vehicle}} treating you? If you know anyone looking for a car, send them my way! 🙏` },
];

// ============ CALL SCRIPTS ============
export const CALL_TEMPLATES: MessageTemplate[] = [
  { id: 'call-intro', category: 'call', useCase: 'First Contact', name: 'Introduction Script', icon: '📞',
    message: `"Hi {{name}}, this is [Your Name] from My Next Ride Ontario. I'm calling about your application for a {{vehicle}}. Do you have a few minutes to chat about what you're looking for?"` },

  { id: 'call-followup', category: 'call', useCase: 'Follow Up', name: 'Follow Up Script', icon: '🔄',
    message: `"Hey {{name}}, it's [Your Name] from My Next Ride. Just following up on our conversation about the {{vehicle}}. Have you had a chance to think it over?"` },

  { id: 'call-qualify', category: 'call', useCase: 'Qualification', name: 'Qualifying Questions', icon: '✅',
    message: `Key questions to ask:
• What's your timeline for getting a vehicle?
• Do you have a trade-in?
• What's most important - price, features, or brand?
• Have you been pre-approved anywhere else?` },

  { id: 'call-objection', category: 'call', useCase: 'Objection Handling', name: 'Common Objections', icon: '💪',
    message: `"Just looking" → "No problem! What would make you ready to move forward?"
"Price too high" → "Let me see what creative financing options we have"
"Need to think" → "Of course! What specific concerns can I address?"` },

  { id: 'call-close', category: 'call', useCase: 'Closing', name: 'Closing Script', icon: '🎯',
    message: `"{{name}}, based on everything we discussed, I think this {{vehicle}} is perfect for you. The financing works, the features match what you need. What do you say we get the paperwork started today?"` },
];

// ============ MEETING TEMPLATES ============
export const MEETING_TEMPLATES: MessageTemplate[] = [
  { id: 'meeting-video-invite', category: 'meeting', useCase: 'Video Call', name: 'Video Call Invite', icon: '📹',
    message: `Hi {{name}}, I'd love to show you some options via video call. Here's my calendar link: [LINK]. Pick a time that works for you!` },

  { id: 'meeting-office-invite', category: 'meeting', useCase: 'Office Visit', name: 'Office Visit Invite', icon: '🏢',
    message: `{{name}}, would you like to come by our office? I can have several vehicles ready for you to look at. What time works best?` },

  { id: 'meeting-testdrive', category: 'meeting', useCase: 'Test Drive', name: 'Test Drive Setup', icon: '🚗',
    message: `Ready for a test drive, {{name}}? I've got the {{vehicle}} all set up. Just let me know when you can come by!` },

  { id: 'meeting-phone', category: 'meeting', useCase: 'Phone Call', name: 'Schedule Call', icon: '📱',
    message: `Let's set up a call, {{name}}. I'm free [TIME OPTIONS]. What works for you?` },

  { id: 'meeting-prep', category: 'meeting', useCase: 'Preparation', name: 'What to Bring', icon: '📋',
    message: `For your visit, please bring:
• Driver's license
• Proof of income (if financing)
• Trade-in info (if applicable)
• Down payment (if ready to purchase)

See you soon!` },
];

// ============ NOTIFICATION TEMPLATES ============
export const NOTIFICATION_TEMPLATES: MessageTemplate[] = [
  { id: 'notif-call-reminder', category: 'notification', useCase: 'Reminder', name: 'Call Lead', icon: '📞',
    message: `Time to call {{name}} - {{phone}}` },

  { id: 'notif-followup-due', category: 'notification', useCase: 'Reminder', name: 'Follow Up Due', icon: '🔔',
    message: `Follow up with {{name}} - been {{days}} days since last contact` },

  { id: 'notif-meeting-reminder', category: 'notification', useCase: 'Reminder', name: 'Meeting Soon', icon: '📅',
    message: `Meeting with {{name}} in 1 hour` },

  { id: 'notif-hot-lead', category: 'notification', useCase: 'Alert', name: 'Hot Lead Alert', icon: '🔥',
    message: `HOT LEAD: {{name}} just submitted an application - respond immediately!` },

  { id: 'notif-email-opened', category: 'notification', useCase: 'Alert', name: 'Email Opened', icon: '👁️',
    message: `{{name}} opened your email - good time to follow up!` },

  { id: 'notif-no-response', category: 'notification', useCase: 'Alert', name: 'No Response', icon: '⚠️',
    message: `{{name}} hasn't responded in 3 days - try different approach` },
];

// ============ ALL TEMPLATES ============
export const ALL_TEMPLATES = {
  email: EMAIL_TEMPLATES,
  sms: SMS_TEMPLATES,
  call: CALL_TEMPLATES,
  meeting: MEETING_TEMPLATES,
  notification: NOTIFICATION_TEMPLATES,
};

export const TEMPLATE_CATEGORIES = [
  { id: 'email', label: 'Email', icon: '✉️', count: EMAIL_TEMPLATES.length },
  { id: 'sms', label: 'SMS', icon: '💬', count: SMS_TEMPLATES.length },
  { id: 'call', label: 'Call Scripts', icon: '📞', count: CALL_TEMPLATES.length },
  { id: 'meeting', label: 'Meeting', icon: '📅', count: MEETING_TEMPLATES.length },
  { id: 'notification', label: 'Alerts', icon: '🔔', count: NOTIFICATION_TEMPLATES.length },
];

export const USE_CASES = ['First Contact', 'Follow Up', 'Gentle Reminder', 'Urgent', 'Closing', 'Re-engagement', 'Post Purchase', 'Meeting', 'Qualification', 'Objection Handling', 'Reminder', 'Alert', 'Post Sale'];
