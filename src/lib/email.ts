import { Lead } from './validation';
import { getEmailSettings } from './s3';
import { config } from './config';

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

// Build beautiful email HTML
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
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f1f5f9; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); color: white; padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; }
    .header .subtitle { opacity: 0.9; font-size: 16px; margin: 0; }
    .header .time { opacity: 0.7; font-size: 13px; margin-top: 12px; }
    .content { background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .section { margin-bottom: 24px; }
    .section:last-child { margin-bottom: 0; }
    .section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
    .section-header h2 { margin: 0; font-size: 16px; font-weight: 600; color: #1948b3; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { padding: 12px; background: #f8fafc; border-radius: 8px; }
    .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; }
    .field-value { font-size: 15px; font-weight: 600; color: #0f172a; }
    .field-value a { color: #1948b3; text-decoration: none; }
    .highlight { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; }
    .urgent { background: #fecaca; color: #991b1b; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 24px; padding: 24px; background: linear-gradient(135deg, #1948b3 0%, #366be3 100%); border-radius: 12px; text-align: center; color: white; }
    .footer p { margin: 0 0 8px 0; font-size: 14px; }
    .footer .cta { display: inline-block; background: #ecc979; color: #1948b3; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 12px; }
    .footer .lead-id { opacity: 0.7; font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🚗 New Vehicle Application</h1>
      <p class="subtitle">${formData.fullName}</p>
      <p class="time">${new Date(lead.createdAt).toLocaleString('en-CA', { dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-header">
          <span>📋</span>
          <h2>Contact Information</h2>
        </div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Full Name</div>
            <div class="field-value">${formData.fullName}</div>
          </div>
          <div class="field">
            <div class="field-label">Phone</div>
            <div class="field-value"><a href="tel:${formData.phone}">${formData.phone}</a></div>
          </div>
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value"><a href="mailto:${formData.email}">${formData.email}</a></div>
          </div>
          <div class="field">
            <div class="field-label">Best Time</div>
            <div class="field-value">${formData.bestTimeToReach}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">
          <span>🚘</span>
          <h2>Vehicle Preferences</h2>
        </div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Urgency</div>
            <div class="field-value"><span class="highlight ${formData.urgency === 'right-away' ? 'urgent' : ''}">${urgencyLabel}</span></div>
          </div>
          <div class="field">
            <div class="field-label">Vehicle Type</div>
            <div class="field-value">${vehicleTypeLabel}</div>
          </div>
          <div class="field">
            <div class="field-label">Payment</div>
            <div class="field-value">${formData.paymentType === 'finance' ? 'Finance' : 'Cash'}</div>
          </div>
          <div class="field">
            <div class="field-label">Budget</div>
            <div class="field-value">${formatBudget(formData)}</div>
          </div>
          ${formData.paymentType === 'finance' ? `
          <div class="field" style="grid-column: span 2;">
            <div class="field-label">Credit Rating</div>
            <div class="field-value">${(formData.creditRating || 'Not specified').charAt(0).toUpperCase() + (formData.creditRating || '').slice(1)}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">
          <span>📄</span>
          <h2>Additional Details</h2>
        </div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Trade-In</div>
            <div class="field-value">${formData.tradeIn === 'yes' ? `Yes - ${formData.tradeInYear} ${formData.tradeInMake} ${formData.tradeInModel}` : formData.tradeIn === 'unsure' ? 'Maybe' : 'No'}</div>
          </div>
          <div class="field">
            <div class="field-label">License Class</div>
            <div class="field-value">${formData.licenseClass.toUpperCase()}</div>
          </div>
          <div class="field">
            <div class="field-label">License Image</div>
            <div class="field-value"><span class="badge ${lead.driversLicenseKey ? 'badge-green' : 'badge-red'}">${lead.driversLicenseKey ? '✓ Uploaded' : '✗ Not provided'}</span></div>
          </div>
          <div class="field">
            <div class="field-label">Cosigner</div>
            <div class="field-value">${formData.cosigner === 'yes' ? `Yes - ${formData.cosignerFullName}` : 'No'}</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>⏰ Remember: Respond within 24 hours!</strong></p>
        <a href="https://mynextrideontario.vercel.app/admin" class="cta">View in Dashboard</a>
        <p class="lead-id">Lead ID: ${lead.id}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Send notification email for new lead
export async function sendLeadNotificationEmail(lead: Lead): Promise<boolean> {
  try {
    const settings = await getEmailSettings();
    
    if (!settings.enabled) {
      console.log('Email notifications disabled in settings');
      return false;
    }

    const recipientEmail = settings.recipientEmail || config.email.defaultRecipient;
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
    const subject = `🚗 New Application: ${formData.fullName} - ${vehicleTypeLabel}`;
    
    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${settings.fromName} <onboarding@resend.dev>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
          }),
        });
        
        if (response.ok) {
          console.log(`✅ Email sent to ${recipientEmail} for lead ${lead.id}`);
          return true;
        } else {
          const error = await response.text();
          console.log('Email API error:', error);
        }
      } catch (emailError) {
        console.log('Email sending failed:', emailError);
      }
    } else {
      console.log('📧 No email service configured. Lead saved to dashboard.');
      console.log(`   Recipient would be: ${recipientEmail}`);
      console.log(`   Subject: ${subject}`);
    }
    
    // Lead is always saved regardless of email status
    return false;
  } catch (error) {
    console.error('Error in email notification:', error);
    return false;
  }
}
