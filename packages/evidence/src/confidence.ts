import type { ConfidenceFactors, NormalizedDocument } from '@researchsoul/shared';

/** PDF Module 15 — Confidence Engine */
export class ConfidenceEngine {
  score(
    factors: Partial<ConfidenceFactors>,
  ): number {
    const f: ConfidenceFactors = {
      sourceAuthority: factors.sourceAuthority ?? 0.5,
      agreement: factors.agreement ?? 0.5,
      recency: factors.recency ?? 0.5,
      evidenceCount: factors.evidenceCount ?? 0.5,
      primarySource: factors.primarySource ?? 0.5,
      citationQuality: factors.citationQuality ?? 0.5,
    };

    const weights = {
      sourceAuthority: 0.25,
      agreement: 0.2,
      recency: 0.15,
      evidenceCount: 0.15,
      primarySource: 0.15,
      citationQuality: 0.1,
    };

    const score =
      f.sourceAuthority * weights.sourceAuthority +
      f.agreement * weights.agreement +
      f.recency * weights.recency +
      f.evidenceCount * weights.evidenceCount +
      f.primarySource * weights.primarySource +
      f.citationQuality * weights.citationQuality;

    return Math.round(Math.min(1, Math.max(0, score)) * 100) / 100;
  }

  computeFactors(
    evidenceCount: number,
    documents: NormalizedDocument[],
    hasPrimarySource: boolean,
    hasCitation: boolean,
    agreementRatio = 1,
  ): ConfidenceFactors {
    const avgAuthority =
      documents.length > 0
        ? documents.reduce((s, d) => s + d.metadata.reliability, 0) / documents.length
        : 0.5;

    const recencyScores = documents.map((d) => {
      const ts = d.metadata.timestamp;
      if (!ts) return 0.5;
      const ageYears = (Date.now() - new Date(ts).getTime()) / (365 * 24 * 60 * 60 * 1000);
      return ageYears < 1 ? 1 : ageYears < 3 ? 0.7 : ageYears < 5 ? 0.5 : 0.3;
    });
    const recency = recencyScores.length
      ? recencyScores.reduce((a, b) => a + b, 0) / recencyScores.length
      : 0.5;

    return {
      sourceAuthority: avgAuthority,
      agreement: agreementRatio,
      recency,
      evidenceCount: Math.min(1, evidenceCount / 3),
      primarySource: hasPrimarySource ? 1 : 0.3,
      citationQuality: hasCitation ? 0.9 : 0.4,
    };
  }
}
