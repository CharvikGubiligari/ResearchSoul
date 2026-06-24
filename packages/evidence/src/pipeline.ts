import type { ModelRouter } from '@researchsoul/llm';
import {
  CitationStyle,
  CitationMode,
  VerificationStatus,
  type NormalizedDocument,
  type ExtractedClaim,
} from '@researchsoul/shared';
import { ClaimExtractionEngine } from './claims';
import { CitationEngine } from './citation';
import { FactVerificationEngine } from './verification';
import { ContradictionEngine } from './contradiction';
import { ConfidenceEngine } from './confidence';
import { deduplicateClaims } from './deduplication';

export interface ProcessedClaim {
  text: string;
  confidence: number;
  verificationStatus: VerificationStatus;
  evidence: Array<{ documentId: string; excerpt: string; citation: string }>;
  entities: string[];
}

export interface EvidencePipelineResult {
  claims: ProcessedClaim[];
  contradictions: Awaited<ReturnType<ContradictionEngine['detect']>>;
  documents: NormalizedDocument[];
}

/** PDF Module 10 — Evidence Engine orchestrator */
export class EvidencePipeline {
  private claimExtractor: ClaimExtractionEngine;
  private citationEngine: CitationEngine;
  private verificationEngine: FactVerificationEngine;
  private contradictionEngine: ContradictionEngine;
  private confidenceEngine: ConfidenceEngine;

  constructor(llm: ModelRouter) {
    this.claimExtractor = new ClaimExtractionEngine(llm);
    this.citationEngine = new CitationEngine();
    this.verificationEngine = new FactVerificationEngine();
    this.contradictionEngine = new ContradictionEngine(llm);
    this.confidenceEngine = new ConfidenceEngine();
  }

  async process(
    documents: NormalizedDocument[],
    citationStyle: CitationStyle = CitationStyle.APA,
    citationMode: CitationMode = CitationMode.INLINE,
  ): Promise<EvidencePipelineResult> {
    const withIds = documents.map((d, i) => ({ ...d, id: d.id ?? `doc-${i}` }));

    let rawClaims = await this.claimExtractor.extractFromDocuments(withIds);
    rawClaims = deduplicateClaims(rawClaims);

    const processed: ProcessedClaim[] = [];
    const claimRecords: Array<{ id: string; text: string }> = [];

    for (let i = 0; i < rawClaims.length; i++) {
      const claim = rawClaims[i];
      const docId = claim.documentId ?? withIds[0]?.id ?? 'doc-0';
      const doc = withIds.find((d) => d.id === docId) ?? withIds[0];
      if (!doc) continue;

      const evidence = [{
        documentId: doc.id!,
        excerpt: claim.span ?? claim.text,
        citation: this.citationEngine.format({ document: doc, span: claim.span, index: i + 1 }, citationStyle, citationMode),
      }];

      const verifiable = {
        id: `claim-${i}`,
        text: claim.text,
        documentId: docId,
        evidenceDocumentIds: [doc.id!],
      };

      const verification = this.verificationEngine.verify([verifiable], withIds);
      const status = verification.get(verifiable.id) ?? VerificationStatus.UNVERIFIED;

      const factors = this.confidenceEngine.computeFactors(
        evidence.length,
        [doc],
        doc.metadata.reliability >= 0.8,
        true,
      );
      const confidence = this.confidenceEngine.score(factors);

      processed.push({
        text: claim.text,
        confidence,
        verificationStatus: status,
        evidence,
        entities: claim.entities ?? [],
      });
      claimRecords.push({ id: verifiable.id, text: claim.text });
    }

    const contradictions = await this.contradictionEngine.detect(claimRecords);

    for (const c of contradictions) {
      const claim = processed.find((p) => p.text === c.claimAText);
      if (claim) claim.confidence = Math.min(claim.confidence, c.adjustedConfidence);
    }

    return { claims: processed, contradictions, documents: withIds };
  }
}

export { CitationEngine } from './citation';
export { ClaimExtractionEngine } from './claims';
export { FactVerificationEngine } from './verification';
export { ContradictionEngine } from './contradiction';
export { ConfidenceEngine } from './confidence';
export { deduplicateClaims, mergeClaimEvidence } from './deduplication';
