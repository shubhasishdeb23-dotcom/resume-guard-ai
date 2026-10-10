import { ParsedResume } from '../types';
import { CandidateMatch, CandidateProfile, JobDescription } from '../types/recruiter';
import { buildStructuredSummary } from './candidateSummary';
import { computeTrustScore, TrustScore } from './trustScore';

export interface EmployerBrief {
  headline: string;
  summary: string;
  fit: {
    overall: number;
    skillMatch: number;
    evidence: number;
    risk: CandidateMatch['riskLevel'];
    recommendation: CandidateMatch['recommendation'];
  };
  strengths: string[];
  gaps: string[];
  verificationAsks: string[];
  interviewFocus: string[];
  nextSteps: string[];
  trust: TrustScore;
}

const RECOMMENDATION_LABEL: Record<CandidateMatch['recommendation'], string> = {
  strong_match: 'Strong match — advance to interview',
  potential_match: 'Potential match — interview with focused verification',
  needs_verification: 'Hold — verify key claims before advancing',
  weak_match: 'Weak match — likely not a fit for this role',
};

export function buildEmployerBrief(
  candidate: CandidateProfile,
  match: CandidateMatch,
  resume: ParsedResume | null,
  job: JobDescription | null,
  shortlistScore?: number,
): EmployerBrief {
  const role = job ? `${job.title} at ${job.company}` : 'the open role';
  const name = candidate.name || 'This candidate';

  const strengths: string[] = [];
  if (match.skillMatch.matched.length > 0) {
    strengths.push(`Matches required skills: ${match.skillMatch.matched.slice(0, 6).join(', ')}.`);
  }
  const supported = resume?.skills.filter(s => s.supportLevel === 'supported').map(s => s.name) || [];
  if (supported.length > 0) {
    strengths.push(`Skills with direct evidence: ${supported.slice(0, 6).join(', ')}.`);
  }
  const quantified = resume?.experience.filter(e => e.achievements.length > 0 || e.metrics.length > 0) || [];
  if (quantified.length > 0) {
    strengths.push(`${quantified.length} role(s) include measurable outcomes (e.g. ${quantified[0].role}).`);
  }
  if (match.experienceMatch.relevant) {
    strengths.push(`Experience requirement met: ${match.experienceMatch.details}.`);
  }
  if (strengths.length === 0) {
    strengths.push('No standout strengths were detected from the stored analysis.');
  }

  const gaps: string[] = [];
  if (match.skillMatch.missing.length > 0) {
    gaps.push(`Not evidenced for required skills: ${match.skillMatch.missing.join(', ')}.`);
  }
  if (match.experienceMatch.gap > 0) {
    gaps.push(`Experience gap of ${match.experienceMatch.gap.toFixed(1)} year(s).`);
  }
  const missingCerts = match.missingRequirements.filter(m => m.toLowerCase().includes('certification'));
  missingCerts.forEach(m => gaps.push(m));
  if (gaps.length === 0) {
    gaps.push('No major gaps detected against the parsed requirements.');
  }

  const verificationAsks = match.recommendedVerification.length > 0
    ? match.recommendedVerification
    : ['No specific claims were flagged for verification.'];

  const interviewFocus: string[] = [];
  if (match.skillMatch.missing.length > 0) {
    interviewFocus.push(`Probe depth on ${match.skillMatch.missing.slice(0, 3).join(', ')}.`);
  }
  if (match.experienceMatch.gap > 0) {
    interviewFocus.push('Clarify the timeline and scope of recent roles.');
  }
  verificationAsks.slice(0, 2).forEach(v => interviewFocus.push(v));
  if (interviewFocus.length === 0) {
    interviewFocus.push('Confirm motivation and role fit, then move to a practical task.');
  }

  const trust = computeTrustScore(resume, candidate, match);

  const nextSteps = [RECOMMENDATION_LABEL[match.recommendation]];
  if (trust.band === 'limited' || trust.band === 'low') {
    nextSteps.push('Run the mock interview and verify the flagged claims before a hiring decision.');
  } else {
    nextSteps.push('Schedule a focused interview using the suggested focus areas.');
  }
  if (typeof shortlistScore === 'number') {
    nextSteps.push(`Shortlist score on file: ${shortlistScore}.`);
  }

  const summary = buildStructuredSummary(candidate, match, job, resume);

  return {
    headline: `${name} — ${role} (fit ${match.overallFit}%, trust ${trust.score})`,
    summary,
    fit: {
      overall: match.overallFit,
      skillMatch: match.skillMatch.score,
      evidence: candidate.evidenceScore,
      risk: match.riskLevel,
      recommendation: match.recommendation,
    },
    strengths,
    gaps,
    verificationAsks,
    interviewFocus,
    nextSteps,
    trust,
  };
}
