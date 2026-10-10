import { ParsedResume } from '../types';
import {
  Claim,
  EvidenceItem,
  TimelineEvent,
  TimelineIssue,
  MetricClaim,
  VerificationRule,
  ProjectCredibility,
  CertificationCheck,
  LanguageAnalysis,
  VerificationResult,
  VerificationStatus,
  RiskLevel,
  RuleId,
} from '../types/verification';

const GENERIC_BUZZWORDS = [
  'synergy', 'leverage', 'proactive', 'dynamic', 'innovative',
  'cutting-edge', 'best-in-class', 'world-class', 'game-changing',
  'disruptive', 'scalable', 'robust', 'seamless', 'end-to-end',
  'full-stack', 'results-driven', 'detail-oriented', 'passionate',
  'motivated', 'team player', 'self-starter', 'go-getter',
];

const MEANINGLESS_ADJECTIVES = [
  'amazing', 'incredible', 'fantastic', 'excellent', 'outstanding',
  'exceptional', 'remarkable', 'extraordinary', 'phenomenal',
];

export function runVerificationEngine(resume: ParsedResume): VerificationResult {
  const claims = analyzeClaims(resume);
  const timelineAnalysis = analyzeTimeline(resume);
  const skillVerification = verifySkills(resume);
  const metricAnalysis = analyzeMetrics(resume);
  const projectCredibility = analyzeProjectCredibility(resume);
  const certificationChecks = checkCertifications(resume);
  const languageAnalysis = analyzeLanguage(resume);
  const triggeredRules = runRuleEngine(resume, claims, timelineAnalysis.issues);
  
  const summary = calculateSummary(claims);
  const overallEvidenceScore = calculateOverallEvidenceScore(
    claims,
    skillVerification,
    projectCredibility,
    metricAnalysis
  );
  
  return {
    id: `verification_${Date.now()}`,
    resumeId: resume.id,
    timestamp: new Date(),
    overallEvidenceScore,
    claimAnalysis: claims,
    timelineAnalysis,
    skillVerification,
    metricAnalysis,
    projectCredibility,
    certificationChecks,
    languageAnalysis,
    triggeredRules,
    summary,
    auditTrail: [{
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      action: 'verification_completed',
      details: { claimsAnalyzed: claims.length, rulesTriggered: triggeredRules.filter(r => r.triggered).length },
    }],
  };
}

function analyzeClaims(resume: ParsedResume): Claim[] {
  const claims: Claim[] = [];
  
  resume.experience.forEach(exp => {
    exp.responsibilities.forEach((resp, idx) => {
      const claim = parseClaim(resp, 'employment', exp.company);
      claim.evidenceFound = findEvidenceForClaim(resp, resume, exp);
      claim.evidenceStrength = calculateEvidenceStrength(claim.evidenceFound);
      claim.verificationStatus = determineVerificationStatus(claim.evidenceStrength);
      claim.riskLevel = determineRiskLevel(claim.evidenceStrength, claim.type);
      claim.missingEvidence = identifyMissingEvidence(claim);
      claim.suggestedQuestions = generateVerificationQuestions(claim);
      claims.push(claim);
    });
    
    exp.achievements.forEach(ach => {
      const claim = parseClaim(ach, 'achievement', exp.company);
      claim.evidenceFound = findEvidenceForClaim(ach, resume, exp);
      claim.evidenceStrength = calculateEvidenceStrength(claim.evidenceFound);
      claim.verificationStatus = determineVerificationStatus(claim.evidenceStrength);
      claim.riskLevel = determineRiskLevel(claim.evidenceStrength, claim.type);
      claim.missingEvidence = identifyMissingEvidence(claim);
      claim.suggestedQuestions = generateVerificationQuestions(claim);
      claims.push(claim);
    });
  });
  
  resume.projects.forEach(proj => {
    if (proj.description) {
      const claim = parseClaim(proj.description, 'project', proj.name);
      claim.evidenceFound = findProjectEvidence(proj);
      claim.evidenceStrength = calculateEvidenceStrength(claim.evidenceFound);
      claim.verificationStatus = determineVerificationStatus(claim.evidenceStrength);
      claim.riskLevel = determineRiskLevel(claim.evidenceStrength, claim.type);
      claim.missingEvidence = identifyMissingEvidence(claim);
      claim.suggestedQuestions = generateVerificationQuestions(claim);
      claims.push(claim);
    }
  });
  
  return claims;
}

function parseClaim(text: string, type: string, source: string): Claim {
  const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: claimId,
    claim: text,
    type: type as Claim['type'],
    source,
    evidenceFound: [],
    supportingSections: [],
    evidenceStrength: 0,
    verificationStatus: 'unverified',
    riskLevel: 'medium',
    missingEvidence: [],
    suggestedQuestions: [],
  };
}

function findEvidenceForClaim(claimText: string, resume: ParsedResume, context: any): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  const claimLower = claimText.toLowerCase();
  
  resume.skills.forEach(skill => {
    if (claimLower.includes(skill.name.toLowerCase())) {
      evidence.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'skill_section',
        source: 'Skills section',
        description: `${skill.name} listed with ${skill.evidence.length} evidence sources`,
        strength: skill.supportLevel === 'supported' ? 'strong' : skill.supportLevel === 'weakly_supported' ? 'medium' : 'weak',
      });
    }
  });
  
  resume.projects.forEach(proj => {
    proj.technologies.forEach(tech => {
      if (claimLower.includes(tech.toLowerCase())) {
        evidence.push({
          id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'project',
          source: proj.name,
          description: `Skill/tool ${tech} used in project`,
          strength: 'medium',
          url: proj.github || proj.demo,
        });
      }
    });
  });
  
  if (context.technologies) {
    context.technologies.forEach((tech: string) => {
      if (claimLower.includes(tech.toLowerCase())) {
        evidence.push({
          id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'experience',
          source: context.company || context.role,
          description: `Skill/tool ${tech} used in this role`,
          strength: 'strong',
        });
      }
    });
  }
  
  return evidence;
}

function findProjectEvidence(project: any): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  
  const publicLink = project.github || project.demo;
  if (publicLink) {
    evidence.push({
      id: `ev_${Date.now()}_link`,
      type: 'external',
      source: 'Public link',
      description: 'Public portfolio, repository or demo available',
      strength: 'strong',
      url: publicLink,
    });
  }
  
  if (project.technologies && project.technologies.length > 0) {
    evidence.push({
      id: `ev_${Date.now()}_tech`,
      type: 'project',
      source: project.name,
      description: `${project.technologies.length} skills/tools listed`,
      strength: 'medium',
    });
  }
  
  if (project.metrics && project.metrics.length > 0) {
    evidence.push({
      id: `ev_${Date.now()}_metrics`,
      type: 'achievement',
      source: project.name,
      description: 'Quantified metrics provided',
      strength: 'medium',
    });
  }
  
  return evidence;
}

function calculateEvidenceStrength(evidence: EvidenceItem[]): number {
  if (evidence.length === 0) return 0;
  
  const strengthMap = { strong: 100, medium: 60, weak: 30 };
  const totalStrength = evidence.reduce((sum, ev) => sum + strengthMap[ev.strength], 0);
  
  return Math.min(Math.round(totalStrength / evidence.length), 100);
}

function determineVerificationStatus(strength: number): VerificationStatus {
  if (strength >= 70) return 'supported';
  if (strength >= 40) return 'needs_verification';
  if (strength >= 20) return 'suspicious';
  return 'unverified';
}

function determineRiskLevel(strength: number, type: string): RiskLevel {
  if (strength >= 70) return 'low';
  if (strength >= 40) return 'medium';
  if (type === 'leadership' || type === 'achievement') return 'high';
  return 'medium';
}

function identifyMissingEvidence(claim: Claim): string[] {
  const missing: string[] = [];
  const claimLower = claim.claim.toLowerCase();
  
  if (/\d+%|\d[\d,]*\+?\s*(?:users?|customers?|clients?|patients?|students?|people|employees?|staff|members?|team|engineers?|nurses?|hours?|days?|weeks?|months?|years?|revenue|sales|units?|tickets?|cases?|accounts?|orders?|transactions?|visits?|events?)/i.test(claim.claim)) {
    if (!claim.evidenceFound.some(e => e.type === 'achievement' && e.description.includes('quantified'))) {
      missing.push('Quantified metric lacks supporting project context');
    }
  }
  
  if (/led|managed|supervised|head of|director/i.test(claim.claim)) {
    if (!claim.evidenceFound.some(e => e.type === 'experience' && e.description.includes('team'))) {
      missing.push('Leadership claim lacks team size evidence');
    }
  }
  
  if (/built|developed|created|designed|implemented/i.test(claim.claim)) {
    if (!claim.evidenceFound.some(e => e.type === 'project')) {
      missing.push('Technical claim lacks project evidence');
    }
  }
  
  return missing;
}

function generateVerificationQuestions(claim: Claim): string[] {
  const questions: string[] = [];
  const claimLower = claim.claim.toLowerCase();
  
  if (/led|managed|supervised/i.test(claim.claim)) {
    questions.push('Can you describe your specific leadership responsibilities?');
    questions.push('How many people reported directly to you?');
  }
  
  if (/\d+%/.test(claim.claim)) {
    questions.push('How was this metric measured?');
    questions.push('What was the baseline before the improvement?');
    questions.push('What timeframe does this cover?');
  }
  
  if (/built|developed|created/i.test(claim.claim) && !claim.evidenceFound.some(e => e.url)) {
    questions.push('Is there a public work sample (repository, portfolio, case study or publication) available?');
  }
  
  return questions;
}

function analyzeTimeline(resume: ParsedResume): { events: TimelineEvent[]; issues: TimelineIssue[] } {
  const events: TimelineEvent[] = [];
  const issues: TimelineIssue[] = [];
  
  resume.experience.forEach(exp => {
    events.push({
      id: `event_${exp.id}`,
      type: 'employment',
      title: exp.role,
      organization: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate ?? null,
      current: exp.current,
      rawData: { ...exp },
    });
  });
  
  resume.internships.forEach(intern => {
    events.push({
      id: `event_${intern.id}`,
      type: 'internship',
      title: intern.role,
      organization: intern.company,
      startDate: intern.startDate,
      endDate: intern.endDate ?? null,
      current: intern.current,
      rawData: { ...intern },
    });
  });
  
  resume.education.forEach(edu => {
    events.push({
      id: `event_${edu.id}`,
      type: 'education',
      title: `${edu.degree} in ${edu.field}`,
      organization: edu.institution,
      startDate: edu.startDate,
      endDate: edu.endDate ?? null,
      current: false,
      rawData: { ...edu },
    });
  });
  
  events.sort((a, b) => parseMonthKey(b.startDate) - parseMonthKey(a.startDate));

  const workEvents = events.filter(e => e.type === 'employment' || e.type === 'internship');

  for (let i = 0; i < workEvents.length - 1; i++) {
    for (let j = i + 1; j < workEvents.length; j++) {
      const early = workEvents[i];
      const late = workEvents[j];
      if (early.endDate && late.startDate) {
        const earlyEnd = parseMonthKey(early.endDate);
        const lateStart = parseMonthKey(late.startDate);
        if (isFinite(earlyEnd) && isFinite(lateStart) && earlyEnd > lateStart) {
          issues.push({
            id: `issue_overlap_${Date.now()}_${i}_${j}`,
            type: 'overlap',
            severity: 'medium',
            events: [early, late],
            description: `Timeline overlap detected: ${early.organization} (${early.startDate} - ${early.endDate}) overlaps with ${late.organization} (${late.startDate} - ${late.endDate})`,
            recommendation: 'Clarify if these were concurrent positions or if dates need correction.',
          });
        }
      }
    }
  }

  const ascending = [...workEvents].sort((a, b) => parseMonthKey(a.startDate) - parseMonthKey(b.startDate));
  for (let i = 0; i < ascending.length - 1; i++) {
    const earlier = ascending[i];
    const later = ascending[i + 1];
    if (earlier.endDate && later.startDate) {
      const earlierEnd = parseMonthKey(earlier.endDate);
      const laterStart = parseMonthKey(later.startDate);
      if (isFinite(earlierEnd) && isFinite(laterStart) && earlierEnd < laterStart) {
        const gapMonths = laterStart - earlierEnd;
        if (gapMonths > 3) {
          issues.push({
            id: `issue_gap_${Date.now()}_${i}`,
            type: 'gap',
            severity: gapMonths > 12 ? 'high' : 'medium',
            events: [earlier, later],
            description: `Employment gap of ~${gapMonths} months between ${earlier.organization} (${earlier.startDate} - ${earlier.endDate}) and ${later.organization} (${later.startDate} - ${later.endDate})`,
            recommendation: 'Ask the candidate to account for this gap (study, freelance, travel, etc.).',
          });
        }
      }
    }
  }

  const allEntries = [...resume.experience, ...resume.internships, ...resume.education] as Array<{
    company?: string;
    institution?: string;
    role?: string;
    current?: boolean;
    startDate: string;
    endDate?: string;
  }>;

  allEntries.forEach(entry => {
    const org = (entry.company || entry.institution || entry.role) || 'entry';
    if (entry.startDate && entry.endDate && !entry.current) {
      const start = parseMonthKey(entry.startDate);
      const end = parseMonthKey(entry.endDate);
      if (isFinite(start) && isFinite(end) && end < start) {
        issues.push({
          id: `issue_impossible_${Date.now()}_${org}`,
          type: 'impossible',
          severity: 'critical',
          events: [],
          description: `Impossible date range: ${org} starts ${entry.startDate} but ends ${entry.endDate}`,
          recommendation: 'Dates must not end before they begin — confirm the real dates with the candidate.',
        });
      }
    }
  });

  return { events, issues };
}

function parseMonthKey(dateStr: string): number {
  const parts = String(dateStr || '').trim().split('-').map(Number);
  if (!parts[0] || isNaN(parts[0])) return NaN;
  return parts[0] * 12 + (parts[1] ? parts[1] - 1 : 6);
}

function verifySkills(resume: ParsedResume) {
  return resume.skills.map(skill => {
    const mentionCount = countSkillMentions(skill.name, resume);
    const evidenceSources = skill.evidence.map(e => e.source);
    const evidenceScore = calculateSkillEvidenceScore(skill, mentionCount);
    
    let status: VerificationStatus = 'unverified';
    if (skill.supportLevel === 'supported') status = 'supported';
    else if (skill.supportLevel === 'weakly_supported') status = 'needs_verification';
    else if (skill.supportLevel === 'unsupported') status = 'suspicious';
    
    return {
      skillId: skill.id,
      skillName: skill.name,
      mentionCount,
      evidenceSources,
      status,
      evidenceScore,
    };
  });
}

function countSkillMentions(skillName: string, resume: ParsedResume): number {
  let count = 0;
  const skillLower = skillName.toLowerCase();
  
  resume.experience.forEach(exp => {
    if (exp.technologies.some(t => t.toLowerCase() === skillLower)) count++;
    if (exp.responsibilities.some(r => r.toLowerCase().includes(skillLower))) count++;
  });
  
  resume.projects.forEach(proj => {
    if (proj.technologies.some(t => t.toLowerCase() === skillLower)) count++;
    if (proj.description?.toLowerCase().includes(skillLower)) count++;
  });
  
  return count;
}

function calculateSkillEvidenceScore(skill: any, mentionCount: number): number {
  let score = 0;
  
  if (skill.supportLevel === 'supported') score += 40;
  else if (skill.supportLevel === 'weakly_supported') score += 20;
  
  score += Math.min(mentionCount * 15, 30);
  score += Math.min(skill.evidence.length * 10, 30);
  
  return Math.min(score, 100);
}

function analyzeMetrics(resume: ParsedResume): MetricClaim[] {
  const metrics: MetricClaim[] = [];
  
  const metricPatterns = [
    /(\d+(?:\.\d+)?)\s*%\s*(improvement|increase|decrease|reduction|growth)/gi,
    /(\d+(?:,\d+)*)\s*(users|customers|clients|requests|transactions)/gi,
    /(\d+(?:\.\d+)?)\s*x\s*(faster|slower|better)/gi,
  ];
  
  resume.experience.forEach(exp => {
    exp.metrics.forEach(metric => {
      metrics.push({
        id: metric.id,
        claim: metric.claim,
        value: metric.value,
        unit: metric.unit,
        context: metric.context,
        hasBaseline: false,
        hasMethod: metric.supportLevel !== 'low',
        hasProject: true,
        hasTimeframe: false,
        hasTechnology: exp.technologies.length > 0,
        supportLevel: metric.supportLevel,
        verification: metric.verification,
      });
    });
  });
  
  resume.projects.forEach(proj => {
    proj.metrics.forEach(metric => {
      metrics.push({
        id: metric.id,
        claim: metric.claim,
        value: metric.value,
        unit: metric.unit,
        context: metric.context,
        hasBaseline: false,
        hasMethod: metric.supportLevel !== 'low',
        hasProject: true,
        hasTimeframe: false,
        hasTechnology: proj.technologies.length > 0,
        supportLevel: metric.supportLevel,
        verification: metric.verification,
      });
    });
  });
  
  return metrics;
}

function analyzeProjectCredibility(resume: ParsedResume): ProjectCredibility[] {
  return resume.projects.map(proj => {
    const checks = {
      hasProblem: !!proj.problem,
      hasImplementation: !!proj.solution || !!proj.description,
      hasTechnology: proj.technologies.length > 0,
      hasRole: !!proj.role,
      hasArchitecture: !!proj.architecture,
      hasDeployment: !!proj.deployment,
      hasUsers: !!proj.users,
      hasMetrics: proj.metrics.length > 0,
      hasGitHub: !!(proj.github || proj.demo),
      hasDemo: !!proj.demo,
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const credibilityScore = Math.round((score / totalChecks) * 100);
    
    const flags: string[] = [];
    if (!checks.hasProblem) flags.push('Missing problem statement');
    if (!checks.hasTechnology) flags.push('No skills or tools listed');
    if (!checks.hasMetrics) flags.push('No quantified outcomes');
    if (!checks.hasGitHub && proj.depthScore > 70) flags.push('High depth score but no public work sample link');
    
    let status: VerificationStatus = 'unverified';
    if (credibilityScore >= 70) status = 'supported';
    else if (credibilityScore >= 40) status = 'needs_verification';
    else status = 'suspicious';
    
    return {
      projectId: proj.id,
      projectName: proj.name,
      ...checks,
      credibilityScore,
      status,
      flags,
    };
  });
}

function checkCertifications(resume: ParsedResume): CertificationCheck[] {
  return resume.certifications.map(cert => ({
    id: cert.id,
    name: cert.name,
    issuer: cert.issuer,
    date: cert.date,
    hasCredentialId: !!cert.credentialId,
    hasLink: !!cert.url,
    credentialUrl: cert.url,
    status: cert.url ? 'verified' : cert.credentialId ? 'link_unavailable' : 'not_provided',
  }));
}

function analyzeLanguage(resume: ParsedResume): LanguageAnalysis {
  const allText = [
    resume.candidate.summary || '',
    ...resume.experience.flatMap(e => e.responsibilities),
    ...resume.projects.flatMap(p => [p.description, ...(p.features || [])]),
  ].join(' ').toLowerCase();
  
  const genericBuzzwords: string[] = [];
  GENERIC_BUZZWORDS.forEach(word => {
    if (allText.includes(word)) {
      genericBuzzwords.push(word);
    }
  });
  
  const meaninglessAdjectives: string[] = [];
  MEANINGLESS_ADJECTIVES.forEach(adj => {
    if (allText.includes(adj)) {
      meaninglessAdjectives.push(adj);
    }
  });
  
  const templatedSections: string[] = [];
  if (resume.experience.some(e => 
    e.responsibilities.some(r => 
      r.toLowerCase().includes('responsible for') || 
      r.toLowerCase().includes('duties included')
    )
  )) {
    templatedSections.push('Experience section contains templated language');
  }
  
  const polishedClaims: string[] = [];
  resume.experience.forEach(exp => {
    exp.achievements.forEach(ach => {
      if (/\d+%/.test(ach) && ach.split(' ').length < 10) {
        polishedClaims.push(ach);
      }
    });
  });
  
  const findings: string[] = [];
  if (genericBuzzwords.length > 5) {
    findings.push('High usage of generic buzzwords detected');
  }
  if (templatedSections.length > 0) {
    findings.push('Some sections may use templated language');
  }
  if (polishedClaims.length > 3) {
    findings.push('Multiple brief quantified claims without context');
  }
  
  const overallScore = Math.max(0, 100 - (genericBuzzwords.length * 3) - (templatedSections.length * 10) - (polishedClaims.length * 5));
  
  return {
    genericBuzzwords,
    repetitivePhrases: [],
    templatedSections,
    polishedClaims,
    meaninglessAdjectives,
    overallScore,
    findings,
  };
}

function runRuleEngine(
  resume: ParsedResume, 
  claims: Claim[], 
  timelineIssues: TimelineIssue[]
): VerificationRule[] {
  const rules: VerificationRule[] = [
    {
      id: 'RULE-001',
      name: 'Employment Date Overlap',
      description: 'Two or more employment entries have overlapping dates',
      severity: 'medium',
      triggered: timelineIssues.some(i => i.type === 'overlap'),
      evidence: timelineIssues.filter(i => i.type === 'overlap').map(i => i.description),
      recommendation: 'Verify dates during interview. Ask about concurrent positions.',
    },
    {
      id: 'RULE-002',
      name: 'Skill Without Evidence',
      description: 'Skill appears only in skills section without project/experience evidence',
      severity: 'medium',
      triggered: resume.skills.some(s => s.supportLevel === 'unsupported'),
      evidence: resume.skills.filter(s => s.supportLevel === 'unsupported').map(s => s.name),
      recommendation: 'Ask candidate to provide examples of using these skills.',
    },
    {
      id: 'RULE-003',
      name: 'Large Metric With Limited Evidence',
      description: 'Achievement contains large percentage improvement with weak supporting evidence',
      severity: 'high',
      triggered: claims.some(c => /\d{2,3}%/.test(c.claim) && c.evidenceStrength < 50),
      evidence: claims.filter(c => /\d{2,3}%/.test(c.claim) && c.evidenceStrength < 50).map(c => c.claim),
      recommendation: 'Request specific details on how metrics were measured.',
    },
    {
      id: 'RULE-004',
      name: 'Production Claim Without Deployment Evidence',
      description: 'Project claims production usage but lacks deployment details',
      severity: 'medium',
      triggered: resume.projects.some(p => 
        p.description?.toLowerCase().includes('production') && 
        !p.deployment && 
        !p.demo
      ),
      evidence: resume.projects.filter(p => 
        p.description?.toLowerCase().includes('production') && 
        !p.deployment
      ).map(p => p.name),
      recommendation: 'Ask about deployment architecture and user access.',
    },
    {
      id: 'RULE-005',
      name: 'Leadership Claim Without Team Details',
      description: 'Leadership responsibility mentioned without team size or scope',
      severity: 'medium',
      triggered: claims.some(c => 
        /led|managed|supervised/i.test(c.claim) && 
        !c.evidenceFound.some(e => e.description.includes('team'))
      ),
      evidence: claims.filter(c => 
        /led|managed|supervised/i.test(c.claim) && 
        !c.evidenceFound.some(e => e.description.includes('team'))
      ).map(c => c.claim),
      recommendation: 'Verify team size and reporting structure.',
    },
    {
      id: 'RULE-006',
      name: 'Certification Without Verification Link',
      description: 'Certification listed without credential ID or verification link',
      severity: 'low',
      triggered: resume.certifications.some(c => !c.url && !c.credentialId),
      evidence: resume.certifications.filter(c => !c.url && !c.credentialId).map(c => c.name),
      recommendation: 'Request credential verification if critical for role.',
    },
    {
      id: 'RULE-007',
      name: 'Keyword-Only Skill',
      description: 'Skill appears only as a keyword without usage context',
      severity: 'medium',
      triggered: resume.skills.some(s => 
        (s.category === 'Programming Languages' || 
        s.category === 'DevOps') && 
        s.evidence.length === 0
      ),
      evidence: resume.skills.filter(s => s.evidence.length === 0).map(s => s.name),
      recommendation: 'Ask for specific examples of technology usage.',
    },
    {
      id: 'RULE-008',
      name: 'Major Experience Claim With Weak Support',
      description: 'Senior-level responsibility claim with limited evidence',
      severity: 'high',
      triggered: claims.some(c => 
        (c.type === 'leadership' || /architect|designed|built/i.test(c.claim)) && 
        c.evidenceStrength < 40
      ),
      evidence: claims.filter(c => 
        (c.type === 'leadership' || /architect|designed|built/i.test(c.claim)) && 
        c.evidenceStrength < 40
      ).map(c => c.claim),
      recommendation: 'Deep dive into technical decisions and outcomes.',
    },
    {
      id: 'RULE-009',
      name: 'Contradictory Dates',
      description: 'Dates that appear inconsistent across sections',
      severity: 'medium',
      triggered: timelineIssues.some(i => i.type === 'inconsistency'),
      evidence: timelineIssues.filter(i => i.type === 'inconsistency').map(i => i.description),
      recommendation: 'Clarify timeline discrepancies.',
    },
    {
      id: 'RULE-010',
      name: 'New Major Claim In Version',
      description: 'Resume version introduces significant new claims not in previous version',
      severity: 'medium',
      triggered: false,
      evidence: [],
      recommendation: 'Compare with previous resume versions if available.',
    },
    {
      id: 'RULE-011',
      name: 'Employment Gap or Impossible Date',
      description: 'Resume shows unexplained employment gaps or date ranges that end before they begin',
      severity: 'medium',
      triggered: timelineIssues.some(i => i.type === 'gap' || i.type === 'impossible'),
      evidence: timelineIssues.filter(i => i.type === 'gap' || i.type === 'impossible').map(i => i.description),
      recommendation: 'Ask the candidate to account for employment gaps and clarify any inconsistent dates.',
    },
  ];
  
  return rules;
}

function calculateSummary(claims: Claim[]) {
  const supported = claims.filter(c => c.verificationStatus === 'supported').length;
  const needsVerification = claims.filter(c => c.verificationStatus === 'needs_verification').length;
  const suspicious = claims.filter(c => c.verificationStatus === 'suspicious').length;
  const unverified = claims.filter(c => c.verificationStatus === 'unverified').length;
  const total = claims.length || 1;
  
  return {
    supported: Math.round((supported / total) * 100),
    needsVerification: Math.round((needsVerification / total) * 100),
    suspicious: Math.round((suspicious / total) * 100),
    unverified: Math.round((unverified / total) * 100),
  };
}

function calculateOverallEvidenceScore(
  claims: Claim[],
  skillVerification: any[],
  projectCredibility: ProjectCredibility[],
  metrics: MetricClaim[]
): number {
  const claimScore = claims.reduce((sum, c) => sum + c.evidenceStrength, 0) / (claims.length || 1);
  const skillScore = skillVerification.reduce((sum, s) => sum + s.evidenceScore, 0) / (skillVerification.length || 1);
  const projectScore = projectCredibility.reduce((sum, p) => sum + p.credibilityScore, 0) / (projectCredibility.length || 1);
  const metricScore = metrics.reduce((sum, m) => sum + (m.supportLevel === 'high' ? 100 : m.supportLevel === 'medium' ? 60 : 30), 0) / (metrics.length || 1);
  
  return Math.round(
    claimScore * 0.3 +
    skillScore * 0.25 +
    projectScore * 0.25 +
    metricScore * 0.2
  );
}

export function generateVerificationSummary(result: VerificationResult): string {
  const { summary, overallEvidenceScore, triggeredRules } = result;
  const triggeredCount = triggeredRules.filter(r => r.triggered).length;
  
  let summaryText = '';
  
  if (overallEvidenceScore >= 80) {
    summaryText = 'The resume demonstrates strong evidence for most claims. ';
  } else if (overallEvidenceScore >= 60) {
    summaryText = 'The resume shows moderate evidence strength with some areas requiring verification. ';
  } else {
    summaryText = 'The resume contains several claims that require additional verification. ';
  }
  
  if (summary.needsVerification > 20) {
    summaryText += `${summary.needsVerification}% of claims need verification. `;
  }
  
  if (summary.suspicious > 10) {
    summaryText += `${summary.suspicious}% of claims show suspicious signals. `;
  }
  
  if (triggeredCount > 0) {
    summaryText += `${triggeredCount} verification rule(s) triggered.`;
  }
  
  return summaryText;
}
