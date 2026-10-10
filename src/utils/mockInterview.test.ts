import { describe, expect, it } from 'vitest';
import {
  buildInterviewQuestions,
  interviewConfidence,
  scoreInterviewAnswerHeuristic,
  InterviewSession,
} from './mockInterview';
import { CandidateMatch, CandidateProfile } from '../types/recruiter';
import { ParsedResume } from '../types';

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

  const resumeWithCredentials = {
    education: [
      { id: 'e1', institution: 'Stanford University', degree: 'MS', field: 'Computer Science', startDate: '2016', endDate: '2018' },
    ],
    certifications: [
      { id: 'c1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon', date: '2021', credentialId: 'ABC123' },
    ],
    experience: [
      { id: 'x1', company: 'DataCorp', role: 'ML Engineer', startDate: '2019', current: true },
    ],
  } as unknown as ParsedResume;

  it('builds credential and degree questions from the resume', () => {
    const questions = buildInterviewQuestions(match, candidate, resumeWithCredentials);
    const credential = questions.filter(q => q.category === 'credential');
    expect(credential.length).toBeGreaterThan(0);
    expect(credential.some(q => /Stanford|Computer Science|MS/i.test(q.question))).toBe(true);
    expect(credential.some(q => /AWS|Amazon|certification/i.test(q.question))).toBe(true);
  });

  it('flags a timeline contradiction when reported years do not match the dated roles', () => {
    const questions = buildInterviewQuestions(match, { ...candidate, yearsExperience: 12 }, resumeWithCredentials);
    expect(questions.some(q => q.category === 'credential' && /reconcile|timeline/i.test(q.question))).toBe(true);
  });

  it('returns null confidence for an empty session and a level once answered', () => {
    const base: InterviewSession = {
      id: 'int1',
      candidateId: 'c1',
      candidateName: 'Sam Rivera',
      jobTitle: 'ML Engineer',
      questions: buildInterviewQuestions(match, candidate),
      answers: [],
      currentIndex: 0,
      startedAt: new Date().toISOString(),
    };
    expect(interviewConfidence(base)).toBeNull();

    const q = base.questions[0];
    const strong = interviewConfidence({
      ...base,
      answers: [
        { questionId: q.id, answer: 'x', score: 80, feedback: '', method: 'heuristic' },
        { questionId: base.questions[1].id, answer: 'y', score: 72, feedback: '', method: 'heuristic' },
      ],
    });
    expect(strong?.level).toBe('strong');

    const weak = interviewConfidence({
      ...base,
      answers: [
        { questionId: q.id, answer: 'x', score: 10, feedback: '', method: 'heuristic' },
        { questionId: base.questions[1].id, answer: 'y', score: 15, feedback: '', method: 'heuristic' },
      ],
    });
    expect(weak?.level).toBe('weak');
  });
});
