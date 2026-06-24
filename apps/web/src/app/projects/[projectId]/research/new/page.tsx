'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';

const RESEARCH_TYPES = [
  'MARKET_ANALYSIS', 'COMPETITIVE_INTEL', 'INVESTMENT_MEMO', 'TECHNICAL_REVIEW', 'LEGAL_REGULATORY', 'CUSTOM',
];
const DEPTHS = ['QUICK_SCAN', 'STANDARD', 'DEEP_DIVE'];
const OUTPUT_TYPES = [
  'EXECUTIVE_SUMMARY', 'DEEP_REPORT', 'INVESTMENT_MEMO', 'MARKET_REPORT', 'TECHNICAL_REVIEW',
  'SWOT', 'PESTLE', 'PORTER_FIVE_FORCES', 'COMPETITIVE_MATRIX', 'LANDSCAPE_ANALYSIS',
];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const CITATION_STYLES = ['APA', 'MLA', 'CHICAGO', 'IEEE', 'BLUEBOOK'];
const CITATION_MODES = ['INLINE', 'FOOTNOTE', 'ENDNOTE'];

export default function NewResearchPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [form, setForm] = useState({
    objective: '',
    researchType: 'MARKET_ANALYSIS',
    depth: 'STANDARD',
    budget: '',
    deadline: '',
    language: 'en',
    country: '',
    audience: 'executive',
    outputType: 'DEEP_REPORT',
    customInstructions: '',
    priority: 'NORMAL',
    citationStyle: 'APA',
    citationMode: 'INLINE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api<{ research: { id: string } }>('/research', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          objective: form.objective,
          researchType: form.researchType,
          depth: form.depth,
          budget: form.budget ? parseFloat(form.budget) : undefined,
          deadline: form.deadline || undefined,
          language: form.language,
          country: form.country || undefined,
          audience: form.audience,
          outputType: form.outputType,
          customInstructions: form.customInstructions || undefined,
          priority: form.priority,
          citationStyle: form.citationStyle,
          citationMode: form.citationMode,
        }),
      });
      router.push(`/research/${result.research.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start research');
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form, label: string, type = 'text', options?: string[]) => (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      {options ? (
        <select
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          required={key === 'objective'}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">← Dashboard</Link>
      <h1 className="text-2xl font-semibold mt-4 mb-6">New Research Request</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
        {field('objective', 'Research Objective *', 'textarea')}
        {field('researchType', 'Research Type', 'text', RESEARCH_TYPES)}
        {field('depth', 'Depth', 'text', DEPTHS)}
        {field('outputType', 'Output Type', 'text', OUTPUT_TYPES)}
        {field('budget', 'Budget (USD)', 'number')}
        {field('deadline', 'Deadline', 'datetime-local')}
        {field('language', 'Language')}
        {field('country', 'Country')}
        {field('audience', 'Audience')}
        {field('priority', 'Priority', 'text', PRIORITIES)}
        {field('citationStyle', 'Citation Style', 'text', CITATION_STYLES)}
        {field('citationMode', 'Citation Mode', 'text', CITATION_MODES)}
        {field('customInstructions', 'Custom Instructions', 'textarea')}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.objective.trim()}
          className="w-full rounded-lg bg-primary py-2 text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Starting research…' : 'Start Research'}
        </button>
      </form>
    </div>
  );
}
