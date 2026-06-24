import type {
  ResearchStatus,
  ResearchType,
  ResearchDepth,
  ResearchOutputType,
  ResearchPriority,
  CitationStyle,
  CitationMode,
  ExecutionDAG,
  ReportFormat,
} from './enums';

export interface ResearchSummary {
  id: string;
  projectId: string;
  objective: string;
  researchType: ResearchType;
  depth: ResearchDepth;
  outputType: ResearchOutputType;
  status: ResearchStatus;
  progress: number;
  budget?: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ResearchDetail extends ResearchSummary {
  deadline?: string;
  language: string;
  country?: string;
  audience?: string;
  customInstructions?: string;
  priority: ResearchPriority;
  citationStyle: CitationStyle;
  citationMode: CitationMode;
  execution?: {
    id: string;
    status: string;
    dag?: ExecutionDAG;
    checkpoint?: unknown;
  };
}

export interface ReportSummary {
  id: string;
  researchId: string;
  title: string;
  outputType: ResearchOutputType;
  format: ReportFormat;
  executiveSummary?: string;
  createdAt: string;
  s3Key?: string;
}

export interface ClaimWithEvidence {
  id: string;
  text: string;
  confidence: number;
  verificationStatus: string;
  evidence: Array<{
    id: string;
    excerpt: string;
    citation: string;
    document: { title?: string; url?: string };
  }>;
  contradictions: Array<{
    id: string;
    reason: string;
    alternativeViewpoints: string[];
  }>;
}

export interface ReportContent {
  title: string;
  executiveSummary: string;
  sections: Array<{
    heading: string;
    content: string;
    claims: ClaimWithEvidence[];
  }>;
  contradictions: Array<{
    claimA: string;
    claimB: string;
    reason: string;
    alternativeViewpoints: string[];
  }>;
  bibliography: string[];
  metadata: {
    researchType: ResearchType;
    outputType: ResearchOutputType;
    citationStyle: CitationStyle;
    generatedAt: string;
  };
}
