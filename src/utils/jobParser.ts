import { JobDescription } from '../types/recruiter';
import { ALL_SKILLS, CERTIFICATION_KEYWORDS } from '../data/skillTaxonomy';

export function parseJobDescription(text: string): JobDescription['extracted'] {
  const textLower = text.toLowerCase();
  
  const skillKeywords = ALL_SKILLS;
  
  const foundSkills: string[] = [];
  skillKeywords.forEach(skill => {
    if (textLower.includes(skill)) {
      foundSkills.push(skill);
    }
  });
  
  const experienceMatch = textLower.match(/(\d+)\s*\+?\s*years?\s*(?:of\s+)?experience/i);
  const yearsRequired = experienceMatch ? parseInt(experienceMatch[1]) : 2;
  
  let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'mid';
  if (textLower.includes('executive') || textLower.includes('director')) {
    experienceLevel = 'executive';
  } else if (textLower.includes('senior') || textLower.includes('lead') || yearsRequired >= 5) {
    experienceLevel = 'senior';
  } else if (
    textLower.includes('entry') || textLower.includes('junior') || yearsRequired <= 1 ||
    /\b(apprentice|trainee|intern|graduate scheme|no experience|recent graduates?)\b/i.test(textLower)
  ) {
    experienceLevel = 'entry';
  }
  
  const degreePatterns = [
    { pattern: /bachelor'?s?\s*(?:degree)?\s*(?:in\s+)?(\w+(?:\s+\w+)?)/i, level: 'bachelor' },
    { pattern: /master'?s?\s*(?:degree)?\s*(?:in\s+)?(\w+(?:\s+\w+)?)/i, level: 'master' },
    { pattern: /ph\.?d\.?\s*(?:in\s+)?(\w+(?:\s+\w+)?)/i, level: 'phd' },
    { pattern: /bsc|b\.s\.|b\.e\./i, level: 'bachelor' },
    { pattern: /msc|m\.s\.|m\.e\./i, level: 'master' },
  ];
  
  const education: JobDescription['extracted']['education'] = [];
  degreePatterns.forEach(({ pattern, level }) => {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      education.push({
        degree: level,
        field: match?.[1] || '',
        required: textLower.includes('required') || textLower.includes('must have'),
      });
    }
  });
  
  if (education.length === 0 && (textLower.includes('degree') || textLower.includes('diploma') || textLower.includes('bachelor') || textLower.includes('graduate'))) {
    education.push({
      degree: 'bachelor',
      field: '',
      required: textLower.includes('required') || textLower.includes('must have'),
    });
  }
  
  const certifications: string[] = [];
  CERTIFICATION_KEYWORDS.forEach(cert => {
    if (textLower.includes(cert)) {
      certifications.push(cert);
    }
  });
  
  const responsibilities: string[] = [];
  const lines = text.split('\n');
  let inResponsibilities = false;
  lines.forEach(line => {
    const trimmed = line.trim();
    if (/responsibilities|what you'?ll do|you will/i.test(trimmed)) {
      inResponsibilities = true;
      return;
    }
    if (/requirements|qualifications|what you need/i.test(trimmed)) {
      inResponsibilities = false;
    }
    if (inResponsibilities && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
      responsibilities.push(trimmed.replace(/^[•\-*]\s*/, ''));
    }
  });
  
  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];
  
  let inRequired = false;
  let inPreferred = false;
  
  lines.forEach(line => {
    const trimmed = line.trim().toLowerCase();
    if (/required|must have|minimum/i.test(trimmed)) {
      inRequired = true;
      inPreferred = false;
      return;
    }
    if (/preferred|nice to have|bonus|plus/i.test(trimmed)) {
      inRequired = false;
      inPreferred = true;
      return;
    }
    if (/responsibilities|what you/i.test(trimmed)) {
      inRequired = false;
      inPreferred = false;
    }
    
    const skillLine = line.replace(/^[•\-*]\s*/, '');
    skillKeywords.forEach(skill => {
      if (skillLine.toLowerCase().includes(skill)) {
        if (inPreferred) {
          if (!preferredSkills.includes(skill)) preferredSkills.push(skill);
        } else if (inRequired) {
          if (!requiredSkills.includes(skill)) requiredSkills.push(skill);
        }
      }
    });
  });
  
  if (requiredSkills.length === 0) {
    foundSkills.slice(0, 5).forEach(skill => {
      if (!requiredSkills.includes(skill)) requiredSkills.push(skill);
    });
  }
  
  const domainKeywords = [
    'fintech', 'healthcare', 'e-commerce', 'saas', 'enterprise', 'startup', 'b2b', 'b2c',
    'hospital', 'clinic', 'nursing', 'education', 'school', 'university', 'legal', 'law firm',
    'banking', 'finance', 'accounting', 'retail', 'hospitality', 'logistics', 'construction',
    'manufacturing', 'government', 'nonprofit', 'insurance', 'real estate', 'pharma', 'biotech',
    'automotive', 'agriculture', 'security', 'transport', 'telecom',
  ];
  const domainRequirements: string[] = [];
  domainKeywords.forEach(domain => {
    if (textLower.includes(domain)) {
      domainRequirements.push(domain);
    }
  });
  
  return {
    requiredSkills: [...new Set(requiredSkills)],
    preferredSkills: [...new Set(preferredSkills)],
    technologies: [...new Set(foundSkills)],
    experience: {
      years: yearsRequired,
      level: experienceLevel,
      description: `${yearsRequired}+ years of experience`,
    },
    education,
    responsibilities,
    certifications,
    domainRequirements,
  };
}
