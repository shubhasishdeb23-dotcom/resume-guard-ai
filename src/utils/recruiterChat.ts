import { ParsedResume } from '../types';
import { CandidateMatch, CandidateProfile, JobDescription } from '../types/recruiter';
import { describeWeights, rankForShortlist, ShortlistWeights } from './shortlist';
import { buildStructuredSummary } from './candidateSummary';

export interface RecruiterChatContext {
  job: JobDescription | null;
  candidates: CandidateProfile[];
  matches: CandidateMatch[];
  resumes: Record<string, ParsedResume>;
  weights: ShortlistWeights;
  focusCandidateId?: string | null;
}

function findCandidate(ctx: RecruiterChatContext, query: string): CandidateProfile | null {
  const q = query.toLowerCase();
  if (ctx.focusCandidateId) {
    const focused = ctx.candidates.find(c => c.id === ctx.focusCandidateId);
    if (focused && (q.includes(focused.name.toLowerCase()) || /\b(this|the) candidate\b/.test(q) || q.includes('them'))) {
      return focused;
    }
  }
  const named = ctx.candidates.find(c => c.name && q.includes(c.name.toLowerCase()));
  if (named) return named;
  if (ctx.focusCandidateId) {
    return ctx.candidates.find(c => c.id === ctx.focusCandidateId) || null;
  }
  return null;
}

function matchFor(ctx: RecruiterChatContext, candidate: CandidateProfile): CandidateMatch | null {
  return ctx.matches.find(m => m.resumeId === candidate.id) || null;
}

export function answerFromLocalData(question: string, ctx: RecruiterChatContext): string {
  const q = question.trim();
  if (!q) return 'Ask a question about the current job, a candidate, scores, verification items, or the shortlist.';

  const lower = q.toLowerCase();
  const ranked = rankForShortlist(ctx.candidates, ctx.matches, ctx.weights);

  if (!ctx.job && ctx.candidates.length === 0) {
    return 'There is no job or candidate data in this browser session yet. Create a job, upload a resume, or load demo data on the recruiter dashboard.';
  }

  if (/(how|what).*(shortlist|score|weight|formula)/.test(lower) || lower.includes('criteria')) {
    const top = ranked.slice(0, 5).map((r, i) => `${i + 1}. ${r.name} (${r.score})`).join('; ');
    return `${describeWeights(ctx.weights)}${top ? ` Current ranking: ${top}.` : ' No candidates to rank yet.'} Shortlisting is a recruiter toggle; the score is an aid, not a hire decision.`;
  }

  if (/(who|which|top|best|rank|shortlist)/.test(lower) && ctx.candidates.length > 0) {
    if (ranked.length === 0) return 'Candidates are present but none have a job-match score yet.';
    const lines = ranked.slice(0, 5).map(r => `${r.name}: ${r.score} (fit ${r.breakdown.jobFit}, evidence ${r.breakdown.evidence}, risk ${r.riskLevel}${r.shortlisted ? ', shortlisted' : ''})`);
    return `Ranked by the transparent shortlist formula for ${ctx.job?.title || 'the current job'}: ${lines.join('. ')}.`;
  }

  const candidate = findCandidate(ctx, lower);
  if (candidate) {
    const match = matchFor(ctx, candidate);
    if (/(verif|flag|risk|suspicious|claim)/.test(lower)) {
      const items = match?.recommendedVerification || [];
      return items.length
        ? `${candidate.name} risk is ${match?.riskLevel}. Verify: ${items.join('; ')}.`
        : `${candidate.name} has risk ${match?.riskLevel || 'n/a'} and no specific verification items on file.`;
    }
    if (/(skill|missing|gap)/.test(lower)) {
      const matched = match?.skillMatch.matched.join(', ') || 'none listed';
      const missing = match?.skillMatch.missing.join(', ') || 'none listed';
      return `${candidate.name} skill match ${match?.skillMatch.score ?? candidate.skillMatch}%. Matched: ${matched}. Missing: ${missing}.`;
    }
    if (/(summar|overview|tell me|who is)/.test(lower)) {
      return buildStructuredSummary(candidate, match, ctx.job, ctx.resumes[candidate.id]);
    }
    return buildStructuredSummary(candidate, match, ctx.job, ctx.resumes[candidate.id]);
  }

  if (ctx.job && /(job|role|requirement|opening)/.test(lower)) {
    const skills = ctx.job.extracted?.requiredSkills?.join(', ') || 'not extracted';
    return `Current job: ${ctx.job.title} at ${ctx.job.company}. Required skills on file: ${skills}. ${ctx.candidates.length} candidate(s) in the pool.`;
  }

  if (/(how many|count|pool)/.test(lower)) {
    return `This session has ${ctx.candidates.length} candidate(s) and ${ctx.matches.length} job-match record(s)${ctx.job ? ` for ${ctx.job.title}` : ''}.`;
  }

  return (
    'I can answer from local recruiter data: candidate scores, skill gaps, verification flags, job requirements, and the shortlist formula. ' +
    'Name a candidate or ask “who ranks highest”. For free-form analysis, connect a local Ollama model in the chat settings.'
  );
}

export function buildPoolContextBlock(ctx: RecruiterChatContext): string {
  const jobLine = ctx.job
    ? `Job: ${ctx.job.title} at ${ctx.job.company}\nRequired skills: ${(ctx.job.extracted?.requiredSkills || []).join(', ') || 'n/a'}\nPreferred: ${(ctx.job.extracted?.preferredSkills || []).join(', ') || 'n/a'}`
    : 'Job: none selected';

  const ranked = rankForShortlist(ctx.candidates, ctx.matches, ctx.weights);
  const people = ctx.candidates.map(c => {
    const m = ctx.matches.find(x => x.resumeId === c.id);
    return `- ${c.name} | fit ${m?.overallFit ?? 'n/a'} | evidence ${c.evidenceScore} | skills ${c.topSkills.join(', ') || 'n/a'} | missing ${(m?.skillMatch.missing || []).join(', ') || 'n/a'} | risk ${m?.riskLevel ?? 'n/a'} | shortlisted ${c.shortlisted ? 'yes' : 'no'} | verify ${(m?.recommendedVerification || []).join('; ') || 'none'}`;
  }).join('\n');

  const ranking = ranked.map(r => `${r.name}:${r.score}`).join(', ') || 'none';

  return `${jobLine}\n${describeWeights(ctx.weights)}\nShortlist ranking: ${ranking}\nCandidates:\n${people || '(none)'}`;
}
