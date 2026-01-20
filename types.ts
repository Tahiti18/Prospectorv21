
export type MainMode = 'RESEARCH' | 'DESIGN' | 'MEDIA' | 'OUTREACH' | 'ADMIN';

export type SubModule = 
  | 'EXECUTIVE_DASHBOARD'
  | 'TRANSFORMATION_BLUEPRINT'
  | 'USER_GUIDE'
  | 'MARKET_DISCOVERY'
  | 'AUTOMATED_SEARCH'
  | 'PROSPECT_DATABASE'
  | 'PIPELINE'
  | 'STRATEGY_CENTER'
  | 'STRATEGIC_REASONING'
  | 'WORKSPACE'
  | 'MARKET_TRENDS'
  | 'VISUAL_ANALYSIS'
  | 'CONTENT_ANALYSIS'
  | 'BENCHMARK'
  | 'ANALYTICS_HUB'
  | 'HEATMAP'
  | 'VISUAL_STUDIO'
  | 'BRAND_DNA'
  | 'MOCKUPS_4K'
  | 'PRODUCT_SYNTHESIS'
  | 'CONTENT_IDEATION'
  | 'ASSET_LIBRARY'
  | 'VIDEO_PRODUCTION'
  | 'VIDEO_AUDIT'
  | 'VIDEO_INSIGHTS'
  | 'MOTION_LAB'
  | 'SONIC_STUDIO'
  | 'MEETING_NOTES'
  | 'CAMPAIGN_ORCHESTRATOR'
  | 'PROPOSALS'
  | 'ROI_CALCULATOR'
  | 'SEQUENCER'
  | 'PRESENTATION_BUILDER'
  | 'DEMO_SANDBOX'
  | 'DRAFTING'
  | 'SALES_COACH'
  | 'AI_CONCIERGE'
  | 'ELEVATOR_PITCH'
  | 'FUNNEL_MAP'
  | 'AGENCY_PLAYBOOK'
  | 'BILLING'
  | 'AFFILIATE'
  | 'IDENTITY'
  | 'SYSTEM_CONFIG'
  | 'EXPORT_DATA'
  | 'CALENDAR'
  | 'ACTIVITY_LOGS'
  | 'SETTINGS'
  | 'NEXUS_GRAPH'
  | 'TIMELINE'
  | 'TASK_MANAGER'
  | 'THEME'
  | 'USAGE_STATS'
  | 'PROMPT_INTERFACE'
  | 'MODEL_BENCH'
  | 'FACT_CHECK'
  | 'TRANSLATOR'
  | 'VIDEO_PITCH'
  | 'ANALYTICS'
  | 'PROMPT_AI'
  | 'DASHBOARD'
  | 'DOD_DASHBOARD';

export type OutreachStatus = 'cold' | 'queued' | 'sent' | 'opened' | 'replied' | 'booked' | 'won' | 'lost' | 'paused';
export type OutreachChannel = 'email' | 'linkedin' | 'call' | 'sms' | 'whatsapp';
export type OutreachMode = 'test' | 'live';

export interface Lead {
  id: string;
  businessName: string;
  websiteUrl: string;
  niche: string;
  city: string;
  rank: number;
  phone?: string;
  email?: string;
  leadScore: number;
  assetGrade: string;
  socialGap: string;
  visualProof?: string;
  bestAngle?: string;
  personalizedHook?: string;
  // Comment: Changed status type from string to OutreachStatus to fix type mismatch in Pipeline component
  status?: OutreachStatus;
  outreachStatus?: OutreachStatus;
  notes?: string;
  tags?: string[];
  instagram?: string;
  tiktok?: string;
  contactUrl?: string;
  lastContactAt?: number;
  nextFollowUpAt?: number;
  outreachHistory?: OutreachLog[];
  locked?: boolean;
  lockedAt?: number;
  lockedByRunId?: string;
  lockExpiresAt?: number;
  brandIdentity?: BrandIdentity;
  groundingSources?: any[];
  campaigns?: any[];
}

export interface OutreachLog {
  id: string;
  timestamp: number;
  channel: OutreachChannel;
  mode: OutreachMode;
  leadId?: string;
  to?: string;
  subject?: string;
  contentSnippet?: string;
  status: string;
}

export interface AssetRecord {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  title: string;
  data: string;
  timestamp: number;
  module: string;
  leadId?: string;
  metadata?: any;
}

export interface BrandIdentity {
  visualTone: string;
  colors: string[];
  fontPairing: string;
  extractedImages?: string[];
}

export interface BenchmarkReport {
  entityName?: string;
  missionSummary: string;
  visualStack: any[];
  sonicStack: any[];
  featureGap: string;
  businessModel: string;
  designSystem: string;
  deepArchitecture: string;
  sources: any[];
}

export interface VeoConfig {
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  resolution: '720p' | '1080p';
}

export interface ComputeStats {
  sessionTokens: number;
  sessionCostUsd: number;
  projectedMonthlyUsd: number;
  proCalls: number;
  flashCalls: number;
}

export interface GeminiResult<T> {
  ok: boolean;
  text: string;
  raw: any;
  error?: { message: string };
}

// Comment: Added missing OutreachAssets interface for OutreachSection component
export interface OutreachAssets {
  emailOpeners: string[];
  fullEmail: string;
  callOpener: string;
  voicemail: string;
  smsFollowup: string;
}

export interface EngineResult {
  leads: Lead[];
  rubric: any;
  // Comment: Fixed any type to OutreachAssets to resolve import error in OutreachSection
  assets: OutreachAssets;
  groundingSources?: any[];
}

export interface CreativeAsset {
  id: string;
  type: 'static' | 'motion';
  angle: 'STORY' | 'PRODUCT' | 'LIFESTYLE' | 'ABSTRACT';
  imageUrl: string;
  videoUrl?: string;
  headline: string;
  subhead: string;
  cta: string;
  status: 'ready' | 'pending';
}

export interface Campaign {
  id: string;
  name: string;
  timestamp: number;
  creatives: CreativeAsset[];
}

export type WorkspaceType = MainMode | string;
