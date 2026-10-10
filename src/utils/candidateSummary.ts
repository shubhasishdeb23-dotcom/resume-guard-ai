import { ParsedResume, ResumeScore } from '../types';
import { CandidateMatch, CandidateProfile, JobDescription } from '../types/recruiter';

export function buildResumeOverview(
  resume: ParsedResume,
  score: ResumeScore | null,
  evidenceScore: number,
): string {
  const name = resume.candidate.name || 'This candidate';
  const skills = resume.skills.slice(0, 8).map(s => s.name);
  const supported = resume.skills.filter(s => s.supportLevel === 'supported').length;
  const projects = resume.projects.map(p => p.name).slice(0, 4);
  return [
    `${name}${resume.candidate.summary ? `: ${resume.candidate.summary}` : '.'}`,
    score ? `Overall score ${score.overall}%, evidence ${evidenceScore}%, ATS ${score.breakdown.atsCompatibility.score}%.` : `Evidence ${evidenceScore}%.`,
    skills.length ? `Skills extracted: ${skills.join(', ')} (${supported} with supporting evidence).` : 'No skills extracted.',
    projects.length ? `Projects: ${projects.join(', ')}.` : 'No projects extracted.',
    `${resume.experience.length} experience entries, ${resume.education.length} education entries.`,
  ].join(' ');
}

export function buildStructuredSummary(
  candidate: CandidateProfile,
  match: CandidateMatch | null,
  job: JobDescription | null,
  resume?: ParsedResume | null,
): string {
  const role = job ? `${job.title} at ${job.company}` : 'the open role';
  const parts: string[] = [];

  parts.push(
    `${candidate.name || 'This candidate'} is being evaluated for ${role}. ` +
    `Reported experience is ${candidate.yearsExperience} year${candidate.yearsExperience === 1 ? '' : 's'}` +
    (candidate.education ? `, education: ${candidate.education}` : '') +
    '.',
  );

  if (candidate.topSkills.length > 0) {
    parts.push(`Highlighted skills: ${candidate.topSkills.join(', ')}.`);
  }

  if (match) {
    parts.push(
      `Job fit ${match.overallFit}%, skill match ${match.skillMatch.score}%, evidence ${candidate.evidenceScore}%, risk ${match.riskLevel}.`,
    );
    if (match.skillMatch.matched.length > 0) {
      parts.push(`Aligned with the job on: ${match.skillMatch.matched.slice(0, 8).join(', ')}.`);
    }
    if (match.skillMatch.missing.length > 0) {
      parts.push(`Not evidenced against required skills: ${match.skillMatch.missing.slice(0, 8).join(', ')}.`);
    }
    if (match.recommendedVerification.length > 0) {
      parts.push(`Verify before advancing: ${match.recommendedVerification.slice(0, 4).join('; ')}.`);
    }
    if (match.recommendationReason) {
      parts.push(match.recommendationReason);
    }
  } else {
    parts.push(`Evidence score ${candidate.evidenceScore}%. No job match is available yet.`);
  }

  if (resume?.projects?.length) {
    parts.push(
      `Projects on file: ${resume.projects.slice(0, 4).map(p => p.name).join(', ')}.`,
    );
  }

  return parts.join(' ');
}
