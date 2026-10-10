import { describe, expect, it } from 'vitest';
import { generateTextReport, ExportData } from './exportReport';

const base: ExportData = {
  candidateName: 'Alex Chen',
  fileName: 'alex.pdf',
  uploadedAt: '2026-01-01',
  overallScore: 85,
  atsScore: 91,
  evidenceScore: 89,
  skillMatch: 88,
  breakdown: [{ name: 'Job Fit', score: 84, recommendation: 'Strong' }],
  skills: [{ name: 'Python', supportLevel: 'supported', evidence: ['Project'] }],
  projects: [{ name: 'ML Pipeline', depthScore: 85, technologies: ['Python'] }],
  summary: 'A concise summary.',
  trust: {
    score: 80,
    band: 'strong',
    label: 'Strong',
    caveat: 'Plausibility check, not fraud detection.',
    factors: [{ label: 'Evidence', value: 85, weight: 0.3, detail: 'good' }],
  },
  brief: {
    headline: 'Alex Chen — ML Engineer (fit 84%, trust 80)',
    strengths: ['Matches required skills'],
    gaps: ['Missing Kubernetes'],
    verificationAsks: ['Verify the ML pipeline claim'],
    interviewFocus: ['Probe Kubernetes'],
    nextSteps: ['Schedule interview'],
  },
};

describe('generateTextReport', () => {
  it('full report includes technical sections', () => {
    const report = generateTextReport(base);
    expect(report).toContain('SCORE BREAKDOWN');
    expect(report).toContain('SKILLS ANALYSIS');
    expect(report).toContain('PROJECTS');
    expect(report).toContain('EMPLOYER BRIEF');
  });

  it('simpleOnly drops technical sections but keeps the employer brief and summary', () => {
    const report = generateTextReport({ ...base, simpleOnly: true });
    expect(report).not.toContain('SCORE BREAKDOWN');
    expect(report).not.toContain('SKILLS ANALYSIS');
    expect(report).not.toContain('PROJECTS');
    expect(report).not.toContain('OVERALL SCORES');
    expect(report).toContain('EMPLOYER BRIEF');
    expect(report).toContain('TRUST SCORE');
  });
});
