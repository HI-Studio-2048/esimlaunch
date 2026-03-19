/**
 * Utility functions to transform provider flags into human-readable labels
 * FRONTEND ONLY - No backend modifications
 */

export interface PlanFlagInfo {
  ipType?: {
    label: string;
    value: string;
  };
  fup?: {
    label: string;
    speedLimit?: string;
    description: string;
  };
  cleanedName: string;
  rawFlags: string[];
}

export function extractPlanFlags(plan: {
  name?: string;
  nonhkip?: boolean | string;
  ipType?: string;
  fup?: boolean | string;
  fupSpeed?: number;
  fairUsagePolicy?: boolean;
}): PlanFlagInfo {
  const rawFlags: string[] = [];
  const originalName = plan.name || '';
  let cleanedName = originalName;

  const nameLower = cleanedName.toLowerCase();

  let ipType: { label: string; value: string } | undefined;
  const hasNonHKIP =
    nameLower.includes('nonhkip') ||
    nameLower.includes('nonhk') ||
    plan.nonhkip === true ||
    plan.ipType === 'nonhkip' ||
    (typeof plan.nonhkip === 'string' &&
      plan.nonhkip.toLowerCase() === 'nonhkip');

  if (hasNonHKIP) {
    rawFlags.push('nonhkip');
    ipType = {
      label: 'IP Location: Non-Hong Kong',
      value: 'nonhkip',
    };
    cleanedName = cleanedName.replace(/nonhkip/gi, '').trim();
    cleanedName = cleanedName.replace(/nonhk/gi, '').trim();
    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  }

  let fup:
    | { label: string; speedLimit?: string; description: string }
    | undefined;
  const fupPattern = /\bfup(\d+)?mbps?\b/i;
  const fupStandalone = /\bfup\b/i;
  const fupInName =
    originalName.match(fupPattern) || originalName.match(fupStandalone);

  const fupInObject =
    plan.fup === true ||
    (plan.fupSpeed && typeof plan.fupSpeed === 'number') ||
    plan.fairUsagePolicy === true ||
    (typeof plan.fup === 'string' && /^fup(\d+)?mbps?$/i.test(plan.fup));

  if (fupInName || fupInObject) {
    const speedMatch = originalName.match(/fup(\d+)?mbps?/i);
    const speedLimit = speedMatch
      ? speedMatch[1] || '1'
      : plan.fupSpeed
        ? String(plan.fupSpeed)
        : '1';

    rawFlags.push(speedMatch ? `FUP${speedLimit}Mbps` : 'FUP');
    fup = {
      label: 'Speed reduced after high-speed data usage',
      speedLimit,
      description: `Fair Usage Policy (FUP): After the high-speed data allowance is used, internet speed is reduced to up to ${speedLimit} Mbps. This allows basic browsing, messaging, and maps, but is not suitable for video streaming.`,
    };
    cleanedName = cleanedName.replace(/fup\d*mbps?/gi, '').trim();
    cleanedName = cleanedName.replace(/\bfup\b/gi, '').trim();
    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  }

  cleanedName = cleanedName.replace(/\s*\(IIJ\)/gi, '').trim();
  cleanedName = cleanedName.replace(/\s*IIJ\s*/gi, ' ').trim();
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  cleanedName = cleanedName.replace(/^[,\-_s]+|[,\-_s]+$/g, '').trim();
  cleanedName = cleanedName.replace(/\s*\(\s*\)/g, '').trim();
  cleanedName = cleanedName.replace(/\s*\(+\s*$/, '').trim();
  cleanedName = cleanedName.replace(/\s*\)+\s*$/, '').trim();
  cleanedName = cleanedName.replace(/\s+$/, '').trim();

  return {
    ipType,
    fup,
    cleanedName: cleanedName || plan.name || '',
    rawFlags,
  };
}

export function getPlanFlagLabels(plan: Parameters<typeof extractPlanFlags>[0]): PlanFlagInfo {
  return extractPlanFlags(plan);
}

export function hasPlanFlags(plan: Parameters<typeof extractPlanFlags>[0]): boolean {
  const flags = extractPlanFlags(plan);
  return flags.rawFlags.length > 0;
}
