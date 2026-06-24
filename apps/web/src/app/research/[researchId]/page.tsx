'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getToken, API_URL } from '@/lib/api';
import type { ResearchProgressEvent } from '@researchsoul/shared';

interface ResearchDetail {
  id: string;
  objective: string;
  status: string;
  progress: number;
  outputType: string;
  reports: Array<{
    id: string;
    title: string;
    executiveSummary: string | null;
    content: string;
    bibliography: string[];
  }>;
  claims: Array<{
    id: string;
    text: string;
    confidence: number;
    verificationStatus: string;
    evidence: Array<{ excerpt: string; citation: string | null; document: { title: string | null; url: string | null } }>;
    contradictions: Array<{ reason: string; alternativeViewpoints: string[] }>;
  }>;
}

export default function ResearchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const researchId = params.researchId as string;

  const [research, setResearch] = useState<ResearchDetail | null>(null);
  const [events, setEvents] = useState<ResearchProgressEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api<ResearchDetail>(`/research/${researchId}`);
      setResearch(data);
    } catch {
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [researchId, router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();

    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load, router]);

  useEffect(() => {
    api<ResearchProgressEvent[]>(`/research/${researchId}/progress`)
      .then(setEvents)
      .catch(() => {});
  }, [researchId, research?.status]);

  async function exportReport(format: string) {
    const report = research?.reports[0];
    if (!report) return;
    const token = getToken();
    const res = await fetch(`${API_URL}/api/v1/reports/${report.id}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ format }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report.${format === 'PDF' ? 'html' : format.toLowerCase()}`;
    a.click();
  }

  async function cancelResearch() {
    await api(`/research/${researchId}/cancel`, { method: 'POST' });
    load();
  }

  if (loading || !research) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading research…</p>
      </div>
    );
  }

  const report = research.reports[0];
  const isRunning = !['COMPLETED', 'FAILED', 'CANCELLED'].includes(research.status);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">← Dashboard</Link>
        <h1 className="text-lg font-semibold mt-2">{research.objective}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted">
          <span className={`px-2 py-0.5 rounded ${research.status === 'COMPLETED' ? 'bg-green-900/40 text-green-300' : 'bg-indigo-900/40 text-indigo-300'}`}>
            {research.status}
          </span>
          <span>{research.progress}%</span>
          <span>{research.outputType.replace(/_/g, ' ')}</span>
          {isRunning && (
            <button onClick={cancelResearch} className="text-red-400 hover:underline">Cancel</button>
          )}
        </div>
        <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${research.progress}%` }} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {events.length > 0 && isRunning && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium mb-2">Progress</h2>
            <ul className="text-sm text-muted space-y-1 max-h-32 overflow-y-auto">
              {events.slice(-8).map((e, i) => (
                <li key={i}>{e.message} {e.agentType && `(${e.agentType})`}</li>
              ))}
            </ul>
          </section>
        )}

        {report && (
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium">{report.title}</h2>
              <div className="flex gap-2">
                {['MARKDOWN', 'DOCX', 'PDF'].map((f) => (
                  <button
                    key={f}
                    onClick={() => exportReport(f)}
                    className="text-xs border border-border px-2 py-1 rounded hover:bg-background"
                  >
                    Export {f}
                  </button>
                ))}
              </div>
            </div>
            {report.executiveSummary && (
              <>
                <h3 className="font-medium mb-2">Executive Summary</h3>
                <p className="text-sm text-muted mb-6 whitespace-pre-wrap">{report.executiveSummary}</p>
              </>
            )}
            <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">{report.content}</div>
          </section>
        )}

        {research.claims.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium mb-4">Evidence & Citations ({research.claims.length} claims)</h2>
            <ul className="space-y-4">
              {research.claims.slice(0, 20).map((claim) => (
                <li key={claim.id} className="border-b border-border pb-4 last:border-0">
                  <p className="text-sm">{claim.text}</p>
                  <p className="text-xs text-muted mt-1">
                    Confidence: {(claim.confidence * 100).toFixed(0)}% · {claim.verificationStatus}
                  </p>
                  {claim.evidence.map((ev, i) => (
                    <p key={i} className="text-xs text-indigo-300 mt-1">
                      {ev.citation ?? ev.excerpt}
                      {ev.document.url && (
                        <a href={ev.document.url} target="_blank" rel="noreferrer" className="ml-2 underline">source</a>
                      )}
                    </p>
                  ))}
                  {claim.contradictions.map((c, i) => (
                    <p key={i} className="text-xs text-amber-400 mt-1">⚠ {c.reason}</p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        )}

        {!report && isRunning && (
          <p className="text-center text-muted text-sm">Research in progress — all 12 agents, evidence pipeline, and report generator running…</p>
        )}
      </main>
    </div>
  );
}
