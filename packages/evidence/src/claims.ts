import type { ModelRouter } from '@researchsoul/llm';
import { LlmTaskType } from '@researchsoul/shared';
import type { ExtractedClaim, NormalizedDocument } from '@researchsoul/shared';

/** PDF Module 12 — Claim Extraction */
export class ClaimExtractionEngine {
  constructor(private llm: ModelRouter) {}

  async extractFromDocument(document: NormalizedDocument): Promise<ExtractedClaim[]> {
    const chunks = this.chunkContent(document.content, 3000);
    const allClaims: ExtractedClaim[] = [];

    for (const chunk of chunks) {
      const result = await this.llm.chatForTask(LlmTaskType.EXTRACTION, [
        {
          role: 'system',
          content: `Extract atomic factual claims from the text. Return JSON array: [{"text":"claim","span":"source excerpt","entities":["Entity1"]}]. Only verifiable facts.`,
        },
        { role: 'user', content: chunk },
      ]);

      try {
        const parsed = JSON.parse(this.extractJson(result.content)) as ExtractedClaim[];
        allClaims.push(...parsed.map((c) => ({ ...c, documentId: document.id })));
      } catch {
        allClaims.push(...this.fallbackExtract(chunk));
      }
    }

    return allClaims;
  }

  async extractFromDocuments(documents: NormalizedDocument[]): Promise<ExtractedClaim[]> {
    const results = await Promise.all(documents.map((d) => this.extractFromDocument(d)));
    return results.flat();
  }

  private chunkContent(content: string, maxLen: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += maxLen) {
      chunks.push(content.slice(i, i + maxLen));
    }
    return chunks.length ? chunks : [content];
  }

  private extractJson(text: string): string {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? match[0] : '[]';
  }

  private fallbackExtract(text: string): ExtractedClaim[] {
    return text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 40)
      .slice(0, 5)
      .map((s) => ({ text: s.trim(), span: s.trim() }));
  }
}
