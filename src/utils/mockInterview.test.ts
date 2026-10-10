import { describe, expect, it } from 'vitest';
import { buildInterviewQuestions, scoreInterviewAnswerHeuristic } from './mockInterview';
import { CandidateMatch, CandidateProfile } from '../types/recruiter';

const candidate: CandidateProfile = {
  id: 'c1',
  resumeId: 'r1',
  name: 'Sam Rivera',
  email: 'sam@example.com',
  summary: '',
  yearsExperience: 4,
  topSkills: ['Python'],
  education: '',
  experience: '',
  overallScore: 80,
  evidenceScore: 80,
  atsScore: 80,
  skillMatch: 80,
  riskSignals: 0,
  verificationStatus: 'pending',
  uploadedAt: new Date(),
  status: 'analyzed',
};

const match = {
  id: 'm1',
  resumeId: 'c1',
  jobId: 'job1',
  overallFit: 80,
  skillMatch: { score: 80, matched: ['Python'], missing: ['Kubernetes'], additional: [], details: [] },
  experienceMatch: { score: 80, yearsRequired: 3, yearsFound: 4, relevant: true, gap: 0, details: '' },
  projectMatch: { score: 70, relevantProjects: ['Recsys'], technologiesMatched: ['Python'], details: '' },
  educationMatch: { score: 70, meetsRequirement: true, details: '' },
  evidenceMatch: { score: 80, strongEvidence: 2, weakEvidence: 1, suspiciousSignals: 0 },
  missingRequirements: [],
  recommendedVerification: ['Kubernetes production experience'],
  riskLevel: 'medium',
  recommendation: 'potential_match',
  recommendationReason: 'gap on k8s',
  analyzedAt: new Date(),
} as CandidateMatch;

describe('mock interview', () => {
  it('builds questions from the challenge report, not placeholders', () => {
    const questions = buildInterviewQuestions(match, candidate);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.some(q => /python/i.test(q.question) || /Kubernetes/i.test(q.question))).toBe(true);
  });

  it('scores empty answers poorly', () => {
    const q = buildInterviewQuestions(match, candidate)[0];
    const result = scoreInterviewAnswerHeuristic(q, 'ok');
    expect(result.score).toBeLessThan(20);
    expect(result.method).toBe('heuristic');
  });

  it('rewards a specific, relevant answer without claiming to be an LLM', () => {
    const q = buildInterviewQuestions(match, candidate)[0];
    const result = scoreInterviewAnswerHeuristic(
      q,
      'I implemented a Python ranking service, deployed it, and cut latency 40% for 2 million daily requests.',
    );
    expect(result.score).toBeGreaterThan(30);
    expect(result.feedback).toContain('Offline heuristic');
  });
});
