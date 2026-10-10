import { describe, expect, it } from 'vitest';
import { answerFromLocalData, RecruiterChatContext } from './recruiterChat';
import { DEFAULT_SHORTLIST_WEIGHTS } from './shortlist';
import { CandidateMatch, CandidateProfile, JobDescription } from '../types/recruiter';

const job = {
  id: 'job1',
  title: 'ML Engineer',
  company: 'Acme',
  rawText: '',
  extracted: {
    requiredSkills: ['python', 'pytorch'],
    preferredSkills: ['aws'],
    technologies: [],
    experience: { years: 3, level: 'mid', description: '' },
    education: [],
    responsibilities: [],
    certifications: [],
    domainRequirements: [],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
} as JobDescription;

const candidate: CandidateProfile = {
  id: 'c1',
  resumeId: 'r1',
  name: 'Sam Rivera',
  email: 'sam@example.com',
  summary: 'ML engineer',
  yearsExperience: 4,
  topSkills: ['Python', 'PyTorch'],
  education: 'MS CS',
  experience: '4 years',
  overallScore: 80,
  evidenceScore: 85,
  atsScore: 88,
  skillMatch: 90,
  riskSignals: 0,
  verificationStatus: 'verified',
  uploadedAt: new Date(),
  status: 'analyzed',
};

const match = {
  id: 'm1',
  resumeId: 'c1',
  jobId: 'job1',
  overallFit: 91,
  skillMatch: { score: 90, matched: ['python'], missing: ['kubernetes'], additional: [], details: [] },
  experienceMatch: { score: 80, yearsRequired: 3, yearsFound: 4, relevant: true, gap: 0, details: '' },
  projectMatch: { score: 80, relevantProjects: [], technologiesMatched: [], details: '' },
  educationMatch: { score: 80, meetsRequirement: true, details: '' },
  evidenceMatch: { score: 85, strongEvidence: 3, weakEvidence: 0, suspiciousSignals: 0 },
  missingRequirements: [],
  recommendedVerification: ['Ask about Kubernetes production on-call'],
  riskLevel: 'low',
  recommendation: 'strong_match',
  recommendationReason: 'Strong ML evidence',
  analyzedAt: new Date(),
} as CandidateMatch;

const ctx: RecruiterChatContext = {
  job,
  candidates: [candidate],
  matches: [match],
  resumes: {},
  weights: DEFAULT_SHORTLIST_WEIGHTS,
};

describe('answerFromLocalData', () => {
  it('ranks from real scores', () => {
    const reply = answerFromLocalData('who ranks highest?', ctx);
    expect(reply).toContain('Sam Rivera');
    expect(reply).toContain('91');
  });

  it('returns verification items from the match record', () => {
    const reply = answerFromLocalData('What should we verify for Sam Rivera?', ctx);
    expect(reply).toContain('Kubernetes');
  });

  it('does not invent a candidate when the pool is empty', () => {
    const reply = answerFromLocalData('who is the best candidate?', {
      ...ctx,
      candidates: [],
      matches: [],
      job: null,
    });
    expect(reply.toLowerCase()).toContain('no job or candidate');
  });
});
