import { Resend } from 'resend';
import { Lead } from './validation';

// Initialize email client
function getEmailClient(): Resend {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new Error('EMAIL_PROVIDER_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

function getEmailConfig() {
  return {
    fromName: process.env.EMAIL_FROM_NAME || 'My Next Ride Ontario',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@mynextrideontario.vercel.app',
    toAddress: process.env.EMAIL_TO_ADDRESS || '',
  };
}

// Format budget display
function formatBudget(lead: Lead['formData']): string {
  if (lead.paymentType === 'finance') {
    const budgetMap: Record<string, string> = {
      '400-or-less': '$400 or less/month',
      '400-500': '$400 - $500/month',
      '500-600': '$500 - $600/month',
      '600-plus': '$600+/month',
    };
    return budgetMap[lead.financeBudget || ''] || 'Not specified';
  } else {
    const budgetMap: Record<string, string> = {
      '15k-or-less': '$15k or less',
      '20-30k': '$20k - $30k',
      '30-45k': '$30k - $45k',
      '50k-plus': '$50k+',
    };
    return budgetMap[lead.cashBudget || ''] || 'Not specified';
  }
}

// Send notification email for new lead
export async function sendLeadNotificationEmail(lead: Lead): Promise<boolean> {
  const config = getEmailConfig();
  
  if (!config.toAddress) {
    console.warn('EMAIL_TO_ADDRESS not configured, skipping email notification');
    return false;
  }
  
  try {
    const resend = getEmailClient();
    
    const { formData } = lead;
    
    // Build email content
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
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1948b3, #366be3); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; color: #1948b3; margin-bottom: 10px; border-bottom: 2px solid #d2def9; padding-bottom: 5px; }
    .field { margin-bottom: 8px; }
    .label { font-weight: bold; color: #64748b; }
    .value { color: #0f172a; }
    .highlight { background: #ecc979; padding: 2px 8px; border-radius: 4px; }
    .footer { margin-top: 20px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">🚗 New Vehicle Application</h1>
      <p style="margin:10px 0 0;">From: <strong>${formData.fullName}</strong></p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">📋 Contact Information</div>
        <div class="field"><span class="label">Name:</span> <span class="value">${formData.fullName}</span></div>
        <div class="field"><span class="label">Phone:</span> <span class="value">${formData.phone}</span></div>
        <div class="field"><span class="label">Email:</span> <span class="value">${formData.email}</span></div>
        <div class="field"><span class="label">Date of Birth:</span> <span class="value">${formData.dateOfBirth}</span></div>
        <div class="field"><span class="label">Best Time to Reach:</span> <span class="value">${formData.bestTimeToReach}</span></div>
      </div>
      
      <div class="section">
        <div class="section-title">🚘 Vehicle Preferences</div>
        <div class="field"><span class="label">Urgency:</span> <span class="value highlight">${urgencyLabel}</span></div>
        <div class="field"><span class="label">Vehicle Type:</span> <span class="value">${vehicleTypeLabel}</span></div>
        <div class="field"><span class="label">Payment Type:</span> <span class="value">${formData.paymentType === 'finance' ? 'Finance' : 'Cash'}</span></div>
        <div class="field"><span class="label">Budget:</span> <span class="value">${formatBudget(formData)}</span></div>
        ${formData.paymentType === 'finance' ? `<div class="field"><span class="label">Credit Rating:</span> <span class="value">${formData.creditRating || 'Not specified'}</span></div>` : ''}
      </div>
      
      <div class="section">
        <div class="section-title">🔄 Trade-In Information</div>
        <div class="field"><span class="label">Has Trade-In:</span> <span class="value">${formData.tradeIn}</span></div>
        ${(formData.tradeIn === 'yes' || formData.tradeIn === 'unsure') ? `
        <div class="field"><span class="label">Year:</span> <span class="value">${formData.tradeInYear || 'N/A'}</span></div>
        <div class="field"><span class="label">Make:</span> <span class="value">${formData.tradeInMake || 'N/A'}</span></div>
        <div class="field"><span class="label">Model:</span> <span class="value">${formData.tradeInModel || 'N/A'}</span></div>
        <div class="field"><span class="label">Mileage:</span> <span class="value">${formData.tradeInMileage || 'N/A'}</span></div>
        <div class="field"><span class="label">VIN:</span> <span class="value">${formData.tradeInVin || 'N/A'}</span></div>
        ` : ''}
      </div>
      
      <div class="section">
        <div class="section-title">📄 License & Cosigner</div>
        <div class="field"><span class="label">License Class:</span> <span class="value">${formData.licenseClass.toUpperCase()}</span></div>
        <div class="field"><span class="label">Driver's License Image:</span> <span class="value">${lead.driversLicenseKey ? '✅ Uploaded' : '❌ Not provided'}</span></div>
        <div class="field"><span class="label">Has Cosigner:</span> <span class="value">${formData.cosigner}</span></div>
        ${formData.cosigner === 'yes' ? `
        <div class="field"><span class="label">Cosigner Name:</span> <span class="value">${formData.cosignerFullName || 'N/A'}</span></div>
        <div class="field"><span class="label">Cosigner Phone:</span> <span class="value">${formData.cosignerPhone || 'N/A'}</span></div>
        <div class="field"><span class="label">Cosigner Email:</span> <span class="value">${formData.cosignerEmail || 'N/A'}</span></div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>Lead ID: ${lead.id}</p>
        <p>Submitted: ${new Date(lead.createdAt).toLocaleString('en-CA')}</p>
        <p><strong>Remember: Every application must receive a response within 24 hours!</strong></p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    await resend.emails.send({
      from: `${config.fromName} <${config.fromAddress}>`,
      to: config.toAddress,
      subject: `🚗 New Application: ${formData.fullName} - ${vehicleTypeLabel}`,
      html: htmlContent,
    });
    
    console.log(`Email notification sent for lead ${lead.id}`);
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

