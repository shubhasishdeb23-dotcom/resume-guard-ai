import { describe, it, expect } from 'vitest';
import { runVerificationEngine } from './verificationEngine';
import { emptyResume, richResume } from './testFixtures';

describe('runVerificationEngine', () => {
  it('returns an overall evidence score between 0 and 100', () => {
    const result = runVerificationEngine(emptyResume());
    expect(result.overallEvidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.overallEvidenceScore).toBeLessThanOrEqual(100);
  });

  it('returns summary percentages that sum to 100', () => {
    const result = runVerificationEngine(richResume());
    const sum = result.summary.supported + result.summary.needsVerification + result.summary.suspicious + result.summary.unverified;
    expect(sum).toBe(100);
  });

  it('gives a rich resume a higher evidence score than an empty one', () => {
    const empty = runVerificationEngine(emptyResume()).overallEvidenceScore;
    const rich = runVerificationEngine(richResume()).overallEvidenceScore;
    expect(rich).toBeGreaterThan(empty);
  });

  it('detects employment gaps and impossible date ranges', () => {
    const resume = emptyResume();
    resume.experience = [
      { id: 'e1', company: 'Alpha Co', role: 'Engineer', startDate: '2021-01', endDate: '2021-06', current: false, responsibilities: [], technologies: [], achievements: [], metrics: [] },
      { id: 'e2', company: 'Beta Co', role: 'Engineer', startDate: '2022-06', current: true, responsibilities: [], technologies: [], achievements: [], metrics: [] },
      { id: 'e3', company: 'Bad Dates', role: 'Engineer', startDate: '2021-11', endDate: '2021-01', current: false, responsibilities: [], technologies: [], achievements: [], metrics: [] },
    ];

    const result = runVerificationEngine(resume);
    const types = result.timelineAnalysis.issues.map(i => i.type);

    expect(types).toContain('gap');
    expect(types).toContain('impossible');
    expect(result.triggeredRules.find(r => r.id === 'RULE-011')?.triggered).toBe(true);
  });
});