import { CandidateMatch, CandidateProfile } from '../types/recruiter';

export interface ShortlistWeights {
  jobFit: number;
  evidence: number;
  skillMatch: number;
  skillDepth: number;
  riskSafety: number;
}

export const DEFAULT_SHORTLIST_WEIGHTS: ShortlistWeights = {
  jobFit: 35,
  evidence: 25,
  skillMatch: 20,
  skillDepth: 10,
  riskSafety: 10,
};

export interface ShortlistBreakdown {
  jobFit: number;
  evidence: number;
  skillMatch: number;
  skillDepth: number;
  riskSafety: number;
}

export interface ShortlistResult {
  candidateId: string;
  name: string;
  score: number;
  breakdown: ShortlistBreakdown;
  explanation: string;
  shortlisted: boolean;
  riskLevel: CandidateMatch['riskLevel'];
}

export function normalizeWeights(weights: ShortlistWeights): ShortlistWeights {
  const total = weights.jobFit + weights.evidence + weights.skillMatch + weights.skillDepth + weights.riskSafety;
  if (total <= 0) return { ...DEFAULT_SHORTLIST_WEIGHTS };
  return {
    jobFit: weights.jobFit / total,
    evidence: weights.evidence / total,
    skillMatch: weights.skillMatch / total,
    skillDepth: weights.skillDepth / total,
    riskSafety: weights.riskSafety / total,
  };
}

export function riskSafetyScore(risk: CandidateMatch['riskLevel']): number {
  if (risk === 'low') return 100;
  if (risk === 'medium') return 50;
  return 0;
}

export function computeShortlistScore(
  candidate: CandidateProfile,
  match: CandidateMatch,
  weights: ShortlistWeights = DEFAULT_SHORTLIST_WEIGHTS,
): ShortlistResult {
  const w = normalizeWeights(weights);
  const jobFit = match.overallFit;
  const evidence = candidate.evidenceScore;
  const skillMatch = match.skillMatch.score;
  const skillDepth = candidate.skillDepthScore ?? evidence;
  const riskSafety = riskSafetyScore(match.riskLevel);

  const score = Math.round(
    jobFit * w.jobFit +
    evidence * w.evidence +
    skillMatch * w.skillMatch +
    skillDepth * w.skillDepth +
    riskSafety * w.riskSafety,
  );

  const explanation =
    `${candidate.name}: ${score} = ` +
    `job fit ${jobFit}×${Math.round(w.jobFit * 100)}% + ` +
    `evidence ${evidence}×${Math.round(w.evidence * 100)}% + ` +
    `skill match ${skillMatch}×${Math.round(w.skillMatch * 100)}% + ` +
    `skill depth ${skillDepth}×${Math.round(w.skillDepth * 100)}% + ` +
    `risk safety ${riskSafety}×${Math.round(w.riskSafety * 100)}% ` +
    `(risk ${match.riskLevel}).`;

  return {
    candidateId: candidate.id,
    name: candidate.name,
    score,
    breakdown: { jobFit, evidence, skillMatch, skillDepth, riskSafety },
    explanation,
    shortlisted: Boolean(candidate.shortlisted),
    riskLevel: match.riskLevel,
  };
}

export function rankForShortlist(
  candidates: CandidateProfile[],
  matches: CandidateMatch[],
  weights: ShortlistWeights = DEFAULT_SHORTLIST_WEIGHTS,
): ShortlistResult[] {
  return candidates
    .map(candidate => {
      const match = matches.find(m => m.resumeId === candidate.id);
      if (!match) return null;
      return computeShortlistScore(candidate, match, weights);
    })
    .filter((row): row is ShortlistResult => row !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function describeWeights(weights: ShortlistWeights): string {
  const w = normalizeWeights(weights);
  return (
    `Shortlist score = job fit (${Math.round(w.jobFit * 100)}%) + evidence (${Math.round(w.evidence * 100)}%) ` +
    `+ skill match (${Math.round(w.skillMatch * 100)}%) + skill depth (${Math.round(w.skillDepth * 100)}%) ` +
    `+ risk safety (${Math.round(w.riskSafety * 100)}%). Risk safety is 100 for low, 50 for medium, 0 for high.`
  );
}
