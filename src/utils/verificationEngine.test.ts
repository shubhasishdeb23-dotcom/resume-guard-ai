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
});