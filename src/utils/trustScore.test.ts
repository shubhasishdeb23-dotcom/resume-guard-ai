import { describe, it, expect } from 'vitest';
import { computeTrustScore } from './trustScore';
import { emptyResume, richResume } from './testFixtures';
import { CandidateMatch, CandidateProfile } from '../types/recruiter';

function candidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: 'c1',
    resumeId: 'r1',
    name: 'Alex Carter',
    email: 'alex@email.com',
    summary: '',
    yearsExperience: 6,
    topSkills: ['React', 'Node.js'],
    education: 'BS Computer Science',
    experience: '6 years',
    overallScore: 82,
    evidenceScore: 85,
    atsScore: 80,
    skillMatch: 90,
    riskSignals: 0,
    verificationStatus: 'verified',
    uploadedAt: new Date(),
    status: 'analyzed',
    ...overrides,
  };
}

function match(overrides: Partial<CandidateMatch> = {}): CandidateMatch {
  return {
    id: 'm1',
    resumeId: 'c1',
    jobId: 'j1',
    overallFit: 82,
    skillMatch: { score: 90, matched: ['react'], missing: [], additional: [], details: [] },
    experienceMatch: { score: 100, yearsRequired: 3, yearsFound: 6, relevant: true, gap: 0, details: '' },
    projectMatch: { score: 70, relevantProjects: [], technologiesMatched: [], details: '' },
    educationMatch: { score: 100, meetsRequirement: true, details: '' },
    evidenceMatch: { score: 85, strongEvidence: 2, weakEvidence: 0, suspiciousSignals: 0 },
    missingRequirements: [],
    recommendedVerification: [],
    riskLevel: 'low',
    recommendation: 'strong_match',
    recommendationReason: '',
    analyzedAt: new Date(),
    ...overrides,
  };
}

describe('computeTrustScore', () => {
  it('rates a well-evidenced, low-risk candidate as high trust', () => {
    const result = computeTrustScore(richResume(), candidate(), match());
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.band).toBe('high');
    expect(result.factors).toHaveLength(5);
    expect(result.factors.reduce((s, f) => s + f.weight, 0)).toBeCloseTo(1, 5);
    expect(result.caveat.toLowerCase()).toContain('not a fraud');
  });

  it('rates a weak, high-risk candidate lower', () => {
    const low = computeTrustScore(
      emptyResume(),
      candidate({ evidenceScore: 35, verificationStatus: 'flagged' }),
      match({ riskLevel: 'high', evidenceMatch: { score: 35, strongEvidence: 0, weakEvidence: 0, suspiciousSignals: 4 } }),
    );
    expect(low.score).toBeLessThan(60);
    expect(['limited', 'low']).toContain(low.band);
  });

  it('stays within 0-100 bounds', () => {
    const result = computeTrustScore(null, candidate({ evidenceScore: 0 }), null);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
