export interface JobDescription {
  id: string;
  title: string;
  company: string;
  location?: string;
  employmentType?: string;
  salary?: string;
  postedAt?: Date;
  rawText: string;
  extracted: {
    requiredSkills: string[];
    preferredSkills: string[];
    technologies: string[];
    experience: {
      years: number;
      level: 'entry' | 'mid' | 'senior' | 'executive';
      description: string;
    };
    education: {
      degree: string;
      field: string;
      required: boolean;
    }[];
    responsibilities: string[];
    certifications: string[];
    domainRequirements: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidateMatch {
  id: string;
  resumeId: string;
  jobId: string;
  overallFit: number;
  skillMatch: {
    score: number;
    matched: string[];
    missing: string[];
    additional: string[];
    details: {
      skill: string;
      required: boolean;
      found: boolean;
      evidence: string;
    }[];
  };
  experienceMatch: {
    score: number;
    yearsRequired: number;
    yearsFound: number;
    relevant: boolean;
    gap: number;
    details: string;
  };
  projectMatch: {
    score: number;
    relevantProjects: string[];
    technologiesMatched: string[];
    details: string;
  };
  educationMatch: {
    score: number;
    meetsRequirement: boolean;
    details: string;
  };
  evidenceMatch: {
    score: number;
    strongEvidence: number;
    weakEvidence: number;
    suspiciousSignals: number;
  };
  missingRequirements: string[];
  recommendedVerification: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: 'strong_match' | 'potential_match' | 'needs_verification' | 'weak_match';
  recommendationReason: string;
  analyzedAt: Date;
}

export interface CandidateProfile {
  id: string;
  resumeId: string;
  name: string;
  email: string;
  summary: string;
  yearsExperience: number;
  topSkills: string[];
  education: string;
  experience: string;
  overallScore: number;
  evidenceScore: number;
  skillDepthScore?: number;
  atsScore: number;
  skillMatch: number;
  riskSignals: number;
  verificationStatus: 'verified' | 'pending' | 'flagged';
  uploadedAt: Date;
  status: 'new' | 'analyzing' | 'analyzed' | 'reviewing' | 'decided';
  shortlisted?: boolean;
  decision?: RecruiterDecision;
}

export interface RecruiterDecision {
  id: string;
  candidateId: string;
  jobId: string;
  decision: 'strong_match' | 'needs_interview' | 'needs_verification' | 'not_suitable';
  notes: string;
  decidedAt: Date;
  decidedBy: string;
}

export interface ComparisonMatrix {
  candidates: CandidateProfile[];
  categories: {
    name: string;
    values: number[];
    highlights: string[];
  }[];
  summary: string;
  recommendation: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'technical' | 'behavioral' | 'verification' | 'experience' | 'credential';
  claim: string;
  question: string;
  followUp: string[];
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ChallengeReport {
  topStrongClaims: { claim: string; evidence: string }[];
  topWeakClaims: { claim: string; missing: string }[];
  technicalQuestions: InterviewQuestion[];
  behavioralQuestions: InterviewQuestion[];
  credentialQuestions?: InterviewQuestion[];
  weakestEvidenceAreas: string[];
  possibleContradictions: string[];
}

export interface RecruiterReport {
  id: string;
  candidateId: string;
  jobId: string;
  generatedAt: Date;
  sections: {
    candidateOverview: {
      name: string;
      summary: string;
      yearsExperience: number;
      topSkills: string[];
    };
    jobFit: {
      score: number;
      analysis: string;
    };
    skillEvidence: {
      score: number;
      details: string[];
    };
    experienceEvidence: {
      score: number;
      details: string[];
    };
    verificationFindings: {
      strongEvidence: string[];
      weakEvidence: string[];
      suspiciousSignals: string[];
    };
    missingRequirements: string[];
    interviewQuestions: InterviewQuestion[];
    overallRecommendation: {
      recommendation: string;
      reason: string;
    };
  };
}

export interface DashboardAnalytics {
  totalCandidates: number;
  averageFit: number;
  averageEvidence: number;
  needsVerification: number;
  highRiskSignals: number;
  topSkills: { skill: string; count: number }[];
  missingSkills: { skill: string; count: number }[];
  decisionDistribution: { decision: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
}

export interface DemoCandidate {
  id: string;
  name: string;
  profile: CandidateProfile;
  resume: any;
  match: CandidateMatch;
  challenges: ChallengeReport;
}
