
import { ComputeStats } from '../types';
import { toast } from './toastManager';

// --- TYPES ---
export type Tier = 'STARTER' | 'GROWTH' | 'EMPIRE';

interface UserProfile {
  tier: Tier;
  xp: number;
  level: number;
  credits: number;
}

// --- STATE ---
let stats: ComputeStats = {
  sessionTokens: 0,
  sessionCostUsd: 0,
  projectedMonthlyUsd: 0,
  proCalls: 0,
  flashCalls: 0
};

let user: UserProfile = {
  tier: 'EMPIRE',
  xp: 15000,
  level: 50,
  credits: 9999.00
};

// GLOBAL ECONOMY LOCK
let economyMode = true;

const FLASH_COST_PER_MIL = 0.10; // $0.10 per million tokens (Economy)
const PRO_COST_PER_MIL = 3.50;  // $3.50 per million tokens (High Fidelity)

// --- LISTENERS ---
type Listener = (s: ComputeStats, user: UserProfile, eco: boolean) => void;
const listeners = new Set<Listener>();

// --- GETTERS ---
export const getBalance = () => user.credits;
export const isEconomyMode = () => economyMode;
export const getUserTier = () => user.tier;
export const getUserLevel = () => user.level;
export const getUserXP = () => user.xp;

// --- SETTERS ---
export const setEconomyMode = (enabled: boolean) => {
  economyMode = enabled;
  notify();
};

export const upgradeTier = (newTier: Tier) => {
  user.tier = newTier;
  notify();
};

// --- GATING LOGIC ---
export const checkFeatureAccess = (feature: string): boolean => {
  // Logic could be expanded here based on tier
  return true;
};

// --- CORE LOGIC ---
export const deductCost = (model: string, estimatedChars: number): boolean => {
  const isPro = model.includes('pro');
  const tokens = Math.ceil(estimatedChars / 4);
  const costPerMil = isPro ? PRO_COST_PER_MIL : FLASH_COST_PER_MIL;
  const effectiveCost = (tokens / 1000000) * costPerMil;

  stats.sessionTokens += tokens;
  stats.sessionCostUsd += effectiveCost;
  
  if (isPro) stats.proCalls++;
  else stats.flashCalls++;
  
  stats.projectedMonthlyUsd = stats.sessionCostUsd * 30;

  // XP is earned based on the "Thinking Intensity"
  const xpGained = Math.ceil(effectiveCost * 1000);
  user.xp += (xpGained > 0 ? xpGained : 1); 
  
  notify();
  return true;
};

// --- SUBSCRIPTION ---
export const subscribeToCompute = (l: Listener): (() => void) => {
  listeners.add(l);
  l(stats, user, economyMode);
  return () => { listeners.delete(l); };
};

const notify = () => {
  listeners.forEach(l => l({ ...stats }, { ...user }, economyMode));
};

export const addCredits = (amount: number) => {
  user.credits += amount;
  notify();
};
