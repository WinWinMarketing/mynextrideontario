import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Lead } from './validation';

// AWS SES Configuration
const getSESClient = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ AWS credentials not configured');
    return null;
  }

  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
};

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'testing@winwinmarketingtesting2.com';
const TO_EMAIL = process.env.SES_TO_EMAIL || 'winwinmarketingcanada@gmail.com';

function formatBudget(formData: Lead['formData']): string {
  if (formData.paymentType === 'finance') {
    const map: Record<string, string> = {
      '400-or-less': 'Under $400/month',
      '400-500': '$400-500/month',
      '500-600': '$500-600/month',
      '600-plus': 'Over $600/month',
    };
    return map[formData.financeBudget || ''] || 'Not specified';
  } else {
    const map: Record<string, string> = {
      '15k-or-less': 'Under $15,000',
      '20-30k': '$20,000-$30,000',
      '30-45k': '$30,000-$45,000',
      '50k-plus': 'Over $50,000',
    };
    return map[formData.cashBudget || ''] || 'Not specified';
  }
}

function formatVehicleType(type: string): string {
  const map: Record<string, string> = {
    sedan: 'Sedan', suv: 'SUV', hatchback: 'Hatchback',
    'coupe-convertible': 'Coupe / Convertible', truck: 'Truck', minivan: 'Minivan',
  };
  return map[type] || type;
}

function formatUrgency(urgency: string): string {
  const map: Record<string, string> = {
    'right-away': 'Right away',
    'few-weeks': 'Within a few weeks',
    'few-months': 'Within a few months',
  };
  return map[urgency] || urgency;
}

function buildAdminEmailHtml(lead: Lead): string {
  const { formData } = lead;
  const date = new Date(lead.createdAt).toLocaleString('en-CA');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f1f5f9;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); color: white; padding: 32px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; font-size: 24px;">🚗 New Lead Application</h1>
      <p style="margin: 0; font-size: 18px; opacity: 0.95;">${formData.fullName}</p>
      <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">${date}</p>
    </div>
    
    <div style="padding: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Phone</div>
          <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${formData.phone}</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Email</div>
          <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${formData.email}</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Vehicle</div>
          <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${formatVehicleType(formData.vehicleType)}</div>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Budget</div>
          <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${formatBudget(formData)}</div>
        </div>
      </div>

      ${lead.driversLicenseKey ? `
      <div style="background: #dcfce7; border: 2px solid #22c55e; padding: 14px; border-radius: 10px; margin-bottom: 20px;">
        <strong style="color: #166534;">✓ Driver's License Uploaded</strong>
      </div>
      ` : ''}

      <div style="background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); padding: 20px; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: white;">⏰ Respond within 24 hours!</p>
        <a href="https://mynextrideontario.vercel.app/admin" style="display: inline-block; background: #ecc979; color: #1948b3; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700;">View Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Send notification to admin
export async function sendLeadNotificationEmail(lead: Lead): Promise<boolean> {
  const ses = getSESClient();
  if (!ses) return false;

  try {
    console.log('📧 Sending admin notification via AWS SES...');
    console.log('   From:', FROM_EMAIL);
    console.log('   To:', TO_EMAIL);

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [TO_EMAIL] },
      Message: {
        Subject: { Data: `🚗 New Application: ${lead.formData.fullName} - ${formatVehicleType(lead.formData.vehicleType)}`, Charset: 'UTF-8' },
        Body: { Html: { Data: buildAdminEmailHtml(lead), Charset: 'UTF-8' } },
      },
    });

    const result = await ses.send(command);
    console.log('✅ Admin email sent! MessageId:', result.MessageId);
    return true;
  } catch (error: any) {
    console.error('❌ SES Error:', error.message || error);
    console.error('   Error Code:', error.Code || error.name);
    return false;
  }
}

// Send email to client (applicant)
export async function sendClientEmail(
  toEmail: string,
  toName: string,
  subject: string,
  body: string
): Promise<boolean> {
  const ses = getSESClient();
  if (!ses) return false;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px;">My Next Ride Ontario</h1>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; color: #334155;">Hi ${toName},</p>
      <div style="color: #475569; line-height: 1.6; white-space: pre-wrap;">${body}</div>
      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">Best regards,<br/>My Next Ride Ontario Team</p>
    </div>
    <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} My Next Ride Ontario</p>
    </div>
  </div>
</body>
</html>`;

  try {
    console.log('📧 Sending client email via AWS SES to:', toEmail);

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } },
      },
    });

    const result = await ses.send(command);
    console.log('✅ Client email sent! MessageId:', result.MessageId);
    return true;
  } catch (error: any) {
    console.error('❌ Client email error:', error.message || error);
    return false;
  }
}

// Email templates system
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'follow-up' | 'approval' | 'reminder' | 'custom';
  createdAt: string;
}

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome / Initial Follow Up',
    subject: 'Thanks for your interest, {{name}}!',
    category: 'follow-up',
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
    body: `Great news! After reviewing your application, I'm pleased to let you know that we have financing options available for you.

Your Application Details:
• Desired Vehicle: {{vehicle}}
• Budget: {{budget}}
• Credit Profile: {{credit}}

Let's schedule a time to discuss the next steps and get you into your new ride!

What time works best for a quick call?`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reminder-24h',
    name: 'Gentle Reminder (24 Hours)',
    subject: 'Quick follow up - {{name}}',
    category: 'reminder',
    body: `Hi {{name}},

I hope this message finds you well! I wanted to follow up on your vehicle inquiry from yesterday.

Are you still interested in finding your next {{vehicle}}? I'm here to help make the process as smooth as possible.

Just reply to this email or give me a call whenever you're ready!`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reminder-week',
    name: 'Weekly Check-In',
    subject: 'Still thinking about your next vehicle, {{name}}?',
    category: 'reminder',
    body: `Hi {{name}},

It's been about a week since you reached out about finding a {{vehicle}}. I wanted to check in and see if you had any questions or if your needs have changed.

We're still here to help whenever you're ready! Our 17 lender network means we can work with most credit situations.

Feel free to reach out anytime.`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'circle-back',
    name: 'Circle Back',
    subject: 'Checking in - {{name}}',
    category: 'reminder',
    body: `Hi {{name}},

I'm circling back on your vehicle application. I understand life gets busy and timing is everything when it comes to a big decision like getting a new vehicle.

If your situation has changed or you have any questions, I'm just an email or phone call away.

No pressure - just want to make sure you have all the support you need when you're ready!`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'thank-you',
    name: 'Thank You (Post-Purchase)',
    subject: 'Thank you for choosing us, {{name}}!',
    category: 'custom',
    body: `Congratulations on your new {{vehicle}}! 🎉

We're thrilled we could help you find the perfect vehicle. It was a pleasure working with you.

If you have any questions about your vehicle or financing, don't hesitate to reach out. We're always here to help.

Also, if you know anyone else looking for their next ride, we'd love a referral! Word of mouth from happy customers like you is the best compliment we can receive.

Enjoy the new wheels!`,
    createdAt: new Date().toISOString(),
  },
];
