import { describe, expect, it } from 'vitest';
import { CandidateMatch, CandidateProfile } from '../types/recruiter';
import {
  computeShortlistScore,
  DEFAULT_SHORTLIST_WEIGHTS,
  normalizeWeights,
  rankForShortlist,
  riskSafetyScore,
} from './shortlist';

function candidate(partial: Partial<CandidateProfile> & { id: string; name: string }): CandidateProfile {
  return {
    resumeId: partial.id,
    email: `${partial.name}@example.com`,
    summary: '',
    yearsExperience: 3,
    topSkills: ['Python'],
    education: 'BS CS',
    experience: '3 years',
    overallScore: 70,
    evidenceScore: 70,
    atsScore: 70,
    skillMatch: 70,
    riskSignals: 0,
    verificationStatus: 'pending',
    uploadedAt: new Date(),
    status: 'analyzed',
    ...partial,
  };
}

function match(partial: Partial<CandidateMatch> & { resumeId: string }): CandidateMatch {
  return {
    id: `m_${partial.resumeId}`,
    jobId: 'job',
    overallFit: 70,
    skillMatch: {
      score: 70,
      matched: ['python'],
      missing: [],
      additional: [],
      details: [],
    },
    experienceMatch: {
      score: 70,
      yearsRequired: 3,
      yearsFound: 3,
      relevant: true,
      gap: 0,
      details: 'ok',
    },
    projectMatch: { score: 70, relevantProjects: [], technologiesMatched: [], details: '' },
    educationMatch: { score: 70, meetsRequirement: true, details: '' },
    evidenceMatch: { score: 70, strongEvidence: 2, weakEvidence: 0, suspiciousSignals: 0 },
    missingRequirements: [],
    recommendedVerification: [],
    riskLevel: 'low',
    recommendation: 'potential_match',
    recommendationReason: 'test',
    analyzedAt: new Date(),
    ...partial,
  };
}

describe('shortlist scoring', () => {
  it('normalizes weights to 1', () => {
    const w = normalizeWeights({ jobFit: 2, evidence: 2, skillMatch: 2, skillDepth: 2, riskSafety: 2 });
    const sum = w.jobFit + w.evidence + w.skillMatch + w.skillDepth + w.riskSafety;
    expect(sum).toBeCloseTo(1);
  });

  it('maps risk to a transparent safety score', () => {
    expect(riskSafetyScore('low')).toBe(100);
    expect(riskSafetyScore('medium')).toBe(50);
    expect(riskSafetyScore('high')).toBe(0);
  });

  it('ranks the stronger evidence/fit candidate first', () => {
    const a = candidate({ id: 'a', name: 'Ada', evidenceScore: 90, skillDepthScore: 88 });
    const b = candidate({ id: 'b', name: 'Ben', evidenceScore: 40, skillDepthScore: 30 });
    const matches = [
      match({ resumeId: 'a', overallFit: 92, skillMatch: { score: 90, matched: ['python'], missing: [], additional: [], details: [] }, riskLevel: 'low' }),
      match({ resumeId: 'b', overallFit: 50, skillMatch: { score: 40, matched: [], missing: ['k8s'], additional: [], details: [] }, riskLevel: 'high' }),
    ];
    const ranked = rankForShortlist([a, b], matches, DEFAULT_SHORTLIST_WEIGHTS);
    expect(ranked[0].candidateId).toBe('a');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('explains the formula with real inputs', () => {
    const c = candidate({ id: 'c', name: 'Cara', evidenceScore: 80, skillDepthScore: 70 });
    const m = match({ resumeId: 'c', overallFit: 60 });
    const result = computeShortlistScore(c, m);
    expect(result.explanation).toContain('Cara');
    expect(result.explanation).toContain('60');
    expect(result.explanation).toContain('80');
  });
});
