import { ParsedResume } from '../types';

const OLLAMA_ENDPOINT_KEY = 'rg.ollama_endpoint';
const DEFAULT_ENDPOINT = 'http://localhost:11434';

export const AI_MODELS = ['llama3', 'llama3.2', 'qwen2.5:7b'];

export function getOllamaEndpoint(): string {
  try {
    const saved = localStorage.getItem(OLLAMA_ENDPOINT_KEY);
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');
  } catch (error) {
    console.warn('Failed to read Ollama endpoint:', error);
  }
  return DEFAULT_ENDPOINT;
}

export function setOllamaEndpoint(endpoint: string): void {
  try {
    localStorage.setItem(OLLAMA_ENDPOINT_KEY, endpoint.trim().replace(/\/+$/, ''));
  } catch (error) {
    console.warn('Failed to save Ollama endpoint:', error);
  }
}

export async function getOllamaModels(endpoint: string): Promise<string[]> {
  const base = endpoint.trim().replace(/\/+$/, '') || DEFAULT_ENDPOINT;
  const response = await fetch(`${base}/api/tags`);
  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`);
  }
  const data = await response.json();
  const models: string[] = Array.isArray(data?.models)
    ? data.models
        .map((m: { name?: string; model?: string }) => m.name || m.model || '')
        .filter(Boolean)
    : [];
  return Array.from(new Set(models)).sort();
}

function buildPrompt(resume: ParsedResume): string {
  const skills = resume.skills.map(s => s.name).join(', ') || 'None listed';
  const experience = resume.experience
    .map(e => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})`)
    .join('; ') || 'None listed';
  const projects = resume.projects
    .map(p => `${p.name}: ${(p.description || '').slice(0, 120)}`)
    .join(' | ') || 'None listed';

  return `You are a senior technical recruiter reviewing a candidate resume. Give concise, specific, evidence-based feedback.

Respond with exactly these four sections and nothing else:
STRENGTHS:
WEAKNESSES:
RED FLAGS:
SUGGESTIONS:

Resume data:
- Name: ${resume.candidate.name || 'Unknown'}
- Skills: ${skills}
- Experience: ${experience}
- Projects: ${projects}
- Summary: ${resume.candidate.summary || 'N/A'}

Be direct, specific, and professional. Keep the whole response under 250 words.`;
}

export async function getAIInsights(resume: ParsedResume, model: string = 'llama3'): Promise<string> {
  const endpoint = getOllamaEndpoint();
  const response = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: buildPrompt(resume),
      stream: false,
      options: { temperature: 0.3, num_ctx: 2048 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data || typeof data.response !== 'string' || !data.response.trim()) {
    throw new Error('Ollama returned an empty response');
  }

  return data.response.trim();
}