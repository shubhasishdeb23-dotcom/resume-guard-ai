import { ParsedResume, SkillEntry, ProjectEntry, ExperienceEntry, EducationEntry, CertificationEntry, MetricClaim } from '../types';
import { ALL_SKILLS, getSkillCategory, skillPattern, CERTIFICATION_KEYWORDS, PORTFOLIO_DOMAINS, SOCIAL_DOMAINS } from '../data/skillTaxonomy';
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

// Canonical section names mapped to the header patterns used across industries.
const SECTION_ALIASES: { name: string; patterns: RegExp[] }[] = [
  {
    name: 'experience',
    patterns: [
      /^(?:professional\s+|work\s+|relevant\s+|career\s+)?experience/i,
      /^work\s*history/i, /^employment/i, /^career\s*history/i, /^positions?\s*held/i,
      /^clinical\s+experience/i, /^field\s+experience/i, /^practicum/i, /^student\s+teaching/i,
      /^volunteer\s+experience/i, /^professional\s+background/i, /^professional\s+history/i,
    ],
  },
  { name: 'education', patterns: [/^education/i, /^academic/i, /^academic\s+background/i, /^qualifications/i] },
  {
    name: 'skills',
    patterns: [
      /^skills/i, /^technical\s*skills/i, /^key\s*skills/i, /^core\s*skills/i,
      /^competencies/i, /^core\s*competencies/i, /^areas?\s+of\s+expertise/i,
      /^technologies/i, /^proficiencies/i, /^specialized\s+skills/i,
    ],
  },
  {
    name: 'projects',
    patterns: [
      /^projects/i, /^(?:personal|key|selected|major|academic|research|side)\s*projects/i,
      /^portfolio/i, /^case\s*studies/i, /^capstone/i, /^selected\s+work/i,
    ],
  },
  {
    name: 'certifications',
    patterns: [
      /^certifications?/i, /^certificates?/i, /^licen[cs]es?/i, /^licensure/i,
      /^credentials?/i, /^certifications?\s*(?:&|and)\s*licen[cs]es?/i,
      /^licen[cs]es?\s*(?:&|and)\s*certifications?/i, /^professional\s+credentials/i,
    ],
  },
  {
    name: 'achievements',
    patterns: [/^achievements/i, /^accomplishments/i, /^awards/i, /^honors/i, /^honours/i, /^awards?\s*(?:&|and)\s*honors?/i],
  },
  { name: 'summary', patterns: [/^(?:professional\s+)?summary/i, /^profile/i, /^objective/i, /^about\s*me/i, /^career\s+summary/i, /^professional\s+profile/i] },
  { name: 'publications', patterns: [/^publications/i, /^research/i, /^papers/i, /^presentations/i] },
  { name: 'training', patterns: [/^training/i, /^professional\s+development/i, /^courses?/i, /^education\s*(?:&|and)\s*training/i] },
  { name: 'languages', patterns: [/^languages/i] },
  { name: 'interests', patterns: [/^interests/i, /^hobbies/i, /^activities/i] },
  { name: 'references', patterns: [/^references/i] },
];

// Terms that indicate a quantified, evidence-bearing achievement in any field.
const METRIC_UNIT_PATTERN = /\b(?:percent|%|users?|customers?|clients?|patients?|students?|people|employees?|staff|members?|team|engineers?|nurses?|volunteers?|hours?|days?|weeks?|months?|years?|revenue|sales|costs?|dollars?|usd|inr|budget|profit|units?|tickets?|cases?|claims?|accounts?|calls?|orders?|transactions?|visits?|events?|records?|files?|tests?|deployments?|projects?|locations?|stores?|bed|beds|classrooms?|schools?|vehicles?|miles|tons|acres?|gallons?)\b/i;

function hasQuantifiedAchievement(text: string): boolean {
  if (!/\d/.test(text)) return false;
  return /\d+(?:\.\d+)?\s*%|\d[\d,]*\+?\s*(?:percent\b)/i.test(text) || METRIC_UNIT_PATTERN.test(text);
}

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
        const sectionHeaders = [
          'experience', 'education', 'skills', 'projects', 'summary', 'objective',
          'work', 'professional', 'employment', 'certification', 'certificate', 'license',
          'achievements', 'accomplishments', 'awards', 'honors', 'publications', 'training',
          'volunteer', 'profile', 'competencies', 'qualifications', 'portfolio', 'references',
        ];
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

// Extract portfolio/website (any professional link that is not a social feed)
function extractPortfolio(text: string): string {
  const urlRegex = /https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/gi;
  const matches = text.match(urlRegex) || [];
  for (const url of matches) {
    const lower = url.toLowerCase();
    if (lower.includes('linkedin.com')) continue;
    if (SOCIAL_DOMAINS.some(domain => lower.includes(domain))) continue;
    return url;
  }
  return '';
}

// Detect public portfolio / evidence links (repos, portfolios, profiles)
function extractPortfolioLinks(text: string): string[] {
  const urlRegex = /https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/gi;
  const matches = text.match(urlRegex) || [];
  const found: string[] = [];
  for (const url of matches) {
    const lower = url.toLowerCase();
    if (lower.includes('linkedin.com')) continue;
    if (SOCIAL_DOMAINS.some(domain => lower.includes(domain))) continue;
    if (PORTFOLIO_DOMAINS.some(domain => lower.includes(domain)) || !found.includes(url)) {
      found.push(url);
    }
  }
  return Array.from(new Set(found));
}

// Find section boundaries
function findSectionBoundaries(text: string): Map<string, { start: number; end: number }> {
  const sections = new Map<string, { start: number; end: number }>();
  
  const lines = text.split('\n');
  let currentSection: string | null = null;
  let currentStart = -1;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim().toLowerCase();
    
    // Check if this line is a section header
    for (const section of SECTION_ALIASES) {
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
      experience: /(?:professional\s+|work\s+|clinical\s+|field\s+)?experience[\s\S]*?(?=\n\s*(?:education|skills|projects|certifications|licen[cs]es|achievements|awards|publications|training|languages|interests|references|$))/i,
      education: /education[\s\S]*?(?=\n\s*(?:experience|skills|projects|certifications|licen[cs]es|achievements|awards|publications|training|languages|interests|references|$))/i,
      skills: /(?:skills|competencies|proficiencies)[\s\S]*?(?=\n\s*(?:experience|education|projects|certifications|licen[cs]es|achievements|awards|publications|training|languages|interests|references|$))/i,
      projects: /(?:projects|portfolio|case\s*studies)[\s\S]*?(?=\n\s*(?:experience|education|skills|certifications|licen[cs]es|achievements|awards|publications|training|languages|interests|references|$))/i,
      certifications: /(?:certifications?|certificates?|licen[cs]es?|credentials)[\s\S]*?(?=\n\s*(?:experience|education|skills|projects|achievements|awards|publications|training|languages|interests|references|$))/i,
      achievements: /(?:achievements|accomplishments|awards|honors?)[\s\S]*?(?=\n\s*(?:experience|education|skills|projects|certifications|licen[cs]es|publications|training|languages|interests|references|$))/i,
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

// Read the first section that exists, trying several aliases (e.g. clinical experience)
function getSectionTextAny(text: string, sectionNames: string[]): string {
  for (const name of sectionNames) {
    const value = getSectionText(text, name);
    if (value) return value;
  }
  return '';
}

// Preserve common professional acronyms, otherwise capitalize the first letter.
const SKILL_ACRONYMS = new Set([
  'cpr', 'bls', 'acls', 'pals', 'rn', 'lpn', 'lvn', 'cna', 'emt', 'cdl', 'cpa', 'cfa',
  'crm', 'seo', 'sem', 'hvac', 'osha', 'gd&t', 'p&l', 'kpi', 'okr', 'emr', 'ehr', 'icu',
  'iep', 'esl', 'tesol', 'tefl', 'sql', 'aws', 'gcp', 'api', 'ui', 'ux', 'gis', 'pmp',
  'csm', 'psm', 'shrm', 'phr', 'sphr', 'hris', 'pos', 'mls', 'gdpr', 'lcsw', 'lmsw',
  'lmft', 'lpc', 'cma', 'aprn', 'pharmd', 'aed', 'vba', 'plc', 'cnc', 'cad', 'fda', 'hipaa',
]);

function formatSkillName(skill: string): string {
  const lower = skill.toLowerCase();
  if (SKILL_ACRONYMS.has(lower)) return lower.toUpperCase();
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

// Extract skills from text
function extractSkills(text: string): SkillEntry[] {
  const skills: SkillEntry[] = [];
  
  // Get section context once for all skill lookups
  const skillsSectionLower = getSectionText(text, 'skills').toLowerCase();
  const expSectionLower = getSectionTextAny(text, ['experience']).toLowerCase();
  const projSectionLower = getSectionTextAny(text, ['projects']).toLowerCase();
  const certSectionLower = getSectionTextAny(text, ['certifications']).toLowerCase();
  
  // Find all skill mentions across industries
  ALL_SKILLS.forEach(skillName => {
    const skillLower = skillName.toLowerCase();
    const matches = text.match(skillPattern(skillLower));
    
    if (matches && matches.length > 0) {
      // Find evidence for this skill
      const evidence: SkillEntry['evidence'] = [];
      
      if (skillsSectionLower.includes(skillLower)) {
        evidence.push({
          source: 'Skills section',
          type: 'skill_section',
          context: 'Listed in skills',
        });
      }
      
      if (expSectionLower.includes(skillLower)) {
        evidence.push({
          source: 'Experience section',
          type: 'experience',
          context: 'Demonstrated in work experience',
        });
      }
      
      if (projSectionLower.includes(skillLower)) {
        evidence.push({
          source: 'Projects / portfolio section',
          type: 'project',
          context: 'Used in projects or portfolio',
        });
      }
      
      if (certSectionLower.includes(skillLower)) {
        evidence.push({
          source: 'Certifications section',
          type: 'certification',
          context: 'Referenced in certifications or licences',
        });
      }
      
      // Determine confidence and support level
      let confidence: SkillEntry['confidence'] = 'low';
      let supportLevel: SkillEntry['supportLevel'] = 'unsupported';
      
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
        name: formatSkillName(skillName),
        category: getSkillCategory(skillName),
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

// Extract quantified claims (numbers with a unit or percentage) from any field
function extractMetricClaims(source: string): MetricClaim[] {
  const metrics: MetricClaim[] = [];
  const metricRegex = /(\d[\d,]*(?:\.\d+)?)\s*(%)?\s*([A-Za-z][A-Za-z -]{0,25})/g;
  let match: RegExpExecArray | null;
  while ((match = metricRegex.exec(source)) !== null) {
    const hasPercent = !!match[2];
    const trailing = (match[3] || '').trim();
    const unitLike = hasPercent || METRIC_UNIT_PATTERN.test(trailing);
    if (!unitLike) continue;
    metrics.push({
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      claim: match[0].trim(),
      value: parseFloat(match[1].replace(/,/g, '')),
      unit: hasPercent ? '%' : trailing,
      context: source.slice(Math.max(0, match.index - 50), match.index + match[0].length + 50),
      supportLevel: hasPercent ? 'high' : 'medium',
      verification: hasPercent
        ? 'Percentage claim — confirm the baseline and how it was measured'
        : 'Numeric claim — confirm the unit, timeframe and baseline',
    });
    if (metrics.length >= 8) break;
  }
  return metrics;
}

// Extract work experience
const ROLE_KEYWORD = /\b(engineer|developer|programmer|nurse|nursing|teacher|instructor|professor|tutor|manager|director|lead|head|senior|junior|associate|analyst|specialist|coordinator|consultant|technician|accountant|designer|recruiter|sales|marketing|chef|driver|waiter|waitress|pharmacist|doctor|physician|therapist|aide|clerk|assistant|supervisor|executive|officer|architect|scientist|intern|student|administrator|editor|writer|advisor|counselor|counsellor|librarian|operator|barista|technologist|trainer)\b/i;

function parseRoleCompanyHeader(header: string): { role: string; company: string; location: string } {
  let location = '';
  let parts = header.split('|').map(p => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (/^[A-Z][A-Za-z.\s]+,\s*[A-Z]{2}$/.test(last)) {
      location = last;
      parts = parts.slice(0, -1);
    }
  }

  if (parts.length === 0) return { role: '', company: '', location };

  if (parts.length === 1) {
    const atMatch = parts[0].split(/\s+at\s+/i);
    if (atMatch.length === 2) {
      return { role: atMatch[0].trim(), company: atMatch[1].trim(), location };
    }
    const sub = parts[0].split(',').map(p => p.trim()).filter(Boolean);
    if (sub.length >= 2) {
      const roleIdx = sub.findIndex(p => ROLE_KEYWORD.test(p));
      if (roleIdx > 0) {
        return { role: sub[roleIdx], company: sub.filter((_, i) => i !== roleIdx).join(', '), location };
      }
      return { role: sub[0], company: sub.slice(1).join(', '), location };
    }
    return { role: parts[0], company: '', location };
  }

  const roleIdx = parts.findIndex(p => ROLE_KEYWORD.test(p));
  if (roleIdx >= 0) {
    return { role: parts[roleIdx], company: parts.filter((_, i) => i !== roleIdx).join(', '), location };
  }
  return { role: parts[0], company: parts.slice(1).join(', '), location };
}

const SECTION_HEADER_LINE = /^(exposure|experience|work history|work experience|employment|employment history|professional experience|clinical experience|teaching experience|relevant experience|internships?|projects?|education|skills|technical skills|certifications?|licenses?|licences?|summary|professional summary|objective|profile|references|languages|interests|achievements|awards|honors|publications|volunteering|volunteer experience)\s*$/i;

function extractExperience(text: string): ExperienceEntry[] {
  const experiences: ExperienceEntry[] = [];

  const expSection = getSectionText(text, 'experience');
  if (!expSection) {
    console.log('No experience section found');
    return experiences;
  }

  const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|Present|Current|\d{4}|Now)/i;
  const bulletPattern = /^[•\-*·●○►▸]/;

  const lines = expSection
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !SECTION_HEADER_LINE.test(l));

  // Group into entries: each entry is a header line + date line + following bullets/paragraphs
  const groups: string[][] = [];
  let current: string[] = [];
  lines.forEach(line => {
    if (datePattern.test(line)) {
      const last = current[current.length - 1];
      if (current.length >= 2 && last && !bulletPattern.test(last) && !datePattern.test(last)) {
        const header = last;
        const prior = current.slice(0, -1);
        if (prior.length) groups.push(prior);
        current = [header, line];
      } else {
        current.push(line);
      }
    } else {
      current.push(line);
    }
  });
  if (current.length) groups.push(current);

  groups.forEach((entryLines, index) => {
    const entryText = entryLines.join('\n');
    if (entryText.trim().length < 20) return;

    const { role, company, location } = parseRoleCompanyHeader(entryLines[0] || '');

    const dateIdx = entryLines.findIndex(l => datePattern.test(l));
    let startDate = '';
    let endDate = '';
    let currentFlag = false;
    if (dateIdx >= 0) {
      const match = entryLines[dateIdx].match(datePattern);
      if (match) {
        startDate = parseDate(match[1]);
        endDate = parseDate(match[2]);
        currentFlag = /present|current|now/i.test(match[2]);
      }
    }

    const responsibilities: string[] = [];
    const technologies: string[] = [];
    const achievements: string[] = [];

    const bodyStart = dateIdx >= 0 ? dateIdx + 1 : 1;
    for (let i = bodyStart; i < entryLines.length; i++) {
      const line = entryLines[i];
      if (line.length < 5) continue;

      if (bulletPattern.test(line)) {
        const cleaned = line.replace(bulletPattern, '').trim();
        responsibilities.push(cleaned);

        ALL_SKILLS.forEach(skill => {
          if (skillPattern(skill).test(line) && !technologies.includes(skill)) {
            technologies.push(skill);
          }
        });

        if (hasQuantifiedAchievement(line)) {
          achievements.push(cleaned);
        }
      } else if (!datePattern.test(line) && line.length > 10) {
        responsibilities.push(line);
      }
    }

    if (company || role) {
      experiences.push({
        id: `exp_${Date.now()}_${index}`,
        company: company || 'Unknown Organization',
        role: role || 'Position',
        startDate,
        endDate,
        current: currentFlag,
        location,
        responsibilities,
        technologies,
        achievements,
        metrics: extractMetricClaims(entryText),
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
  
  // Degree / credential patterns across education systems
  const degreePatterns = [
    /(Bachelor|Master|Doctorate|Doctoral|PhD|Ph\.D|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc|B\.?A|M\.?A|MBA|BBA|BCA|MCA|Associate|Diploma|Certificate|Certification|High School Diploma|GED|HSC|SSC|A-Levels?|O-Levels?)/gi,
    /(B\.?S\.?|M\.?S\.?|BSc|MSc|BA|MA|BE|ME|RN|LPN|CNA|LLB|JD|MD|DDS|DVM|PharmD|BSN|MSN|DNP)/g,
  ];
  
  // Institution patterns
  const institutionPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:University|College|Institute|School|Academy|Polytechnic|Seminary|Conservatory)))/g,
    /((?:University|College|Institute|School|Academy|Polytechnic)\s+(?:of\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
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
        field: field || '',
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
    
    // Find skills/technologies across industries mentioned in this entry
    const projectTechs: string[] = [];
    ALL_SKILLS.forEach(tech => {
      if (skillPattern(tech).test(entry) && !projectTechs.includes(tech)) {
        projectTechs.push(tech);
      }
    });
    
    // Find any public links (repository, portfolio, publication, demo)
    const linkMatches = entry.match(/https?:\/\/[^\s)]+/gi) || [];
    const githubMatch = linkMatches.find(u => u.toLowerCase().includes('github.com'));
    const portfolioMatch = linkMatches.find(u => {
      const lower = u.toLowerCase();
      return !lower.includes('linkedin.com') && u !== githubMatch;
    });
    const demoMatch = portfolioMatch ? [portfolioMatch] : null;
    
    // Calculate depth score based on available information (field-agnostic)
    const depthItems = {
      hasDescription: description.length > 20,
      hasSkills: projectTechs.length > 0,
      hasLink: linkMatches.length > 0,
      hasMetrics: hasQuantifiedAchievement(description),
      hasProblem: /problem|challenge|issue|solve|goal|objective|need|requirement/i.test(description),
      hasSolution: /solution|implemented|built|developed|created|designed|launched|delivered|managed|led|improved|reduced|increased/i.test(description),
    };
    const depthScore = Math.round((Object.values(depthItems).filter(Boolean).length / 6) * 100);
    
    // Extract quantified claims
    const metrics: MetricClaim[] = extractMetricClaims(description);
    
    projects.push({
      id: `proj_${Date.now()}_${index}`,
      name: projectName,
      description: description.slice(0, 500),
      technologies: projectTechs,
      features: [],
      metrics,
      github: githubMatch,
      demo: demoMatch ? demoMatch[0] : undefined,
      depthScore,
    });
  });
  
  console.log(`Extracted ${projects.length} project entries`);
  return projects;
}

// Extract certifications, licences and credentials (any industry)
function extractCertifications(text: string): CertificationEntry[] {
  const certifications: CertificationEntry[] = [];
  const seen = new Set<string>();
  
  const push = (name: string, source: string) => {
    const cleaned = name.replace(/^[•\-*·–]\s*/, '').replace(/\s+/g, ' ').trim();
    if (cleaned.length < 3 || cleaned.length > 120) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    const yearMatch = source.match(/\b(19|20)\d{2}\b/);
    seen.add(key);
    certifications.push({
      id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: cleaned,
      issuer: '',
      date: yearMatch ? yearMatch[0] : '',
      credentialId: '',
      url: '',
    });
  };
  
  // 1) Read the certifications / licences / credentials section line by line
  const certSection = getSectionTextAny(text, ['certifications', 'training']);
  if (certSection) {
    const lines = certSection.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach((line, index) => {
      if (index === 0 && /^(certifications?|certificates?|licen[cs]es?|credentials?|training|courses?)/i.test(line)) return;
      if (line.length < 4) return;
      if (/^(professional development|training)$/i.test(line)) return;
      if (/[,;]/.test(line) && !/\b(19|20)\d{2}\b/.test(line)) {
        line.split(/[,;]/).forEach(part => push(part, line));
      } else {
        push(line, line);
      }
    });
  }
  
  // 2) Keyword scan for inline mentions when few section entries were found
  if (certifications.length < 3) {
    const textLower = text.toLowerCase();
    CERTIFICATION_KEYWORDS.forEach(keyword => {
      if (textLower.includes(keyword)) {
        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const match = text.match(regex);
        push(match ? match[0] : keyword, text);
      }
    });
  }
  
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
        !/^(experience|education|skills|projects|certifications|licen[cs]es|achievements|awards|publications|training|volunteer|portfolio)/i.test(cleaned) &&
        !/@/.test(cleaned) &&
        !/^\d+$/.test(cleaned)) {
      return cleaned;
    }
  }
  
  return '';
}

// Main parsing function
export function parseResumeText(text: string, id: string, fileName: string, fileSize: number, version: number): ParsedResume {
  // Extract all components
  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const location = extractLocation(text);
  const summary = extractSummary(text);
  const linkedin = extractLinkedIn(text);
  const github = extractGitHub(text);
  const portfolio = extractPortfolio(text);
  const portfolioLinks = extractPortfolioLinks(text);
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

  return {
    id,
    fileName,
    fileSize,
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
        other: portfolioLinks.filter(url => url !== portfolio && url !== github),
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
}

export async function parseResume(file: File, id: string, version: number): Promise<ParsedResume> {
  console.log('Starting resume parsing for:', file.name);
  
  // Extract text from file
  const text = await extractText(file);
  
  if (!text || text.trim().length === 0) {
    throw new Error('Could not extract any text from the resume. Please ensure the file is not corrupted.');
  }
  
  console.log('Extracted text length:', text.length);
  
  return parseResumeText(text, id, file.name, file.size, version);
}
