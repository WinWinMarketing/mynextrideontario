import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Lead } from './validation';

// AWS SES Configuration - uses same credentials as S3
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Environment variables for email
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

function buildEmailHtml(lead: Lead): string {
  const { formData } = lead;
  const date = new Date(lead.createdAt).toLocaleString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 20px 20px 0 0; }
    .header h1 { margin: 0 0 8px 0; font-size: 26px; font-weight: 700; }
    .header .name { font-size: 20px; opacity: 0.95; margin: 0; }
    .header .date { font-size: 13px; opacity: 0.7; margin-top: 10px; }
    .body { background: white; padding: 30px; border-radius: 0 0 20px 20px; }
    .section { margin-bottom: 24px; }
    .section-title { color: #1948b3; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 14px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { background: #f8fafc; padding: 14px; border-radius: 12px; }
    .field-label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; font-weight: 600; }
    .field-value { font-size: 15px; color: #0f172a; font-weight: 600; }
    .license-badge { background: #dcfce7; border: 2px solid #22c55e; padding: 18px; border-radius: 14px; margin-bottom: 24px; }
    .license-badge strong { color: #166534; }
    .license-badge p { color: #15803d; font-size: 13px; margin: 6px 0 0 0; }
    .cta { background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); padding: 28px; border-radius: 16px; text-align: center; }
    .cta p { color: white; font-weight: 600; font-size: 16px; margin: 0 0 16px 0; }
    .cta a { display: inline-block; background: #ecc979; color: #1948b3; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; }
    .cta .id { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>🚗 New Lead Application</h1>
        <p class="name">${formData.fullName}</p>
        <p class="date">${date}</p>
      </div>
      
      <div class="body">
        <div class="section">
          <h2 class="section-title">Contact Information</h2>
          <div class="grid">
            <div class="field">
              <div class="field-label">Phone</div>
              <div class="field-value">${formData.phone}</div>
            </div>
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value">${formData.email}</div>
            </div>
            <div class="field">
              <div class="field-label">Date of Birth</div>
              <div class="field-value">${formData.dateOfBirth}</div>
            </div>
            <div class="field">
              <div class="field-label">Best Time</div>
              <div class="field-value">${formData.bestTimeToReach}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Vehicle Preferences</h2>
          <div class="grid">
            <div class="field">
              <div class="field-label">Vehicle Type</div>
              <div class="field-value">${formatVehicleType(formData.vehicleType)}</div>
            </div>
            <div class="field">
              <div class="field-label">Urgency</div>
              <div class="field-value">${formatUrgency(formData.urgency)}</div>
            </div>
            <div class="field">
              <div class="field-label">Payment Type</div>
              <div class="field-value">${formData.paymentType === 'finance' ? 'Finance' : 'Cash'}</div>
            </div>
            <div class="field">
              <div class="field-label">Budget</div>
              <div class="field-value">${formatBudget(formData)}</div>
            </div>
            ${formData.paymentType === 'finance' ? `
            <div class="field">
              <div class="field-label">Credit Rating</div>
              <div class="field-value">${formData.creditRating || 'N/A'}</div>
            </div>
            ` : ''}
          </div>
        </div>

        ${lead.driversLicenseKey ? `
        <div class="license-badge">
          <strong>✓ Driver's License Uploaded</strong>
          <p>View the license image in the admin dashboard</p>
        </div>
        ` : ''}

        <div class="cta">
          <p>⏰ Remember: Respond within 24 hours!</p>
          <a href="https://mynextrideontario.vercel.app/admin">View in Dashboard</a>
          <p class="id">Lead ID: ${lead.id}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendLeadNotificationEmail(lead: Lead): Promise<boolean> {
  try {
    console.log('📧 Preparing to send email via AWS SES...');
    console.log('   From:', FROM_EMAIL);
    console.log('   To:', TO_EMAIL);
    
    const subject = `🚗 New Application: ${lead.formData.fullName} - ${formatVehicleType(lead.formData.vehicleType)}`;
    const htmlContent = buildEmailHtml(lead);

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [TO_EMAIL] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: htmlContent, Charset: 'UTF-8' } },
      },
    });

    const result = await sesClient.send(command);
    console.log('✅ Email sent successfully! MessageId:', result.MessageId);
    return true;
  } catch (error) {
    console.error('❌ AWS SES email error:', error);
    return false;
  }
}

// Email templates system
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome / Follow Up',
    subject: 'Thanks for your interest in your next vehicle, {{name}}!',
    body: `Hi {{name}},

Thank you for reaching out about your vehicle needs! I wanted to personally follow up on your application.

Based on your preferences:
- Vehicle: {{vehicle}}
- Budget: {{budget}}
- Timeline: {{urgency}}

I have several options that might be perfect for you. When would be a good time to chat?

Best regards,
My Next Ride Ontario Team`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'approval',
    name: 'Approval Notification',
    subject: 'Great news about your vehicle financing, {{name}}!',
    body: `Hi {{name}},

Great news! After reviewing your application, I'm pleased to let you know that we have financing options available for you.

Your Details:
- Desired Vehicle: {{vehicle}}
- Budget: {{budget}}

Let's schedule a time to discuss the next steps and get you into your new ride!

Looking forward to hearing from you.

Best regards,
My Next Ride Ontario Team`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reminder',
    name: 'Gentle Reminder',
    subject: 'Quick follow up - {{name}}',
    body: `Hi {{name}},

I hope this message finds you well! I wanted to follow up on your vehicle inquiry from a few days ago.

Are you still interested in finding your next {{vehicle}}? I'm here to help make the process as smooth as possible.

Let me know if you have any questions!

Best regards,
My Next Ride Ontario Team`,
    createdAt: new Date().toISOString(),
  },
];
