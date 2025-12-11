// Configuration - uses environment variables for sensitive credentials

export const config = {
  // Admin credentials (server-side only)
  admin: {
    password: 'WINWIN04',
    sessionSecret: 'mynextrideontario-session-secret-2024-secure-key',
  },
  
  // Default email settings
  email: {
    defaultRecipient: 'winwinmarketingcanada@gmail.com',
    fromName: 'My Next Ride Ontario',
  },
  
  // AWS config - uses environment variables set in Vercel
  aws: {
    get accessKeyId() { return process.env.AWS_ACCESS_KEY_ID || ''; },
    get secretAccessKey() { return process.env.AWS_SECRET_ACCESS_KEY || ''; },
    get region() { return process.env.AWS_REGION || 'us-east-1'; },
    get bucketName() { return process.env.LEADS_BUCKET_NAME || 'martin-leads'; },
  },
  
  // Google Maps - client-side accessible
  googleMaps: {
    get apiKey() { 
      return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''; 
    },
  },
};

// Settings stored in S3
export const SETTINGS_KEY = 'settings/email-settings.json';
export const SHOWCASE_SETTINGS_KEY = 'settings/showcase-settings.json';

export interface EmailSettings {
  recipientEmail: string;
  fromName: string;
  enabled: boolean;
}

export interface ShowcaseSettings {
  enabled: boolean;
}

export const defaultEmailSettings: EmailSettings = {
  recipientEmail: config.email.defaultRecipient,
  fromName: config.email.fromName,
  enabled: true,
};

export const defaultShowcaseSettings: ShowcaseSettings = {
  enabled: true,
};
