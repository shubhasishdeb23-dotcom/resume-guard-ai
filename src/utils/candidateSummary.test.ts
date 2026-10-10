import { describe, expect, it } from 'vitest';
import { buildStructuredSummary } from './candidateSummary';
import { CandidateMatch, CandidateProfile } from '../types/recruiter';

describe('buildStructuredSummary', () => {
  it('uses real candidate and match fields only', () => {
    const candidate: CandidateProfile = {
      id: '1',
      resumeId: 'r1',
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      summary: 'Backend engineer',
      yearsExperience: 5,
      topSkills: ['Go', 'PostgreSQL'],
      education: 'BS Computer Science',
      experience: '5 years',
      overallScore: 81,
      evidenceScore: 64,
      atsScore: 70,
      skillMatch: 72,
      riskSignals: 1,
      verificationStatus: 'pending',
      uploadedAt: new Date(),
      status: 'analyzed',
    };
    const match = {
      overallFit: 77,
      skillMatch: { score: 72, matched: ['Go'], missing: ['Kubernetes'], additional: [], details: [] },
      recommendedVerification: ['Confirm Kubernetes production experience'],
      recommendationReason: 'Solid backend evidence, platform gap.',
      riskLevel: 'medium',
    } as unknown as CandidateMatch;

    const text = buildStructuredSummary(candidate, match, {
      id: 'j',
      title: 'Platform Engineer',
      company: 'Northwind',
      rawText: '',
      extracted: {
        requiredSkills: [],
        preferredSkills: [],
        technologies: [],
        experience: { years: 4, level: 'mid', description: '' },
        education: [],
        responsibilities: [],
        certifications: [],
        domainRequirements: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(text).toContain('Jordan Lee');
    expect(text).toContain('Platform Engineer');
    expect(text).toContain('Kubernetes');
    expect(text).toContain('77%');
    expect(text).not.toContain('undefined');
  });
});
