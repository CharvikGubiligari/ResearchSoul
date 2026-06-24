export const SAMPLE_QUEUE = 'sample';

export interface SampleJobData {
  message: string;
  userId?: string;
}

export interface SampleJobResult {
  processedAt: string;
  echo: string;
}
