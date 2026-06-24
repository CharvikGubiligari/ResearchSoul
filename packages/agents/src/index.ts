import {
  AgentType,
  SourceType,
  type AgentCapabilities,
  type AgentTaskContext,
  type EvidenceBundle,
} from '@researchsoul/shared';
import type { ModelRouter } from '@researchsoul/llm';
import { RetrievalService } from '@researchsoul/retrieval';
import { normalizeSources } from '@researchsoul/retrieval';
import type { RetrievalConfig } from '@researchsoul/retrieval';

/** PDF Module 7 — all 12 autonomous agents registered */
export const AGENT_REGISTRY: AgentCapabilities[] = [
  { type: AgentType.MARKET, name: 'Market Agent', capabilities: ['tam_sam_som', 'market_segments', 'growth_rates', 'market_sizing'], defaultSources: [SourceType.GOOGLE, SourceType.NEWS, SourceType.WHITEPAPER, SourceType.CRUNCHBASE], maxConcurrency: 3, estimatedCostTier: 'medium' },
  { type: AgentType.COMPETITOR, name: 'Competitor Agent', capabilities: ['competitive_landscape', 'positioning', 'market_share'], defaultSources: [SourceType.GOOGLE, SourceType.CRUNCHBASE, SourceType.COMPANY_WEBSITE, SourceType.NEWS], maxConcurrency: 3, estimatedCostTier: 'medium' },
  { type: AgentType.FUNDING, name: 'Funding Agent', capabilities: ['vc_rounds', 'investors', 'valuations', 'funding_timeline'], defaultSources: [SourceType.CRUNCHBASE, SourceType.NEWS, SourceType.SEC], maxConcurrency: 2, estimatedCostTier: 'medium' },
  { type: AgentType.CUSTOMER, name: 'Customer Agent', capabilities: ['reviews', 'sentiment', 'personas', 'customer_feedback'], defaultSources: [SourceType.REDDIT, SourceType.NEWS, SourceType.GOOGLE], maxConcurrency: 3, estimatedCostTier: 'low' },
  { type: AgentType.TECHNOLOGY, name: 'Technology Agent', capabilities: ['tech_stack', 'architecture', 'technical_depth'], defaultSources: [SourceType.GITHUB, SourceType.ARXIV, SourceType.GOOGLE, SourceType.WHITEPAPER], maxConcurrency: 3, estimatedCostTier: 'medium' },
  { type: AgentType.PATENT, name: 'Patent Agent', capabilities: ['ip_landscape', 'patent_filings', 'prior_art'], defaultSources: [SourceType.PATENT_DB, SourceType.GOOGLE, SourceType.ARXIV], maxConcurrency: 2, estimatedCostTier: 'high' },
  { type: AgentType.ACADEMIC, name: 'Academic Agent', capabilities: ['papers', 'citations', 'research_trends'], defaultSources: [SourceType.ARXIV, SourceType.PUBMED, SourceType.GOOGLE], maxConcurrency: 3, estimatedCostTier: 'medium' },
  { type: AgentType.NEWS, name: 'News Agent', capabilities: ['recent_events', 'press_coverage', 'announcements'], defaultSources: [SourceType.NEWS, SourceType.RSS, SourceType.GOOGLE], maxConcurrency: 4, estimatedCostTier: 'low' },
  { type: AgentType.FINANCIAL, name: 'Financial Agent', capabilities: ['sec_filings', 'financials', 'metrics', 'revenue'], defaultSources: [SourceType.SEC, SourceType.CRUNCHBASE, SourceType.NEWS], maxConcurrency: 2, estimatedCostTier: 'medium' },
  { type: AgentType.PRODUCT, name: 'Product Agent', capabilities: ['features', 'pricing', 'product_strategy', 'roadmap'], defaultSources: [SourceType.COMPANY_WEBSITE, SourceType.GITHUB, SourceType.GOOGLE], maxConcurrency: 3, estimatedCostTier: 'medium' },
  { type: AgentType.LEGAL, name: 'Legal Agent', capabilities: ['regulations', 'compliance', 'litigation'], defaultSources: [SourceType.SEC, SourceType.GOOGLE, SourceType.NEWS], maxConcurrency: 2, estimatedCostTier: 'high' },
  { type: AgentType.TREND, name: 'Trend Agent', capabilities: ['emerging_trends', 'forecasts', 'adoption_curves'], defaultSources: [SourceType.NEWS, SourceType.ARXIV, SourceType.REDDIT, SourceType.GOOGLE], maxConcurrency: 3, estimatedCostTier: 'medium' },
];

export function getAgentCapabilities(type: AgentType): AgentCapabilities {
  const found = AGENT_REGISTRY.find((a) => a.type === type);
  if (!found) throw new Error(`Unknown agent type: ${type}`);
  return found;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Each agent owns: Tools, Prompt, Memory, Planner, Validator (PDF Module 7) */
export abstract class BaseResearchAgent {
  abstract readonly type: AgentType;
  protected memory: Record<string, unknown> = {};

  constructor(
    protected llm: ModelRouter,
    protected retrieval: RetrievalService,
  ) {}

  /** Planner — sub-task decomposition */
  plan(context: AgentTaskContext): string[] {
    const caps = getAgentCapabilities(this.type);
    const query = context.subQuestion ?? context.question;
    return [`Research ${caps.name} perspective on: ${query}`];
  }

  /** Execute — retrieve, normalize, extract */
  async execute(context: AgentTaskContext): Promise<EvidenceBundle> {
    const caps = getAgentCapabilities(this.type);
    const sourceTypes = context.sourceTypes.length
      ? context.sourceTypes
      : caps.defaultSources;

    const subQueries = this.plan(context);
    const allDocs: EvidenceBundle['documents'] = [];

    for (const query of subQueries) {
      const raw = await this.retrieval.retrieve({
        query,
        sourceTypes,
        language: context.language,
        country: context.country,
        maxResults: context.sourceTypes.includes(SourceType.ARXIV) ? 3 : 5,
      });
      const normalized = normalizeSources(raw, context.language ?? 'en');
      allDocs.push(...normalized.map((d, i) => ({ ...d, id: `${context.taskId}-${this.type}-${i}` })));
    }

    this.memory['lastRetrieval'] = { count: allDocs.length, taskId: context.taskId };

    const claims = allDocs.flatMap((doc) =>
      doc.content
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 30)
        .slice(0, 3)
        .map((text) => ({
          text: text.trim(),
          documentId: doc.id,
          span: text.trim(),
        })),
    );

    const bundle: EvidenceBundle = {
      agentType: this.type,
      taskId: context.taskId,
      claims,
      documents: allDocs,
      metadata: { agent: caps.name, queries: subQueries },
    };

    const validation = this.validate(bundle);
    if (!validation.valid && allDocs.length === 0) {
      throw new Error(`Agent ${this.type} validation failed: ${validation.errors.join(', ')}`);
    }

    return bundle;
  }

  /** Validator */
  validate(bundle: EvidenceBundle): ValidationResult {
    const errors: string[] = [];
    if (bundle.documents.length === 0) errors.push('No documents retrieved');
    if (bundle.claims.length === 0) errors.push('No claims extracted');
    return { valid: errors.length === 0, errors };
  }
}

export class MarketAgent extends BaseResearchAgent { readonly type = AgentType.MARKET; }
export class CompetitorAgent extends BaseResearchAgent { readonly type = AgentType.COMPETITOR; }
export class FundingAgent extends BaseResearchAgent { readonly type = AgentType.FUNDING; }
export class CustomerAgent extends BaseResearchAgent { readonly type = AgentType.CUSTOMER; }
export class TechnologyAgent extends BaseResearchAgent { readonly type = AgentType.TECHNOLOGY; }
export class PatentAgent extends BaseResearchAgent { readonly type = AgentType.PATENT; }
export class AcademicAgent extends BaseResearchAgent { readonly type = AgentType.ACADEMIC; }
export class NewsAgent extends BaseResearchAgent { readonly type = AgentType.NEWS; }
export class FinancialAgent extends BaseResearchAgent { readonly type = AgentType.FINANCIAL; }
export class ProductAgent extends BaseResearchAgent { readonly type = AgentType.PRODUCT; }
export class LegalAgent extends BaseResearchAgent { readonly type = AgentType.LEGAL; }
export class TrendAgent extends BaseResearchAgent { readonly type = AgentType.TREND; }

export function createAgent(
  type: AgentType,
  llm: ModelRouter,
  retrievalConfig: RetrievalConfig = {},
): BaseResearchAgent {
  const retrieval = new RetrievalService(retrievalConfig);
  const agents: Record<AgentType, new (llm: ModelRouter, r: RetrievalService) => BaseResearchAgent> = {
    [AgentType.MARKET]: MarketAgent,
    [AgentType.COMPETITOR]: CompetitorAgent,
    [AgentType.FUNDING]: FundingAgent,
    [AgentType.CUSTOMER]: CustomerAgent,
    [AgentType.TECHNOLOGY]: TechnologyAgent,
    [AgentType.PATENT]: PatentAgent,
    [AgentType.ACADEMIC]: AcademicAgent,
    [AgentType.NEWS]: NewsAgent,
    [AgentType.FINANCIAL]: FinancialAgent,
    [AgentType.PRODUCT]: ProductAgent,
    [AgentType.LEGAL]: LegalAgent,
    [AgentType.TREND]: TrendAgent,
  };
  const AgentClass = agents[type];
  return new AgentClass(llm, retrieval);
}
