import { ParsedResume, SkillEntry, ProjectEntry, ExperienceEntry, EducationEntry, CertificationEntry, MetricClaim } from '../types';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let mammothModule: any = null;

const getMammoth = async () => {
  if (!mammothModule) {
    mammothModule = await import('mammoth');
  }
  return mammothModule;
};

// PDF.js worker setup (bundled locally — no CDN required)
let pdfjsLib: any = null;

const getPdfJs = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
  return pdfjsLib;
};

// Common skill keywords for extraction
const TECH_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
  'react', 'vue', 'angular', 'node.js', 'nodejs', 'express', 'django', 'flask', 'spring', 'dotnet', '.net',
  'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'graphql', 'rest', 'api',
  'machine learning', 'deep learning', 'ml', 'ai', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
  'data science', 'data analysis', 'spark', 'hadoop', 'etl',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'figma', 'ui', 'ux',
  'agile', 'scrum', 'jira', 'confluence', 'slack', 'trello',
  'linux', 'unix', 'bash', 'shell', 'devops', 'ci/cd',
  'fastapi', 'flask', 'django', 'spring boot', 'microservices', 'serverless',
  'nlp', 'computer vision', 'neural networks', 'gan', 'transformers',
];

const SOFT_SKILLS = [
  'leadership', 'communication', 'teamwork', 'team work', 'problem-solving', 'problem solving', 'analytical',
  'project management', 'mentoring', 'collaboration', 'presentation', 'negotiation',
  'critical thinking', 'time management', 'adaptability', 'creativity',
];

const ALL_SKILLS = [...TECH_SKILLS, ...SOFT_SKILLS];

// Extract text from PDF using pdf.js
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Build text with proper spacing and line handling
      let lastY: number | null = null;
      let pageText = '';
      
      textContent.items.forEach((item: any) => {
        if ('str' in item && item.str.trim()) {
          const currentY = item.transform[5];
          const fontSize = item.transform[0];
          
          // Check if we need a new line (different Y position)
          if (lastY !== null && Math.abs(currentY - lastY) > fontSize * 0.5) {
            pageText += '\n';
          } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            // Add space between items on same line
            pageText += ' ';
          }
          pageText += item.str;
          lastY = currentY;
        }
      });
      
      fullText += pageText + '\n\n---PAGE_BREAK---\n\n';
    }
    
    console.log('Extracted PDF text (first 2000 chars):', fullText.slice(0, 2000));
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
  }
}

// Extract text from TXT
async function extractTextFromTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Extract text from DOCX using mammoth
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await getMammoth();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value || '';
    if (!text.trim()) {
      throw new Error('No text content found in DOCX');
    }
    return text;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX. Please ensure the file is a valid .docx document.');
  }
}

// Main text extraction function
async function extractText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type;
  
  console.log('Extracting text from file:', file.name, 'Type:', mimeType, 'Extension:', extension);
  
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return extractTextFromPDF(file);
  } else if (mimeType === 'text/plain' || extension === 'txt') {
    return extractTextFromTXT(file);
  } else if (extension === 'docx' || mimeType.includes('wordprocessingml')) {
    return extractTextFromDOCX(file);
  } else {
    // Try PDF first, then text
    try {
      return await extractTextFromPDF(file);
    } catch {
      return extractTextFromTXT(file);
    }
  }
}

// Extract email using regex
function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const matches = text.match(emailRegex);
  return matches ? matches[0].toLowerCase() : '';
}

// Extract phone using regex
function extractPhone(text: string): string {
  const phonePatterns = [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return '';
}

// Extract name from resume text
function extractName(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('First 15 lines for name extraction:', lines.slice(0, 15));
  
  // Common patterns to skip (headers, contact info, etc.)
  const skipPatterns = [
    /^resume$/i, /^cv$/i, /^curriculum\s*vitae$/i, /^curriculum$/i,
    /@/, /\.com/, /\.org/, /\.in/, /\.edu/, /\.io/,
    /^phone/i, /^email/i, /^mobile/i, /^contact/i, /^address/i,
    /^linkedin/i, /^github/i, /^portfolio/i, /^website/i,
    /^http/i, /^www/i, /^\+/, /^\d{10,}/,
    /^page\s*\d/i, /^\d+\s*$/i, /^---page/i,
    /^summary/i, /^objective/i, /^profile/i,
  ];
  
  // Look for name in first few lines
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i];
    
    // Skip lines matching skip patterns
    if (skipPatterns.some(pattern => pattern.test(line))) {
      continue;
    }
    
    // Skip lines that are too long (likely not a name)
    if (line.length > 50) {
      continue;
    }
    
    // Skip lines with numbers (except years)
    if (/\d{3,}/.test(line) && !/\b(19|20)\d{2}\b/.test(line)) {
      continue;
    }
    
    // Check if line looks like a name
    const words = line.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length >= 2 && words.length <= 5) {
      // Check if all words start with capital letter (proper name)
      const isProperName = words.every(word => /^[A-Z][a-z]+$/.test(word) || /^[A-Z]+$/.test(word));
      
      // Or check if it's a name format like "John Doe" or "JOHN DOE"
      const isNameFormat = words.every(word => /^[A-Za-z]+$/.test(word));
      
      if (isProperName || (isNameFormat && words.length <= 4)) {
        // Additional check: not a common section header
        const sectionHeaders = ['experience', 'education', 'skills', 'projects', 'summary', 'objective', 'work', 'professional', 'employment'];
        const isHeader = sectionHeaders.some(header => line.toLowerCase().includes(header));
        
        if (!isHeader) {
          console.log('Found name:', line, 'at line', i);
          // Capitalize properly
          return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
      }
    }
  }
  
  // Fallback: Look for patterns like "Name: John Doe"
  const namePattern = /(?:name|full\s*name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
  const nameMatch = text.match(namePattern);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  
  return 'Unknown Candidate';
}

// Extract location
function extractLocation(text: string): string {
  const locationPatterns = [
    // City, State format
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(?:\d{5})?/,
    // Indian cities
    /\b(Mumbai|Delhi|Bangalore|Bengaluru|Chennai|Hyderabad|Pune|Kolkata|Ahmedabad|Jaipur|Lucknow|Noida|Gurgaon)\b/i,
    // US Cities
    /\b(San Francisco|New York|Los Angeles|Seattle|Austin|Boston|Chicago|Denver|Portland)\b/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return '';
}

// Extract LinkedIn URL
function extractLinkedIn(text: string): string {
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/gi;
  const match = text.match(linkedinRegex);
  return match ? match[0] : '';
}

// Extract GitHub URL
function extractGitHub(text: string): string {
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9-]+/gi;
  const match = text.match(githubRegex);
  return match ? match[0] : '';
}

// Extract portfolio/website
function extractPortfolio(text: string): string {
  const urlRegex = /https?:\/\/(?!linkedin|github|facebook|twitter|instagram)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : '';
}

// Find section boundaries
function findSectionBoundaries(text: string): Map<string, { start: number; end: number }> {
  const sections = new Map<string, { start: number; end: number }>();
  
  const sectionPatterns = [
    { name: 'experience', patterns: [/^(?:professional\s+)?experience/i, /^work\s*history/i, /^employment/i, /^work\s*experience/i] },
    { name: 'education', patterns: [/^education/i, /^academic/i] },
    { name: 'skills', patterns: [/^skills/i, /^technical\s*skills/i, /^technologies/i, /^competencies/i] },
    { name: 'projects', patterns: [/^projects/i, /^personal\s*projects/i, /^key\s*projects/i] },
    { name: 'certifications', patterns: [/^certifications?/i, /^certificates/i] },
    { name: 'achievements', patterns: [/^achievements/i, /^awards/i, /^honors/i, /^honours/i] },
    { name: 'summary', patterns: [/^(?:professional\s+)?summary/i, /^profile/i, /^objective/i, /^about\s*me/i] },
  ];
  
  const lines = text.split('\n');
  let currentSection: string | null = null;
  let currentStart = -1;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim().toLowerCase();
    
    // Check if this line is a section header
    for (const section of sectionPatterns) {
      const isMatch = section.patterns.some(pattern => {
        const match = trimmedLine.match(pattern);
        return match && trimmedLine.length < 50; // Section headers are usually short
      });
      
      if (isMatch) {
        // Save previous section
        if (currentSection && currentStart >= 0) {
          sections.set(currentSection, { start: currentStart, end: index });
        }
        currentSection = section.name;
        currentStart = index;
        break;
      }
    }
  });
  
  // Save last section
  if (currentSection && currentStart >= 0) {
    sections.set(currentSection, { start: currentStart, end: lines.length });
  }
  
  console.log('Found sections:', Array.from(sections.keys()));
  return sections;
}

// Get section text
function getSectionText(text: string, sectionName: string): string {
  const sections = findSectionBoundaries(text);
  const section = sections.get(sectionName);
  
  if (!section) {
    // Try to find section content by pattern
    const patterns: Record<string, RegExp> = {
      experience: /(?:professional\s+)?experience[\s\S]*?(?=\n\s*(?:education|skills|projects|certifications|achievements|$))/i,
      education: /education[\s\S]*?(?=\n\s*(?:experience|skills|projects|certifications|achievements|$))/i,
      skills: /skills[\s\S]*?(?=\n\s*(?:experience|education|projects|certifications|achievements|$))/i,
      projects: /projects[\s\S]*?(?=\n\s*(?:experience|education|skills|certifications|achievements|$))/i,
    };
    
    const pattern = patterns[sectionName];
    if (pattern) {
      const match = text.match(pattern);
      return match ? match[0] : '';
    }
    return '';
  }
  
  const lines = text.split('\n');
  return lines.slice(section.start, section.end).join('\n');
}

// Extract skills from text
function extractSkills(text: string): SkillEntry[] {
  const skills: SkillEntry[] = [];
  
  // Get skills section for context
  const skillsSection = getSectionText(text, 'skills');
  const skillsSectionLower = skillsSection.toLowerCase();
  
  // Find all skill mentions
  ALL_SKILLS.forEach(skillName => {
    const skillLower = skillName.toLowerCase();
    
    // Create regex that matches the skill as a whole word
    const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches && matches.length > 0) {
      // Find evidence for this skill
      const evidence: SkillEntry['evidence'] = [];
      
      // Check if skill is in skills section
      if (skillsSectionLower.includes(skillLower)) {
        evidence.push({
          source: 'Skills section',
          type: 'skill_section',
          context: 'Listed in skills',
        });
      }
      
      // Check experience section
      const expSection = getSectionText(text, 'experience');
      if (expSection.toLowerCase().includes(skillLower)) {
        evidence.push({
          source: 'Experience section',
          type: 'experience',
          context: 'Mentioned in work experience',
        });
      }
      
      // Check projects section
      const projSection = getSectionText(text, 'projects');
      if (projSection.toLowerCase().includes(skillLower)) {
        evidence.push({
          source: 'Projects section',
          type: 'project',
          context: 'Used in projects',
        });
      }
      
      // Determine category
      let category = 'Technical';
      if (SOFT_SKILLS.includes(skillLower)) {
        category = 'Soft Skills';
      } else if (['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'devops'].includes(skillLower)) {
        category = 'DevOps & Cloud';
      } else if (['javascript', 'typescript', 'python', 'java', 'c++', 'go', 'rust', 'ruby', 'php'].includes(skillLower)) {
        category = 'Programming Languages';
      } else if (['react', 'vue', 'angular', 'node.js', 'nodejs', 'django', 'flask', 'spring', 'fastapi'].includes(skillLower)) {
        category = 'Frameworks';
      } else if (['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch'].includes(skillLower)) {
        category = 'Databases';
      } else if (['machine learning', 'deep learning', 'ml', 'ai', 'tensorflow', 'pytorch', 'keras', 'nlp', 'computer vision'].includes(skillLower)) {
        category = 'Machine Learning';
      }
      
      // Determine confidence and support level
      let confidence: SkillEntry['confidence'] = 'low';
      let supportLevel: SkillEntry['supportLevel'] = 'unsupported';
      
      // Count evidence from different sources
      const evidenceCount = evidence.length;
      const hasProjectEvidence = evidence.some(e => e.type === 'project');
      const hasExperienceEvidence = evidence.some(e => e.type === 'experience');
      
      if (evidenceCount >= 3 || (hasProjectEvidence && hasExperienceEvidence)) {
        confidence = 'high';
        supportLevel = 'supported';
      } else if (evidenceCount >= 2 || hasProjectEvidence || hasExperienceEvidence) {
        confidence = 'medium';
        supportLevel = 'weakly_supported';
      } else if (evidenceCount === 1) {
        confidence = 'medium';
        supportLevel = 'weakly_supported';
      }
      
      skills.push({
        id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: skillName.charAt(0).toUpperCase() + skillName.slice(1),
        category,
        claimed: true,
        evidence,
        confidence,
        supportLevel,
      });
    }
  });
  
  return skills;
}

// Parse date string
function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle "Present", "Current", "Now"
  if (/present|current|now/i.test(dateStr)) {
    return 'Present';
  }
  
  // Try various date formats
  const patterns = [
    // Month Year
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?)\s*(\d{4})/i,
    // MM/YYYY
    /(\d{1,2})\/(\d{4})/,
    // Year only
    /(\d{4})/,
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return dateStr.trim();
}

// Extract work experience
function extractExperience(text: string): ExperienceEntry[] {
  const experiences: ExperienceEntry[] = [];
  
  const expSection = getSectionText(text, 'experience');
  if (!expSection) {
    console.log('No experience section found');
    return experiences;
  }
  
  console.log('Experience section (first 1000 chars):', expSection.slice(0, 1000));
  
  // Split by common delimiters
  const entries = expSection.split(/\n\s*\n|\n(?=[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*(?:[-–]|at|,|\d{4}))/g);
  
  entries.forEach((entry, index) => {
    if (entry.trim().length < 20) return; // Skip very short entries
    
    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;
    
    // Try to parse company and role
    let company = '';
    let role = '';
    let startDate = '';
    let endDate = '';
    let current = false;
    const responsibilities: string[] = [];
    const technologies: string[] = [];
    const achievements: string[] = [];
    
    // Date pattern
    const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|Present|Current|\d{4}|Now)/i;
    
    // Parse first few lines for company, role, dates
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      const dateMatch = line.match(datePattern);
      
      if (dateMatch) {
        startDate = parseDate(dateMatch[1]);
        endDate = parseDate(dateMatch[2]);
        current = /present|current|now/i.test(dateMatch[2]);
        
        // Extract company/role from the same line
        const withoutDate = line.replace(datePattern, '').trim();
        const parts = withoutDate.split(/[|•\-–,]/).map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 2) {
          company = parts[0];
          role = parts[1];
        } else if (parts.length === 1) {
          if (!company) company = parts[0];
        }
      } else if (!company && line.length < 60) {
        // First non-date line is likely company
        company = line;
      } else if (!role && line.length < 60 && !datePattern.test(line)) {
        role = line;
      }
    }
    
    // Parse remaining lines for responsibilities and technologies
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty or very short lines
      if (line.length < 5) continue;
      
      // Check for bullet points
      if (/^[•\-*·●○►▸►]/.test(line)) {
        const cleaned = line.replace(/^[•\-*·●○►▸►]\s*/, '');
        responsibilities.push(cleaned);
        
        // Extract technologies mentioned
        TECH_SKILLS.forEach(tech => {
          if (line.toLowerCase().includes(tech)) {
            if (!technologies.includes(tech)) {
              technologies.push(tech);
            }
          }
        });
        
        // Check for achievements (contain metrics)
        if (/\d+%|\d+\s*(users|customers|clients|requests|queries|transactions)/i.test(line)) {
          achievements.push(cleaned);
        }
      } else if (line.length > 10 && !datePattern.test(line)) {
        // Non-bullet lines might be responsibilities
        responsibilities.push(line);
      }
    }
    
    // Only add if we have meaningful data
    if (company || role) {
      experiences.push({
        id: `exp_${Date.now()}_${index}`,
        company: company || 'Unknown Company',
        role: role || 'Position',
        startDate,
        endDate,
        current,
        location: '',
        responsibilities,
        technologies,
        achievements,
        metrics: [],
      });
    }
  });
  
  console.log(`Extracted ${experiences.length} experience entries`);
  return experiences;
}

// Extract education
function extractEducation(text: string): EducationEntry[] {
  const education: EducationEntry[] = [];
  
  const eduSection = getSectionText(text, 'education');
  if (!eduSection) {
    console.log('No education section found');
    return education;
  }
  
  console.log('Education section (first 500 chars):', eduSection.slice(0, 500));
  
  // Degree patterns
  const degreePatterns = [
    /(Bachelor|Master|PhD|Ph\.D|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc|B\.?A|M\.?A|MBA|BBA|BCA|MCA)['s]*\s*(?:of\s+)?(?:Science|Arts|Engineering|Technology|Computer Science|Business)?/gi,
    /(B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|B\.?E\.?|M\.?E\.?|B\.?Tech|M\.?Tech|PhD|MBA|BCA|MCA|BBA)/gi,
  ];
  
  // Institution patterns
  const institutionPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:University|College|Institute|School|Academy)))/g,
    /((?:University|College|Institute)\s+(?:of\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
  ];
  
  // Split into entries
  const entries = eduSection.split(/\n\s*\n|\n(?=[A-Z])/g);
  
  entries.forEach((entry, index) => {
    if (entry.trim().length < 10) return;
    
    let degree = '';
    let institution = '';
    let field = '';
    let startDate = '';
    let endDate = '';
    
    // Extract degree
    for (const pattern of degreePatterns) {
      const match = entry.match(pattern);
      if (match) {
        degree = match[0];
        break;
      }
    }
    
    // Extract institution
    for (const pattern of institutionPatterns) {
      const match = entry.match(pattern);
      if (match) {
        institution = match[0];
        break;
      }
    }
    
    // Extract years
    const years = entry.match(/\b(19|20)\d{2}\b/g);
    if (years) {
      startDate = years[0];
      if (years.length > 1) {
        endDate = years[years.length - 1];
      }
    }
    
    // Extract field of study
    const fieldMatch = entry.match(/(?:in|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (fieldMatch) {
      field = fieldMatch[1];
    }
    
    if (degree || institution) {
      education.push({
        id: `edu_${Date.now()}_${index}`,
        institution: institution || entry.split('\n')[0].slice(0, 100),
        degree: degree || 'Degree',
        field: field || 'Computer Science',
        startDate,
        endDate,
        gpa: '',
        honors: [],
        coursework: [],
      });
    }
  });
  
  console.log(`Extracted ${education.length} education entries`);
  return education;
}

// Extract projects
function extractProjects(text: string): ProjectEntry[] {
  const projects: ProjectEntry[] = [];
  
  const projSection = getSectionText(text, 'projects');
  if (!projSection) {
    console.log('No projects section found');
    return projects;
  }
  
  console.log('Projects section (first 1000 chars):', projSection.slice(0, 1000));
  
  // Split by common delimiters
  const entries = projSection.split(/\n\s*\n|\n(?=[A-Z][a-z]+(?:\s+[A-Za-z]+)*\s*[:\-])/g);
  
  entries.forEach((entry, index) => {
    if (entry.trim().length < 15) return;
    
    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;
    
    // First line is usually project name
    let projectName = lines[0].replace(/^[•\-*·]\s*/, '').replace(/[:\-]\s*$/, '').trim();
    
    // Skip if it looks like a section header
    if (/^projects?$/i.test(projectName)) return;
    if (projectName.length > 80) {
      projectName = projectName.slice(0, 80);
    }
    
    // Combine remaining lines for description
    const description = lines.slice(1).join(' ');
    
    // Find technologies
    const projectTechs: string[] = [];
    TECH_SKILLS.forEach(tech => {
      if (entry.toLowerCase().includes(tech)) {
        projectTechs.push(tech);
      }
    });
    
    // Check for GitHub link
    const githubMatch = entry.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+/gi);
    
    // Check for demo link
    const demoMatch = entry.match(/(?:https?:\/\/)?(?:www\.)?(?!github)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi);
    
    // Calculate depth score based on available information
    const depthItems = {
      hasDescription: description.length > 20,
      hasTechnologies: projectTechs.length > 0,
      hasGitHub: !!githubMatch,
      hasMetrics: /\d+%|\d+\s*(users|customers|requests|queries)/i.test(description),
      hasProblem: /problem|challenge|issue|solve/i.test(description),
      hasSolution: /solution|implemented|built|developed|created/i.test(description),
    };
    const depthScore = Math.round((Object.values(depthItems).filter(Boolean).length / 6) * 100);
    
    // Extract metrics
    const metrics: MetricClaim[] = [];
    const metricMatches = description.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(improvement|increase|reduction|growth|faster|slower)/gi);
    for (const match of metricMatches) {
      metrics.push({
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        claim: match[0],
        value: parseFloat(match[1]),
        unit: match[2],
        context: description.slice(Math.max(0, match.index! - 50), match.index! + match[0].length + 50),
        supportLevel: 'medium',
        verification: 'Metric requires additional context',
      });
    }
    
    projects.push({
      id: `proj_${Date.now()}_${index}`,
      name: projectName,
      description: description.slice(0, 500),
      technologies: projectTechs,
      features: [],
      metrics,
      github: githubMatch ? githubMatch[0] : undefined,
      demo: demoMatch ? demoMatch[0] : undefined,
      depthScore,
    });
  });
  
  console.log(`Extracted ${projects.length} project entries`);
  return projects;
}

// Extract certifications
function extractCertifications(text: string): CertificationEntry[] {
  const certifications: CertificationEntry[] = [];
  
  const certSection = getSectionText(text, 'certifications');
  const textToSearch = certSection || text;
  
  const certPatterns = [
    /(AWS|Azure|GCP|Google Cloud)\s*(?:Certified|Solutions?)?\s*(?:Architect|Developer|Administrator|Engineer|Practitioner)?/gi,
    /(PMP|Project Management Professional)/gi,
    /(Certified Scrum Master|CSM|PSM)/gi,
    /(CISSP|CISA|CISM)/gi,
    /(CCNA|CCNP|CCIE)/gi,
    /(Microsoft Certified|MCSE|MCSA)/gi,
    /(Oracle Certified|OCP|OCA)/gi,
    /(Google Certified)/gi,
    /(Salesforce Certified)/gi,
    /(Tableau Certified)/gi,
    /(Kubernetes Certified|CKA|CKAD)/gi,
  ];
  
  certPatterns.forEach(pattern => {
    const matches = textToSearch.matchAll(pattern);
    for (const match of matches) {
      const certName = match[0];
      
      // Avoid duplicates
      if (certifications.some(c => c.name === certName)) continue;
      
      // Extract year
      const yearMatch = textToSearch.match(/\b(20)\d{2}\b/);
      
      certifications.push({
        id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: certName,
        issuer: '',
        date: yearMatch ? yearMatch[0] : '',
        credentialId: '',
        url: '',
      });
    }
  });
  
  console.log(`Extracted ${certifications.length} certifications`);
  return certifications;
}

// Extract summary/objective
function extractSummary(text: string): string {
  const summarySection = getSectionText(text, 'summary');
  
  if (summarySection) {
    // Clean up and return
    const cleaned = summarySection
      .replace(/^(?:professional\s+)?summary|profile|objective|about\s*me/gi, '')
      .replace(/\n+/g, ' ')
      .trim();
    return cleaned.slice(0, 500);
  }
  
  // If no explicit summary, use first substantial paragraph
  const paragraphs = text.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const cleaned = para.trim();
    // Skip if it looks like a section header or contact info
    if (cleaned.length > 50 && cleaned.length < 500 &&
        !/^(experience|education|skills|projects|certifications)/i.test(cleaned) &&
        !/@/.test(cleaned) &&
        !/^\d+$/.test(cleaned)) {
      return cleaned;
    }
  }
  
  return '';
}

// Main parsing function
export async function parseResume(file: File, id: string, version: number): Promise<ParsedResume> {
  console.log('Starting resume parsing for:', file.name);
  
  // Extract text from file
  const text = await extractText(file);
  
  if (!text || text.trim().length === 0) {
    throw new Error('Could not extract any text from the resume. Please ensure the file is not corrupted.');
  }
  
  console.log('Extracted text length:', text.length);
  
  // Extract all components
  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const location = extractLocation(text);
  const summary = extractSummary(text);
  const linkedin = extractLinkedIn(text);
  const github = extractGitHub(text);
  const portfolio = extractPortfolio(text);
  const skills = extractSkills(text);
  const experience = extractExperience(text);
  const education = extractEducation(text);
  const projects = extractProjects(text);
  const certifications = extractCertifications(text);
  
  console.log('Parsed data:', {
    name,
    email,
    phone,
    location,
    skillsCount: skills.length,
    experienceCount: experience.length,
    educationCount: education.length,
    projectsCount: projects.length,
    certificationsCount: certifications.length,
  });
  
  const parsedResume: ParsedResume = {
    id,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date(),
    status: 'completed',
    version,
    
    candidate: {
      name,
      email,
      phone,
      location,
      summary,
      links: {
        github: github || undefined,
        linkedin: linkedin || undefined,
        portfolio: portfolio || undefined,
        other: [],
      },
    },
    
    education,
    experience,
    internships: [],
    projects,
    skills,
    certifications,
    achievements: [],
    publications: [],
  };
  
  return parsedResume;
}
