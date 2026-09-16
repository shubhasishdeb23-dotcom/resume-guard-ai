export type VerificationStatus = 'supported' | 'needs_verification' | 'suspicious' | 'unverified';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ClaimType = 
  | 'employment' 
  | 'skill' 
  | 'achievement' 
  | 'metric' 
  | 'project' 
  | 'leadership' 
  | 'education' 
  | 'certification';

export type RuleId = 
  | 'RULE-001'
  | 'RULE-002'
  | 'RULE-003'
  | 'RULE-004'
  | 'RULE-005'
  | 'RULE-006'
  | 'RULE-007'
  | 'RULE-008'
  | 'RULE-009'
  | 'RULE-010'
  | 'RULE-011';

export interface Claim {
  id: string;
  claim: string;
  type: ClaimType;
  source: string;
  sourceLine?: number;
  evidenceFound: EvidenceItem[];
  supportingSections: string[];
  evidenceStrength: number;
  verificationStatus: VerificationStatus;
  riskLevel: RiskLevel;
  missingEvidence: string[];
  suggestedQuestions: string[];
}

export interface EvidenceItem {
  id: string;
  type: 'project' | 'experience' | 'skill_section' | 'achievement' | 'certification' | 'education' | 'external';
  source: string;
  description: string;
  strength: 'strong' | 'medium' | 'weak';
  url?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'employment' | 'education' | 'internship' | 'project' | 'gap';
  title: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  rawData: Record<string, unknown>;
}

export interface TimelineIssue {
  id: string;
  type: 'overlap' | 'gap' | 'impossible' | 'inconsistency' | 'duplicate';
  severity: RiskLevel;
  events: TimelineEvent[];
  description: string;
  recommendation: string;
}

export interface MetricClaim {
  id: string;
  claim: string;
  value: number;
  unit: string;
  context: string;
  hasBaseline: boolean;
  hasMethod: boolean;
  hasProject: boolean;
  hasTimeframe: boolean;
  hasTechnology: boolean;
  supportLevel: 'high' | 'medium' | 'low';
  verification: string;
}

export interface VerificationRule {
  id: RuleId;
  name: string;
  description: string;
  severity: RiskLevel;
  triggered: boolean;
  evidence: string[];
  recommendation: string;
}

export interface ProjectCredibility {
  projectId: string;
  projectName: string;
  hasProblem: boolean;
  hasImplementation: boolean;
  hasTechnology: boolean;
  hasRole: boolean;
  hasArchitecture: boolean;
  hasDeployment: boolean;
  hasUsers: boolean;
  hasMetrics: boolean;
  hasGitHub: boolean;
  hasDemo: boolean;
  credibilityScore: number;
  status: VerificationStatus;
  flags: string[];
}

export interface CertificationCheck {
  id: string;
  name: string;
  issuer: string;
  date: string;
  hasCredentialId: boolean;
  hasLink: boolean;
  credentialUrl?: string;
  status: 'verified' | 'link_unavailable' | 'not_provided' | 'partial';
}

export interface LanguageAnalysis {
  genericBuzzwords: string[];
  repetitivePhrases: string[];
  templatedSections: string[];
  polishedClaims: string[];
  meaninglessAdjectives: string[];
  overallScore: number;
  findings: string[];
}

export interface VerificationResult {
  id: string;
  resumeId: string;
  timestamp: Date;
  
  overallEvidenceScore: number;
  claimAnalysis: Claim[];
  timelineAnalysis: {
    events: TimelineEvent[];
    issues: TimelineIssue[];
  };
  skillVerification: {
    skillId: string;
    skillName: string;
    mentionCount: number;
    evidenceSources: string[];
    status: VerificationStatus;
    evidenceScore: number;
  }[];
  metricAnalysis: MetricClaim[];
  projectCredibility: ProjectCredibility[];
  certificationChecks: CertificationCheck[];
  languageAnalysis: LanguageAnalysis;
  triggeredRules: VerificationRule[];
  
  summary: {
    supported: number;
    needsVerification: number;
    suspicious: number;
    unverified: number;
  };
  
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  details: Record<string, unknown>;
}

export interface VersionComparison {
  previousVersion: number;
  currentVersion: number;
  newClaims: Claim[];
  removedClaims: Claim[];
  modifiedClaims: {
    previous: Claim;
    current: Claim;
    change: string;
  }[];
  newMajorClaims: Claim[];
  scoreChange: {
    overall: number;
    evidence: number;
  };
}

export interface ResumeEvidenceHealth {
  strongEvidence: number;
  needsVerification: number;
  suspiciousSignals: number;
  notEnoughEvidence: number;
  summary: string;
}
