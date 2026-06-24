import type { ModelRouter } from '@researchsoul/llm';
import { LlmTaskType } from '@researchsoul/shared';

export interface ContradictionResult {
  claimAId: string;
  claimBId: string;
  claimAText: string;
  claimBText: string;
  reason: string;
  alternativeViewpoints: string[];
  adjustedConfidence: number;
}

/** PDF Module 14 — Contradiction Engine */
export class ContradictionEngine {
  constructor(private llm: ModelRouter) {}

  async detect(
    claims: Array<{ id: string; text: string }>,
  ): Promise<ContradictionResult[]> {
    if (claims.length < 2) return [];

    const contradictions: ContradictionResult[] = [];

    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const a = claims[i];
        const b = claims[j];
        if (this.mightConflict(a.text, b.text)) {
          const result = await this.analyzeConflict(a, b);
          if (result) contradictions.push(result);
        }
      }
    }

    return contradictions;
  }

  private mightConflict(a: string, b: string): boolean {
    const wordsA = a.toLowerCase().split(/\W+/);
    const wordsB = b.toLowerCase().split(/\W+/);
    const shared = wordsA.filter((w) => w.length > 4 && wordsB.includes(w));
    return shared.length >= 2;
  }

  private async analyzeConflict(
    a: { id: string; text: string },
    b: { id: string; text: string },
  ): Promise<ContradictionResult | null> {
    const result = await this.llm.chatForTask(LlmTaskType.VERIFICATION, [
      {
        role: 'system',
        content: `Determine if two claims contradict. Respond JSON: {"contradicts":bool,"reason":"","alternativeViewpoints":[""],"adjustedConfidence":0.0-1.0}`,
      },
      { role: 'user', content: `Claim A: ${a.text}\nClaim B: ${b.text}` },
    ]);

    try {
      const parsed = JSON.parse(result.content.match(/\{[\s\S]*\}/)?.[0] ?? '{}') as {
        contradicts?: boolean;
        reason?: string;
        alternativeViewpoints?: string[];
        adjustedConfidence?: number;
      };
      if (!parsed.contradicts) return null;
      return {
        claimAId: a.id,
        claimBId: b.id,
        claimAText: a.text,
        claimBText: b.text,
        reason: parsed.reason ?? 'Conflicting information detected',
        alternativeViewpoints: parsed.alternativeViewpoints ?? [a.text, b.text],
        adjustedConfidence: parsed.adjustedConfidence ?? 0.4,
      };
    } catch {
      return null;
    }
  }
}
