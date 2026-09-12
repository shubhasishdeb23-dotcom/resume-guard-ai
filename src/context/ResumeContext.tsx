import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ParsedResume, ResumeVersion, ResumeScore, ATSAnalysis } from '../types';
import { parseResume } from '../utils/resumeParser';
import { calculateResumeScore } from '../utils/scoringEngine';
import { analyzeATS } from '../utils/atsAnalyzer';
import { runVerificationEngine } from '../utils/verificationEngine';
import { saveState, loadState } from '../utils/storage';

const RESUMES_KEY = 'rg.resumes_v1';
const CURRENT_RESUME_KEY = 'rg.current_resume_v1';
const VERSIONS_KEY = 'rg.versions_v1';

interface ResumeContextType {
  resumes: ParsedResume[];
  currentResume: ParsedResume | null;
  versions: ResumeVersion[];
  isUploading: boolean;
  isParsing: boolean;
  uploadResume: (file: File) => Promise<void>;
  selectResume: (id: string) => void;
  deleteResume: (id: string) => void;
  getScore: (resumeId: string) => ResumeScore | null;
  getATSAnalysis: (resumeId: string) => ATSAnalysis | null;
}

const ResumeContext = createContext<ResumeContextType | null>(null);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resumes, setResumes] = useState<ParsedResume[]>(() => loadState<ParsedResume[]>(RESUMES_KEY, []));
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(() => loadState<string | null>(CURRENT_RESUME_KEY, null));
  const [versions, setVersions] = useState<ResumeVersion[]>(() => loadState<ResumeVersion[]>(VERSIONS_KEY, []));
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const currentResume = resumes.find(r => r.id === currentResumeId) ?? null;

  useEffect(() => saveState(RESUMES_KEY, resumes), [resumes]);
  useEffect(() => saveState(CURRENT_RESUME_KEY, currentResumeId), [currentResumeId]);
  useEffect(() => saveState(VERSIONS_KEY, versions), [versions]);

  const uploadResume = useCallback(async (file: File) => {
    setIsUploading(true);

    try {
      const resumeId = `resume_${Date.now()}`;
      const version = resumes.length + 1;

      const newResume: ParsedResume = {
        id: resumeId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        status: 'parsing',
        version,
        candidate: {
          name: '',
          email: '',
          links: { other: [] },
        },
        education: [],
        experience: [],
        internships: [],
        projects: [],
        skills: [],
        certifications: [],
        achievements: [],
        publications: [],
      };

      setResumes(prev => [...prev, newResume]);
      setCurrentResumeId(resumeId);
      setIsUploading(false);
      setIsParsing(true);

      const parsedResume = await parseResume(file, resumeId, version);

      setResumes(prev => prev.map(r => r.id === resumeId ? parsedResume : r));
      setCurrentResumeId(resumeId);

      const parsedScore = calculateResumeScore(parsedResume);

      const newVersion: ResumeVersion = {
        id: `ver_${Date.now()}`,
        versionNumber: version,
        uploadedAt: new Date(),
        score: parsedScore.overall,
        atsScore: analyzeATS(parsedResume).score,
        skillEvidenceScore: parsedScore.breakdown.skillRelevance.score,
        verificationScore: runVerificationEngine(parsedResume).overallEvidenceScore,
      };
      setVersions(prev => [...prev, newVersion]);

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsParsing(false);
    }
  }, [resumes.length]);

  const selectResume = useCallback((id: string) => {
    const resume = resumes.find(r => r.id === id);
    if (resume) {
      setCurrentResumeId(id);
    }
  }, [resumes]);

  const deleteResume = useCallback((id: string) => {
    setResumes(prev => prev.filter(r => r.id !== id));
    if (currentResumeId === id) {
      setCurrentResumeId(null);
    }
  }, [currentResumeId]);

  const getScore = useCallback((resumeId: string): ResumeScore | null => {
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) return null;
    return calculateResumeScore(resume);
  }, [resumes]);

  const getATSAnalysis = useCallback((resumeId: string): ATSAnalysis | null => {
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) return null;
    return analyzeATS(resume);
  }, [resumes]);

  return (
    <ResumeContext.Provider value={{
      resumes,
      currentResume,
      versions,
      isUploading,
      isParsing,
      uploadResume,
      selectResume,
      deleteResume,
      getScore,
      getATSAnalysis,
    }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};