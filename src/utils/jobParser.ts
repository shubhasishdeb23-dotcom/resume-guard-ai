import { JobDescription } from '../types/recruiter';

export function parseJobDescription(text: string): JobDescription['extracted'] {
  const textLower = text.toLowerCase();
  
  const techSkills = [
    'python', 'javascript', 'typescript', 'java', 'c++', 'go', 'rust', 'ruby',
    'react', 'vue', 'angular', 'node.js', 'django', 'flask', 'spring',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins',
    'sql', 'mongodb', 'postgresql', 'redis', 'elasticsearch',
    'git', 'agile', 'scrum', 'ci/cd', 'rest api', 'graphql',
  ];
  
  const foundTech: string[] = [];
  techSkills.forEach(skill => {
    if (textLower.includes(skill)) {
      foundTech.push(skill);
    }
  });
  
  const experienceMatch = textLower.match(/(\d+)\s*\+?\s*years?\s*(?:of\s+)?experience/i);
  const yearsRequired = experienceMatch ? parseInt(experienceMatch[1]) : 2;
  
  let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'mid';
  if (textLower.includes('senior') || textLower.includes('lead') || yearsRequired >= 5) {
    experienceLevel = 'senior';
  } else if (textLower.includes('entry') || textLower.includes('junior') || yearsRequired <= 1) {
    experienceLevel = 'entry';
  } else if (textLower.includes('executive') || textLower.includes('director')) {
    experienceLevel = 'executive';
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
        field: match?.[1] || 'Computer Science',
        required: textLower.includes('required') || textLower.includes('must have'),
      });
    }
  });
  
  if (education.length === 0 && (textLower.includes('cs') || textLower.includes('computer science'))) {
    education.push({
      degree: 'bachelor',
      field: 'Computer Science',
      required: false,
    });
  }
  
  const certPatterns = [
    'aws certified', 'azure certified', 'gcp certified', 'google certified',
    'pmp', 'scrum master', 'csm', 'psm', 'kubernetes certified',
  ];
  const certifications: string[] = [];
  certPatterns.forEach(cert => {
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
    techSkills.forEach(skill => {
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
    foundTech.slice(0, 5).forEach(skill => {
      if (!requiredSkills.includes(skill)) requiredSkills.push(skill);
    });
  }
  
  const domainKeywords = [
    'fintech', 'healthcare', 'e-commerce', 'saas', 'enterprise',
    'startup', 'b2b', 'b2c', 'real-time', 'distributed systems',
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
    technologies: [...new Set(foundTech)],
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
