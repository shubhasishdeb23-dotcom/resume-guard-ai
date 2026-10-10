import { ParsedResume } from '../types';
import { CandidateMatch, CandidateProfile, ChallengeReport, InterviewQuestion } from '../types/recruiter';

function yearOf(date?: string | null): number | null {
  if (!date) return null;
  const match = String(date).match(/(\d{4})/);
  return match ? Number(match[1]) : null;
}

export function generateChallengeReport(
  match: CandidateMatch,
  candidate: CandidateProfile,
  resume?: ParsedResume | null,
): ChallengeReport {
  const topStrongClaims: { claim: string; evidence: string }[] = [];

  match.skillMatch.matched.slice(0, 3).forEach((skill) => {
    topStrongClaims.push({
      claim: `Proficient in ${skill}`,
      evidence: 'Skill matched against the job requirements',
    });
  });

  match.projectMatch.relevantProjects.slice(0, 2).forEach((project) => {
    const tech = match.projectMatch.technologiesMatched.slice(0, 3).join(', ');
    topStrongClaims.push({
      claim: `Built ${project}`,
      evidence: tech ? `Project references matched technologies: ${tech}` : 'Project matched against job requirements',
    });
  });

  const topWeakClaims: { claim: string; missing: string }[] = [];

  match.recommendedVerification.slice(0, 3).forEach((item) => {
    topWeakClaims.push({
      claim: item,
      missing: 'No supporting evidence on the resume',
    });
  });

  match.skillMatch.missing.slice(0, 3).forEach((skill) => {
    topWeakClaims.push({
      claim: `Proficiency in ${skill}`,
      missing: 'Required by the job but not listed on the resume — verify experience or willingness to learn',
    });
  });

  const technicalQuestions: InterviewQuestion[] = [];

  match.skillMatch.matched.slice(0, 3).forEach((skill, i) => {
    technicalQuestions.push({
      id: `tiq_${Date.now()}_${i}`,
      category: 'technical',
      claim: `Proficient in ${skill}`,
      question: `Describe a specific project where you applied ${skill}. What was your role and what was the measurable outcome?`,
      followUp: [
        'What specific sub-skill did you use most in that project?',
        'Can you share a metric or result that demonstrates impact?',
      ],
      priority: i === 0 ? 'high' : 'medium',
      reason: 'Matched skill used to evaluate claimed technical depth',
    });
  });

  match.recommendedVerification.slice(0, 3).forEach((item, i) => {
    technicalQuestions.push({
      id: `viq_${Date.now()}_${i}`,
      category: 'verification',
      claim: item,
      question: `Your resume references "${item}". Can you walk us through the underlying evidence, key responsibilities, and any measurable outcomes?`,
      followUp: [],
      priority: 'high',
      reason: 'Explicitly flagged for verification by the evidence engine',
    });
  });

  const holes: string[] = [];
  match.skillMatch.missing.forEach((skill) => holes.push(`Missing required skill: ${skill}`));
  match.recommendedVerification.forEach((item) => holes.push(`Unverified claim: ${item}`));
  if (match.missingRequirements.length > 0) {
    match.missingRequirements.forEach((req) => holes.push(`Unmet requirement: ${req}`));
  }
  if (holes.length === 0) {
    holes.push('Limited depth of evidence across resume sections');
  }

  const possibleContradictions = [
    ...match.recommendedVerification.filter((item) => /overlap|timeline|inconsisten|duplicate|gap/i.test(item)),
  ];
  if (possibleContradictions.length === 0 && match.riskLevel === 'high') {
    possibleContradictions.push('High-risk signals detected in experience timeline or claims');
  }

  const credentialQuestions: InterviewQuestion[] = [];
  const education = resume?.education || [];
  const certifications = resume?.certifications || [];

  education.slice(0, 2).forEach((edu, i) => {
    const years = [edu.startDate, edu.endDate].filter(Boolean).join('–');
    const label = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}${edu.institution ? ` — ${edu.institution}` : ''}`.trim();
    credentialQuestions.push({
      id: `ciq_edu_${candidate.id}_${i}`,
      category: 'credential',
      claim: `Education: ${label || 'degree on file'}`,
      question: `Your resume lists ${label || 'a degree'}${years ? ` (${years})` : ''}. Walk us through the coursework, thesis or capstone most relevant to this role, and what credential documentation you can provide.`,
      followUp: ['Which institution and graduation year should we verify?', 'What did you personally produce for your final project?'],
      priority: 'medium',
      reason: 'A degree cannot be verified from the resume text alone — confirm institution, dates and specifics.',
    });
  });

  certifications.slice(0, 2).forEach((cert, i) => {
    const name = cert.name || 'a certification';
    const issuer = cert.issuer ? ` issued by ${cert.issuer}` : '';
    const when = cert.date ? ` (${cert.date})` : '';
    credentialQuestions.push({
      id: `ciq_cert_${candidate.id}_${i}`,
      category: 'credential',
      claim: `Certification: ${name}${issuer}`,
      question: `You list ${name}${issuer}${when}. ${cert.credentialId ? `The credential ID on file is ${cert.credentialId}. ` : ''}How did you apply it on the job, and how could we confirm it with the issuing body?`,
      followUp: ['What is the credential ID or registry we could check?', 'How did it change how you work?'],
      priority: 'medium',
      reason: 'Certifications should be confirmed with the issuing body.',
    });
  });

  const jobs = resume?.experience || [];
  const eduEndYears = education.map(e => yearOf(e.endDate)).filter((y): y is number => y !== null);
  const jobStartYears = jobs.map(j => yearOf(j.startDate)).filter((y): y is number => y !== null);
  const earliestJob = jobStartYears.length ? Math.min(...jobStartYears) : null;
  const latestEduEnd = eduEndYears.length ? Math.max(...eduEndYears) : null;

  if (earliestJob !== null && latestEduEnd !== null && latestEduEnd > earliestJob + 1) {
    possibleContradictions.push(`Education end (${latestEduEnd}) is after the first job start (${earliestJob})`);
    credentialQuestions.push({
      id: `ciq_timeline_${candidate.id}`,
      category: 'credential',
      claim: 'Timeline: education vs work',
      question: `Your education appears to end around ${latestEduEnd}, but your work history starts around ${earliestJob}. Can you walk us through the overlap — were you studying and working at the same time?`,
      followUp: ['Were these full-time roles?', 'Is there anything about the sequence we should understand?'],
      priority: 'medium',
      reason: 'Overlapping education and employment can be legitimate (part-time study) but should be clarified.',
    });
  }

  const currentYear = new Date().getFullYear();
  if (earliestJob !== null && candidate.yearsExperience > 0) {
    const span = currentYear - earliestJob;
    if (Math.abs(span - candidate.yearsExperience) > 2) {
      possibleContradictions.push(`Reported ${candidate.yearsExperience} years does not match the work-history span (~${span} years)`);
      credentialQuestions.push({
        id: `ciq_exp_${candidate.id}`,
        category: 'credential',
        claim: `${candidate.yearsExperience} years of experience`,
        question: `Your resume reports about ${candidate.yearsExperience} years of experience, but the dated roles span roughly ${span} years. Help us reconcile the timeline and any career gaps.`,
        followUp: ['Were there overlapping or contract roles?', 'Any periods out of the workforce we should know about?'],
        priority: 'high',
        reason: 'Reported experience does not align with the employment timeline.',
      });
    }
  }

  const behavioralQuestions: InterviewQuestion[] = [
    {
      id: `biq_exp_${candidate.id}`,
      category: 'behavioral',
      claim: `${candidate.yearsExperience} years of experience`,
      question: `Walk through a time you owned an outcome end-to-end in a role similar to this job. What was the problem, what did you personally do, and how did you know it worked?`,
      followUp: ['What would you do differently now?', 'Who else was involved, and what was uniquely yours?'],
      priority: 'medium',
      reason: `Resume reports ${candidate.yearsExperience} years; confirm ownership versus participation.`,
    },
  ];

  if (match.skillMatch.missing[0]) {
    const missing = match.skillMatch.missing[0];
    behavioralQuestions.push({
      id: `biq_gap_${candidate.id}`,
      category: 'behavioral',
      claim: `Gap: ${missing}`,
      question: `This role expects ${missing}, which is not evidenced on the resume. Tell us about the closest experience you have, or how you ramped on a similar gap in a previous job.`,
      followUp: ['How long did that ramp take?', 'What artifacts could we review?'],
      priority: 'high',
      reason: `${missing} is a missing job requirement`,
    });
  }

  if (match.riskLevel !== 'low') {
    behavioralQuestions.push({
      id: `biq_risk_${candidate.id}`,
      category: 'behavioral',
      claim: `Risk level ${match.riskLevel}`,
      question: `Some claims on this resume need more evidence. Pick the claim you are most proud of and reconstruct it: context, your actions, tools, and a measurable result.`,
      followUp: ['What would a former manager confirm?', 'What should we not take at face value?'],
      priority: 'high',
      reason: `Match risk is ${match.riskLevel}`,
    });
  }

  return {
    topStrongClaims: topStrongClaims.slice(0, 5),
    topWeakClaims: topWeakClaims.slice(0, 5),
    technicalQuestions: technicalQuestions.slice(0, 5),
    behavioralQuestions: behavioralQuestions.slice(0, 4),
    credentialQuestions: credentialQuestions.slice(0, 4),
    weakestEvidenceAreas: holes.slice(0, 5),
    possibleContradictions,
  };
}