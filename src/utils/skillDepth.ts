import { ParsedResume } from '../types';

export interface SkillDepthDetail {
  skill: string;
  context: 'project' | 'experience' | 'none';
  evidence: string;
}

export interface SkillDepthResult {
  score: number;
  provenSkills: string[];
  unprovenSkills: string[];
  details: SkillDepthDetail[];
}

export function analyzeContextualSkillDepth(resume: ParsedResume): SkillDepthResult {
  const skillNames = resume.skills.map(s => s.name.trim()).filter(Boolean);

  if (skillNames.length === 0) {
    return { score: 0, provenSkills: [], unprovenSkills: [], details: [] };
  }

  const projectCorpus = resume.projects.flatMap(p => [
    p.name,
    p.description,
    p.problem,
    p.solution,
    p.role,
    ...p.features,
    ...p.metrics.flatMap(m => [m.claim, m.context]),
  ]);

  const experienceCorpus = resume.experience.flatMap(e => [
    e.role,
    ...e.responsibilities,
    ...e.achievements,
    ...e.metrics.flatMap(m => [m.claim, m.context]),
  ]);

  const details: SkillDepthDetail[] = skillNames.map(skill => {
    const skillLower = skill.toLowerCase();
    const inProject = projectCorpus.some(t => !!t && t.toLowerCase().includes(skillLower));
    const inExperience = experienceCorpus.some(t => !!t && t.toLowerCase().includes(skillLower));

    const context: SkillDepthDetail['context'] = inProject ? 'project' : inExperience ? 'experience' : 'none';

    return {
      skill,
      context,
      evidence: inProject
        ? 'Used within project descriptions, features, or metrics'
        : inExperience
          ? 'Mentioned within experience responsibilities or outcomes'
          : 'Only listed as a keyword without project context',
    };
  });

  const proven = details.filter(d => d.context !== 'none');
  const score = Math.round((proven.length / skillNames.length) * 100);

  return {
    score,
    provenSkills: proven.map(d => d.skill),
    unprovenSkills: details.filter(d => d.context === 'none').map(d => d.skill),
    details,
  };
}