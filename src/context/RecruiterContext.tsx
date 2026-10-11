import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { JobDescription, CandidateMatch, CandidateProfile, RecruiterDecision, DashboardAnalytics } from '../types/recruiter';
import { parseJobDescription } from '../utils/jobParser';
import { matchCandidateToJob } from '../utils/jobMatcher';
import { analyzeATS } from '../utils/atsAnalyzer';
import { analyzeContextualSkillDepth } from '../utils/skillDepth';
import { DEMO_JOB, DEMO_CANDIDATES } from '../data/demoCandidates';
import { ParsedResume } from '../types';
import { saveState, loadState } from '../utils/storage';
import { DEFAULT_SHORTLIST_WEIGHTS, ShortlistWeights } from '../utils/shortlist';

const JOBS_KEY = 'rg.jobs_v1';
const CURRENT_JOB_KEY = 'rg.current_job_v1';
const CANDIDATES_KEY = 'rg.candidates_v1';
const MATCHES_KEY = 'rg.matches_v1';
const DECISIONS_KEY = 'rg.decisions_v1';
const PARSED_RESUMES_KEY = 'rg.parsed_resumes_v1';
const WEIGHTS_KEY = 'rg.shortlist_weights_v1';

interface RecruiterContextType {
  jobs: JobDescription[];
  currentJob: JobDescription | null;
  candidates: CandidateProfile[];
  matches: CandidateMatch[];
  decisions: RecruiterDecision[];
  parsedResumes: Record<string, ParsedResume>;
  shortlistWeights: ShortlistWeights;
  analytics: DashboardAnalytics;
  isLoading: boolean;
  
  createJob: (title: string, company: string, rawText: string) => JobDescription;
  selectJob: (jobId: string) => void;
  deleteJob: (jobId: string) => void;
  
  addCandidate: (resume: ParsedResume, evidenceScore: number) => void;
  removeCandidate: (candidateId: string) => void;
  updateCandidateStatus: (candidateId: string, status: CandidateProfile['status']) => void;
  toggleShortlist: (candidateId: string) => void;
  setShortlistWeights: (weights: ShortlistWeights) => void;
  
  makeDecision: (candidateId: string, decision: RecruiterDecision['decision'], notes: string) => void;
  
  loadCommonRoles: () => void;
  loadDemoData: () => void;
  getMatch: (candidateId: string) => CandidateMatch | null;
  getCandidate: (candidateId: string) => CandidateProfile | null;
  getParsedResume: (candidateId: string) => ParsedResume | null;
  
  compareCandidates: (candidateIds: string[]) => any;
}

const RecruiterContext = createContext<RecruiterContextType | null>(null);

export const RecruiterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<JobDescription[]>(() => loadState<JobDescription[]>(JOBS_KEY, []));
  const [currentJobId, setCurrentJobId] = useState<string | null>(() => loadState<string | null>(CURRENT_JOB_KEY, null));
  const [candidates, setCandidates] = useState<CandidateProfile[]>(() => loadState<CandidateProfile[]>(CANDIDATES_KEY, []));
  const [matches, setMatches] = useState<CandidateMatch[]>(() => loadState<CandidateMatch[]>(MATCHES_KEY, []));
  const [decisions, setDecisions] = useState<RecruiterDecision[]>(() => loadState<RecruiterDecision[]>(DECISIONS_KEY, []));
  const [parsedResumes, setParsedResumes] = useState<Record<string, ParsedResume>>(() => loadState(PARSED_RESUMES_KEY, {}));
  const [shortlistWeights, setShortlistWeightsState] = useState<ShortlistWeights>(() =>
    loadState(WEIGHTS_KEY, DEFAULT_SHORTLIST_WEIGHTS),
  );
  const [isLoading, setIsLoading] = useState(false);

  const currentJob = jobs.find(j => j.id === currentJobId) ?? null;

  useEffect(() => saveState(JOBS_KEY, jobs), [jobs]);
  useEffect(() => saveState(CURRENT_JOB_KEY, currentJobId), [currentJobId]);
  useEffect(() => saveState(CANDIDATES_KEY, candidates), [candidates]);
  useEffect(() => saveState(MATCHES_KEY, matches), [matches]);
  useEffect(() => saveState(DECISIONS_KEY, decisions), [decisions]);
  useEffect(() => saveState(PARSED_RESUMES_KEY, parsedResumes), [parsedResumes]);
  useEffect(() => saveState(WEIGHTS_KEY, shortlistWeights), [shortlistWeights]);

  const calculateAnalytics = useCallback((): DashboardAnalytics => {
    const totalCandidates = candidates.length;
    const averageFit = totalCandidates > 0 
      ? Math.round(matches.reduce((sum, m) => sum + m.overallFit, 0) / totalCandidates)
      : 0;
    const averageEvidence = totalCandidates > 0 
      ? Math.round(candidates.reduce((sum, c) => sum + c.evidenceScore, 0) / totalCandidates)
      : 0;
    const needsVerification = candidates.filter(c => c.verificationStatus === 'pending' || c.verificationStatus === 'flagged').length;
    const highRiskSignals = matches.filter(m => m.riskLevel === 'high').length;
    
    const skillCounts: Record<string, number> = {};
    candidates.forEach(c => {
      c.topSkills.forEach(s => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const missingSkillCounts: Record<string, number> = {};
    matches.forEach(m => {
      m.skillMatch.missing.forEach(s => {
        missingSkillCounts[s] = (missingSkillCounts[s] || 0) + 1;
      });
    });
    const missingSkills = Object.entries(missingSkillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const decisionCounts: Record<string, number> = {
      strong_match: 0,
      needs_interview: 0,
      needs_verification: 0,
      not_suitable: 0,
    };
    decisions.forEach(d => {
      decisionCounts[d.decision] = (decisionCounts[d.decision] || 0) + 1;
    });
    const decisionDistribution = Object.entries(decisionCounts)
      .map(([decision, count]) => ({ decision, count }));
    
    const scoreRanges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    const scoreCounts = scoreRanges.map(range => ({ range, count: 0 }));
    matches.forEach(m => {
      const score = m.overallFit;
      const rangeIndex = Math.min(Math.floor(score / 20), 4);
      scoreCounts[rangeIndex].count++;
    });
    
    return {
      totalCandidates,
      averageFit,
      averageEvidence,
      needsVerification,
      highRiskSignals,
      topSkills,
      missingSkills,
      decisionDistribution,
      scoreDistribution: scoreCounts,
    };
  }, [candidates, matches, decisions]);

  const createJob = useCallback((title: string, company: string, rawText: string): JobDescription => {
    const extracted = parseJobDescription(rawText);
    const job: JobDescription = {
      id: uuidv4(),
      title,
      company,
      rawText,
      extracted,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setJobs(prev => [...prev, job]);
    setCurrentJobId(job.id);
    return job;
  }, []);

  const selectJob = useCallback((jobId: string) => {
    if (jobs.some(j => j.id === jobId)) setCurrentJobId(jobId);
  }, [jobs]);

  const deleteJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    if (currentJobId === jobId) setCurrentJobId(null);
  }, [currentJobId]);

  const ensureJob = useCallback((resume: ParsedResume): JobDescription => {
    if (currentJob) return currentJob;

    const topSkills = resume.skills.slice(0, 5).map(s => s.name).join(', ') || 'software development';
    const title = resume.skills[0] ? `${resume.skills[0].name} Specialist` : 'Software Engineer';
    const rawText = `We are opening a new position for a candidate with strong skills in ${topSkills}, relevant hands-on experience, and a solid educational background.`;

    const job: JobDescription = {
      id: uuidv4(),
      title,
      company: 'General Opening',
      rawText,
      extracted: parseJobDescription(rawText),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setJobs(prev => [...prev, job]);
    setCurrentJobId(job.id);
    return job;
  }, [currentJob]);

  const addCandidate = useCallback((resume: ParsedResume, evidenceScore: number) => {
    const job = ensureJob(resume);

    const yearsExp = resume.experience.reduce((total, exp) => {
      const start = new Date(exp.startDate).getFullYear();
      if (isNaN(start)) return total;
      const end = exp.current ? new Date().getFullYear() : new Date(exp.endDate || '').getFullYear();
      return total + (isNaN(end) ? 0 : Math.max(0, end - start));
    }, 0);
    
    const profile: CandidateProfile = {
      id: uuidv4(),
      resumeId: resume.id,
      name: resume.candidate.name,
      email: resume.candidate.email,
      summary: resume.candidate.summary || '',
      yearsExperience: yearsExp,
      topSkills: resume.skills.slice(0, 5).map(s => s.name),
      education: resume.education.map(e => `${e.degree} ${e.field}`).join(', '),
      experience: `${yearsExp} years`,
      overallScore: 0,
      evidenceScore,
      skillDepthScore: analyzeContextualSkillDepth(resume).score,
      atsScore: analyzeATS(resume).score,
      skillMatch: 0,
      riskSignals: resume.skills.filter(s => s.supportLevel === 'unsupported').length,
      verificationStatus: evidenceScore >= 70 ? 'verified' : evidenceScore >= 50 ? 'pending' : 'flagged',
      uploadedAt: new Date(),
      status: 'analyzing',
    };
    
    setParsedResumes(prev => ({ ...prev, [profile.id]: resume }));
    setCandidates(prev => [...prev, profile]);
    
    const match = { ...matchCandidateToJob(resume, job, evidenceScore), resumeId: profile.id };
    setMatches(prev => [...prev, match]);
    
    profile.overallScore = match.overallFit;
    profile.skillMatch = match.skillMatch.score;
    profile.status = 'analyzed';
    
    setCandidates(prev => prev.map(c => c.id === profile.id ? profile : c));
  }, [ensureJob]);

  const removeCandidate = useCallback((candidateId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    setMatches(prev => prev.filter(m => m.resumeId !== candidateId));
    setParsedResumes(prev => {
      const next = { ...prev };
      delete next[candidateId];
      return next;
    });
  }, []);

  const toggleShortlist = useCallback((candidateId: string) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, shortlisted: !c.shortlisted } : c));
  }, []);

  const setShortlistWeights = useCallback((weights: ShortlistWeights) => {
    setShortlistWeightsState(weights);
  }, []);

  const updateCandidateStatus = useCallback((candidateId: string, status: CandidateProfile['status']) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status } : c));
  }, []);

  const makeDecision = useCallback((candidateId: string, decision: RecruiterDecision['decision'], notes: string) => {
    if (!currentJob) return;
    
    const newDecision: RecruiterDecision = {
      id: uuidv4(),
      candidateId,
      jobId: currentJob.id,
      decision,
      notes,
      decidedAt: new Date(),
      decidedBy: 'recruiter',
    };
    
    setDecisions(prev => [...prev, newDecision]);
    updateCandidateStatus(candidateId, 'decided');
  }, [currentJob, updateCandidateStatus]);

  const loadCommonRoles = useCallback(() => {
    const presets = [
      { title: 'AI/ML Engineer', company: 'TechCorp AI', text: DEMO_JOB.rawText },
      { title: 'Software Engineer', company: 'TechCorp', text: 'Software Engineer. Requirements: 3+ years software development, Python/JavaScript, Git, problem-solving, testing.' },
      { title: 'Frontend Engineer', company: 'TechCorp', text: 'Frontend Engineer. Requirements: React, TypeScript, CSS, responsive design, accessibility.' },
      { title: 'Backend Engineer', company: 'TechCorp', text: 'Backend Engineer. Requirements: Node.js/Express, REST APIs, SQL/NoSQL, authentication, scalability.' },
      { title: 'Data Scientist', company: 'DataCorp', text: 'Data Scientist. Requirements: Python, statistics, ML, pandas, visualization, SQL.' },
      { title: 'Nurse', company: 'HealthCare', text: 'Registered Nurse. Requirements: BSN/RN, patient care, documentation, critical thinking, empathy.' },
      { title: 'Teacher', company: 'EduCorp', text: 'Teacher. Requirements: teaching credential, lesson planning, classroom management, communication.' },
    ];
    const newJobs = presets.map(p => ({
      id: uuidv4(),
      title: p.title,
      company: p.company,
      rawText: p.text,
      extracted: parseJobDescription(p.text),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    setJobs(newJobs);
    setCurrentJobId(newJobs[0].id);
  }, []);

  const loadDemoData = useCallback(() => {
    const demoJob: JobDescription = {
      ...DEMO_JOB,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setJobs([demoJob]);
    setCurrentJobId(demoJob.id);
    
    const demoProfiles: CandidateProfile[] = DEMO_CANDIDATES.map(dc => ({
      ...dc.profile,
      id: uuidv4(),
      resumeId: dc.id,
      uploadedAt: new Date(),
    }));
    
    const demoMatches: CandidateMatch[] = DEMO_CANDIDATES.map((dc, i) => ({
      ...dc.match,
      id: uuidv4(),
      resumeId: demoProfiles[i].id,
      jobId: demoJob.id,
      analyzedAt: new Date(),
    }));
    
    const resumeMap: Record<string, ParsedResume> = {};
    DEMO_CANDIDATES.forEach((dc, i) => {
      resumeMap[demoProfiles[i].id] = dc.resume as ParsedResume;
    });
    
    setCandidates(demoProfiles);
    setMatches(demoMatches);
    setParsedResumes(resumeMap);
  }, []);

  const getMatch = useCallback((candidateId: string): CandidateMatch | null => {
    return matches.find(m => m.resumeId === candidateId) || null;
  }, [matches]);

  const getCandidate = useCallback((candidateId: string): CandidateProfile | null => {
    return candidates.find(c => c.id === candidateId) || null;
  }, [candidates]);

  const getParsedResume = useCallback((candidateId: string): ParsedResume | null => {
    return parsedResumes[candidateId] || null;
  }, [parsedResumes]);

  const compareCandidates = useCallback((candidateIds: string[]) => {
    const selectedCandidates = candidates.filter(c => candidateIds.includes(c.id));
    const selectedMatches = matches.filter(m => candidateIds.includes(m.resumeId));

    const depthScores = selectedCandidates.map(c => c.skillDepthScore ?? c.evidenceScore);

    const categories: {
      name: string;
      values: number[];
      highlights: string[];
    }[] = [
      { name: 'Skill Fit', values: selectedMatches.map(m => m.skillMatch.score), highlights: [] },
      { name: 'Skill Depth (Context)', values: depthScores, highlights: [] },
      { name: 'Evidence', values: selectedMatches.map(m => m.evidenceMatch.score), highlights: [] },
      { name: 'Job Fit', values: selectedMatches.map(m => m.overallFit), highlights: [] },
      { name: 'Experience', values: selectedMatches.map(m => m.experienceMatch.score), highlights: [] },
      { name: 'Education', values: selectedMatches.map(m => m.educationMatch.score), highlights: [] },
    ];

    categories.forEach(cat => {
      const maxVal = Math.max(...cat.values);
      const minVal = Math.min(...cat.values);
      cat.highlights = cat.values.map((v, i) => {
        if (v === maxVal && maxVal > minVal) return 'Best';
        if (v === minVal && maxVal > minVal) return 'Lowest';
        return '';
      });
    });

    const aiScores = selectedMatches.map((m, i) =>
      m.overallFit * 0.5 + m.evidenceMatch.score * 0.3 + (depthScores[i] || 0) * 0.2
    );
    const bestIdx = aiScores.indexOf(Math.max(...aiScores));

    return {
      candidates: selectedCandidates,
      categories,
      summary: `Comparing ${selectedCandidates.length} candidates for ${currentJob?.title || 'position'}`,
      recommendation: `${selectedCandidates[bestIdx]?.name || 'No candidate'} ranks first on this comparison: job fit, evidence, and skill depth (Skill Depth ${depthScores[bestIdx] || 0}%).`,
    };
  }, [candidates, matches, currentJob]);

  const analytics = calculateAnalytics();

  return (
    <RecruiterContext.Provider value={{
      jobs,
      currentJob,
      candidates,
      matches,
      decisions,
      parsedResumes,
      shortlistWeights,
      analytics,
      isLoading,
      createJob,
      selectJob,
      deleteJob,
      addCandidate,
      removeCandidate,
      updateCandidateStatus,
      toggleShortlist,
      setShortlistWeights,
      makeDecision,
      loadCommonRoles,
      loadDemoData,
      getMatch,
      getCandidate,
      getParsedResume,
      compareCandidates,
    }}>
      {children}
    </RecruiterContext.Provider>
  );
};

export const useRecruiter = () => {
  const context = useContext(RecruiterContext);
  if (!context) {
    throw new Error('useRecruiter must be used within a RecruiterProvider');
  }
  return context;
};
