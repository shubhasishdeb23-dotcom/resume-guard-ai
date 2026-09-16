import { describe, it, expect } from 'vitest';
import { analyzeContextualSkillDepth } from './skillDepth';
import { emptyResume } from './testFixtures';

describe('analyzeContextualSkillDepth', () => {
  it('returns 0 when there are no skills', () => {
    expect(analyzeContextualSkillDepth(emptyResume()).score).toBe(0);
  });

  it('scores low when skills only appear as keywords', () => {
    const resume = emptyResume();
    resume.skills = [
      { id: 's1', name: 'React', category: 'x', claimed: true, evidence: [], confidence: 'medium', supportLevel: 'claimed' },
      { id: 's2', name: 'Docker', category: 'x', claimed: true, evidence: [], confidence: 'medium', supportLevel: 'claimed' },
    ];
    resume.projects = [
      { id: 'p1', name: 'web', description: 'A static webpage', features: [], metrics: [], technologies: [], depthScore: 30 },
    ];

    const result = analyzeContextualSkillDepth(resume);
    expect(result.score).toBe(0);
    expect(result.provenSkills).toHaveLength(0);
  });

  it('scores high when skills appear inside project or experience context', () => {
    const resume = emptyResume();
    resume.skills = [
      { id: 's1', name: 'React', category: 'x', claimed: true, evidence: [], confidence: 'high', supportLevel: 'supported' },
      { id: 's2', name: 'Docker', category: 'x', claimed: true, evidence: [], confidence: 'high', supportLevel: 'supported' },
    ];
    resume.projects = [
      {
        id: 'p1',
        name: 'Dashboard',
        description: 'Built a React analytics dashboard deployed with Docker',
        features: [],
        metrics: [],
        technologies: ['React', 'Docker'],
        depthScore: 85,
      },
    ];

    const result = analyzeContextualSkillDepth(resume);
    expect(result.score).toBe(100);
    expect(result.provenSkills.sort()).toEqual(['Docker', 'React']);
  });
});