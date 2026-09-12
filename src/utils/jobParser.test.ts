import { describe, it, expect } from 'vitest';
import { parseJobDescription } from './jobParser';

const SAMPLE_JOB = `
We are hiring a Senior Backend Engineer with 5+ years of experience.
Must have Python, Django, AWS, and PostgreSQL.
Bachelors degree in Computer Science or related field preferred.
Nice to have: Kubernetes, Redis, GraphQL.
Responsibilities include building microservices, CI/CD pipelines, and API design.
`;

describe('parseJobDescription', () => {
  const extracted = parseJobDescription(SAMPLE_JOB);

  it('extracts required skills', () => {
    expect(extracted.requiredSkills.length).toBeGreaterThan(0);
    expect(extracted.requiredSkills.some(s => s.toLowerCase() === 'python')).toBe(true);
  });

  it('extracts experience years', () => {
    expect(extracted.experience.years).toBeGreaterThanOrEqual(5);
  });

  it('extracts education requirement', () => {
    const fields = extracted.education.map(e => `${e.degree} ${e.field}`.toLowerCase()).join(' ');
    expect(fields).toContain('computer science');
  });

  it('extracts technologies list', () => {
    expect(extracted.technologies.length).toBeGreaterThan(0);
    expect(extracted.technologies.some(t => t.toLowerCase() === 'aws')).toBe(true);
  });
});