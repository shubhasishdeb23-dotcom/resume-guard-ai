import { JobDescription, CandidateMatch } from '../types/recruiter';

export interface SkillOption {
  skill: string;
  required: boolean;
}

export interface SimulationResult {
  baseline: { fit: number; skillMatch: number };
  projected: { fit: number; skillMatch: number };
  delta: { fit: number; skillMatch: number };
  addedSkills: string[];
  stillMissing: string[];
  notes: string[];
}

const FIT_WEIGHTS = {
  skillMatch: 0.3,
  experienceMatch: 0.2,
  projectMatch: 0.15,
  educationMatch: 0.1,
  evidenceMatch: 0.25,
};

function norm(value: string): string {
  return value.toLowerCase().trim();
}

export function skillsCandidateCouldAdd(job: JobDescription | null, match: CandidateMatch | null): SkillOption[] {
  if (!job) return [];
  const matched = new Set((match?.skillMatch.matched || []).map(norm));
  const seen = new Set<string>();
  const options: SkillOption[] = [];

  const push = (skill: string, required: boolean) => {
    const key = norm(skill);
    if (seen.has(key) || matched.has(key)) return;
    seen.add(key);
    options.push({ skill, required });
  };

  job.extracted.requiredSkills.forEach(s => push(s, true));
  job.extracted.preferredSkills.forEach(s => push(s, false));

  return options;
}

export function simulateSkills(
  match: CandidateMatch,
  job: JobDescription | null,
  addedSkills: string[],
): SimulationResult {
  const required = (job?.extracted.requiredSkills || []).map(norm);
  const matched = new Set(match.skillMatch.matched.map(norm));
  const add = new Set(addedSkills.map(norm));

  const requiredMatchedBefore = required.filter(s => matched.has(s)).length;
  const newlyMatchedRequired = required.filter(s => !matched.has(s) && add.has(s)).length;
  const requiredMatchedAfter = requiredMatchedBefore + newlyMatchedRequired;

  const baselineSkillMatch = match.skillMatch.score;
  const projectedSkillMatch = required.length > 0
    ? Math.round((requiredMatchedAfter / required.length) * 100)
    : baselineSkillMatch;

  const projectedFit = Math.round(
    projectedSkillMatch * FIT_WEIGHTS.skillMatch +
    match.experienceMatch.score * FIT_WEIGHTS.experienceMatch +
    match.projectMatch.score * FIT_WEIGHTS.projectMatch +
    match.educationMatch.score * FIT_WEIGHTS.educationMatch +
    match.evidenceMatch.score * FIT_WEIGHTS.evidenceMatch,
  );

  const stillMissing = required
    .filter(s => !matched.has(s) && !add.has(s))
    .map(s => job?.extracted.requiredSkills.find(orig => norm(orig) === s) || s);

  const addedPreferred = addedSkills.filter(s => {
    const key = norm(s);
    return !required.includes(key) && (job?.extracted.preferredSkills || []).some(p => norm(p) === key);
  });

  const notes: string[] = [
    'This is a simulation only: it assumes any added skill would be backed by real evidence.',
  ];
  if (addedPreferred.length > 0) {
    notes.push(`Adding preferred skills (${addedPreferred.join(', ')}) improves the shortlist narrative but does not change the required-skill score.`);
  }
  if (required.length === 0) {
    notes.push('The current job lists no required skills, so the skill-match score stays at its baseline.');
  }

  return {
    baseline: { fit: match.overallFit, skillMatch: baselineSkillMatch },
    projected: { fit: projectedFit, skillMatch: projectedSkillMatch },
    delta: { fit: projectedFit - match.overallFit, skillMatch: projectedSkillMatch - baselineSkillMatch },
    addedSkills,
    stillMissing,
    notes,
  };
}
