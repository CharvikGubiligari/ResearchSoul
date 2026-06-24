'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken, getToken } from '@/lib/api';
import type { OrganizationSummary } from '@researchsoul/shared';

interface MeResponse {
  user: { id: string; email: string; name: string | null };
  organizations: OrganizationSummary[];
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [jobStatus, setJobStatus] = useState<string>('');
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    loadDashboard();
  }, [router]);

  async function loadDashboard() {
    try {
      const profile = await api<MeResponse>('/auth/me');
      setMe(profile);

      const org = profile.organizations[0];
      if (!org) return;

      const workspaces = await api<Workspace[]>(
        `/organizations/${org.id}/workspaces`,
      );
      const ws = workspaces[0];
      if (!ws) return;

      setWorkspace(ws);
      const projectList = await api<Project[]>(
        `/workspaces/${ws.id}/projects`,
      );
      setProjects(projectList);
    } catch {
      clearToken();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !newProjectName.trim()) return;
    setError('');
    try {
      const project = await api<Project>(
        `/workspaces/${workspace.id}/projects`,
        {
          method: 'POST',
          body: JSON.stringify({ name: newProjectName.trim() }),
        },
      );
      setProjects((prev) => [project, ...prev]);
      setNewProjectName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  }

  async function testJob() {
    setJobStatus('Enqueueing…');
    try {
      const job = await api<{ id: string }>('/jobs/sample', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello from ResearchSoul Phase 0' }),
      });
      setJobStatus(`Job ${job.id} pending…`);
      const poll = async () => {
        const status = await api<{ status: string; result?: { echo: string } }>(
          `/jobs/${job.id}`,
        );
        setJobStatus(`Job ${job.id}: ${status.status}`);
        if (status.status === 'COMPLETED') {
          setJobStatus(`Done — ${status.result?.echo ?? 'completed'}`);
        } else if (status.status === 'FAILED') {
          setJobStatus('Job failed');
        } else {
          setTimeout(poll, 800);
        }
      };
      setTimeout(poll, 800);
    } catch (err) {
      setJobStatus(err instanceof Error ? err.message : 'Job failed');
    }
  }

  async function testLlm() {
    setLlmResponse('Calling LLM…');
    try {
      const orgId = me?.organizations[0]?.id;
      const result = await api<{ content: string; usage: { estimatedCostUsd: number } }>(
        '/llm/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            message: 'Confirm ResearchSoul Phase 0 is operational.',
            organizationId: orgId,
          }),
        },
      );
      setLlmResponse(
        `${result.content}\n\n(cost: $${result.usage.estimatedCostUsd})`,
      );
    } catch (err) {
      setLlmResponse(err instanceof Error ? err.message : 'LLM call failed');
    }
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearToken();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  const org = me?.organizations[0];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">ResearchSoul</h1>
          <p className="text-sm text-muted">
            {me?.user.email} · {org?.name} · {org?.credits} credits
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-muted hover:text-foreground"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium mb-4">Projects</h2>
          <form onSubmit={createProject} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-indigo-400"
            >
              Create
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          {projects.length === 0 ? (
            <p className="text-muted text-sm">No projects yet. Create one above.</p>
          ) : (
            <ul className="divide-y divide-border">
              {projects.map((p) => (
                <li key={p.id} className="py-3 flex justify-between items-start">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.description && (
                      <p className="text-sm text-muted">{p.description}</p>
                    )}
                    <Link
                      href={`/projects/${p.id}/research/new`}
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      + Start research
                    </Link>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium mb-4">Phase 0 Checks</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={testJob}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-background"
            >
              Test background job
            </button>
            <button
              onClick={testLlm}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-background"
            >
              Test LLM abstraction
            </button>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/health`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-background inline-block"
            >
              API health
            </a>
          </div>
          {jobStatus && (
            <p className="text-sm text-muted mb-2">Job: {jobStatus}</p>
          )}
          {llmResponse && (
            <pre className="text-sm bg-background rounded-lg p-3 whitespace-pre-wrap border border-border">
              {llmResponse}
            </pre>
          )}
        </section>

        <p className="text-xs text-muted text-center">
          Phase 1 MVP — autonomous research with evidence-backed reports
        </p>
      </main>
    </div>
  );
}
