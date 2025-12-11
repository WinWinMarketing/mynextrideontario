// Complete Presets Library with Full Communication Settings
import { Preset, PipelineStage, NodeConnection, TextLabel, DEFAULT_AUTOMATION_SETTINGS, DEFAULT_CONTACT_SETTINGS } from './types';
import { LeadStatus } from '@/lib/validation';

// Helper to create contact methods
const createContactMethods = (types: ('email' | 'phone' | 'text' | 'whatsapp' | 'meeting' | 'reminder' | 'manual')[], overrides: Partial<typeof DEFAULT_CONTACT_SETTINGS> = {}) => 
  types.map(type => ({
    id: type,
    type,
    enabled: true,
    settings: { ...DEFAULT_CONTACT_SETTINGS, ...overrides },
  }));

// Helper to create a stage
const createStage = (
  id: string,
  label: string,
  statusId: LeadStatus | 'dead',
  x: number,
  y: number,
  width: number,
  height: number,
  icon: string,
  color: any,
  contactTypes: ('email' | 'phone' | 'text' | 'whatsapp' | 'meeting' | 'reminder' | 'manual')[] = ['email'],
  contactOverrides: Partial<typeof DEFAULT_CONTACT_SETTINGS> = {},
  deadReason?: string
): PipelineStage => ({
  id,
  label,
  statusId,
  deadReason,
  x,
  y,
  width,
  height,
  color,
  icon,
  contactMethods: createContactMethods(contactTypes, contactOverrides),
  automationSettings: DEFAULT_AUTOMATION_SETTINGS,
  displayMode: width > 280 ? 'double' : 'single',
  maxVisibleLeads: Math.floor((height - 70) / 48),
});

// PRESETS WITH FULL COMMUNICATION SETUPS
export const ALL_PRESETS: Preset[] = [
  // SIMPLE 3-STAGE
  {
    id: 'simple-3stage',
    name: 'Simple 3-Stage',
    description: 'Perfect for beginners. New → Working → Done flow with email follow-ups.',
    category: 'complexity-levels',
    icon: '📊',
    complexity: 'simple',
    tags: ['basic', 'beginner', 'linear'],
    recommendedZoom: 0.75,
    stages: [
      createStage('new', 'New Leads', 'new', 15, 50, 320, 280, '📥', 'blue', ['email'], { tone: 'friendly', goal: 'nurturing' }),
      createStage('working', 'Working', 'working', 50, 50, 320, 280, '⚙️', 'yellow', ['email', 'phone'], { tone: 'professional', goal: 'relationship' }),
      createStage('done', 'Completed', 'approval', 85, 50, 300, 260, '✅', 'green', ['email'], { tone: 'friendly', goal: 'relationship' }),
    ],
    connections: [
      { id: 'c1', fromStageId: 'new', toStageId: 'working', style: 'solid', animated: true, label: 'Engage' },
      { id: 'c2', fromStageId: 'working', toStageId: 'done', style: 'solid', animated: true, label: 'Close' },
    ],
    labels: [
      { id: 'l1', text: 'Simple Sales Funnel', x: 50, y: 10, fontSize: 18, color: '#94a3b8' },
    ],
  },

  // STANDARD 5-STAGE WITH FOLLOW-UPS
  {
    id: 'standard-5stage',
    name: 'Standard Pipeline',
    description: 'Balanced funnel with follow-up branch. Includes email sequences and phone calls.',
    category: 'complexity-levels',
    icon: '📈',
    complexity: 'medium',
    tags: ['standard', 'balanced', 'follow-up'],
    recommendedZoom: 0.7,
    stages: [
      createStage('inbox', 'Inbox', 'new', 8, 50, 280, 300, '📥', 'blue', ['email'], { timing: 'immediate', tone: 'friendly' }),
      createStage('engaged', 'Engaged', 'working', 30, 30, 260, 220, '💬', 'yellow', ['email', 'phone'], { tone: 'professional' }),
      createStage('followup', 'Follow Up', 'circle-back', 30, 70, 260, 200, '📞', 'cyan', ['phone', 'text'], { timing: 'scheduled', tone: 'friendly' }),
      createStage('closing', 'Closing', 'approval', 58, 50, 280, 260, '🎯', 'green', ['phone', 'meeting'], { tone: 'professional', goal: 'closing' }),
      createStage('archive', 'Archive', 'dead', 85, 50, 220, 180, '📦', 'slate', [], {}),
    ],
    connections: [
      { id: 'c1', fromStageId: 'inbox', toStageId: 'engaged', style: 'solid', animated: true },
      { id: 'c2', fromStageId: 'inbox', toStageId: 'followup', style: 'dashed', animated: false, condition: { type: 'no-response', value: 48 } },
      { id: 'c3', fromStageId: 'engaged', toStageId: 'closing', style: 'solid', animated: true },
      { id: 'c4', fromStageId: 'followup', toStageId: 'engaged', style: 'solid', animated: true, condition: { type: 'replied' } },
      { id: 'c5', fromStageId: 'closing', toStageId: 'archive', style: 'dashed', animated: false },
    ],
    labels: [
      { id: 'l1', text: 'Standard Sales Pipeline', x: 50, y: 8, fontSize: 18, color: '#94a3b8' },
      { id: 'l2', text: 'Main Flow', x: 30, y: 20, fontSize: 12, color: '#64748b' },
      { id: 'l3', text: 'Recovery Path', x: 30, y: 85, fontSize: 12, color: '#64748b' },
    ],
  },

  // HOT LEAD FAST TRACK
  {
    id: 'hot-fast-track',
    name: 'Hot Lead Fast Track',
    description: 'Speed-focused pipeline for ready-to-buy leads. Aggressive communication with calls & texts.',
    category: 'pipeline-purposes',
    icon: '🔥',
    complexity: 'simple',
    tags: ['hot', 'urgent', 'fast'],
    recommendedZoom: 0.75,
    stages: [
      createStage('hot-in', 'Hot Inbound', 'new', 12, 50, 300, 300, '🔥', 'orange', ['phone', 'text'], { timing: 'immediate', tone: 'urgent', goal: 'urgency' }),
      createStage('qualify', 'Quick Qualify', 'working', 45, 50, 300, 280, '✅', 'yellow', ['phone'], { tone: 'professional', goal: 'closing' }),
      createStage('close', 'Close Deal', 'approval', 78, 50, 280, 260, '🏆', 'green', ['phone', 'meeting'], { tone: 'urgent', goal: 'closing' }),
    ],
    connections: [
      { id: 'c1', fromStageId: 'hot-in', toStageId: 'qualify', style: 'solid', animated: true, label: '< 1 hour' },
      { id: 'c2', fromStageId: 'qualify', toStageId: 'close', style: 'solid', animated: true, label: 'Same day' },
    ],
    labels: [
      { id: 'l1', text: '🔥 HOT LEAD PIPELINE', x: 50, y: 10, fontSize: 20, color: '#f97316' },
      { id: 'l2', text: 'Goal: Close within 24 hours', x: 50, y: 90, fontSize: 14, color: '#fb923c' },
    ],
  },

  // COLD LEAD NURTURING
  {
    id: 'cold-nurture',
    name: 'Cold Lead Nurturing',
    description: 'Long-term nurture for cold leads. Gentle email drips with occasional personal touches.',
    category: 'pipeline-purposes',
    icon: '❄️',
    complexity: 'advanced',
    tags: ['cold', 'nurture', 'long-term', 'drip'],
    recommendedZoom: 0.6,
    stages: [
      createStage('cold-pool', 'Cold Pool', 'new', 5, 50, 240, 280, '❄️', 'cyan', ['email'], { timing: 'delayed', delay: 72, followUpStyle: 'gentle', tone: 'friendly' }),
      createStage('drip-1', 'Drip Sequence 1', 'working', 22, 30, 220, 180, '💧', 'blue', ['email'], { frequency: 'weekly', followUpStyle: 'gentle' }),
      createStage('drip-2', 'Drip Sequence 2', 'working', 22, 70, 220, 180, '💧', 'blue', ['email'], { frequency: 'weekly', followUpStyle: 'gentle' }),
      createStage('warming', 'Warming Up', 'working', 42, 50, 260, 240, '☀️', 'yellow', ['email', 'text'], { tone: 'friendly', goal: 'relationship' }),
      createStage('re-engaged', 'Re-Engaged', 'working', 62, 50, 260, 240, '🔥', 'orange', ['phone', 'email'], { tone: 'professional', goal: 'nurturing' }),
      createStage('hot-again', 'Hot Again!', 'approval', 82, 35, 220, 180, '🎯', 'green', ['phone', 'meeting'], { goal: 'closing' }),
      createStage('stay-cold', 'Stay Cold', 'dead', 82, 70, 200, 150, '💤', 'slate', [], {}, 'not-ready'),
    ],
    connections: [
      { id: 'c1', fromStageId: 'cold-pool', toStageId: 'drip-1', style: 'solid', animated: true },
      { id: 'c2', fromStageId: 'cold-pool', toStageId: 'drip-2', style: 'dashed', animated: false },
      { id: 'c3', fromStageId: 'drip-1', toStageId: 'warming', style: 'solid', animated: true, condition: { type: 'opened' } },
      { id: 'c4', fromStageId: 'drip-2', toStageId: 'warming', style: 'solid', animated: true, condition: { type: 'clicked' } },
      { id: 'c5', fromStageId: 'warming', toStageId: 're-engaged', style: 'solid', animated: true, condition: { type: 'replied' } },
      { id: 'c6', fromStageId: 're-engaged', toStageId: 'hot-again', style: 'solid', animated: true },
      { id: 'c7', fromStageId: 'warming', toStageId: 'stay-cold', style: 'dashed', animated: false, condition: { type: 'no-response', value: 168 } },
    ],
    labels: [
      { id: 'l1', text: '❄️ Cold Lead Nurturing System', x: 45, y: 8, fontSize: 18, color: '#06b6d4' },
      { id: 'l2', text: 'Email Drip Zone', x: 22, y: 50, fontSize: 11, color: '#64748b' },
    ],
  },

  // ANALYTICAL BUYER
  {
    id: 'analytical',
    name: 'Analytical Buyer',
    description: 'For data-driven leads. Heavy on email with specs, comparisons, and detailed info.',
    category: 'personality-types',
    icon: '📊',
    complexity: 'medium',
    tags: ['analytical', 'data', 'research'],
    recommendedZoom: 0.65,
    stages: [
      createStage('inquiry', 'Data Inquiry', 'new', 8, 50, 260, 280, '📊', 'blue', ['email'], { tone: 'professional', goal: 'nurturing' }),
      createStage('research', 'Research Phase', 'working', 28, 30, 240, 200, '🔍', 'purple', ['email'], { tone: 'professional' }),
      createStage('compare', 'Comparison', 'working', 28, 68, 240, 200, '⚖️', 'indigo', ['email'], { tone: 'professional' }),
      createStage('review', 'Data Review', 'working', 52, 50, 280, 260, '📈', 'yellow', ['email', 'meeting'], { tone: 'professional', goal: 'relationship' }),
      createStage('decide', 'Decision', 'approval', 78, 35, 240, 180, '✅', 'green', ['phone', 'meeting'], { goal: 'closing' }),
      createStage('more-info', 'Needs More', 'circle-back', 78, 68, 220, 160, '❓', 'cyan', ['email'], { followUpStyle: 'gentle' }),
    ],
    connections: [
      { id: 'c1', fromStageId: 'inquiry', toStageId: 'research', style: 'solid', animated: true },
      { id: 'c2', fromStageId: 'inquiry', toStageId: 'compare', style: 'dashed', animated: false },
      { id: 'c3', fromStageId: 'research', toStageId: 'review', style: 'solid', animated: true },
      { id: 'c4', fromStageId: 'compare', toStageId: 'review', style: 'solid', animated: true },
      { id: 'c5', fromStageId: 'review', toStageId: 'decide', style: 'solid', animated: true, condition: { type: 'replied' } },
      { id: 'c6', fromStageId: 'review', toStageId: 'more-info', style: 'dashed', animated: false, condition: { type: 'no-response', value: 72 } },
      { id: 'c7', fromStageId: 'more-info', toStageId: 'review', style: 'dotted', animated: false },
    ],
    labels: [
      { id: 'l1', text: '📊 Analytical Buyer Journey', x: 45, y: 8, fontSize: 18, color: '#8b5cf6' },
      { id: 'l2', text: 'Send specs, charts, comparisons', x: 28, y: 50, fontSize: 10, color: '#64748b' },
    ],
  },

  // EMOTIONAL BUYER
  {
    id: 'emotional',
    name: 'Emotional Buyer',
    description: 'For relationship-driven leads. Personal calls, friendly texts, testimonials.',
    category: 'personality-types',
    icon: '💝',
    complexity: 'medium',
    tags: ['emotional', 'relationship', 'personal'],
    recommendedZoom: 0.7,
    stages: [
      createStage('hello', 'First Hello', 'new', 10, 50, 280, 280, '👋', 'pink', ['text', 'email'], { tone: 'friendly', goal: 'relationship' }),
      createStage('connect', 'Building Rapport', 'working', 35, 50, 300, 300, '🤝', 'purple', ['phone', 'text'], { tone: 'friendly', goal: 'relationship' }),
      createStage('stories', 'Share Stories', 'working', 62, 30, 240, 180, '⭐', 'yellow', ['email', 'text'], { tone: 'friendly' }),
      createStage('trust', 'Trust Built', 'working', 62, 68, 240, 180, '💖', 'pink', ['phone'], { tone: 'friendly', goal: 'relationship' }),
      createStage('happy', 'Happy Customer', 'approval', 88, 50, 220, 200, '🎉', 'green', ['phone', 'text'], { tone: 'friendly' }),
    ],
    connections: [
      { id: 'c1', fromStageId: 'hello', toStageId: 'connect', style: 'solid', animated: true, label: 'Personal touch' },
      { id: 'c2', fromStageId: 'connect', toStageId: 'stories', style: 'solid', animated: true },
      { id: 'c3', fromStageId: 'connect', toStageId: 'trust', style: 'solid', animated: true },
      { id: 'c4', fromStageId: 'stories', toStageId: 'happy', style: 'solid', animated: true },
      { id: 'c5', fromStageId: 'trust', toStageId: 'happy', style: 'solid', animated: true },
    ],
    labels: [
      { id: 'l1', text: '💝 Emotional Buyer Journey', x: 50, y: 8, fontSize: 18, color: '#ec4899' },
      { id: 'l2', text: 'Focus: Personal connection', x: 50, y: 90, fontSize: 12, color: '#f472b6' },
    ],
  },

  // PROFESSIONAL AGENT STYLE
  {
    id: 'professional',
    name: 'Professional Style',
    description: 'Formal business communication. Structured emails, scheduled calls, formal meetings.',
    category: 'agent-styles',
    icon: '👔',
    complexity: 'medium',
    tags: ['professional', 'formal', 'business'],
    recommendedZoom: 0.7,
    stages: [
      createStage('inquiry', 'Initial Inquiry', 'new', 10, 50, 280, 260, '📧', 'blue', ['email'], { tone: 'professional', goal: 'nurturing' }),
      createStage('qualify', 'Qualification', 'working', 35, 50, 280, 260, '📋', 'indigo', ['email', 'phone'], { tone: 'professional' }),
      createStage('present', 'Presentation', 'working', 60, 50, 280, 260, '📊', 'purple', ['meeting', 'email'], { timing: 'scheduled', tone: 'professional' }),
      createStage('close', 'Close', 'approval', 85, 50, 240, 220, '✅', 'green', ['meeting', 'phone'], { tone: 'professional', goal: 'closing' }),
    ],
    connections: [
      { id: 'c1', fromStageId: 'inquiry', toStageId: 'qualify', style: 'solid', animated: true },
      { id: 'c2', fromStageId: 'qualify', toStageId: 'present', style: 'solid', animated: true },
      { id: 'c3', fromStageId: 'present', toStageId: 'close', style: 'solid', animated: true },
    ],
    labels: [
      { id: 'l1', text: '👔 Professional Sales Process', x: 50, y: 10, fontSize: 18, color: '#6366f1' },
    ],
  },

  // POWER USER - FULL FUNNEL
  {
    id: 'power-user',
    name: 'Power User Full Funnel',
    description: 'Maximum control. 12+ stages with complete branching, all communication channels, A/B paths.',
    category: 'complexity-levels',
    icon: '⚡',
    complexity: 'power-user',
    tags: ['advanced', 'full', 'complete', 'power'],
    recommendedZoom: 0.5,
    stages: [
      createStage('inbound', 'Inbound', 'new', 3, 40, 200, 240, '📥', 'blue', ['email'], { timing: 'immediate' }),
      createStage('qualify', 'Qualify', 'working', 15, 20, 180, 150, '✅', 'green', ['email'], {}),
      createStage('segment-a', 'Segment A', 'working', 15, 45, 180, 130, '🅰️', 'purple', ['email', 'phone'], {}),
      createStage('segment-b', 'Segment B', 'working', 15, 68, 180, 130, '🅱️', 'indigo', ['email', 'text'], {}),
      createStage('disqualify', 'Disqualified', 'dead', 15, 88, 160, 100, '❌', 'red', [], {}, 'not-qualified'),
      createStage('nurture-a', 'Nurture A', 'working', 30, 28, 180, 140, '🌱', 'teal', ['email'], { frequency: 'weekly' }),
      createStage('nurture-b', 'Nurture B', 'working', 30, 58, 180, 140, '🌿', 'cyan', ['email', 'text'], { frequency: 'weekly' }),
      createStage('hot', 'Hot Track', 'working', 47, 28, 200, 160, '🔥', 'orange', ['phone', 'text'], { tone: 'urgent' }),
      createStage('warm', 'Warm Track', 'working', 47, 58, 200, 160, '☀️', 'yellow', ['email', 'phone'], {}),
      createStage('cold', 'Cold Track', 'circle-back', 47, 85, 180, 120, '❄️', 'slate', ['email'], { followUpStyle: 'gentle' }),
      createStage('negotiate', 'Negotiate', 'working', 65, 43, 220, 180, '🤝', 'purple', ['phone', 'meeting'], { goal: 'closing' }),
      createStage('proposal', 'Proposal', 'working', 82, 43, 200, 160, '📋', 'indigo', ['email', 'meeting'], {}),
      createStage('won', 'Won!', 'approval', 95, 28, 160, 130, '🏆', 'green', ['email', 'phone'], {}),
      createStage('lost', 'Lost', 'dead', 95, 60, 160, 120, '📦', 'slate', [], {}, 'competitor'),
    ],
    connections: [
      { id: 'c1', fromStageId: 'inbound', toStageId: 'qualify', style: 'solid', animated: true },
      { id: 'c2', fromStageId: 'qualify', toStageId: 'segment-a', style: 'solid', animated: true },
      { id: 'c3', fromStageId: 'qualify', toStageId: 'segment-b', style: 'solid', animated: true },
      { id: 'c4', fromStageId: 'qualify', toStageId: 'disqualify', style: 'dashed', animated: false },
      { id: 'c5', fromStageId: 'segment-a', toStageId: 'nurture-a', style: 'solid', animated: true },
      { id: 'c6', fromStageId: 'segment-b', toStageId: 'nurture-b', style: 'solid', animated: true },
      { id: 'c7', fromStageId: 'nurture-a', toStageId: 'hot', style: 'solid', animated: true },
      { id: 'c8', fromStageId: 'nurture-b', toStageId: 'warm', style: 'solid', animated: true },
      { id: 'c9', fromStageId: 'warm', toStageId: 'cold', style: 'dashed', animated: false, condition: { type: 'no-response', value: 72 } },
      { id: 'c10', fromStageId: 'hot', toStageId: 'negotiate', style: 'solid', animated: true },
      { id: 'c11', fromStageId: 'warm', toStageId: 'negotiate', style: 'solid', animated: true },
      { id: 'c12', fromStageId: 'cold', toStageId: 'warm', style: 'dotted', animated: false, condition: { type: 'replied' } },
      { id: 'c13', fromStageId: 'negotiate', toStageId: 'proposal', style: 'solid', animated: true },
      { id: 'c14', fromStageId: 'proposal', toStageId: 'won', style: 'solid', animated: true },
      { id: 'c15', fromStageId: 'proposal', toStageId: 'lost', style: 'dashed', animated: false, condition: { type: 'no-response', value: 168 } },
    ],
    labels: [
      { id: 'l1', text: '⚡ POWER USER PIPELINE', x: 50, y: 5, fontSize: 20, color: '#fbbf24' },
      { id: 'l2', text: 'Qualification', x: 15, y: 12, fontSize: 10, color: '#64748b' },
      { id: 'l3', text: 'Nurture Zone', x: 30, y: 45, fontSize: 10, color: '#64748b' },
      { id: 'l4', text: 'Temperature Tracks', x: 47, y: 20, fontSize: 10, color: '#64748b' },
      { id: 'l5', text: 'Closing Zone', x: 75, y: 35, fontSize: 10, color: '#64748b' },
    ],
  },
];

// Preset categories for sidebar
export const PRESET_CATEGORIES = [
  { id: 'complexity-levels', label: 'Complexity', icon: '📊', description: 'Simple to power user' },
  { id: 'pipeline-purposes', label: 'Pipeline Types', icon: '🎯', description: 'Goal-specific funnels' },
  { id: 'personality-types', label: 'Lead Personalities', icon: '🧠', description: 'Match buyer behavior' },
  { id: 'agent-styles', label: 'Agent Styles', icon: '💼', description: 'Communication approaches' },
];
