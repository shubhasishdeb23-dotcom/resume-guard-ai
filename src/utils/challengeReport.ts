import { CandidateMatch, CandidateProfile, ChallengeReport, InterviewQuestion } from '../types/recruiter';

export function generateChallengeReport(match: CandidateMatch, candidate: CandidateProfile): ChallengeReport {
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
    weakestEvidenceAreas: holes.slice(0, 5),
    possibleContradictions,
  };
}