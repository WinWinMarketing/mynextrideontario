// Node Templates Library - Custom Node is FIRST
import { NodeTemplate, TemplateCategory, DEFAULT_CONTACT_SETTINGS } from './types';
import { LeadStatus } from '@/lib/validation';

// Template Categories - Custom is first
export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; icon: string; description: string }[] = [
  { id: 'custom', label: 'Custom', icon: '⚡', description: 'Build your own' },
  { id: 'lead-stages', label: 'Lead Stages', icon: '📊', description: 'Basic pipeline stages' },
  { id: 'communication', label: 'Communication', icon: '💬', description: 'Contact actions' },
  { id: 'automation', label: 'Automation', icon: '⚙️', description: 'Auto-triggered actions' },
  { id: 'conditionals', label: 'Conditionals', icon: '🔀', description: 'Branching logic' },
  { id: 'advanced', label: 'Advanced', icon: '🚀', description: 'Power user nodes' },
];

// Helper for contact methods
const cm = (types: any[], overrides = {}) => types.map(type => ({
  id: type, type, enabled: true, settings: { ...DEFAULT_CONTACT_SETTINGS, ...overrides },
}));

// CUSTOM NODE - FIRST IN LIST (opens builder when clicked)
export const CUSTOM_TEMPLATE: NodeTemplate = {
  id: 'custom',
  label: 'Custom Node',
  icon: '⚡',
  description: 'Create your own stage with custom colors, icons, and contact methods. Full control!',
  category: 'custom',
  preview: 'purple',
  defaultStatusId: 'working' as LeadStatus,
  contactMethods: [],
  suggestedConnections: [],
};

// ALL TEMPLATES
export const ALL_TEMPLATES: NodeTemplate[] = [
  // CUSTOM - Always first
  CUSTOM_TEMPLATE,

  // LEAD STAGES
  { id: 'inbox', label: 'Inbox', icon: '📥', description: 'Entry point for new leads', category: 'lead-stages', preview: 'blue', defaultStatusId: 'new' as LeadStatus, contactMethods: cm(['email']), suggestedConnections: ['hot-lead', 'warm-lead'] },
  { id: 'hot-lead', label: 'Hot Lead', icon: '🔥', description: 'High priority, ready to buy', category: 'lead-stages', preview: 'orange', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['phone', 'text'], { tone: 'urgent', goal: 'closing' }), suggestedConnections: ['closing'] },
  { id: 'warm-lead', label: 'Warm Lead', icon: '☀️', description: 'Interested, needs nurturing', category: 'lead-stages', preview: 'yellow', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['email', 'phone']), suggestedConnections: ['hot-lead', 'negotiating'] },
  { id: 'cold-lead', label: 'Cold Lead', icon: '❄️', description: 'Low engagement, revisit later', category: 'lead-stages', preview: 'cyan', defaultStatusId: 'circle-back' as LeadStatus, contactMethods: cm(['email'], { followUpStyle: 'gentle' }), suggestedConnections: ['warm-lead'] },
  { id: 'negotiating', label: 'Negotiating', icon: '🤝', description: 'Discussing terms', category: 'lead-stages', preview: 'purple', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['phone', 'meeting'], { goal: 'closing' }), suggestedConnections: ['closing'] },
  { id: 'closing', label: 'Closing', icon: '🎯', description: 'Final stage, deal almost done', category: 'lead-stages', preview: 'green', defaultStatusId: 'approval' as LeadStatus, contactMethods: cm(['phone', 'meeting'], { tone: 'urgent', goal: 'closing' }), suggestedConnections: ['won'] },
  { id: 'won', label: 'Won!', icon: '🏆', description: 'Successfully converted!', category: 'lead-stages', preview: 'green', defaultStatusId: 'approval' as LeadStatus, contactMethods: cm(['email'], { tone: 'friendly', goal: 'relationship' }), suggestedConnections: [] },
  { id: 'lost', label: 'Lost', icon: '❌', description: 'Did not convert', category: 'lead-stages', preview: 'red', defaultStatusId: 'dead' as LeadStatus, contactMethods: [], suggestedConnections: [] },
  { id: 'on-hold', label: 'On Hold', icon: '⏸️', description: 'Waiting on external factors', category: 'lead-stages', preview: 'slate', defaultStatusId: 'circle-back' as LeadStatus, contactMethods: cm(['reminder']), suggestedConnections: ['warm-lead'] },

  // COMMUNICATION
  { id: 'send-email', label: 'Send Email', icon: '✉️', description: 'Trigger email sequence', category: 'communication', preview: 'blue', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['email']), suggestedConnections: ['wait-response'] },
  { id: 'phone-call', label: 'Phone Call', icon: '📞', description: 'Schedule a call', category: 'communication', preview: 'green', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['phone'], { timing: 'scheduled' }), suggestedConnections: ['follow-up'] },
  { id: 'text-message', label: 'Text Message', icon: '💬', description: 'Send SMS', category: 'communication', preview: 'cyan', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['text'], { tone: 'friendly' }), suggestedConnections: ['wait-response'] },
  { id: 'whatsapp', label: 'WhatsApp', icon: '📱', description: 'WhatsApp message', category: 'communication', preview: 'green', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['whatsapp'], { tone: 'casual' }), suggestedConnections: ['wait-response'] },
  { id: 'meeting', label: 'Schedule Meeting', icon: '📅', description: 'In-person or virtual', category: 'communication', preview: 'purple', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['meeting'], { timing: 'scheduled' }), suggestedConnections: ['closing'] },
  { id: 'manual-touch', label: 'Manual Touch', icon: '✋', description: 'Manual action required', category: 'communication', preview: 'yellow', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['manual']), suggestedConnections: [] },

  // AUTOMATION
  { id: 'auto-followup', label: 'Auto Follow-Up', icon: '🔄', description: 'Automatic follow-up after delay', category: 'automation', preview: 'blue', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['email'], { timing: 'delayed', delay: 48 }), suggestedConnections: ['wait-response'] },
  { id: 'reminder', label: 'Reminder', icon: '⏰', description: 'Task reminder for agent', category: 'automation', preview: 'yellow', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['reminder']), suggestedConnections: ['manual-touch'] },
  { id: 'wait-response', label: 'Wait Response', icon: '⏳', description: 'Pause and wait for reply', category: 'automation', preview: 'slate', defaultStatusId: 'working' as LeadStatus, contactMethods: [], suggestedConnections: ['auto-followup', 'escalate'] },
  { id: 'escalate', label: 'Escalate', icon: '📢', description: 'Escalate to manager', category: 'automation', preview: 'red', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['reminder'], { tone: 'urgent' }), suggestedConnections: ['manual-touch'] },
  { id: 'drip', label: 'Drip Campaign', icon: '💧', description: 'Add to email drip', category: 'automation', preview: 'blue', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['email'], { frequency: 'custom', timing: 'delayed' }), suggestedConnections: ['warm-lead'] },

  // CONDITIONALS
  { id: 'if-opened', label: 'If Opened', icon: '👁️', description: 'Branch if email opened', category: 'conditionals', preview: 'cyan', defaultStatusId: 'working' as LeadStatus, contactMethods: [], suggestedConnections: ['phone-call'] },
  { id: 'if-clicked', label: 'If Clicked', icon: '👆', description: 'Branch if link clicked', category: 'conditionals', preview: 'green', defaultStatusId: 'working' as LeadStatus, contactMethods: [], suggestedConnections: ['hot-lead'] },
  { id: 'if-replied', label: 'If Replied', icon: '💬', description: 'Branch if lead replied', category: 'conditionals', preview: 'green', defaultStatusId: 'working' as LeadStatus, contactMethods: [], suggestedConnections: ['negotiating'] },
  { id: 'if-no-response', label: 'No Response', icon: '🔇', description: 'Branch if no reply', category: 'conditionals', preview: 'orange', defaultStatusId: 'working' as LeadStatus, contactMethods: [], suggestedConnections: ['auto-followup', 'cold-lead'] },
  { id: 'delay', label: 'Delay', icon: '⏰', description: 'Wait specific time', category: 'conditionals', preview: 'slate', defaultStatusId: 'working' as LeadStatus, contactMethods: [], suggestedConnections: [] },
  { id: 'ab-split', label: 'A/B Split', icon: '🔀', description: 'Split traffic for testing', category: 'conditionals', preview: 'purple', defaultStatusId: 'working' as LeadStatus, contactMethods: [], suggestedConnections: [] },

  // ADVANCED
  { id: 're-engage', label: 'Re-Engage', icon: '🔄', description: 'Win-back campaign', category: 'advanced', preview: 'purple', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['email'], { followUpStyle: 'gentle', goal: 'nurturing' }), suggestedConnections: ['warm-lead'] },
  { id: 'archive', label: 'Archive', icon: '📦', description: 'Archive for later', category: 'advanced', preview: 'slate', defaultStatusId: 'dead' as LeadStatus, contactMethods: [], suggestedConnections: ['re-engage'] },
  { id: 'referral', label: 'Referral Ask', icon: '🎁', description: 'Ask for referrals', category: 'advanced', preview: 'green', defaultStatusId: 'approval' as LeadStatus, contactMethods: cm(['email'], { tone: 'friendly', goal: 'relationship' }), suggestedConnections: [] },
  { id: 'upsell', label: 'Upsell', icon: '📈', description: 'Upsell opportunity', category: 'advanced', preview: 'yellow', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['email', 'phone'], { goal: 'closing' }), suggestedConnections: ['closing'] },
  { id: 'proposal', label: 'Proposal', icon: '📋', description: 'Send formal proposal', category: 'advanced', preview: 'indigo', defaultStatusId: 'working' as LeadStatus, contactMethods: cm(['email']), suggestedConnections: ['closing'] },
  { id: 'qualify', label: 'Qualification', icon: '✅', description: 'Qualify lead', category: 'advanced', preview: 'green', defaultStatusId: 'working' as LeadStatus, contactMethods: [], suggestedConnections: ['hot-lead', 'warm-lead', 'cold-lead'] },
  { id: 'disqualify', label: 'Disqualified', icon: '🚫', description: 'Does not meet criteria', category: 'advanced', preview: 'red', defaultStatusId: 'dead' as LeadStatus, contactMethods: [], suggestedConnections: [] },
];

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): NodeTemplate[] {
  return ALL_TEMPLATES.filter(t => t.category === category);
}
