export enum OrgRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum UsageEventType {
  LLM_TOKENS = 'LLM_TOKENS',
  RETRIEVAL_CALL = 'RETRIEVAL_CALL',
  STORAGE_BYTES = 'STORAGE_BYTES',
  RESEARCH_RUN = 'RESEARCH_RUN',
}

export enum JobStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
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
