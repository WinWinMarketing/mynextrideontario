// Configuration - uses environment variables for sensitive credentials

export const config = {
  // Admin credentials (server-side only - use env vars for security)
  admin: {
    get password() { 
      return process.env.ADMIN_PASSWORD || 'WINWIN04'; 
    },
    get sessionSecret() { 
      return process.env.SESSION_SECRET || 'mynextrideontario-session-secret-2024-secure-key-dev'; 
    },
  },
  
  // AWS config - uses environment variables
  aws: {
    get accessKeyId() { return process.env.AWS_ACCESS_KEY_ID || ''; },
    get secretAccessKey() { return process.env.AWS_SECRET_ACCESS_KEY || ''; },
    get region() { return process.env.AWS_REGION || 'us-east-1'; },
    get bucketName() { return process.env.LEADS_BUCKET_NAME || 'martin-leads'; },
  },
};

// Settings stored in S3
export const SHOWCASE_SETTINGS_KEY = 'settings/showcase-settings.json';

export interface ShowcaseSettings {
  enabled: boolean;
}

export const defaultShowcaseSettings: ShowcaseSettings = {
  enabled: true,
};
