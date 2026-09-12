import { describe, it, expect } from 'vitest';
import { calculateResumeScore } from './scoringEngine';
import { emptyResume, richResume } from './testFixtures';

describe('calculateResumeScore', () => {
  it('returns a score between 0 and 100 with all 8 components', () => {
    const score = calculateResumeScore(emptyResume());
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(Object.keys(score.breakdown)).toHaveLength(8);
  });

  it('scores an empty resume low', () => {
    const score = calculateResumeScore(emptyResume());
    expect(score.overall).toBeLessThan(60);
  });

  it('scores a rich resume higher than an empty one', () => {
    const empty = calculateResumeScore(emptyResume()).overall;
    const rich = calculateResumeScore(richResume()).overall;
    expect(rich).toBeGreaterThan(empty);
  });
});