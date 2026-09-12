import { ParsedResume } from '../types';

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';

export const AI_MODELS = ['llama3', 'llama3.2', 'qwen2.5:7b'];

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
  const response = await fetch(OLLAMA_ENDPOINT, {
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