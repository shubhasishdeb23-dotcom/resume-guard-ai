import { ParsedResume, ResumeScore, ScoreComponent, SkillEntry } from '../types';

export function calculateQualityScore(resume: ParsedResume): number {
  const b = calculateResumeScore(resume).breakdown;
  const weighted =
    b.readability.score * 0.25 +
    b.atsCompatibility.score * 0.25 +
    b.projectStrength.score * 0.20 +
    b.quantification.score * 0.15 +
    b.consistency.score * 0.15;
  return Math.round(weighted);
}

export function calculateResumeScore(resume: ParsedResume): ResumeScore {
  const atsCompatibility = calculateATSScore(resume);
  const skillRelevance = calculateSkillScore(resume.skills);
  const experienceEvidence = calculateExperienceScore(resume);
  const projectStrength = calculateDemonstratedEvidence(resume);
  const quantification = calculateQuantificationScore(resume);
  const consistency = calculateConsistencyScore(resume);
  const credibility = calculateCredibilityScore(resume);
  const readability = calculateReadabilityScore(resume);
  
  const weights = {
    atsCompatibility: 0.15,
    skillRelevance: 0.15,
    experienceEvidence: 0.20,
    projectStrength: 0.15,
    quantification: 0.10,
    consistency: 0.10,
    credibility: 0.10,
    readability: 0.05,
  };
  
  const overall = Math.round(
    atsCompatibility.score * weights.atsCompatibility +
    skillRelevance.score * weights.skillRelevance +
    experienceEvidence.score * weights.experienceEvidence +
    projectStrength.score * weights.projectStrength +
    quantification.score * weights.quantification +
    consistency.score * weights.consistency +
    credibility.score * weights.credibility +
    readability.score * weights.readability
  );
  
  return {
    overall,
    breakdown: {
      atsCompatibility,
      skillRelevance,
      experienceEvidence,
      projectStrength,
      quantification,
      consistency,
      credibility,
      readability,
    },
  };
}

function calculateATSScore(resume: ParsedResume): ScoreComponent {
  let score = 50;
  const evidence: string[] = [];
  const issues: string[] = [];
  
  if (resume.candidate.email) { score += 10; evidence.push('Email present'); }
  else { issues.push('Missing email'); }
  
  if (resume.candidate.phone) { score += 10; evidence.push('Phone present'); }
  else { issues.push('Missing phone'); }
  
  if (resume.candidate.links.linkedin) { score += 5; evidence.push('LinkedIn present'); }
  if (resume.candidate.links.github || resume.candidate.links.portfolio || resume.candidate.links.other.length > 0) {
    score += 5;
    evidence.push('Portfolio / professional link present');
  }
  if (resume.experience.length >= 2) { score += 10; evidence.push('Multiple experience entries'); }
  if (resume.skills.length >= 5) { score += 10; evidence.push('Skills section populated'); }
  
  return {
    score: Math.min(score, 100),
    maxScore: 100,
    explanation: 'ATS compatibility measures how well your resume can be parsed by automated systems.',
    evidence: [...evidence, ...issues.map(i => `Issue: ${i}`)],
    recommendation: issues.length > 0 ? `Address: ${issues.join(', ')}` : 'Resume is ATS-friendly',
  };
}

function calculateSkillScore(skills: SkillEntry[]): ScoreComponent {
  if (skills.length === 0) {
    return {
      score: 0,
      maxScore: 100,
      explanation: 'No skills were identified in the resume.',
      evidence: ['Skills section is empty or not detected'],
      recommendation: 'Add a dedicated skills section with relevant technologies.',
    };
  }
  
  const supported = skills.filter(s => s.supportLevel === 'supported').length;
  const weaklySupported = skills.filter(s => s.supportLevel === 'weakly_supported').length;
  const unsupported = skills.filter(s => s.supportLevel === 'unsupported').length;
  
  const evidence: string[] = [
    `${skills.length} skills identified`,
    `${supported} skills have strong evidence`,
    `${weaklySupported} skills have weak evidence`,
    `${unsupported} skills lack evidence`,
  ];
  
  const score = Math.round(
    (supported * 100 / skills.length) * 0.6 +
    (weaklySupported * 60 / skills.length) * 0.3 +
    (unsupported * 20 / skills.length) * 0.1 +
    Math.min(skills.length * 2, 20)
  );
  
  return {
    score: Math.min(score, 100),
    maxScore: 100,
    explanation: 'Skill relevance measures how well claimed skills are supported by evidence.',
    evidence,
    recommendation: unsupported > 0 ? `${unsupported} skills need supporting evidence` : 'Skills are well-supported',
  };
}

function calculateExperienceScore(resume: ParsedResume): ScoreComponent {
  const { experience, internships } = resume;
  const totalExp = experience.length + internships.length;
  
  if (totalExp === 0) {
    return {
      score: 0,
      maxScore: 100,
      explanation: 'No work experience entries found.',
      evidence: ['Experience section is empty'],
      recommendation: 'Add work experience with specific achievements and the skills or tools you used.',
    };
  }
  
  let score = 30;
  const evidence: string[] = [];
  
  evidence.push(`${experience.length} professional positions`);
  if (internships.length > 0) {
    evidence.push(`${internships.length} internship(s)`);
    score += 10;
  }
  
  const withMetrics = experience.filter(e => e.metrics.length > 0).length;
  if (withMetrics > 0) {
    score += 20;
    evidence.push(`${withMetrics} position(s) with quantified achievements`);
  }
  
  const withTech = experience.filter(e => e.technologies.length > 0).length;
  if (withTech > 0) {
    score += 15;
    evidence.push(`${withTech} position(s) with skills or tools mentioned`);
  }
  
  const currentExp = experience.find(e => e.current);
  if (currentExp) {
    score += 10;
    evidence.push('Currently employed');
  }
  
  return {
    score: Math.min(score, 100),
    maxScore: 100,
    explanation: 'Experience evidence measures the depth and quality of work history.',
    evidence,
    recommendation: withMetrics < experience.length ? 'Add quantified achievements to all positions' : 'Experience is well-documented',
  };
}

// Field-agnostic evidence score: projects/portfolio when present, otherwise
// work experience depth. Every career documents proof differently.
function calculateDemonstratedEvidence(resume: ParsedResume): ScoreComponent {
  const { projects, experience, certifications } = resume;
  
  if (projects.length === 0 && experience.length === 0) {
    return {
      score: 25,
      maxScore: 100,
      explanation: 'No projects, portfolio entries or work experience found.',
      evidence: ['Nothing to assess yet'],
      recommendation: 'Add work experience or portfolio entries with outcomes and numbers.',
    };
  }
  
  const evidence: string[] = [];
  
  const avgDepth = projects.length > 0
    ? projects.reduce((sum, p) => sum + p.depthScore, 0) / projects.length
    : 0;
  const withPublicLinks = projects.filter(p => p.github || p.demo).length;
  const projectMetrics = projects.filter(p => p.metrics.length > 0).length;
  
  const expScores = experience.map(e => {
    let s = 40;
    if (e.responsibilities.length >= 3) s += 15;
    if (e.metrics.length > 0 || e.achievements.length > 0) s += 25;
    if (e.technologies.length > 0) s += 10;
    if (e.current) s += 5;
    return Math.min(s, 100);
  });
  const expAvg = expScores.length > 0 ? expScores.reduce((a, b) => a + b, 0) / expScores.length : 0;
  const expWithMetrics = experience.filter(e => e.metrics.length > 0 || e.achievements.length > 0).length;
  
  if (projects.length > 0) {
    evidence.push(`${projects.length} project/portfolio entr${projects.length === 1 ? 'y' : 'ies'} (avg depth ${Math.round(avgDepth)}/100)`);
  }
  if (withPublicLinks > 0) {
    evidence.push(`${withPublicLinks} with public links (repo, portfolio or demo)`);
  }
  if (projectMetrics > 0) {
    evidence.push(`${projectMetrics} project(s) with quantified results`);
  }
  if (experience.length > 0) {
    evidence.push(`${experience.length} position(s) assessed — ${expWithMetrics} with quantified outcomes`);
  }
  if (certifications.length > 0) {
    evidence.push(`${certifications.length} certification/licence(s) adding verifiable weight`);
  }
  
  let score: number;
  if (projects.length > 0 && experience.length > 0) {
    score = Math.round(avgDepth * 0.5 + expAvg * 0.4 + Math.min(certifications.length * 10, 10));
  } else if (projects.length > 0) {
    score = Math.round(avgDepth);
  } else {
    score = Math.round(expAvg + Math.min(certifications.length * 5, 10));
  }
  
  return {
    score: Math.min(score, 100),
    maxScore: 100,
    explanation: 'Evidence strength measures how well work is documented with specifics, outcomes and public proof.',
    evidence,
    recommendation: score < 70
      ? 'Add specifics: what you did, the problem, the tools used and the measurable result.'
      : 'Evidence is well documented.',
  };
}

function calculateQuantificationScore(resume: ParsedResume): ScoreComponent {
  const allMetrics = [
    ...resume.experience.flatMap(e => e.metrics),
    ...resume.projects.flatMap(p => p.metrics),
  ];
  
  if (allMetrics.length === 0) {
    return {
      score: 20,
      maxScore: 100,
      explanation: 'No quantified achievements found.',
      evidence: ['No metrics or numbers detected'],
      recommendation: 'Add specific numbers: "Improved X by Y%", "Reduced Z by N seconds"',
    };
  }
  
  const highSupport = allMetrics.filter(m => m.supportLevel === 'high').length;
  const mediumSupport = allMetrics.filter(m => m.supportLevel === 'medium').length;
  
  const evidence: string[] = [
    `${allMetrics.length} quantified claims found`,
    `${highSupport} with strong context`,
    `${mediumSupport} with partial context`,
  ];
  
  const score = Math.min(40 + (highSupport * 15) + (mediumSupport * 10) + (allMetrics.length * 5), 100);
  
  return {
    score,
    maxScore: 100,
    explanation: 'Quantification measures how well achievements are backed by specific numbers.',
    evidence,
    recommendation: 'Ensure all metrics include context for how they were measured',
  };
}

function calculateConsistencyScore(resume: ParsedResume): ScoreComponent {
  const evidence: string[] = [];
  let score = 80;
  
  const hasSummary = !!resume.candidate.summary;
  if (hasSummary) {
    evidence.push('Professional summary present');
  } else {
    score -= 15;
    evidence.push('Missing professional summary');
  }
  
  const allDatesValid = [...resume.experience, ...resume.education].every(e => {
    if (!e.startDate) return false;
    if (e.endDate && e.endDate < e.startDate) return false;
    return true;
  });
  
  if (allDatesValid) {
    evidence.push('All dates are valid and consistent');
  } else {
    score -= 20;
    evidence.push('Some date inconsistencies detected');
  }
  
  return {
    score: Math.max(score, 0),
    maxScore: 100,
    explanation: 'Consistency measures logical coherence across resume sections.',
    evidence,
    recommendation: score < 80 ? 'Review dates and section completeness' : 'Resume is consistent',
  };
}

function calculateCredibilityScore(resume: ParsedResume): ScoreComponent {
  const evidence: string[] = [];
  let score = 50;
  
  if (resume.candidate.links.github || resume.candidate.links.portfolio || resume.candidate.links.other.length > 0) {
    score += 12;
    evidence.push('Public professional link present (portfolio, repo or website)');
  }
  if (resume.candidate.links.linkedin) {
    score += 13;
    evidence.push('LinkedIn profile linked');
  }
  if (resume.certifications.length > 0) {
    score += 10;
    evidence.push(`${resume.certifications.length} certification(s)`);
  }
  if (resume.achievements.length > 0) {
    score += 10;
    evidence.push(`${resume.achievements.length} achievement(s) documented`);
  }
  
  const supportedSkills = resume.skills.filter(s => s.supportLevel === 'supported').length;
  score += Math.min(supportedSkills * 2, 20);
  evidence.push(`${supportedSkills} skills with supporting evidence`);
  
  return {
    score: Math.min(score, 100),
    maxScore: 100,
    explanation: 'Credibility measures verifiable claims and evidence quality.',
    evidence,
    recommendation: 'Add more verifiable links and certifications',
  };
}

function calculateReadabilityScore(resume: ParsedResume): ScoreComponent {
  const summaryLength = resume.candidate.summary?.length || 0;
  const avgBulletLength = resume.experience.flatMap(e => e.responsibilities).join(' ').length / 
    Math.max(resume.experience.flatMap(e => e.responsibilities).length, 1);
  
  const evidence: string[] = [];
  let score = 70;
  
  if (summaryLength > 50 && summaryLength < 300) {
    score += 10;
    evidence.push('Summary length is appropriate');
  } else {
    evidence.push('Consider adjusting summary length');
  }
  
  if (avgBulletLength > 20 && avgBulletLength < 150) {
    score += 10;
    evidence.push('Bullet points are well-sized');
  } else {
    evidence.push('Review bullet point lengths');
  }
  
  if (resume.experience.length > 0) {
    evidence.push(`${resume.experience.length} experience entries`);
  }
  
  return {
    score: Math.min(score, 100),
    maxScore: 100,
    explanation: 'Readability measures how easily humans can parse the resume.',
    evidence,
    recommendation: 'Keep bullet points concise and scannable',
  };
}
