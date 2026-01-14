// Email templates system (for copy/paste into Gmail/Outlook)
// No email sending functionality - templates only

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'follow-up' | 'approval' | 'reminder' | 'custom';
  createdAt: string;
  isDefault?: boolean;
}

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome / Initial Follow Up',
    subject: 'Thanks for your interest, {{name}}!',
    category: 'follow-up',
    isDefault: true,
    body: `Thank you for reaching out about your vehicle needs! I wanted to personally follow up on your application.

Based on your preferences:
• Vehicle: {{vehicle}}
• Budget: {{budget}}
• Timeline: {{urgency}}

I have several options that might be perfect for you. When would be a good time to chat?

Looking forward to connecting with you!`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'approval',
    name: 'Approval Notification',
    subject: 'Great news about your vehicle financing, {{name}}!',
    category: 'approval',
    isDefault: true,
    body: `Great news! After reviewing your application, I am pleased to let you know that we have financing options available for you.

Your Application Details:
• Desired Vehicle: {{vehicle}}
• Budget: {{budget}}
• Credit Profile: {{credit}}

Let us schedule a time to discuss the next steps and get you into your new ride!

What time works best for a quick call?`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reminder-24h',
    name: 'Gentle Reminder (24 Hours)',
    subject: 'Quick follow up, {{name}}',
    category: 'reminder',
    isDefault: true,
    body: `Hi {{name}},

I hope this message finds you well! I wanted to follow up on your vehicle inquiry from yesterday.

Are you still interested in finding your next {{vehicle}}? I am here to help make the process as smooth as possible.

Just reply to this email or give me a call whenever you are ready!`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reminder-week',
    name: 'Weekly Check In',
    subject: 'Still thinking about your next vehicle, {{name}}?',
    category: 'reminder',
    isDefault: true,
    body: `Hi {{name}},

It has been about a week since you reached out about finding a {{vehicle}}. I wanted to check in and see if you had any questions or if your needs have changed.

We are still here to help whenever you are ready! Our 17 lender network means we can work with most credit situations.

Feel free to reach out anytime.`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'circle-back',
    name: 'Circle Back',
    subject: 'Checking in, {{name}}',
    category: 'reminder',
    isDefault: true,
    body: `Hi {{name}},

I am circling back on your vehicle application. I understand life gets busy and timing is everything when it comes to a big decision like getting a new vehicle.

If your situation has changed or you have any questions, I am just an email or phone call away.

No pressure, just want to make sure you have all the support you need when you are ready!`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'thank-you',
    name: 'Thank You (Post Purchase)',
    subject: 'Thank you for choosing us, {{name}}!',
    category: 'custom',
    isDefault: true,
    body: `Congratulations on your new {{vehicle}}!

We are thrilled we could help you find the perfect vehicle. It was a pleasure working with you.

If you have any questions about your vehicle or financing, do not hesitate to reach out. We are always here to help.

Also, if you know anyone else looking for their next ride, we would love a referral! Word of mouth from happy customers like you is the best compliment we can receive.

Enjoy the new wheels!`,
    createdAt: new Date().toISOString(),
  },
];
