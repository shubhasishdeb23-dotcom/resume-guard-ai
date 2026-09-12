import { describe, it, expect } from 'vitest';
import { matchCandidateToJob } from './jobMatcher';
import { JobDescription } from '../types/recruiter';
import { richResume, emptyResume } from './testFixtures';

function job(): JobDescription {
  return {
    id: 'j1',
    title: 'Backend Engineer',
    company: 'Acme',
    rawText: 'Need Python, Django, AWS and PostgreSQL',
    extracted: {
      requiredSkills: ['Python', 'Django', 'AWS', 'PostgreSQL'],
      preferredSkills: ['Kubernetes'],
      technologies: ['Python', 'Django', 'AWS', 'PostgreSQL', 'Kubernetes'],
      experience: { years: 3, level: 'mid', description: '3+ years backend' },
      education: [{ degree: 'Bachelor', field: 'Computer Science', required: false }],
      responsibilities: ['Build APIs'],
      certifications: [],
      domainRequirements: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('matchCandidateToJob', () => {
  it('returns a valid match with all sub-scores', () => {
    const match = matchCandidateToJob(richResume(), job(), 80);
    expect(match.overallFit).toBeGreaterThanOrEqual(0);
    expect(match.overallFit).toBeLessThanOrEqual(100);
    expect(match.skillMatch.score).toBeGreaterThanOrEqual(0);
    expect(match.experienceMatch.yearsRequired).toBe(3);
    expect(['low', 'medium', 'high']).toContain(match.riskLevel);
  });

  it('reports missing required skills', () => {
    const match = matchCandidateToJob(emptyResume(), job(), 40);
    expect(match.skillMatch.missing.some(s => s.toLowerCase() === 'python')).toBe(true);
  });

  it('recommends verification when evidence score is low', () => {
    const match = matchCandidateToJob(richResume(), job(), 35);
    expect(match.riskLevel).not.toBe('low');
  });
});