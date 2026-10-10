import { ParsedResume } from '../types';
import { CandidateMatch, CandidateProfile, InterviewQuestion, JobDescription } from '../types/recruiter';

const OLLAMA_ENDPOINT_KEY = 'rg.ollama_endpoint';
const OLLAMA_MODEL_KEY = 'rg.ollama_model';
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

export function getPreferredModel(): string {
  try {
    const saved = localStorage.getItem(OLLAMA_MODEL_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (error) {
    console.warn('Failed to read Ollama model:', error);
  }
  return AI_MODELS[0];
}

export function setPreferredModel(model: string): void {
  try {
    localStorage.setItem(OLLAMA_MODEL_KEY, model.trim());
  } catch (error) {
    console.warn('Failed to save Ollama model:', error);
  }
}

export interface OllamaStatus {
  available: boolean;
  endpoint: string;
  models: string[];
  error?: string;
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

export async function checkOllamaStatus(endpoint = getOllamaEndpoint()): Promise<OllamaStatus> {
  try {
    const models = await getOllamaModels(endpoint);
    return { available: true, endpoint, models };
  } catch (error) {
    return {
      available: false,
      endpoint,
      models: [],
      error: error instanceof Error ? error.message : 'Ollama is not reachable',
    };
  }
}

export function ollamaSetupHint(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'this site';
  return `Could not reach Ollama at ${getOllamaEndpoint()}. Start \`ollama serve\`, pull a model, and set OLLAMA_ORIGINS to include ${origin} (or *), then restart Ollama.`;
}

export async function ollamaGenerate(
  prompt: string,
  model: string = getPreferredModel(),
  options: { temperature?: number; num_ctx?: number } = {},
): Promise<string> {
  const endpoint = getOllamaEndpoint();
  const response = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.3,
        num_ctx: options.num_ctx ?? 4096,
      },
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
  return ollamaGenerate(buildPrompt(resume), model);
}

export function buildCandidateContext(
  candidate: CandidateProfile,
  match: CandidateMatch | null,
  job: JobDescription | null,
  resume?: ParsedResume | null,
): string {
  const skills = candidate.topSkills.join(', ') || 'None listed';
  const matched = match?.skillMatch.matched.join(', ') || 'n/a';
  const missing = match?.skillMatch.missing.join(', ') || 'n/a';
  const verify = match?.recommendedVerification.join('; ') || 'none flagged';
  const projects = resume?.projects.map(p => p.name).join(', ') || 'n/a';

  return [
    `Job: ${job?.title || 'n/a'} at ${job?.company || 'n/a'}`,
    `Candidate: ${candidate.name} <${candidate.email}>`,
    `Years experience: ${candidate.yearsExperience}`,
    `Education: ${candidate.education || 'n/a'}`,
    `Summary: ${candidate.summary || 'n/a'}`,
    `Top skills: ${skills}`,
    `Job fit: ${match?.overallFit ?? 'n/a'}%`,
    `Evidence: ${candidate.evidenceScore}%`,
    `Skill match: ${match?.skillMatch.score ?? candidate.skillMatch}%`,
    `Risk: ${match?.riskLevel ?? 'n/a'}`,
    `Matched skills: ${matched}`,
    `Missing skills: ${missing}`,
    `Verification items: ${verify}`,
    `Projects: ${projects}`,
    `Engineer recommendation: ${match?.recommendation || 'n/a'} — ${match?.recommendationReason || ''}`,
  ].join('\n');
}

export async function generateNarrativeSummary(
  candidate: CandidateProfile,
  match: CandidateMatch | null,
  job: JobDescription | null,
  resume?: ParsedResume | null,
  model?: string,
): Promise<string> {
  const prompt = `You are a recruiting analyst. Write a concise 120-180 word candidate briefing for a hiring manager.
Use only the facts below. Do not invent employers, dates, skills, scores, or outcomes.
If evidence is weak, say so. End with 2 suggested next steps.

${buildCandidateContext(candidate, match, job, resume)}`;

  return ollamaGenerate(prompt, model, { temperature: 0.2 });
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function ollamaChat(
  messages: OllamaChatMessage[],
  model: string = getPreferredModel(),
  options: { temperature?: number; num_ctx?: number } = {},
): Promise<string> {
  const endpoint = getOllamaEndpoint();
  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.3,
        num_ctx: options.num_ctx ?? 4096,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Ollama returned an empty response');
  }
  return content.trim();
}

// Models sometimes restart the transcript ("Recruiter: ...", "Assistant: ...").
// Trim any echoed role label or a spurious new turn so the user only sees the answer.
export function sanitizeChatReply(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^(Recruiter|Assistant|You|User|System)\s*:\s*/i, '');
  const turnBreak = text.search(/\n+\s*(Recruiter|You|User)\s*:/i);
  if (turnBreak >= 0) text = text.slice(0, turnBreak);
  return text.trim();
}

export async function recruiterChatReply(
  question: string,
  history: ChatTurn[],
  contextBlock: string,
  model?: string,
): Promise<string> {
  const prior: OllamaChatMessage[] = history
    .slice(-8)
    .filter((t, i, arr) => !(i === arr.length - 1 && t.role === 'user' && t.content.trim() === question.trim()))
    .map(t => ({ role: t.role, content: t.content }));

  const messages: OllamaChatMessage[] = [
    {
      role: 'system',
      content:
        'You are ResumeGuard AI, a recruitment assistant. Answer only from the hiring context below. ' +
        'If the answer is not in the context, say you do not have that data. Never invent candidates or scores. ' +
        'Keep answers under 180 words. Be specific and cite the numbers that appear in the context.\n\n' +
        `HIRING CONTEXT:\n${contextBlock}`,
    },
    ...prior,
    { role: 'user', content: question },
  ];

  const raw = await ollamaChat(messages, model, { temperature: 0.2, num_ctx: 4096 });
  return sanitizeChatReply(raw);
}

export interface InterviewScoreResult {
  score: number;
  feedback: string;
  method: 'ollama';
}

export async function scoreInterviewAnswerWithLlm(
  question: InterviewQuestion,
  answer: string,
  contextBlock: string,
  model?: string,
): Promise<InterviewScoreResult> {
  const prompt = `You are scoring a mock interview answer for recruiting practice.
Score 0-100 based on specificity, relevance to the claim, and technical depth.
Do not reward vague or empty answers. Use only the resume context — do not invent facts the candidate did not say.

Return JSON only in this shape:
{"score": <number>, "feedback": "<2-4 sentences>"}

CLAIM: ${question.claim}
QUESTION: ${question.question}
REASON: ${question.reason}
CANDIDATE ANSWER: ${answer || '(empty)'}

CONTEXT:
${contextBlock}`;

  const raw = await ollamaGenerate(prompt, model, { temperature: 0.1 });
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Model did not return JSON');
  }
  const parsed = JSON.parse(jsonMatch[0]) as { score?: number; feedback?: string };
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
  const feedback = typeof parsed.feedback === 'string' && parsed.feedback.trim()
    ? parsed.feedback.trim()
    : 'No structured feedback was returned.';
  return { score, feedback, method: 'ollama' };
}
