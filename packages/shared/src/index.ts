export * from './enums';
export * from './research';

import type { OrgRole, JobStatus, ResearchType, ResearchDepth, ResearchOutputType, ResearchPriority, ResearchStatus, AgentType, CitationStyle, CitationMode } from './enums';
import type { AgentType as AT, SourceType, DocumentType, ExecutionDAG, DAGNode, DAGEdge } from './enums';

export type { ExecutionDAG, DAGNode, DAGEdge };

export interface DocumentMetadata {
  author?: string;
  publisher?: string;
  timestamp?: string;
  type: DocumentType;
  language?: string;
  url?: string;
  license?: string;
  reliability: number;
}

export interface NormalizedDocument {
  id?: string;
  metadata: DocumentMetadata;
  content: string;
  title?: string;
}

export interface ExtractedClaim {
  text: string;
  documentId?: string;
  span?: string;
  entities?: string[];
}

export interface EvidenceRecord {
  documentId: string;
  span: string;
  excerpt: string;
}

export interface ContradictionRecord {
  claimA: string;
  claimB: string;
  reason: string;
  alternativeViewpoints: string[];
  adjustedConfidence: number;
}

export interface ConfidenceFactors {
  sourceAuthority: number;
  agreement: number;
  recency: number;
  evidenceCount: number;
  primarySource: number;
  citationQuality: number;
}

export interface AgentCapabilities {
  type: AT;
  name: string;
  capabilities: string[];
  defaultSources: SourceType[];
  maxConcurrency: number;
  estimatedCostTier: 'low' | 'medium' | 'high';
}

export interface AgentTaskContext {
  researchId: string;
  taskId: string;
  agentType: AgentType;
  question: string;
  subQuestion?: string;
  sourceTypes: SourceType[];
  country?: string;
  language?: string;
  customInstructions?: string;
}

export interface EvidenceBundle {
  agentType: AT;
  taskId: string;
  claims: ExtractedClaim[];
  documents: NormalizedDocument[];
  metadata: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  requestId?: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  requestId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  credits: number;
  role: OrgRole;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    storage: 'up' | 'down';
  };
}

export interface JobStatusResponse {
  id: string;
  name: string;
  status: JobStatus;
  progress?: number;
  result?: unknown;
  failedReason?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface LlmUsageLog {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
}

export interface ResearchRequestInput {
  projectId: string;
  objective: string;
  researchType: ResearchType;
  depth: ResearchDepth;
  budget?: number;
  deadline?: string;
  language?: string;
  country?: string;
  audience?: string;
  outputType: ResearchOutputType;
  customInstructions?: string;
  priority?: ResearchPriority;
  citationStyle?: CitationStyle;
  citationMode?: CitationMode;
}

export interface ResearchProgressEvent {
  researchId: string;
  status: ResearchStatus;
  phase: string;
  progress: number;
  message: string;
  taskId?: string;
  agentType?: AgentType;
  timestamp: string;
}
