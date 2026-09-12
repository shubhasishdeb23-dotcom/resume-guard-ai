import { ParsedResume, ATSAnalysis } from '../types';

export function analyzeATS(resume: ParsedResume): ATSAnalysis {
  const keywords = analyzeKeywords(resume);
  const sections = analyzeSections(resume);
  const formatting = analyzeFormatting(resume);
  const contactInfo = analyzeContactInfo(resume);
  const length = analyzeLength(resume);
  const dateConsistency = analyzeDateConsistency(resume);
  
  const score = calculateATSScore({
    keywords,
    sections,
    formatting,
    contactInfo,
    length,
    dateConsistency,
  });
  
  return {
    score,
    keywords,
    sections,
    formatting,
    contactInfo,
    length,
    dateConsistency,
  };
}

function analyzeKeywords(resume: ParsedResume) {
  const allText = [
    resume.candidate.summary || '',
    ...resume.experience.flatMap(e => [...e.responsibilities, ...e.technologies]),
    ...resume.projects.flatMap(p => [p.description, ...p.technologies]),
    ...resume.skills.map(s => s.name),
  ].join(' ').toLowerCase();
  
  const commonKeywords = [
    'javascript', 'python', 'java', 'typescript', 'react', 'node', 'sql', 'aws',
    'docker', 'kubernetes', 'git', 'agile', 'scrum', 'api', 'rest', 'graphql',
    'mongodb', 'postgresql', 'redis', 'microservices', 'ci/cd', 'testing',
    'leadership', 'collaboration', 'communication', 'problem-solving',
  ];
  
  const found: string[] = [];
  const missing: string[] = [];
  const density: Record<string, number> = {};
  
  commonKeywords.forEach(keyword => {
    const count = (allText.match(new RegExp(keyword, 'g')) || []).length;
    if (count > 0) {
      found.push(keyword);
      density[keyword] = count;
    } else {
      missing.push(keyword);
    }
  });
  
  return { found, missing, density };
}

function analyzeSections(resume: ParsedResume) {
  const present: string[] = [];
  const missing: string[] = [];
  
  if (resume.candidate.summary) present.push('Summary');
  else missing.push('Summary');
  
  if (resume.experience.length > 0) present.push('Experience');
  else missing.push('Experience');
  
  if (resume.education.length > 0) present.push('Education');
  else missing.push('Education');
  
  if (resume.skills.length > 0) present.push('Skills');
  else missing.push('Skills');
  
  if (resume.projects.length > 0) present.push('Projects');
  
  const order = present.slice();
  
  return { present, missing, order };
}

function analyzeFormatting(resume: ParsedResume) {
  const issues: string[] = [];
  
  return {
    hasColumns: false,
    hasTables: false,
    hasImages: false,
    hasSpecialChars: false,
    issues,
  };
}

function analyzeContactInfo(resume: ParsedResume) {
  return {
    email: !!resume.candidate.email,
    phone: !!resume.candidate.phone,
    location: !!resume.candidate.location,
    linkedin: !!resume.candidate.links.linkedin,
    github: !!resume.candidate.links.github,
  };
}

function analyzeLength(resume: ParsedResume) {
  const wordCount = [
    resume.candidate.summary || '',
    ...resume.experience.flatMap(e => e.responsibilities),
    ...resume.projects.flatMap(p => [p.description, ...p.features]),
  ].join(' ').split(/\s+/).length;
  
  return {
    pages: wordCount > 600 ? 2 : 1,
    words: wordCount,
    appropriate: wordCount >= 300 && wordCount <= 800,
  };
}

function analyzeDateConsistency(resume: ParsedResume) {
  const issues: string[] = [];
  
  resume.experience.forEach(exp => {
    if (exp.startDate && exp.endDate && exp.endDate < exp.startDate) {
      issues.push(`Invalid date range at ${exp.company}`);
    }
  });
  
  return {
    consistent: issues.length === 0,
    issues,
  };
}

type ATSAnalysisInput = Omit<ATSAnalysis, 'score'>;

function calculateATSScore(analysis: ATSAnalysisInput): number {
  let score = 0;
  
  score += Object.values(analysis.contactInfo).filter(Boolean).length * 8;
  score += analysis.sections.present.length * 10;
  score += Math.min(analysis.keywords.found.length * 2, 30);
  if (analysis.length.appropriate) score += 10;
  if (analysis.dateConsistency.consistent) score += 10;
  score -= analysis.formatting.issues.length * 5;
  
  return Math.min(Math.max(score, 0), 100);
}
