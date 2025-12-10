import { Lead } from './validation';

// Mailgun configuration
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandboxb8d5e3c8f5a94f3e9c1a2b3c4d5e6f7g.mailgun.org';
const RECIPIENT_EMAIL = 'winwinmarketingcanada@gmail.com';

// Format budget display
function formatBudget(formData: Lead['formData']): string {
  if (formData.paymentType === 'finance') {
    const budgetMap: Record<string, string> = {
      '400-or-less': '$400 or less/month',
      '400-500': '$400 - $500/month',
      '500-600': '$500 - $600/month',
      '600-plus': '$600+/month',
    };
    return budgetMap[formData.financeBudget || ''] || 'Not specified';
  } else {
    const budgetMap: Record<string, string> = {
      '15k-or-less': '$15k or less',
      '20-30k': '$20k - $30k',
      '30-45k': '$30k - $45k',
      '50k-plus': '$50k+',
    };
    return budgetMap[formData.cashBudget || ''] || 'Not specified';
  }
}

// Build email HTML
function buildEmailHtml(lead: Lead): string {
  const { formData } = lead;
  
  const vehicleTypeLabel = {
    sedan: 'Sedan',
    suv: 'SUV',
    hatchback: 'Hatchback',
    'coupe-convertible': 'Coupe / Convertible',
    truck: 'Truck',
    minivan: 'Minivan',
  }[formData.vehicleType] || formData.vehicleType;
  
  const urgencyLabel = {
    'right-away': 'Right away',
    'few-weeks': 'Within a few weeks',
    'few-months': 'Within a few months',
  }[formData.urgency] || formData.urgency;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 20px; background: #f1f5f9;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); color: white; padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="margin: 0 0 8px 0; font-size: 28px;">New Vehicle Application</h1>
      <p style="opacity: 0.9; font-size: 18px; margin: 0;">${formData.fullName}</p>
      <p style="opacity: 0.7; font-size: 13px; margin-top: 12px;">${new Date(lead.createdAt).toLocaleString('en-CA')}</p>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px;">
      <h2 style="color: #1948b3; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Contact Information</h2>
      <table style="width: 100%; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px; background: #f8fafc; border-radius: 8px; width: 50%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Phone</div>
            <div style="font-size: 15px; font-weight: 600;">${formData.phone}</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="padding: 8px; background: #f8fafc; border-radius: 8px; width: 50%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Email</div>
            <div style="font-size: 15px; font-weight: 600;">${formData.email}</div>
          </td>
        </tr>
      </table>
      
      <h2 style="color: #1948b3; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Vehicle Preferences</h2>
      <table style="width: 100%; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Urgency</div>
            <div style="font-size: 15px; font-weight: 600;">${urgencyLabel}</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Vehicle</div>
            <div style="font-size: 15px; font-weight: 600;">${vehicleTypeLabel}</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height: 12px;"></td></tr>
        <tr>
          <td style="padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Payment</div>
            <div style="font-size: 15px; font-weight: 600;">${formData.paymentType === 'finance' ? 'Finance' : 'Cash'}</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Budget</div>
            <div style="font-size: 15px; font-weight: 600;">${formatBudget(formData)}</div>
          </td>
        </tr>
        ${formData.paymentType === 'finance' ? `
        <tr><td colspan="3" style="height: 12px;"></td></tr>
        <tr>
          <td colspan="3" style="padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Credit Rating</div>
            <div style="font-size: 15px; font-weight: 600;">${(formData.creditRating || 'Not specified').charAt(0).toUpperCase() + (formData.creditRating || '').slice(1)}</div>
          </td>
        </tr>
        ` : ''}
      </table>
      
      <h2 style="color: #1948b3; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Additional Details</h2>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Trade-In</div>
            <div style="font-size: 15px; font-weight: 600;">${formData.tradeIn === 'yes' ? `Yes - ${formData.tradeInYear} ${formData.tradeInMake} ${formData.tradeInModel}` : formData.tradeIn === 'unsure' ? 'Maybe' : 'No'}</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Cosigner</div>
            <div style="font-size: 15px; font-weight: 600;">${formData.cosigner === 'yes' ? `Yes - ${formData.cosignerFullName}` : 'No'}</div>
          </td>
        </tr>
      </table>
      
      <div style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); border-radius: 12px; text-align: center; color: white;">
        <p style="margin: 0; font-weight: 600;">Remember: Respond within 24 hours!</p>
        <a href="https://mynextrideontario.vercel.app/admin" style="display: inline-block; background: #ecc979; color: #1948b3; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 12px;">View in Dashboard</a>
        <p style="opacity: 0.7; font-size: 12px; margin-top: 16px;">Lead ID: ${lead.id}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Send email using Mailgun API
async function sendWithMailgun(to: string, subject: string, html: string): Promise<boolean> {
  if (!MAILGUN_API_KEY) {
    console.log('Mailgun API key not configured');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('from', `My Next Ride Ontario <mailgun@${MAILGUN_DOMAIN}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);

    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Email sent via Mailgun:', data.id);
      return true;
    } else {
      const error = await response.text();
      console.error('Mailgun error:', error);
      return false;
    }
  } catch (error) {
    console.error('Mailgun request failed:', error);
    return false;
  }
}

// Send notification email for new lead
export async function sendLeadNotificationEmail(lead: Lead): Promise<boolean> {
  try {
    const { formData } = lead;
    
    const vehicleTypeLabel = {
      sedan: 'Sedan',
      suv: 'SUV',
      hatchback: 'Hatchback',
      'coupe-convertible': 'Coupe',
      truck: 'Truck',
      minivan: 'Minivan',
    }[formData.vehicleType] || formData.vehicleType;

    const htmlContent = buildEmailHtml(lead);
    const subject = `New Application: ${formData.fullName} - ${vehicleTypeLabel}`;
    
    // Send via Mailgun
    const sent = await sendWithMailgun(RECIPIENT_EMAIL, subject, htmlContent);
    
    if (!sent) {
      console.log('📧 Email not sent. Lead saved to dashboard.');
    }
    
    return sent;
  } catch (error) {
    console.error('Error in email notification:', error);
    return false;
  }
}
