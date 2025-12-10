import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Lead } from './validation';

// AWS SES Configuration
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@winwinmarketingtesting2.com';
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

function buildEmailHtml(lead: Lead): string {
  const { formData } = lead;
  
  const vehicleTypeMap: Record<string, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    hatchback: 'Hatchback',
    'coupe-convertible': 'Coupe / Convertible',
    truck: 'Truck',
    minivan: 'Minivan',
  };

  const urgencyMap: Record<string, string> = {
    'right-away': 'Right away',
    'few-weeks': 'Within a few weeks',
    'few-months': 'Within a few months',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">New Lead Application</h1>
      <p style="margin: 0; font-size: 20px; opacity: 0.95;">${formData.fullName}</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.7;">${new Date(lead.createdAt).toLocaleString('en-CA')}</p>
    </div>
    
    <div style="padding: 30px;">
      <div style="margin-bottom: 24px;">
        <h2 style="color: #1948b3; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; font-weight: 600;">Contact Information</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600;">Phone</div>
            <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${formData.phone}</div>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600;">Email</div>
            <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${formData.email}</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h2 style="color: #1948b3; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; font-weight: 600;">Vehicle Preferences</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600;">Vehicle Type</div>
            <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${vehicleTypeMap[formData.vehicleType]}</div>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600;">Urgency</div>
            <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${urgencyMap[formData.urgency]}</div>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600;">Budget</div>
            <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${formatBudget(formData)}</div>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 10px;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600;">Payment</div>
            <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${formData.paymentType === 'finance' ? 'Finance' : 'Cash'}</div>
          </div>
        </div>
      </div>

      ${lead.driversLicenseKey ? `
      <div style="background: #dcfce7; border: 2px solid #22c55e; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
        <div style="font-weight: 700; color: #166534; margin-bottom: 4px;">✓ Driver's License Uploaded</div>
        <div style="font-size: 13px; color: #15803d;">View in admin dashboard</div>
      </div>
      ` : ''}

      <div style="background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); padding: 24px; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 16px 0; font-weight: 600; color: white; font-size: 16px;">⏰ Respond within 24 hours!</p>
        <a href="https://mynextrideontario.vercel.app/admin" style="display: inline-block; background: #ecc979; color: #1948b3; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">View in Dashboard</a>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.7);">Lead ID: ${lead.id}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendLeadNotificationEmail(lead: Lead): Promise<boolean> {
  try {
    const { formData } = lead;
    
    const vehicleTypes: Record<string, string> = {
      sedan: 'Sedan', suv: 'SUV', hatchback: 'Hatchback',
      'coupe-convertible': 'Coupe', truck: 'Truck', minivan: 'Minivan',
    };

    const subject = `🚗 New Application: ${formData.fullName} - ${vehicleTypes[formData.vehicleType]}`;
    const htmlContent = buildEmailHtml(lead);

    console.log('📧 Sending email via AWS SES to:', TO_EMAIL);

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [TO_EMAIL],
      },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: htmlContent } },
      },
    });

    await sesClient.send(command);
    console.log('✅ Email sent successfully via AWS SES');
    return true;
  } catch (error) {
    console.error('❌ AWS SES error:', error);
    return false;
  }
}
