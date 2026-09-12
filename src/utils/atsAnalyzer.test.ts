import { describe, it, expect } from 'vitest';
import { analyzeATS } from './atsAnalyzer';
import { emptyResume, richResume } from './testFixtures';

describe('analyzeATS', () => {
  it('returns a score between 0 and 100', () => {
    const analysis = analyzeATS(emptyResume());
    expect(analysis.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score).toBeLessThanOrEqual(100);
  });

  it('scores a complete resume higher than an empty one', () => {
    const empty = analyzeATS(emptyResume()).score;
    const rich = analyzeATS(richResume()).score;
    expect(rich).toBeGreaterThan(empty);
  });

  it('flags missing sections on an empty resume', () => {
    const analysis = analyzeATS(emptyResume());
    expect(analysis.sections.missing.length).toBeGreaterThan(0);
    expect(analysis.contactInfo.email).toBe(false);
  });
});