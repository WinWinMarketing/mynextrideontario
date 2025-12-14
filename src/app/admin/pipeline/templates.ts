// Comprehensive Templates Library - Fully Categorized & Organized
export interface MessageTemplate {
  id: string;
  category: 'email' | 'sms' | 'call' | 'meeting' | 'notification';
  useCase: string;
  name: string;
  subject?: string;
  message: string;
  icon: string;
  timing?: string;
  tags?: string[];
}

// ============ EMAIL TEMPLATES - EXTENSIVE ============
export const EMAIL_TEMPLATES: MessageTemplate[] = [
  // ===== FIRST CONTACT / WELCOME =====
  { id: 'email-welcome-1', category: 'email', useCase: 'First Contact', name: 'Welcome - Warm & Friendly', icon: '👋', tags: ['welcome', 'warm'],
    subject: 'Welcome to My Next Ride Ontario, {{name}}!',
    message: `Hi {{name}},

Thank you for reaching out! I'm excited to help you find your perfect vehicle.

I noticed you're interested in a {{vehicle}}. With access to 17 lenders and a wide dealer network, we'll find options that fit your budget.

I'll review your application and reach out within 24 hours with personalized options.

Best regards,
My Next Ride Ontario` },
  
  { id: 'email-welcome-2', category: 'email', useCase: 'First Contact', name: 'Welcome - Professional', icon: '💼', tags: ['welcome', 'professional'],
    subject: 'Your Vehicle Search - {{name}}',
    message: `Dear {{name}},

Thank you for your inquiry. We've received your application and our team is reviewing it now.

Based on your requirements for a {{vehicle}}, we'll identify suitable options from our network.

Expect to hear from us within 24 hours.

Professional regards,
My Next Ride Ontario Team` },

  { id: 'email-welcome-3', category: 'email', useCase: 'First Contact', name: 'Welcome - Quick Response', icon: '⚡', tags: ['welcome', 'fast'],
    subject: 'Got your request! - My Next Ride',
    message: `Hey {{name}}!

Just got your application - super excited to help!

Quick question: Are you flexible on the {{vehicle}}, or is that exactly what you're looking for?

Let me know and I'll start searching right away!

Talk soon,
My Next Ride Ontario` },

  { id: 'email-welcome-4', category: 'email', useCase: 'First Contact', name: 'Welcome - Value Focused', icon: '💰', tags: ['welcome', 'value'],
    subject: '{{name}}, let\'s find you a great deal',
    message: `Hi {{name}},

Thanks for choosing My Next Ride Ontario!

I specialize in finding great vehicles at even better prices. With your budget of {{budget}}, I'm confident we can find something amazing.

Here's what happens next:
1. I'll search our inventory and partner network
2. Compare financing options from 17+ lenders
3. Present you with the best options within 24 hours

Any specific features you absolutely need?

Best,
My Next Ride Ontario` },

  // ===== FOLLOW UP =====
  { id: 'email-followup-24h', category: 'email', useCase: 'Follow Up', name: 'Follow Up - 24 Hours', icon: '🔄', timing: '24h', tags: ['followup', 'gentle'],
    subject: 'Quick update on your vehicle search',
    message: `Hi {{name}},

Just following up on my previous message about your vehicle search.

I've been looking into options for the {{vehicle}} you mentioned and have a few possibilities.

Would you have a few minutes for a quick call this week?

Best,
My Next Ride Ontario` },

  { id: 'email-followup-48h', category: 'email', useCase: 'Follow Up', name: 'Follow Up - 48 Hours', icon: '📧', timing: '48h', tags: ['followup', 'check-in'],
    subject: 'Still looking for your {{vehicle}}?',
    message: `Hey {{name}},

I wanted to check back in - are you still searching for a {{vehicle}}?

I have some new options that just came in that might be perfect for you.

Let me know if you'd like to discuss!

Cheers,
My Next Ride Ontario` },

  { id: 'email-followup-72h', category: 'email', useCase: 'Follow Up', name: 'Follow Up - 72 Hours', icon: '📨', timing: '72h', tags: ['followup', 'options'],
    subject: 'Some options for you, {{name}}',
    message: `Hi {{name}},

I've put together a few options that match what you're looking for. Would love to walk you through them.

Are you available for a quick 10-minute call today or tomorrow?

Just reply with a time that works!

Best,
My Next Ride Ontario` },

  { id: 'email-followup-1week', category: 'email', useCase: 'Follow Up', name: 'Follow Up - 1 Week', icon: '📅', timing: '1 week', tags: ['followup', 'weekly'],
    subject: 'Checking in, {{name}}',
    message: `Hi {{name}},

It's been about a week since we connected. I wanted to see if anything has changed with your vehicle search.

The market moves fast, and I may have new options that weren't available before.

Would love to catch up when you have a moment.

Best,
My Next Ride Ontario` },

  { id: 'email-followup-2week', category: 'email', useCase: 'Follow Up', name: 'Follow Up - 2 Weeks', icon: '📆', timing: '2 weeks', tags: ['followup', 'biweekly'],
    subject: 'Any updates on your vehicle search?',
    message: `Hey {{name}},

Just wanted to touch base - it's been a couple weeks since we last spoke.

Still in the market for a {{vehicle}}? The landscape has changed a bit and there might be some new opportunities.

Happy to help whenever you're ready!

Best,
My Next Ride Ontario` },

  // ===== GENTLE REMINDER =====
  { id: 'email-gentle-1', category: 'email', useCase: 'Gentle Reminder', name: 'Gentle Check-In', icon: '💭', tags: ['reminder', 'soft'],
    subject: 'Just checking in...',
    message: `Hi {{name}},

Hope all is well! I just wanted to touch base and see how your vehicle search is going.

No pressure at all - just wanted you to know I'm here if you need anything.

Take care,
My Next Ride Ontario` },

  { id: 'email-gentle-2', category: 'email', useCase: 'Gentle Reminder', name: 'Still Here to Help', icon: '🤝', tags: ['reminder', 'helpful'],
    subject: 'Still here when you need us',
    message: `Hey {{name}},

I know things can get busy, so I just wanted to send a quick note.

Whenever you're ready to continue your vehicle search, I'm here to help. No rush!

Best wishes,
My Next Ride Ontario` },

  { id: 'email-gentle-3', category: 'email', useCase: 'Gentle Reminder', name: 'Quick Hello', icon: '👋', tags: ['reminder', 'casual'],
    subject: 'Quick hello from My Next Ride',
    message: `Hi {{name}},

Just a quick hello! Wanted to see if you had any questions about your vehicle search.

I'm around if you need anything at all.

Cheers!
My Next Ride Ontario` },

  // ===== CLOSING / READY TO BUY =====
  { id: 'email-closing-1', category: 'email', useCase: 'Closing', name: 'Found Your Match!', icon: '🎯', tags: ['closing', 'match'],
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

  { id: 'email-closing-2', category: 'email', useCase: 'Closing', name: 'Ready to Move Forward', icon: '🏆', tags: ['closing', 'ready'],
    subject: 'Let\'s get you into your new vehicle!',
    message: `{{name}},

Everything is lined up and ready to go!

I have your {{vehicle}} secured and the financing approved. All we need is to set up a time for you to come see it.

When works best for you? I can make myself available.

Let's make this happen!
My Next Ride Ontario` },

  { id: 'email-closing-3', category: 'email', useCase: 'Closing', name: 'Special Opportunity', icon: '✨', tags: ['closing', 'urgent'],
    subject: 'Special opportunity - {{name}}',
    message: `Hi {{name}},

I wanted to reach out personally because I have something special.

A {{vehicle}} just became available that's perfect for your situation. The price and financing are better than anything I've seen in weeks.

This one won't last long. Can you come see it today or tomorrow?

Let me know!
My Next Ride Ontario` },

  // ===== RE-ENGAGEMENT =====
  { id: 'email-reengage-1', category: 'email', useCase: 'Re-engagement', name: 'Been a While', icon: '🔁', tags: ['reengage', 'reconnect'],
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

  { id: 'email-reengage-2', category: 'email', useCase: 'Re-engagement', name: 'New Opportunities', icon: '✨', tags: ['reengage', 'new'],
    subject: 'New options available, {{name}}',
    message: `Hey {{name}},

Just wanted to let you know we have some exciting new inventory that might be perfect for you.

Things change fast in this market, and something that wasn't possible before might be now.

Worth a quick chat?

Cheers,
My Next Ride Ontario` },

  { id: 'email-reengage-3', category: 'email', useCase: 'Re-engagement', name: 'Market Update', icon: '📊', tags: ['reengage', 'update'],
    subject: 'Market update for you, {{name}}',
    message: `Hi {{name}},

Quick market update that might interest you:

- {{vehicle}} prices have changed recently
- New financing promotions are available
- Inventory is better than it was when we last spoke

If your situation has changed too, let's reconnect!

Best,
My Next Ride Ontario` },

  // ===== POST PURCHASE =====
  { id: 'email-postsale-1week', category: 'email', useCase: 'Post Purchase', name: '1 Week Check-In', icon: '🎉', timing: '1 week', tags: ['postsale', 'checkin'],
    subject: 'How\'s your new {{vehicle}}?',
    message: `Hi {{name}},

Congratulations again on your new {{vehicle}}! 🎉

I wanted to check in and see how everything is going. Any questions about your vehicle?

If you ever need anything - service recommendations, questions about features - I'm always here to help.

Enjoy the ride!
My Next Ride Ontario` },

  { id: 'email-postsale-1month', category: 'email', useCase: 'Post Purchase', name: '1 Month Check-In', icon: '📆', timing: '1 month', tags: ['postsale', 'referral'],
    subject: 'One month with your {{vehicle}}!',
    message: `Hey {{name}},

Can you believe it's been a month already?

Just checking in to see how you're enjoying your {{vehicle}}. By now you've probably discovered all the features!

If you have any friends or family looking for a vehicle, I'd love to help them too. 

Drive safe!
My Next Ride Ontario` },

  { id: 'email-postsale-3month', category: 'email', useCase: 'Post Purchase', name: '3 Month Check-In', icon: '🔧', timing: '3 months', tags: ['postsale', 'service'],
    subject: '3 months already! - {{vehicle}}',
    message: `Hi {{name}},

Time flies! You've had your {{vehicle}} for 3 months now.

Just wanted to check if everything's still running smoothly. If you need any service recommendations, I know some great shops.

Also, if anyone you know is in the market, send them my way! I take great care of referrals.

Best,
My Next Ride Ontario` },

  { id: 'email-postsale-6month', category: 'email', useCase: 'Post Purchase', name: '6 Month Check-In', icon: '📅', timing: '6 months', tags: ['postsale', 'milestone'],
    subject: '6 month milestone with your {{vehicle}}',
    message: `Hey {{name}},

Happy 6 month anniversary with your {{vehicle}}!

By now you're probably a pro with it. Everything still going well?

If you're ever thinking about upgrading or adding another vehicle to the family, let me know. I'm always here to help!

Drive safe,
My Next Ride Ontario` },

  { id: 'email-postsale-1year', category: 'email', useCase: 'Post Purchase', name: '1 Year Anniversary', icon: '🎂', timing: '1 year', tags: ['postsale', 'anniversary'],
    subject: 'Happy 1 Year Anniversary, {{name}}!',
    message: `Hi {{name}},

Happy anniversary with your {{vehicle}}! 🎂

It's been a whole year already. I hope it's been treating you well!

If you're ever thinking about upgrading, trading in, or know someone who needs a vehicle, I'm always here.

Thank you for being a valued customer!

Best,
My Next Ride Ontario` },

  // ===== MEETING RELATED =====
  { id: 'email-meeting-confirm', category: 'email', useCase: 'Meeting', name: 'Confirm Appointment', icon: '📅', tags: ['meeting', 'confirm'],
    subject: 'Confirming our meeting, {{name}}',
    message: `Hi {{name}},

Just confirming our meeting scheduled for [DATE/TIME].

I'll have the {{vehicle}} ready for you to see. If you need directions or have any questions beforehand, just let me know!

Looking forward to it!

Best,
My Next Ride Ontario` },

  { id: 'email-meeting-reminder', category: 'email', useCase: 'Meeting', name: 'Meeting Reminder', icon: '🔔', tags: ['meeting', 'reminder'],
    subject: 'Reminder: We\'re meeting tomorrow!',
    message: `Hi {{name}},

Quick reminder that we're meeting tomorrow at [TIME].

Everything is set up and ready. Can't wait to show you what I've found!

See you soon,
My Next Ride Ontario` },

  { id: 'email-meeting-reschedule', category: 'email', useCase: 'Meeting', name: 'Reschedule Request', icon: '📆', tags: ['meeting', 'reschedule'],
    subject: 'Quick reschedule request - {{name}}',
    message: `Hi {{name}},

I hope this message finds you well. I wanted to see if we could reschedule our meeting?

What times work best for you this week? I'm pretty flexible and want to make sure we find a time that works for both of us.

Let me know!
My Next Ride Ontario` },

  { id: 'email-meeting-postmeeting', category: 'email', useCase: 'Meeting', name: 'Post-Meeting Follow Up', icon: '🤝', tags: ['meeting', 'followup'],
    subject: 'Great meeting you, {{name}}!',
    message: `Hi {{name}},

It was great meeting you today! Thanks for taking the time to come see the {{vehicle}}.

As discussed, here are the next steps:
- I'll finalize the financing details
- Get the paperwork ready
- Touch base tomorrow to confirm everything

Any questions in the meantime, just reach out!

Best,
My Next Ride Ontario` },
];

// ============ SMS TEMPLATES - EXTENSIVE ============
export const SMS_TEMPLATES: MessageTemplate[] = [
  // ===== INTERNAL SMS REMINDERS (to yourself / your team) =====
  // NOTE: In this system, SMS nodes are NOT sent to the customer. They are reminders to YOU.
  { id: 'sms-intro-1', category: 'sms', useCase: 'Reminder', name: 'Reminder: Contact New Lead (5 min)', icon: '🔔', tags: ['reminder', 'new', 'speed'],
    message: `REMINDER: New lead "{{name}}"\n\n✅ Contact within 5 minutes\n- Review basics: vehicle, budget, timeline\n- Add quick notes after outreach` },

  { id: 'sms-intro-2', category: 'sms', useCase: 'Reminder', name: 'Reminder: Send Welcome Email', icon: '✉️', tags: ['reminder', 'email'],
    message: `REMINDER: Send welcome email to {{name}}\n\n- Include next steps\n- Ask 1 clarifying question\n- Set follow-up timer (24h)` },

  { id: 'sms-intro-3', category: 'sms', useCase: 'Reminder', name: 'Reminder: Inventory Check', icon: '🚗', tags: ['reminder', 'inventory'],
    message: `REMINDER: Check inventory for {{name}}\n\n- Vehicle interest: {{vehicle}}\n- Budget: {{budget}}\n- Prepare 3 options + 1 alternative` },

  { id: 'sms-intro-4', category: 'sms', useCase: 'Reminder', name: 'Reminder: Qualification Notes', icon: '🧾', tags: ['reminder', 'qualify'],
    message: `REMINDER: Qualify {{name}}\n\n- Timeline\n- Budget/payment comfort\n- Trade-in?\n- Must-have features\n\nLog notes in the lead profile.` },

  // ===== FOLLOW-UP REMINDERS =====
  { id: 'sms-followup-1', category: 'sms', useCase: 'Follow Up', name: 'Follow Up: 24h Check-in', icon: '⏱️', tags: ['followup', '24h'],
    message: `FOLLOW-UP (24h): {{name}}\n\n- Send quick check-in email\n- If no reply: schedule 48h reminder` },

  { id: 'sms-followup-2', category: 'sms', useCase: 'Follow Up', name: 'Follow Up: 48h Second Touch', icon: '📨', tags: ['followup', '48h'],
    message: `FOLLOW-UP (48h): {{name}}\n\n- Send a value email (new options / new angle)\n- Ask 1 simple question to reply` },

  { id: 'sms-followup-3', category: 'sms', useCase: 'Follow Up', name: 'Follow Up: 72h Final Ping', icon: '✅', tags: ['followup', '72h'],
    message: `FOLLOW-UP (72h): {{name}}\n\n- Send final “still looking?” email\n- If no response: route to nurture or dead-zone` },

  { id: 'sms-followup-4', category: 'sms', useCase: 'Reminder', name: 'Reminder: Book Appointment Options', icon: '📅', tags: ['reminder', 'appointment'],
    message: `REMINDER: Offer appointment options to {{name}}\n\nGive 2 time options + confirm location.\nThen update status to “Appointment Booked”.` },

  { id: 'sms-followup-5', category: 'sms', useCase: 'Reminder', name: 'Reminder: Update Lead Notes', icon: '📝', tags: ['reminder', 'notes'],
    message: `REMINDER: Update notes for {{name}}\n\n- What they want\n- Objections\n- Next step + date\n\nThis keeps the pipeline clean.` },

  // ===== URGENT / HOT =====
  { id: 'sms-urgent-1', category: 'sms', useCase: 'Urgent', name: 'Hot Deal', icon: '🔥', tags: ['urgent', 'deal'],
    message: `{{name}}! Found something perfect for you - won't last long! Can you call me ASAP?` },

  { id: 'sms-urgent-2', category: 'sms', useCase: 'Urgent', name: 'Time Sensitive', icon: '⚡', tags: ['urgent', 'time'],
    message: `Hey {{name}}, I have a {{vehicle}} that just came in - exactly what you wanted. Available today!` },

  { id: 'sms-urgent-3', category: 'sms', useCase: 'Urgent', name: 'Price Drop', icon: '💵', tags: ['urgent', 'price'],
    message: `{{name}}! Price just dropped on a {{vehicle}} I was holding for you. Interested?` },

  { id: 'sms-urgent-4', category: 'sms', useCase: 'Urgent', name: 'Last Chance', icon: '⏰', tags: ['urgent', 'last'],
    message: `{{name}}, that {{vehicle}} you liked has another buyer interested. Want me to hold it for you?` },

  // ===== MEETING =====
  { id: 'sms-meeting-confirm', category: 'sms', useCase: 'Meeting', name: 'Confirm Appointment', icon: '📅', tags: ['meeting', 'confirm'],
    message: `Hi {{name}}, confirming our meeting tomorrow. Looking forward to showing you some great options!` },

  { id: 'sms-meeting-reminder', category: 'sms', useCase: 'Meeting', name: 'Reminder 1 Hour', icon: '🔔', tags: ['meeting', 'reminder'],
    message: `Reminder: We have an appointment in 1 hour! See you soon 🚗` },

  { id: 'sms-meeting-onway', category: 'sms', useCase: 'Meeting', name: 'On Your Way?', icon: '🚗', tags: ['meeting', 'check'],
    message: `Hey {{name}}, just checking if you're still on your way? I've got everything ready for you!` },

  { id: 'sms-meeting-reschedule', category: 'sms', useCase: 'Meeting', name: 'Reschedule', icon: '📆', tags: ['meeting', 'reschedule'],
    message: `{{name}}, no problem if you need to reschedule. What day/time works better for you?` },

  // ===== POST SALE =====
  { id: 'sms-postsale-thanks', category: 'sms', useCase: 'Post Sale', name: 'Thank You', icon: '🎉', tags: ['postsale', 'thanks'],
    message: `{{name}}, congrats on your new ride! 🎉 If you ever need anything, don't hesitate to reach out!` },

  { id: 'sms-postsale-checkin', category: 'sms', useCase: 'Post Sale', name: 'Check In', icon: '👋', tags: ['postsale', 'checkin'],
    message: `Hey {{name}}! How's the {{vehicle}} treating you? Any questions?` },

  { id: 'sms-postsale-referral', category: 'sms', useCase: 'Post Sale', name: 'Ask Referral', icon: '🤝', tags: ['postsale', 'referral'],
    message: `Hey {{name}}! How's the {{vehicle}} treating you? If you know anyone looking for a car, send them my way! 🙏` },

  { id: 'sms-postsale-service', category: 'sms', useCase: 'Post Sale', name: 'Service Reminder', icon: '🔧', tags: ['postsale', 'service'],
    message: `Hi {{name}}! Just a friendly reminder - your {{vehicle}} might be due for its first service. Need any recommendations?` },

  // ===== RE-ENGAGEMENT =====
  { id: 'sms-reengage-1', category: 'sms', useCase: 'Re-engagement', name: 'Miss You', icon: '👋', tags: ['reengage', 'friendly'],
    message: `{{name}}! Been a while. Still in the market? Got some new options that might interest you!` },

  { id: 'sms-reengage-2', category: 'sms', useCase: 'Re-engagement', name: 'New Inventory', icon: '✨', tags: ['reengage', 'new'],
    message: `Hey {{name}}, new vehicles just came in. Anything specific you're looking for now?` },

  { id: 'sms-reengage-3', category: 'sms', useCase: 'Re-engagement', name: 'Special Offer', icon: '🎁', tags: ['reengage', 'offer'],
    message: `{{name}}, we have some special financing offers right now. Want me to check if you qualify?` },
];

// ============ CALL SCRIPTS ============
export const CALL_TEMPLATES: MessageTemplate[] = [
  { id: 'call-intro', category: 'call', useCase: 'First Contact', name: 'Introduction Script', icon: '📞', tags: ['intro', 'opener'],
    message: `"Hi {{name}}, this is [Your Name] from My Next Ride Ontario. I'm calling about your application for a {{vehicle}}. Do you have a few minutes to chat about what you're looking for?"

KEY POINTS:
• Be warm and friendly
• Confirm they have time
• Ask open-ended questions
• Listen actively` },

  { id: 'call-followup', category: 'call', useCase: 'Follow Up', name: 'Follow Up Script', icon: '🔄', tags: ['followup', 'reconnect'],
    message: `"Hey {{name}}, it's [Your Name] from My Next Ride. Just following up on our conversation about the {{vehicle}}. Have you had a chance to think it over?"

IF YES:
• "Great! What questions do you have?"
• "What's holding you back from moving forward?"

IF NO:
• "No problem, I know things get busy. Quick update - I found some options I think you'll love. Can we chat for 5 minutes?"` },

  { id: 'call-qualify', category: 'call', useCase: 'Qualification', name: 'Qualifying Questions', icon: '✅', tags: ['qualify', 'questions'],
    message: `KEY QUALIFICATION QUESTIONS:

1. TIMELINE
"What's your timeline for getting a vehicle?"

2. TRADE-IN
"Do you have a current vehicle to trade in?"

3. PRIORITIES
"What's most important - price, features, or brand?"

4. FINANCING
"Have you been pre-approved anywhere else?"

5. DECISION MAKER
"Will anyone else be involved in the decision?"

6. BUDGET
"What monthly payment would be comfortable for you?"` },

  { id: 'call-objection', category: 'call', useCase: 'Objection Handling', name: 'Common Objections', icon: '💪', tags: ['objection', 'handling'],
    message: `COMMON OBJECTIONS & RESPONSES:

"Just looking"
→ "No problem! What would make you ready to move forward?"

"Price too high"
→ "I understand. Let me see what creative financing options we have. What monthly payment works for your budget?"

"Need to think about it"
→ "Of course! What specific concerns can I address to help you decide?"

"Talking to other dealers"
→ "That's smart! What would make us your first choice?"

"Bad credit"
→ "I work with 17 lenders specifically for situations like this. Let's see what we can do."

"No money down"
→ "We have zero-down options. Let me check your eligibility."` },

  { id: 'call-close', category: 'call', useCase: 'Closing', name: 'Closing Script', icon: '🎯', tags: ['closing', 'deal'],
    message: `"{{name}}, based on everything we discussed, I think this {{vehicle}} is perfect for you. The financing works, the features match what you need. What do you say we get the paperwork started today?"

TRIAL CLOSES:
• "How does this sound so far?"
• "Can you see yourself in this vehicle?"
• "If everything checks out, are you ready to move forward?"

ASSUMPTIVE CLOSE:
• "When would you like to come pick it up - this week or next?"
• "Should I get the paperwork started now?"` },

  { id: 'call-voicemail', category: 'call', useCase: 'Voicemail', name: 'Voicemail Scripts', icon: '📱', tags: ['voicemail', 'message'],
    message: `VOICEMAIL SCRIPT 1 - Intro:
"Hi {{name}}, this is [Name] from My Next Ride Ontario. I received your application and I'm excited to help you find your {{vehicle}}. Give me a call back at [NUMBER] or text me. Talk soon!"

VOICEMAIL SCRIPT 2 - Follow Up:
"Hey {{name}}, just checking in. I found some great options for you. Call or text me at [NUMBER] when you get a chance. Thanks!"

VOICEMAIL SCRIPT 3 - Urgent:
"{{name}}, it's [Name]. I have something you'll want to see - call me back as soon as you can at [NUMBER]. Thanks!"

KEEP IT:
• Under 30 seconds
• Energetic but professional
• Clear callback number` },

  { id: 'call-testdrive', category: 'call', useCase: 'Test Drive', name: 'Test Drive Setup', icon: '🚗', tags: ['testdrive', 'setup'],
    message: `"{{name}}, I'd love to get you behind the wheel of the {{vehicle}}. What time works best for you to come in for a test drive?"

DURING TEST DRIVE:
• Point out features they mentioned wanting
• Let them experience the vehicle
• Ask how it feels
• Address any concerns

AFTER TEST DRIVE:
• "So, what did you think?"
• "Could you see yourself driving this every day?"
• "Ready to talk numbers?"` },
];

// ============ MEETING TEMPLATES ============
export const MEETING_TEMPLATES: MessageTemplate[] = [
  { id: 'meeting-video-invite', category: 'meeting', useCase: 'Video Call', name: 'Video Call Invite', icon: '📹', tags: ['video', 'invite'],
    message: `Hi {{name}}, I'd love to show you some options via video call. Here's my calendar link: [LINK]. Pick a time that works for you!

For the call, I'll:
• Walk you through available inventory
• Show you photos/videos of specific vehicles
• Explain financing options
• Answer all your questions` },

  { id: 'meeting-office-invite', category: 'meeting', useCase: 'Office Visit', name: 'Office Visit Invite', icon: '🏢', tags: ['office', 'invite'],
    message: `{{name}}, would you like to come by our office? I can have several vehicles ready for you to look at. What time works best?

Our address: [ADDRESS]
What to bring:
• Driver's license
• Proof of income (if financing)
• Trade-in info (if applicable)` },

  { id: 'meeting-testdrive', category: 'meeting', useCase: 'Test Drive', name: 'Test Drive Setup', icon: '🚗', tags: ['testdrive', 'schedule'],
    message: `Ready for a test drive, {{name}}? I've got the {{vehicle}} all set up. Just let me know when you can come by!

Test drives usually take about 20-30 minutes. I'll be there to answer any questions and help you get comfortable with the vehicle.` },

  { id: 'meeting-phone', category: 'meeting', useCase: 'Phone Call', name: 'Schedule Call', icon: '📱', tags: ['phone', 'schedule'],
    message: `Let's set up a call, {{name}}. I'm available:
• Today: [TIMES]
• Tomorrow: [TIMES]
• [DAY]: [TIMES]

What works for you? Just reply with a time!` },

  { id: 'meeting-prep', category: 'meeting', useCase: 'Preparation', name: 'What to Bring', icon: '📋', tags: ['prep', 'checklist'],
    message: `For your visit, please bring:

REQUIRED:
✅ Valid driver's license

IF FINANCING:
✅ Proof of income (pay stubs, bank statements)
✅ Proof of address (utility bill, bank statement)

IF TRADING IN:
✅ Current vehicle title
✅ Registration
✅ All sets of keys

IF PURCHASING:
✅ Down payment method

See you soon!` },

  { id: 'meeting-virtual-tour', category: 'meeting', useCase: 'Virtual Tour', name: 'Virtual Vehicle Tour', icon: '📲', tags: ['virtual', 'tour'],
    message: `{{name}}, can't make it in person? No problem!

I can do a live video tour of the {{vehicle}} for you. I'll show you:
• Exterior condition
• Interior features
• Engine bay
• Mileage and details
• Any specific areas you want to see

When would work for a 15-minute video call?` },
];

// ============ NOTIFICATION TEMPLATES ============
export const NOTIFICATION_TEMPLATES: MessageTemplate[] = [
  // Reminders
  { id: 'notif-call-reminder', category: 'notification', useCase: 'Reminder', name: 'Call Lead', icon: '📞', tags: ['reminder', 'call'],
    message: `Time to call {{name}} - {{phone}}` },

  { id: 'notif-followup-due', category: 'notification', useCase: 'Reminder', name: 'Follow Up Due', icon: '🔔', tags: ['reminder', 'followup'],
    message: `Follow up with {{name}} - been {{days}} days since last contact` },

  { id: 'notif-meeting-reminder', category: 'notification', useCase: 'Reminder', name: 'Meeting Soon', icon: '📅', tags: ['reminder', 'meeting'],
    message: `Meeting with {{name}} in 1 hour` },

  { id: 'notif-meeting-15min', category: 'notification', useCase: 'Reminder', name: 'Meeting 15 Min', icon: '⏰', tags: ['reminder', 'meeting'],
    message: `Meeting with {{name}} starts in 15 minutes!` },

  { id: 'notif-task-due', category: 'notification', useCase: 'Reminder', name: 'Task Due', icon: '✅', tags: ['reminder', 'task'],
    message: `Task due: {{task}} for {{name}}` },

  // Alerts
  { id: 'notif-hot-lead', category: 'notification', useCase: 'Alert', name: 'Hot Lead Alert', icon: '🔥', tags: ['alert', 'hot'],
    message: `HOT LEAD: {{name}} just submitted an application - respond immediately!` },

  { id: 'notif-email-opened', category: 'notification', useCase: 'Alert', name: 'Email Opened', icon: '👁️', tags: ['alert', 'engagement'],
    message: `{{name}} opened your email - good time to follow up!` },

  { id: 'notif-link-clicked', category: 'notification', useCase: 'Alert', name: 'Link Clicked', icon: '🔗', tags: ['alert', 'engagement'],
    message: `{{name}} clicked a link in your email - they're interested!` },

  { id: 'notif-no-response', category: 'notification', useCase: 'Alert', name: 'No Response', icon: '⚠️', tags: ['alert', 'warning'],
    message: `{{name}} hasn't responded in 3 days - try different approach` },

  { id: 'notif-going-cold', category: 'notification', useCase: 'Alert', name: 'Going Cold', icon: '❄️', tags: ['alert', 'warning'],
    message: `{{name}} is going cold - been 7 days without contact` },

  { id: 'notif-deadline', category: 'notification', useCase: 'Alert', name: 'Deadline Approaching', icon: '⏳', tags: ['alert', 'deadline'],
    message: `Deadline: {{name}}'s financing approval expires in 24 hours` },

  // Success
  { id: 'notif-deal-won', category: 'notification', useCase: 'Success', name: 'Deal Won', icon: '🎉', tags: ['success', 'win'],
    message: `CONGRATS! {{name}} just signed - deal closed!` },

  { id: 'notif-referral', category: 'notification', useCase: 'Success', name: 'New Referral', icon: '🤝', tags: ['success', 'referral'],
    message: `New referral from {{name}}! Check your inbox.` },

  // System
  { id: 'notif-daily-summary', category: 'notification', useCase: 'System', name: 'Daily Summary', icon: '📊', tags: ['system', 'summary'],
    message: `Daily Summary: {{new}} new leads, {{followups}} follow-ups due, {{meetings}} meetings today` },

  { id: 'notif-weekly-report', category: 'notification', useCase: 'System', name: 'Weekly Report', icon: '📈', tags: ['system', 'report'],
    message: `Weekly Report: {{closed}} deals closed, {{value}} total value, {{conversion}}% conversion rate` },
];

// ============ DEAD LEAD TEMPLATES ============
export const DEAD_LEAD_TEMPLATES: MessageTemplate[] = [
  { id: 'dead-not-interested', category: 'email', useCase: 'Dead Lead', name: 'Lost Interest - Future Check', icon: '💭', tags: ['dead', 'future'],
    message: `Hi {{name}},

I understand if the timing isn't right. No worries at all!

I'll check back in a few months in case your situation changes. In the meantime, if you know anyone looking for a vehicle, feel free to send them my way.

Best wishes,
My Next Ride Ontario` },

  { id: 'dead-competitor', category: 'email', useCase: 'Dead Lead', name: 'Went Competitor - Stay Connected', icon: '🏃', tags: ['dead', 'competitor'],
    message: `Hi {{name}},

I heard you found something elsewhere - congrats on your new vehicle!

If you ever need anything in the future - service recommendations, trade-in value, or another vehicle - don't hesitate to reach out. I'm always here to help.

All the best,
My Next Ride Ontario` },

  { id: 'dead-timing', category: 'email', useCase: 'Dead Lead', name: 'Bad Timing - Future Reminder', icon: '⏰', tags: ['dead', 'timing'],
    message: `Hi {{name}},

Totally understand - timing is everything! I'll make a note to follow up in a few months when things might be different.

If anything changes sooner, you know where to find me.

Best,
My Next Ride Ontario` },

  { id: 'dead-budget', category: 'email', useCase: 'Dead Lead', name: 'Budget Issue - Options Available', icon: '💰', tags: ['dead', 'budget'],
    message: `Hi {{name}},

I understand budget constraints can be challenging. But don't give up - situations change, and I work with lenders who specialize in all types of credit.

Keep my number handy. When the time is right, I'll be here to help make it happen.

Best,
My Next Ride Ontario` },
];

// ============ ALL TEMPLATES ============
export const ALL_TEMPLATES = {
  email: EMAIL_TEMPLATES,
  sms: SMS_TEMPLATES,
  call: CALL_TEMPLATES,
  meeting: MEETING_TEMPLATES,
  notification: NOTIFICATION_TEMPLATES,
  deadLead: DEAD_LEAD_TEMPLATES,
};

export const TEMPLATE_CATEGORIES = [
  { id: 'email', label: 'Email', icon: '✉️', count: EMAIL_TEMPLATES.length, description: 'Email templates for all stages' },
  { id: 'sms', label: 'SMS Reminders (Internal)', icon: '💬', count: SMS_TEMPLATES.length, description: 'Internal reminders to you (not sent to the lead)' },
  { id: 'call', label: 'Call Scripts (Manual)', icon: '📞', count: CALL_TEMPLATES.length, description: 'Manual call scripts (not automation)' },
  { id: 'meeting', label: 'Meeting', icon: '📅', count: MEETING_TEMPLATES.length, description: 'Meeting setup and prep' },
  { id: 'notification', label: 'Alerts', icon: '🔔', count: NOTIFICATION_TEMPLATES.length, description: 'Notification templates' },
  { id: 'deadLead', label: 'Dead Leads', icon: '💀', count: DEAD_LEAD_TEMPLATES.length, description: 'Dead lead recovery' },
];

export const USE_CASES = [
  'First Contact', 'Follow Up', 'Gentle Reminder', 'Urgent', 'Closing', 
  'Re-engagement', 'Post Purchase', 'Meeting', 'Qualification', 
  'Objection Handling', 'Reminder', 'Alert', 'Post Sale', 'Dead Lead',
  'Video Call', 'Office Visit', 'Test Drive', 'Voicemail', 'System', 'Success'
];

// Helper to get templates by use case
export const getTemplatesByUseCase = (useCase: string) => {
  return [
    ...EMAIL_TEMPLATES.filter(t => t.useCase === useCase),
    ...SMS_TEMPLATES.filter(t => t.useCase === useCase),
    ...CALL_TEMPLATES.filter(t => t.useCase === useCase),
    ...MEETING_TEMPLATES.filter(t => t.useCase === useCase),
    ...NOTIFICATION_TEMPLATES.filter(t => t.useCase === useCase),
    ...DEAD_LEAD_TEMPLATES.filter(t => t.useCase === useCase),
  ];
};

// Helper to get templates by category and use case
export const getFilteredTemplates = (category: string, useCase: string) => {
  const categoryTemplates = ALL_TEMPLATES[category as keyof typeof ALL_TEMPLATES] || [];
  if (useCase === 'all') return categoryTemplates;
  return categoryTemplates.filter(t => t.useCase === useCase);
};
