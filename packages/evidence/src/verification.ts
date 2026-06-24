import { VerificationStatus, type NormalizedDocument } from '@researchsoul/shared';

export interface VerifiableClaim {
  id?: string;
  text: string;
  documentId?: string;
  evidenceDocumentIds: string[];
}

/** PDF Module 13 — Fact Verification */
export class FactVerificationEngine {
  verify(claims: VerifiableClaim[], documents: NormalizedDocument[]): Map<string, VerificationStatus> {
    const results = new Map<string, VerificationStatus>();
    const docMap = new Map(documents.map((d) => [d.id!, d]));

    for (const claim of claims) {
      const key = claim.id ?? claim.text;
      const evidenceCount = claim.evidenceDocumentIds.length;

      if (evidenceCount === 0) {
        results.set(key, VerificationStatus.UNVERIFIED);
        continue;
      }

      const reliabilities = claim.evidenceDocumentIds
        .map((id) => docMap.get(id)?.metadata.reliability ?? 0.5);
      const avgReliability = reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length;

      const timestamps = claim.evidenceDocumentIds
        .map((id) => docMap.get(id)?.metadata.timestamp)
        .filter(Boolean) as string[];
      const isStale = timestamps.every((t) => Date.now() - new Date(t).getTime() > 3 * 365 * 24 * 60 * 60 * 1000);

      if (evidenceCount >= 2 && avgReliability >= 0.7) {
        results.set(key, VerificationStatus.VERIFIED);
      } else if (isStale) {
        results.set(key, VerificationStatus.STALE);
      } else if (avgReliability >= 0.5) {
        results.set(key, VerificationStatus.VERIFIED);
      } else {
        results.set(key, VerificationStatus.UNVERIFIED);
      }
    }

    return results;
  }

  findDuplicates(claims: VerifiableClaim[]): VerifiableClaim[][] {
    const groups: VerifiableClaim[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < claims.length; i++) {
      if (used.has(i)) continue;
      const group = [claims[i]];
      for (let j = i + 1; j < claims.length; j++) {
        if (used.has(j)) continue;
        if (this.similarity(claims[i].text, claims[j].text) > 0.85) {
          group.push(claims[j]);
          used.add(j);
        }
      }
      used.add(i);
      if (group.length > 1) groups.push(group);
    }
    return groups;
  }

  private similarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\W+/));
    const wordsB = new Set(b.toLowerCase().split(/\W+/));
    const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
    return intersection / Math.max(wordsA.size, wordsB.size, 1);
  }
}
