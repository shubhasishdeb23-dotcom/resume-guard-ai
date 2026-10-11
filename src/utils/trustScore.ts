import { ParsedResume } from '../types';
import { CandidateMatch, CandidateProfile } from '../types/recruiter';

export interface TrustFactor {
  label: string;
  value: number;
  weight: number;
  detail: string;
}

export interface TrustScore {
  score: number;
  band: 'high' | 'moderate' | 'limited' | 'low';
  label: string;
  factors: TrustFactor[];
  caveat: string;
}

const CAVEAT =
  'Trust Score reflects the plausibility and internal consistency of the material provided. It is not a fraud-detection or background-check result, and all findings should be confirmed through direct verification.';

function bandFor(score: number): { band: TrustScore['band']; label: string } {
  if (score >= 80) return { band: 'high', label: 'High trust' };
  if (score >= 60) return { band: 'moderate', label: 'Moderate trust' };
  if (score >= 40) return { band: 'limited', label: 'Limited trust' };
  return { band: 'low', label: 'Low trust' };
}

export function computeTrustScore(
  resume: ParsedResume | null,
  candidate: CandidateProfile,
  match: CandidateMatch | null,
): TrustScore {
  const evidence = clamp(candidate.evidenceScore ?? 0);

  const verificationSafety = match
    ? match.riskLevel === 'low'
      ? 100
      : match.riskLevel === 'medium'
        ? 60
        : 25
    : 60;

  const totalSkills = resume?.skills.length ?? 0;
  const supportedSkills = resume?.skills.filter(s => s.supportLevel === 'supported').length ?? 0;
  const skillSupport = totalSkills > 0 ? clamp(Math.round((supportedSkills / totalSkills) * 100)) : 50;

  const suspiciousSignals = resume?.skills.filter(s => s.supportLevel === 'unsupported').length ?? 0;
  const consistency = clamp(100 - suspiciousSignals * 12);

  const experiences = resume?.experience ?? [];
  const withOutcomes = experiences.filter(e => (e.achievements?.length ?? 0) > 0 || (e.metrics?.length ?? 0) > 0).length;
  const quantified = experiences.length > 0 ? clamp(Math.round((withOutcomes / experiences.length) * 100)) : 60;

  const factors: TrustFactor[] = [
    {
      label: 'Evidence strength',
      value: evidence,
      weight: 0.3,
      detail: `Overall evidence coverage is ${evidence}%.`,
    },
    {
      label: 'Verification safety',
      value: verificationSafety,
      weight: 0.25,
      detail: match ? `Risk level reported as ${match.riskLevel}.` : 'No job match available.',
    },
    {
      label: 'Internal consistency',
      value: consistency,
      weight: 0.15,
      detail: `${suspiciousSignals} claim(s) lack any supporting context.`,
    },
    {
      label: 'Skill support ratio',
      value: skillSupport,
      weight: 0.15,
      detail: `${supportedSkills}/${totalSkills || 0} listed skills have supporting evidence.`,
    },
    {
      label: 'Quantified outcomes',
      value: quantified,
      weight: 0.15,
      detail: `${withOutcomes}/${experiences.length || 0} roles include a measurable result.`,
    },
  ];

  const score = clamp(
    Math.round(factors.reduce((sum, f) => sum + f.value * f.weight, 0)),
  );
  const { band, label } = bandFor(score);

  return { score, band, label, factors, caveat: CAVEAT };
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
