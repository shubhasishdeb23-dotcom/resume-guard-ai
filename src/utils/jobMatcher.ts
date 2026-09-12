import { ParsedResume } from '../types';
import { JobDescription, CandidateMatch, InterviewQuestion, ChallengeReport } from '../types/recruiter';
import { v4 as uuidv4 } from 'uuid';

export function matchCandidateToJob(
  resume: ParsedResume,
  job: JobDescription,
  evidenceScore: number
): CandidateMatch {
  const skillMatch = calculateSkillMatch(resume, job);
  const experienceMatch = calculateExperienceMatch(resume, job);
  const projectMatch = calculateProjectMatch(resume, job);
  const educationMatch = calculateEducationMatch(resume, job);
  const evidenceMatch = calculateEvidenceMatch(evidenceScore, skillMatch, resume);
  
  const overallFit = calculateOverallFit({
    skillMatch: skillMatch.score,
    experienceMatch: experienceMatch.score,
    projectMatch: projectMatch.score,
    educationMatch: educationMatch.score,
    evidenceMatch: evidenceMatch.score,
  });
  
  const missingRequirements = identifyMissingRequirements(resume, job, skillMatch, experienceMatch);
  const recommendedVerification = generateVerificationRecommendations(resume, skillMatch, evidenceScore);
  const riskLevel = determineRiskLevel(evidenceScore, skillMatch.missing.length, recommendedVerification.length);
  const recommendation = determineRecommendation(overallFit, evidenceScore, riskLevel);
  const recommendationReason = generateRecommendationReason(recommendation, overallFit, evidenceScore, skillMatch, experienceMatch);
  
  return {
    id: uuidv4(),
    resumeId: resume.id,
    jobId: job.id,
    overallFit,
    skillMatch,
    experienceMatch,
    projectMatch,
    educationMatch,
    evidenceMatch,
    missingRequirements,
    recommendedVerification,
    riskLevel,
    recommendation,
    recommendationReason,
    analyzedAt: new Date(),
  };
}

function calculateSkillMatch(resume: ParsedResume, job: JobDescription): CandidateMatch['skillMatch'] {
  const resumeSkills = resume.skills.map(s => s.name.toLowerCase());
  const requiredSkills = job.extracted.requiredSkills.map(s => s.toLowerCase());
  const preferredSkills = job.extracted.preferredSkills.map(s => s.toLowerCase());
  const allJobSkills = [...requiredSkills, ...preferredSkills];
  
  const matched: string[] = [];
  const missing: string[] = [];
  const additional: string[] = [];
  const details: CandidateMatch['skillMatch']['details'] = [];
  
  requiredSkills.forEach(skill => {
    const found = resumeSkills.some(s => s.includes(skill) || skill.includes(s));
    const resumeSkill = resume.skills.find(s => s.name.toLowerCase().includes(skill) || skill.includes(s.name.toLowerCase()));
    
    details.push({
      skill: skill,
      required: true,
      found,
      evidence: found && resumeSkill ? `${resumeSkill.evidence.length} evidence sources` : 'Not found',
    });
    
    if (found) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });
  
  preferredSkills.forEach(skill => {
    const found = resumeSkills.some(s => s.includes(skill) || skill.includes(s));
    details.push({
      skill: skill,
      required: false,
      found,
      evidence: found ? 'Present' : 'Not found',
    });
    if (found) {
      matched.push(skill);
    }
  });
  
  resumeSkills.forEach(skill => {
    if (!allJobSkills.some(s => s.includes(skill) || skill.includes(s))) {
      additional.push(skill);
    }
  });
  
  const requiredMatched = matched.filter(s => requiredSkills.includes(s.toLowerCase())).length;
  const score = requiredSkills.length > 0 
    ? Math.round((requiredMatched / requiredSkills.length) * 100)
    : 70;
  
  return { score, matched, missing, additional, details };
}

function calculateExperienceMatch(resume: ParsedResume, job: JobDescription): CandidateMatch['experienceMatch'] {
  const requiredYears = job.extracted.experience.years;
  const resumeYears = calculateTotalExperience(resume);
  const gap = Math.max(0, requiredYears - resumeYears);
  const relevant = resumeYears >= requiredYears * 0.7;
  
  let score = 100;
  if (gap > 0) {
    score = Math.max(30, 100 - (gap * 15));
  } else if (resumeYears > requiredYears + 2) {
    score = 95;
  }
  
  const details = resumeYears >= requiredYears
    ? `Meets requirement: ${resumeYears.toFixed(1)} years vs ${requiredYears} required`
    : `Gap of ${gap.toFixed(1)} years from requirement`;
  
  return {
    score,
    yearsRequired: requiredYears,
    yearsFound: Math.round(resumeYears * 10) / 10,
    relevant,
    gap,
    details,
  };
}

function calculateTotalExperience(resume: ParsedResume): number {
  let totalMonths = 0;
  
  resume.experience.forEach(exp => {
    const start = parseDate(exp.startDate);
    const end = exp.current ? new Date() : parseDate(exp.endDate);
    if (start && end) {
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
  });
  
  return totalMonths / 12;
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})|((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?)\s*(\d{4})?/i);
  if (!match) return null;
  
  if (match[1]) {
    return new Date(parseInt(match[1]), 0);
  }
  
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthIndex = months.findIndex(m => match[2].toLowerCase().startsWith(m));
  const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
  
  return new Date(year, monthIndex);
}

function calculateProjectMatch(resume: ParsedResume, job: JobDescription): CandidateMatch['projectMatch'] {
  const jobTechs = job.extracted.technologies.map(t => t.toLowerCase());
  const relevantProjects: string[] = [];
  const technologiesMatched: string[] = [];
  
  resume.projects.forEach(proj => {
    const projTechs = proj.technologies.map(t => t.toLowerCase());
    const hasRelevantTech = projTechs.some(t => jobTechs.some(jt => t.includes(jt) || jt.includes(t)));
    
    if (hasRelevantTech) {
      relevantProjects.push(proj.name);
      projTechs.forEach(t => {
        if (jobTechs.some(jt => t.includes(jt) || jt.includes(t))) {
          if (!technologiesMatched.includes(t)) technologiesMatched.push(t);
        }
      });
    }
  });
  
  const score = relevantProjects.length > 0 
    ? Math.min(100, 50 + relevantProjects.length * 20)
    : 30;
  
  return {
    score,
    relevantProjects,
    technologiesMatched,
    details: relevantProjects.length > 0 
      ? `${relevantProjects.length} relevant project(s) using ${technologiesMatched.length} matching technologies`
      : 'No directly relevant projects found',
  };
}

function calculateEducationMatch(resume: ParsedResume, job: JobDescription): CandidateMatch['educationMatch'] {
  const requiredEducation = job.extracted.education;
  
  if (requiredEducation.length === 0) {
    return { score: 100, meetsRequirement: true, details: 'No specific education requirement' };
  }
  
  const resumeDegrees = resume.education.map(e => e.degree.toLowerCase());
  const resumeFields = resume.education.map(e => e.field.toLowerCase());
  
  let meetsRequirement = false;
  let details = '';
  
  for (const req of requiredEducation) {
    const hasDegree = resumeDegrees.some(d => 
      d.includes(req.degree.toLowerCase()) || req.degree.toLowerCase().includes(d)
    );
    const hasField = req.field ? resumeFields.some(f => 
      f.includes(req.field.toLowerCase()) || req.field.toLowerCase().includes(f)
    ) : true;
    
    if (hasDegree && hasField) {
      meetsRequirement = true;
      details = `Meets ${req.degree} requirement in ${req.field || 'relevant field'}`;
      break;
    }
  }
  
  if (!meetsRequirement) {
    details = resume.education.length > 0 
      ? `Has ${resume.education[0].degree} but may not meet specific requirement`
      : 'Education requirement not clearly met';
  }
  
  const score = meetsRequirement ? 100 : resume.education.length > 0 ? 60 : 30;
  
  return { score, meetsRequirement, details };
}

function calculateEvidenceMatch(
  evidenceScore: number,
  skillMatch: CandidateMatch['skillMatch'],
  resume: ParsedResume
): CandidateMatch['evidenceMatch'] {
  const strongEvidence = resume.skills.filter(s => s.supportLevel === 'supported').length;
  const weakEvidence = resume.skills.filter(s => s.supportLevel === 'weakly_supported').length;
  const suspiciousSignals = resume.skills.filter(s => s.supportLevel === 'unsupported').length;
  
  return {
    score: evidenceScore,
    strongEvidence,
    weakEvidence,
    suspiciousSignals,
  };
}

function calculateOverallFit(scores: {
  skillMatch: number;
  experienceMatch: number;
  projectMatch: number;
  educationMatch: number;
  evidenceMatch: number;
}): number {
  const weights = {
    skillMatch: 0.30,
    experienceMatch: 0.20,
    projectMatch: 0.15,
    educationMatch: 0.10,
    evidenceMatch: 0.25,
  };
  
  return Math.round(
    scores.skillMatch * weights.skillMatch +
    scores.experienceMatch * weights.experienceMatch +
    scores.projectMatch * weights.projectMatch +
    scores.educationMatch * weights.educationMatch +
    scores.evidenceMatch * weights.evidenceMatch
  );
}

function identifyMissingRequirements(
  resume: ParsedResume,
  job: JobDescription,
  skillMatch: CandidateMatch['skillMatch'],
  experienceMatch: CandidateMatch['experienceMatch']
): string[] {
  const missing: string[] = [];
  
  skillMatch.missing.forEach(skill => {
    missing.push(`Missing required skill: ${skill}`);
  });
  
  if (experienceMatch.gap > 0) {
    missing.push(`Experience gap: ${experienceMatch.gap.toFixed(1)} years short`);
  }
  
  job.extracted.certifications.forEach(cert => {
    const hasCert = resume.certifications.some(c => 
      c.name.toLowerCase().includes(cert.toLowerCase())
    );
    if (!hasCert) {
      missing.push(`Missing certification: ${cert}`);
    }
  });
  
  return missing;
}

function generateVerificationRecommendations(
  resume: ParsedResume,
  skillMatch: CandidateMatch['skillMatch'],
  evidenceScore: number
): string[] {
  const recommendations: string[] = [];
  
  if (evidenceScore < 60) {
    recommendations.push('Overall evidence strength is low - recommend thorough verification');
  }
  
  resume.skills.filter(s => s.supportLevel === 'unsupported').forEach(skill => {
    recommendations.push(`Verify ${skill.name} skill - no supporting evidence found`);
  });
  
  resume.experience.filter(e => e.achievements.length === 0).forEach(exp => {
    recommendations.push(`Verify achievements at ${exp.company}`);
  });
  
  return recommendations.slice(0, 5);
}

function determineRiskLevel(
  evidenceScore: number,
  missingSkills: number,
  verificationCount: number
): 'low' | 'medium' | 'high' {
  if (evidenceScore >= 70 && missingSkills <= 1 && verificationCount <= 1) return 'low';
  if (evidenceScore >= 50 && missingSkills <= 3) return 'medium';
  return 'high';
}

function determineRecommendation(
  overallFit: number,
  evidenceScore: number,
  riskLevel: string
): 'strong_match' | 'potential_match' | 'needs_verification' | 'weak_match' {
  if (overallFit >= 80 && evidenceScore >= 70 && riskLevel === 'low') return 'strong_match';
  if (overallFit >= 70 && evidenceScore >= 60) return 'potential_match';
  if (riskLevel === 'high' || evidenceScore < 50) return 'needs_verification';
  return 'weak_match';
}

function generateRecommendationReason(
  recommendation: string,
  overallFit: number,
  evidenceScore: number,
  skillMatch: CandidateMatch['skillMatch'],
  experienceMatch: CandidateMatch['experienceMatch']
): string {
  const reasons: string[] = [];
  
  if (skillMatch.score >= 80) {
    reasons.push('Strong technical skill match');
  } else if (skillMatch.missing.length > 0) {
    reasons.push(`${skillMatch.missing.length} required skills missing`);
  }
  
  if (experienceMatch.relevant) {
    reasons.push('Experience requirement met');
  } else {
    reasons.push(`${experienceMatch.gap.toFixed(1)} years experience gap`);
  }
  
  if (evidenceScore >= 70) {
    reasons.push('Claims well-supported by evidence');
  } else if (evidenceScore < 50) {
    reasons.push('Evidence verification recommended');
  }
  
  return reasons.join('. ') + '.';
}

export function generateChallengeReport(
  resume: ParsedResume,
  match: CandidateMatch,
  claims: any[]
): ChallengeReport {
  const topStrongClaims = claims
    .filter(c => c.verificationStatus === 'supported')
    .slice(0, 5)
    .map(c => ({ claim: c.claim, evidence: c.evidenceFound.map((e: any) => e.source).join(', ') }));
  
  const topWeakClaims = claims
    .filter(c => c.verificationStatus !== 'supported')
    .slice(0, 5)
    .map(c => ({ 
      claim: c.claim, 
      missing: c.missingEvidence.length > 0 ? c.missingEvidence.join(', ') : 'No supporting evidence' 
    }));
  
  const technicalQuestions: InterviewQuestion[] = [];
  const behavioralQuestions: InterviewQuestion[] = [];
  
  claims.filter(c => c.verificationStatus !== 'supported').slice(0, 5).forEach((claim, i) => {
    if (/built|developed|implemented|designed/i.test(claim.claim)) {
      technicalQuestions.push({
        id: `q_tech_${i}`,
        category: 'technical',
        claim: claim.claim,
        question: generateTechnicalQuestion(claim),
        followUp: claim.suggestedQuestions.slice(0, 2),
        priority: claim.evidenceStrength < 30 ? 'high' : 'medium',
        reason: 'Claim lacks technical evidence',
      });
    }
    
    if (/led|managed|supervised/i.test(claim.claim)) {
      behavioralQuestions.push({
        id: `q_beh_${i}`,
        category: 'behavioral',
        claim: claim.claim,
        question: generateBehavioralQuestion(claim),
        followUp: ['What was your specific contribution?', 'How did you measure success?'],
        priority: 'high',
        reason: 'Leadership claim needs verification',
      });
    }
  });
  
  const weakestEvidenceAreas = resume.skills
    .filter(s => s.supportLevel === 'unsupported')
    .slice(0, 5)
    .map(s => s.name);
  
  const possibleContradictions: string[] = [];
  if (match.experienceMatch.gap > 0) {
    possibleContradictions.push(`Experience claims may not align with stated years`);
  }
  
  return {
    topStrongClaims,
    topWeakClaims,
    technicalQuestions,
    behavioralQuestions,
    weakestEvidenceAreas,
    possibleContradictions,
  };
}

function generateTechnicalQuestion(claim: any): string {
  if (/\d+%/.test(claim.claim)) {
    return `You mentioned "${claim.claim.slice(0, 50)}...". What was the baseline, how did you measure it, and what specific changes led to this improvement?`;
  }
  return `Can you walk me through how you "${claim.claim.slice(0, 50)}..."? What technologies did you use and what challenges did you face?`;
}

function generateBehavioralQuestion(claim: any): string {
  return `You mentioned "${claim.claim.slice(0, 50)}...". Can you describe your specific responsibilities, the team structure, and how you measured success?`;
}
