import type { ModelRouter } from '@researchsoul/llm';
import { LlmTaskType } from '@researchsoul/shared';
import {
  ResearchOutputType,
  CitationStyle,
  type ResearchType,
} from '@researchsoul/shared';
import type { EvidencePipelineResult } from '@researchsoul/evidence';

export interface ReportGeneratorInput {
  objective: string;
  researchType: ResearchType;
  outputType: ResearchOutputType;
  evidence: EvidencePipelineResult;
  citationStyle: CitationStyle;
}

/** PDF Module 20 — all report output types */
const OUTPUT_TEMPLATES: Record<ResearchOutputType, string> = {
  [ResearchOutputType.EXECUTIVE_SUMMARY]: 'Write a concise executive summary (500 words max) with key findings and recommendations.',
  [ResearchOutputType.DEEP_REPORT]: 'Write a comprehensive deep research report with sections: Introduction, Methodology, Findings, Analysis, Conclusions, References.',
  [ResearchOutputType.INVESTMENT_MEMO]: 'Write an investment memo with: Thesis, Market Opportunity, Team, Traction, Risks, Valuation Considerations, Recommendation.',
  [ResearchOutputType.MARKET_REPORT]: 'Write a market report with: Market Overview, Size & Growth, Segments, Key Players, Trends, Outlook.',
  [ResearchOutputType.TECHNICAL_REVIEW]: 'Write a technical review with: Architecture, Technology Stack, Strengths, Weaknesses, Comparison, Recommendations.',
  [ResearchOutputType.SWOT]: 'Write a SWOT analysis with clear Strengths, Weaknesses, Opportunities, Threats sections.',
  [ResearchOutputType.PESTLE]: 'Write a PESTLE analysis covering Political, Economic, Social, Technological, Legal, Environmental factors.',
  [ResearchOutputType.PORTER_FIVE_FORCES]: 'Write Porter\'s Five Forces analysis: Competitive Rivalry, Supplier Power, Buyer Power, Threat of Substitutes, Threat of New Entrants.',
  [ResearchOutputType.COMPETITIVE_MATRIX]: 'Write a competitive matrix comparing key players across features, pricing, market share, and positioning.',
  [ResearchOutputType.LANDSCAPE_ANALYSIS]: 'Write a landscape analysis mapping the ecosystem, key players, relationships, and market dynamics.',
};

export class ReportGenerator {
  constructor(private llm: ModelRouter) {}

  async generate(input: ReportGeneratorInput): Promise<{
    title: string;
    executiveSummary: string;
    content: string;
    bibliography: string[];
  }> {
    const claimsText = input.evidence.claims
      .filter((c) => c.confidence >= 0.5)
      .map((c, i) => `[${i + 1}] ${c.text} (confidence: ${c.confidence}) ${c.evidence.map((e) => e.citation).join(' ')}`)
      .join('\n');

    const contradictionsText = input.evidence.contradictions
      .map((c) => `CONFLICT: ${c.claimAText} vs ${c.claimBText} — ${c.reason}`)
      .join('\n');

    const template = OUTPUT_TEMPLATES[input.outputType] ?? OUTPUT_TEMPLATES[ResearchOutputType.DEEP_REPORT];

    const result = await this.llm.chatForTask(LlmTaskType.REPORT, [
      {
        role: 'system',
        content: `${template}\nCite sources using [n] notation. Flag contradictions. Only use provided claims.`,
      },
      {
        role: 'user',
        content: `Objective: ${input.objective}\nType: ${input.researchType}\n\nVerified Claims:\n${claimsText}\n\nContradictions:\n${contradictionsText || 'None detected'}`,
      },
    ], { preferQuality: true });

    const execResult = await this.llm.chatForTask(LlmTaskType.SYNTHESIS, [
      { role: 'system', content: 'Write a 200-word executive summary of this research.' },
      { role: 'user', content: result.content.slice(0, 8000) },
    ]);

    const bibliography = input.evidence.documents.map((d, i) =>
      `[${i + 1}] ${d.metadata.author ?? 'Unknown'} (${d.metadata.timestamp ? new Date(d.metadata.timestamp).getFullYear() : 'n.d.'}). ${d.title ?? 'Untitled'}. ${d.metadata.url ?? ''}`,
    );

    return {
      title: `Research: ${input.objective.slice(0, 80)}`,
      executiveSummary: execResult.content,
      content: result.content,
      bibliography,
    };
  }
}
