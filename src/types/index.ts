export type UserRole = 'candidate' | 'recruiter' | 'admin';

export type AnalysisStatus = 'pending' | 'parsing' | 'analyzing' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface ParsedResume {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  status: AnalysisStatus;
  version: number;
  
  candidate: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary?: string;
    links: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
      other: string[];
    };
  };
  
  education: EducationEntry[];
  experience: ExperienceEntry[];
  internships: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  achievements: AchievementEntry[];
  publications: PublicationEntry[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string[];
  coursework?: string[];
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location?: string;
  responsibilities: string[];
  technologies: string[];
  achievements: string[];
  metrics: MetricClaim[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  problem?: string;
  solution?: string;
  technologies: string[];
  role?: string;
  features: string[];
  metrics: MetricClaim[];
  deployment?: string;
  github?: string;
  demo?: string;
  users?: string;
  architecture?: string;
  depthScore: number;
}

export interface SkillEntry {
  id: string;
  name: string;
  category: string;
  claimed: boolean;
  evidence: SkillEvidence[];
  confidence: 'high' | 'medium' | 'low' | 'none';
  supportLevel: 'supported' | 'weakly_supported' | 'unsupported' | 'claimed';
}

export interface SkillEvidence {
  source: string;
  type: 'project' | 'experience' | 'internship' | 'certification' | 'coursework' | 'skill_section';
  context: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  description: string;
  date?: string;
  organization?: string;
}

export interface PublicationEntry {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  date: string;
  url?: string;
  doi?: string;
}

export interface MetricClaim {
  id: string;
  claim: string;
  value: number;
  unit: string;
  context: string;
  supportLevel: 'high' | 'medium' | 'low';
  verification: string;
}

export interface ResumeScore {
  overall: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  atsCompatibility: ScoreComponent;
  skillRelevance: ScoreComponent;
  experienceEvidence: ScoreComponent;
  projectStrength: ScoreComponent;
  quantification: ScoreComponent;
  consistency: ScoreComponent;
  credibility: ScoreComponent;
  readability: ScoreComponent;
}

export interface ScoreComponent {
  score: number;
  maxScore: number;
  explanation: string;
  evidence: string[];
  recommendation: string;
}

export interface ATSAnalysis {
  score: number;
  keywords: {
    found: string[];
    missing: string[];
    density: Record<string, number>;
  };
  sections: {
    present: string[];
    missing: string[];
    order: string[];
  };
  formatting: {
    hasColumns: boolean;
    hasTables: boolean;
    hasImages: boolean;
    hasSpecialChars: boolean;
    issues: string[];
  };
  contactInfo: {
    email: boolean;
    phone: boolean;
    location: boolean;
    linkedin: boolean;
    github: boolean;
    portfolio: boolean;
  };
  length: {
    pages: number;
    words: number;
    appropriate: boolean;
  };
  dateConsistency: {
    consistent: boolean;
    issues: string[];
  };
}

export interface ResumeVersion {
  id: string;
  versionNumber: number;
  uploadedAt: Date;
  score: number;
  atsScore: number;
  skillEvidenceScore: number;
  verificationScore: number;
  changes?: VersionChange[];
}

export interface VersionChange {
  type: 'added' | 'removed' | 'modified';
  category: string;
  description: string;
  details?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  requirements: string[];
  skills: string[];
  experience: string;
  location?: string;
  salary?: string;
  postedAt?: Date;
}

export interface CandidateMatch {
  resumeId: string;
  jobDescriptionId: string;
  matchScore: number;
  skillMatch: {
    matched: string[];
    missing: string[];
    additional: string[];
  };
  experienceMatch: {
    yearsRequired: number;
    yearsFound: number;
    relevant: boolean;
  };
  recommendations: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

export interface PlatformStats {
  totalResumes: number;
  totalUsers: number;
  analysesToday: number;
  averageScore: number;
  topIndustries: { industry: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
}
