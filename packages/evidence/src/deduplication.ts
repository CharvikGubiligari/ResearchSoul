import type { ExtractedClaim } from '@researchsoul/shared';

/** Deduplication — PDF Evidence Layer */
export function deduplicateClaims(claims: ExtractedClaim[]): ExtractedClaim[] {
  const seen = new Map<string, ExtractedClaim>();

  for (const claim of claims) {
    const key = normalizeClaimText(claim.text);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, claim);
    }
  }

  return [...seen.values()];
}

function normalizeClaimText(text: string): string {
  return text.toLowerCase().replace(/\W+/g, ' ').trim();
}

export function mergeClaimEvidence(
  claims: ExtractedClaim[],
): Map<string, ExtractedClaim[]> {
  const groups = new Map<string, ExtractedClaim[]>();
  for (const claim of claims) {
    const key = normalizeClaimText(claim.text);
    const group = groups.get(key) ?? [];
    group.push(claim);
    groups.set(key, group);
  }
  return groups;
}
