import { describe, it, expect } from 'vitest';
import { buildEmployerBrief } from './employerBrief';
import { richResume } from './testFixtures';
import { CandidateMatch, CandidateProfile, JobDescription } from '../types/recruiter';

function candidate(): CandidateProfile {
  return {
    id: 'c1',
    resumeId: 'r1',
    name: 'Alex Carter',
    email: 'alex@email.com',
    summary: 'Senior full-stack engineer',
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
  };
}

function job(): JobDescription {
  return {
    id: 'j1',
    title: 'Senior Engineer',
    company: 'TechCorp',
    rawText: '',
    extracted: {
      requiredSkills: ['React', 'Node.js'],
      preferredSkills: [],
      technologies: [],
      experience: { years: 5, level: 'senior', description: '' },
      education: [],
      responsibilities: [],
      certifications: [],
      domainRequirements: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function match(): CandidateMatch {
  return {
    id: 'm1',
    resumeId: 'c1',
    jobId: 'j1',
    overallFit: 84,
    skillMatch: { score: 100, matched: ['react', 'node.js'], missing: [], additional: [], details: [] },
    experienceMatch: { score: 95, yearsRequired: 5, yearsFound: 6, relevant: true, gap: 0, details: 'Meets requirement: 6.0 years vs 5 required' },
    projectMatch: { score: 70, relevantProjects: ['Collab Editor'], technologiesMatched: ['react'], details: '' },
    educationMatch: { score: 100, meetsRequirement: true, details: '' },
    evidenceMatch: { score: 85, strongEvidence: 2, weakEvidence: 0, suspiciousSignals: 0 },
    missingRequirements: [],
    recommendedVerification: ['Verify React skill'],
    riskLevel: 'low',
    recommendation: 'strong_match',
    recommendationReason: 'Strong technical skill match.',
    analyzedAt: new Date(),
  };
}

describe('buildEmployerBrief', () => {
  it('produces a complete, fact-based brief', () => {
    const brief = buildEmployerBrief(candidate(), match(), richResume(), job(), 88);
    expect(brief.headline).toContain('Alex Carter');
    expect(brief.headline).toContain('fit 84%');
    expect(brief.headline).toContain('trust');
    expect(brief.strengths.length).toBeGreaterThan(0);
    expect(brief.gaps.length).toBeGreaterThan(0);
    expect(brief.verificationAsks).toContain('Verify React skill');
    expect(brief.interviewFocus.length).toBeGreaterThan(0);
    expect(brief.nextSteps[0]).toMatch(/strong match/i);
    expect(brief.nextSteps.join(' ')).toContain('88');
    expect(brief.trust.score).toBeGreaterThanOrEqual(0);
    expect(brief.fit.recommendation).toBe('strong_match');
  });
});
