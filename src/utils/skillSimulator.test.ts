import { describe, it, expect } from 'vitest';
import { simulateSkills, skillsCandidateCouldAdd } from './skillSimulator';
import { CandidateMatch, JobDescription } from '../types/recruiter';

function job(): JobDescription {
  return {
    id: 'j1',
    title: 'Backend Engineer',
    company: 'Acme',
    rawText: '',
    extracted: {
      requiredSkills: ['React', 'Python', 'SQL'],
      preferredSkills: ['Docker'],
      technologies: [],
      experience: { years: 3, level: 'mid', description: '' },
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
    overallFit: 70,
    skillMatch: { score: 67, matched: ['react', 'sql'], missing: ['python'], additional: [], details: [] },
    experienceMatch: { score: 100, yearsRequired: 3, yearsFound: 5, relevant: true, gap: 0, details: '' },
    projectMatch: { score: 60, relevantProjects: [], technologiesMatched: [], details: '' },
    educationMatch: { score: 100, meetsRequirement: true, details: '' },
    evidenceMatch: { score: 70, strongEvidence: 1, weakEvidence: 1, suspiciousSignals: 0 },
    missingRequirements: ['Missing required skill: python'],
    recommendedVerification: [],
    riskLevel: 'low',
    recommendation: 'potential_match',
    recommendationReason: '',
    analyzedAt: new Date(),
  };
}

describe('skill simulator', () => {
  it('lists addable required and preferred skills not already matched', () => {
    const options = skillsCandidateCouldAdd(job(), match());
    const names = options.map(o => o.skill.toLowerCase());
    expect(names).toContain('python');
    expect(names).toContain('docker');
    expect(names).not.toContain('react');
    expect(options.find(o => o.skill.toLowerCase() === 'python')?.required).toBe(true);
    expect(options.find(o => o.skill.toLowerCase() === 'docker')?.required).toBe(false);
  });

  it('projects a higher fit when a missing required skill is added', () => {
    const result = simulateSkills(match(), job(), ['Python']);
    expect(result.projected.skillMatch).toBe(100);
    expect(result.delta.skillMatch).toBeGreaterThan(0);
    expect(result.delta.fit).toBeGreaterThan(0);
    expect(result.stillMissing).toHaveLength(0);
    expect(result.notes.join(' ')).toMatch(/simulation/i);
  });

  it('keeps the score flat when only preferred skills are added', () => {
    const result = simulateSkills(match(), job(), ['Docker']);
    expect(result.delta.skillMatch).toBe(0);
    expect(result.notes.join(' ')).toMatch(/preferred/i);
  });
});
