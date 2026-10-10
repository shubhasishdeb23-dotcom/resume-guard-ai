export interface SkillCategory {
  category: string;
  skills: string[];
}

// Cross-industry skill taxonomy. Skills are matched case-insensitively as
// whole words/phrases, so terms with symbols (c++, c#, .net, 5s, p&l) are allowed.
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    category: 'Healthcare & Medicine',
    skills: [
      'patient care', 'patient assessment', 'vital signs', 'phlebotomy', 'iv therapy',
      'medication administration', 'electronic health records', 'electronic medical records',
      'epic', 'cerner', 'cp', 'cpr', 'bls', 'acls', 'pals', 'triage', 'wound care',
      'infection control', 'hipaa', 'clinical documentation', 'care planning', 'care plans',
      'emr', 'ehr', 'catheterization', 'specimen collection', 'sterile technique',
      'patient education', 'nursing', 'icu', 'emergency medicine', 'pediatrics', 'geriatrics',
      'oncology', 'post-operative care', 'pharmacology', 'medical terminology', 'first aid',
      'telemetry', 'ehr systems', 'charting', 'clinical assessment', 'vital signs monitoring',
      'medication management', 'intravenous', 'wound dressing', 'discharge planning',
      'patient advocacy', 'infection prevention', 'medical records', 'clinical procedures',
    ],
  },
  {
    category: 'Education & Teaching',
    skills: [
      'lesson planning', 'lesson plans', 'curriculum development', 'classroom management',
      'student assessment', 'differentiated instruction', 'iep', 'special education', 'k-12',
      'early childhood education', 'student engagement', 'behavior management',
      'educational technology', 'parent communication', 'grading', 'tutoring', 'mentoring',
      'literacy instruction', 'esl', 'tesol', 'tefl', 'steam', 'stem education', 'common core',
      'classroom instruction', 'student learning outcomes', 'instructional design',
      'assessment design', 'classroom technology', 'student support', 'academic advising',
      'curriculum design', 'blended learning', 'distance learning', 'teacher training',
    ],
  },
  {
    category: 'Business & Management',
    skills: [
      'project management', 'program management', 'strategic planning', 'operations management',
      'budgeting', 'forecasting', 'process improvement', 'stakeholder management',
      'change management', 'business development', 'kpi', 'okr', 'p&l', 'business analysis',
      'risk management', 'supply chain', 'vendor management', 'team leadership',
      'cross-functional collaboration', 'lean', 'six sigma', 'okrs', 'performance management',
      'strategic initiatives', 'business strategy', 'operational efficiency', 'contract negotiation',
      'resource planning', 'workforce planning', 'quality management', 'continuous improvement',
    ],
  },
  {
    category: 'Finance & Accounting',
    skills: [
      'accounting', 'bookkeeping', 'accounts payable', 'accounts receivable', 'payroll',
      'financial reporting', 'gaap', 'ifrs', 'quickbooks', 'sap', 'financial analysis',
      'auditing', 'audit', 'tax preparation', 'reconciliation', 'variance analysis',
      'pivot tables', 'financial modeling', 'valuation', 'investment analysis',
      'portfolio management', 'cash flow', 'internal controls', 'cpa', 'cfa', 'accounts reconciliation',
      'general ledger', 'month-end close', 'financial statements', 'budget analysis',
      'cost accounting', 'credit analysis', 'underwriting', 'tax compliance', 'expense management',
    ],
  },
  {
    category: 'Sales & Marketing',
    skills: [
      'salesforce', 'crm', 'lead generation', 'cold calling', 'b2b sales', 'b2c sales',
      'negotiation', 'account management', 'customer acquisition', 'pipeline management',
      'upselling', 'territory management', 'market research', 'seo', 'sem', 'social media marketing',
      'content marketing', 'email marketing', 'google analytics', 'brand management',
      'campaign management', 'copywriting', 'digital marketing', 'hubspot', 'marketo',
      'product marketing', 'growth marketing', 'market analysis', 'quota attainment',
      'consultative selling', 'account expansion', 'lead qualification', 'sales enablement',
      'customer relationship management', 'go-to-market', 'brand strategy', 'paid media',
    ],
  },
  {
    category: 'Customer Service & Support',
    skills: [
      'customer service', 'customer support', 'conflict resolution', 'de-escalation',
      'call center', 'help desk', 'ticketing systems', 'zendesk', 'client relations',
      'customer retention', 'complaint resolution', 'appointment scheduling', 'front desk',
      'phone etiquette', 'customer satisfaction', 'csat', 'client services', 'issue resolution',
      'customer experience', 'live chat support', 'client onboarding', 'relationship building',
    ],
  },
  {
    category: 'Information Technology',
    skills: [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
      'react', 'vue', 'angular', 'node.js', 'nodejs', 'express', 'django', 'flask', 'spring', 'dotnet', '.net',
      'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'graphql', 'rest', 'api',
      'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
      'data science', 'data analysis', 'data analytics', 'spark', 'hadoop', 'etl', 'power bi', 'tableau',
      'html', 'css', 'sass', 'tailwind', 'bootstrap', 'figma', 'ui', 'ux',
      'agile', 'scrum', 'jira', 'confluence', 'slack', 'trello',
      'linux', 'unix', 'bash', 'shell', 'devops', 'ci/cd', 'it support', 'active directory',
      'fastapi', 'microservices', 'serverless', 'nlp', 'computer vision', 'neural networks', 'transformers',
      'cybersecurity', 'information security', 'network administration', 'system administration',
      'cloud computing', 'database administration', 'technical support', 'software development',
      'excel', 'vba', 'powerpoint', 'microsoft office', 'word', 'outlook', 'sharepoint',
    ],
  },
  {
    category: 'Engineering & Manufacturing',
    skills: [
      'autocad', 'solidworks', 'cad', 'lean manufacturing', 'quality control', 'quality assurance',
      'iso 9001', 'cnc', 'welding', 'machining', 'process engineering', 'root cause analysis',
      'kaizen', '5s', 'production planning', 'gd&t', 'plc', 'preventive maintenance',
      'osha', 'mechanical engineering', 'electrical engineering', 'civil engineering',
      'chemical engineering', 'industrial engineering', 'manufacturing', 'assembly',
      'blueprint reading', 'product design', 'testing', 'calibration', 'troubleshooting',
      'instrumentation', 'lean', 'continuous improvement', 'machine operation',
    ],
  },
  {
    category: 'Skilled Trades & Construction',
    skills: [
      'carpentry', 'plumbing', 'electrical', 'hvac', 'masonry', 'painting', 'drywall',
      'roofing', 'concrete', 'framing', 'power tools', 'hand tools', 'construction safety',
      'osha 10', 'osha 30', 'heavy equipment', 'forklift', 'crane operation', 'pipefitting',
      'soldering', 'installation', 'repair', 'site supervision', 'estimating', 'welding',
      'sheet metal', 'landscaping', 'demolition', 'concrete finishing', 'cabinet making',
      'appliance repair', 'maintenance technician', 'mechanical repair', 'preventive maintenance',
    ],
  },
  {
    category: 'Transportation & Logistics',
    skills: [
      'cdl', 'class a cdl', 'class b cdl', 'driving', 'delivery', 'route planning', 'dispatch',
      'warehouse', 'inventory management', 'forklift', 'pallet jack', 'shipping', 'receiving',
      'logistics', 'freight', 'courier', 'dot regulations', 'order picking', 'packing',
      'loading', 'unloading', 'gps navigation', 'fleet management', 'supply chain management',
      'warehouse operations', 'hazmat', 'transportation', 'material handling', 'stocking',
    ],
  },
  {
    category: 'Administrative & Office',
    skills: [
      'data entry', 'scheduling', 'calendar management', 'filing', 'records management',
      'office administration', 'reception', 'typing', 'transcription', 'email correspondence',
      'travel arrangements', 'meeting coordination', 'expense reports', 'front office',
      'clerical', 'documentation', 'microsoft office', 'excel', 'word', 'powerpoint', 'outlook',
      'sharepoint', 'google workspace', 'office management', 'administrative support',
      'phone systems', 'minutes taking', 'document management', 'report preparation',
    ],
  },
  {
    category: 'Human Resources',
    skills: [
      'recruiting', 'talent acquisition', 'onboarding', 'employee relations',
      'hr policies', 'benefits administration', 'compensation', 'hris', 'workday',
      'interviewing', 'training and development', 'employee engagement', 'labor relations',
      'applicant tracking system', 'sourcing', 'payroll', 'performance reviews',
      'hr compliance', 'talent management', 'employee onboarding', 'compensation analysis',
      'workforce development', 'succession planning', 'diversity and inclusion',
    ],
  },
  {
    category: 'Legal & Compliance',
    skills: [
      'legal research', 'litigation', 'contract drafting', 'contract review', 'legal writing',
      'case management', 'westlaw', 'lexisnexis', 'paralegal', 'compliance', 'corporate law',
      'intellectual property', 'due diligence', 'discovery', 'court filings', 'client intake',
      'depositions', 'regulatory compliance', 'gdpr', 'legal documentation', 'legal analysis',
      'legal advising', 'mergers and acquisitions', 'regulatory affairs', 'policy development',
      'contract management', 'risk assessment', 'investigations', 'legal counsel',
    ],
  },
  {
    category: 'Hospitality & Food Service',
    skills: [
      'food preparation', 'culinary', 'cooking', 'baking', 'bartending', 'barista',
      'food safety', 'servsafe', 'haccp', 'waitstaff', 'hosting', 'cash handling',
      'kitchen management', 'menu planning', 'inventory', 'sanitation', 'pos systems',
      'restaurant management', 'catering', 'housekeeping', 'concierge', 'banquet',
      'food handling', 'customer service', 'table service', 'kitchen operations',
      'hotel management', 'front desk', 'guest services', 'food service',
    ],
  },
  {
    category: 'Retail',
    skills: [
      'cash handling', 'pos systems', 'merchandising', 'inventory management', 'stocking',
      'customer service', 'upselling', 'visual merchandising', 'store operations',
      'loss prevention', 'returns', 'product knowledge', 'inventory counts', 'retail sales',
      'customer engagement', 'point of sale', 'store management', 'sales floor',
      'inventory control', 'planogram', 'shrinkage control',
    ],
  },
  {
    category: 'Social Work & Community Services',
    skills: [
      'case management', 'crisis intervention', 'counseling', 'client advocacy',
      'community outreach', 'resource referral', 'service plans', 'child welfare',
      'mental health', 'substance abuse', 'group facilitation', 'mandated reporting',
      'trauma-informed care', 'social services', 'individualized service plans',
      'behavioral health', 'family services', 'crisis management', 'client assessment',
      'community resources', 'psychosocial assessment', 'support planning',
    ],
  },
  {
    category: 'Science & Research',
    skills: [
      'research', 'data analysis', 'laboratory', 'microscopy', 'pcr', 'gel electrophoresis',
      'lab safety', 'specimen processing', 'clinical research', 'statistical analysis',
      'spss', 'matlab', 'r', 'experimental design', 'peer review', 'grant writing', 'biology',
      'chemistry', 'physics', 'biochemistry', 'microbiology', 'assay development',
      'scientific writing', 'research methodology', 'data collection', 'lab techniques',
      'quality control', 'protocol development', 'laboratory techniques', 'wet lab',
    ],
  },
  {
    category: 'Creative & Design',
    skills: [
      'graphic design', 'photoshop', 'illustrator', 'indesign', 'adobe creative suite',
      'ui design', 'ux design', 'branding', 'typography', 'layout design', 'illustration',
      'animation', 'video editing', 'premiere pro', 'after effects', 'photography',
      'sketching', 'wireframing', 'prototyping', 'creative direction', 'art direction',
      'visual design', 'motion graphics', 'print design', 'color theory', 'design systems',
    ],
  },
  {
    category: 'Media & Communications',
    skills: [
      'journalism', 'copywriting', 'editing', 'proofreading', 'content creation',
      'social media', 'press releases', 'storytelling', 'interviewing', 'reporting',
      'broadcasting', 'video production', 'audio editing', 'podcast production',
      'scriptwriting', 'ap style', 'public relations', 'media relations', 'content strategy',
      'social media management', 'copy editing', 'communication strategy', 'editorial',
    ],
  },
  {
    category: 'Government & Public Safety',
    skills: [
      'law enforcement', 'emergency response', 'firefighting', 'emt', 'paramedic',
      'dispatching', 'incident reporting', 'patrol', 'investigation', 'security clearance',
      'public administration', 'policy analysis', 'code enforcement', 'emergency management',
      'military', 'report writing', 'public safety', 'crisis response', 'case investigation',
      'regulatory enforcement', 'government relations', 'emergency preparedness',
    ],
  },
  {
    category: 'Security & Protective Services',
    skills: [
      'security', 'surveillance', 'access control', 'patrol', 'incident reporting', 'cctv',
      'loss prevention', 'emergency response', 'conflict de-escalation', 'security clearance',
      'crowd control', 'investigations', 'risk mitigation', 'security operations',
      'bag screening', 'safety inspections', 'emergency procedures', 'physical security',
    ],
  },
  {
    category: 'Agriculture & Environment',
    skills: [
      'agriculture', 'farming', 'crop management', 'livestock', 'soil science', 'irrigation',
      'pest control', 'agricultural machinery', 'horticulture', 'forestry',
      'environmental science', 'sustainability', 'conservation', 'waste management',
      'water quality', 'recycling', 'gis', 'environmental compliance', 'crop production',
      'animal husbandry', 'sustainable agriculture', 'environmental monitoring',
    ],
  },
  {
    category: 'Fitness & Wellness',
    skills: [
      'personal training', 'group fitness', 'nutrition', 'exercise prescription', 'aed',
      'kinesiology', 'strength training', 'yoga', 'pilates', 'wellness coaching',
      'health coaching', 'injury prevention', 'anatomy', 'fitness assessment',
      'strength and conditioning', 'athletic training', 'physical therapy',
      'customer service', 'class instruction', 'wellness programs',
    ],
  },
  {
    category: 'Real Estate & Insurance',
    skills: [
      'real estate', 'property management', 'leasing', 'appraisal', 'escrow', 'mls',
      'underwriting', 'claims processing', 'insurance', 'policy analysis', 'risk assessment',
      'client relations', 'property inspection', 'tenant relations', 'sales',
      'customer service', 'negotiation', 'title processing', 'mortgage', 'claims handling',
      'insurance sales', 'brokerage',
    ],
  },
  {
    category: 'Veterinary & Animal Care',
    skills: [
      'veterinary', 'animal care', 'animal handling', 'veterinary technician',
      'surgery assistance', 'kennel', 'grooming', 'vaccinations', 'lab work',
      'client education', 'anesthesia', 'animal nutrition', 'patient care',
      'veterinary medicine', 'animal science', 'pet care',
    ],
  },
  {
    category: 'Pharmacy',
    skills: [
      'pharmacy', 'pharmacology', 'prescription processing', 'medication dispensing',
      'patient counseling', 'inventory management', 'insurance billing',
      'sterile compounding', 'drug interactions', 'pharmacy technician', 'medication therapy',
      'pharmaceutical', 'prescription verification', 'pharmacy operations',
    ],
  },
  {
    category: 'Soft & Transferable Skills',
    skills: [
      'leadership', 'communication', 'teamwork', 'team work', 'problem-solving', 'problem solving',
      'analytical', 'mentoring', 'collaboration', 'presentation', 'negotiation',
      'critical thinking', 'time management', 'adaptability', 'creativity', 'attention to detail',
      'organization', 'multitasking', 'interpersonal skills', 'decision making', 'work ethic',
      'reliability', 'flexibility', 'patience', 'empathy', 'professionalism', 'supervision',
      'training', 'planning', 'coordination', 'written communication', 'verbal communication',
      'customer focus', 'detail oriented', 'self-motivated', 'fast-paced environment',
      'conflict management', 'resourcefulness', 'initiative', 'accountability',
    ],
  },
];

const seenSkills = new Set<string>();
export const ALL_SKILLS: string[] = [];
for (const group of SKILL_CATEGORIES) {
  for (const skill of group.skills) {
    const key = skill.toLowerCase();
    if (!seenSkills.has(key)) {
      seenSkills.add(key);
      ALL_SKILLS.push(key);
    }
  }
}

const skillCategoryMap = new Map<string, string>();
for (const group of SKILL_CATEGORIES) {
  for (const skill of group.skills) {
    const key = skill.toLowerCase();
    if (!skillCategoryMap.has(key)) {
      skillCategoryMap.set(key, group.category);
    }
  }
}

export function getSkillCategory(skill: string): string {
  return skillCategoryMap.get(skill.trim().toLowerCase()) || 'General';
}

// Matches a skill term on non-word boundaries so symbols work: c++, c#, .net, p&l, 5s.
export function skillPattern(term: string): RegExp {
  const escaped = term.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'gi');
}

export function countSkillMentions(text: string, term: string): number {
  if (!text) return 0;
  const matches = text.match(skillPattern(term));
  return matches ? matches.length : 0;
}

// Certifications, licences and credentials across industries.
export const CERTIFICATION_KEYWORDS: string[] = [
  // Healthcare
  'registered nurse', 'rn license', 'licensed practical nurse', 'lpn', 'lvn',
  'certified nursing assistant', 'cna', 'nurse practitioner', 'aprn', 'pharmd',
  'paramedic', 'emt', 'acls', 'bls', 'pals', 'cpr certified', 'medical assistant',
  'cma', 'radiologic technologist', 'respiratory therapist', 'physical therapist',
  'occupational therapist', 'clinical social worker', 'lcsw', 'lmsw', 'lmft', 'lpc',
  // Trades & safety
  'osha 10', 'osha 30', 'forklift certification', 'cdl', 'class a cdl', 'class b cdl',
  'epa 608', 'hvac certification', 'welding certification', 'servsafe', 'food handler',
  'food safety certification', 'cosmetology license', 'barber license',
  'electrical license', 'plumbing license', 'contractor license',
  // Education
  'teaching license', 'teaching certification', 'state certification', 'praxis',
  'tefl', 'tesol', 'celta', 'early childhood certification', 'special education certification',
  // Business & finance
  'pmp', 'project management professional', 'capm', 'csm', 'psm', 'scrum master',
  'six sigma', 'lean six sigma', 'six sigma green belt', 'six sigma black belt',
  'cpa', 'cfa', 'cma certification', 'cfp', 'series 7', 'series 63', 'series 65',
  'life insurance license', 'property and casualty license', 'notary',
  'certified payroll professional', 'shrm', 'phr', 'sphr',
  // Legal
  'bar exam', 'bar admission', 'paralegal certificate', 'certified paralegal',
  // Tech
  'aws certified', 'azure certified', 'gcp certified', 'google certified',
  'microsoft certified', 'comptia', 'cissp', 'ceh', 'itil', 'ccna', 'ccnp',
  'kubernetes certified', 'cka', 'ckad', 'salesforce certified', 'oracle certified',
  'quickbooks certified', 'tableau certified', 'hubspot certified', 'google ads certified',
  // Real estate / other
  'real estate license', 'realtor certification', 'insurance license',
  'security clearance', 'first aid certification', 'notary public',
];

// Domains that represent a professional portfolio or public evidence of work.
export const PORTFOLIO_DOMAINS: string[] = [
  'github.com', 'gitlab.com', 'bitbucket.org', 'behance.net', 'dribbble.com',
  'medium.com', 'kaggle.com', 'stackoverflow.com', 'orcid.org', 'researchgate.net',
  'artstation.com', 'vimeo.com', 'youtube.com', 'soundcloud.com', 'issuu.com',
];

export const SOCIAL_DOMAINS: string[] = [
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com', 'snapchat.com',
];
