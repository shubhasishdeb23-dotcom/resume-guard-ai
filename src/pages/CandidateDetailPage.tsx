import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Download,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Brain,
  Award,
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
  ExternalLink,
  Users,
} from 'lucide-react';
import { useRecruiter } from '../context/RecruiterContext';
import { CandidateProfile, RecruiterDecision } from '../types/recruiter';
import { DEMO_CANDIDATES } from '../data/demoCandidates';

const CandidateDetailPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { getMatch, getCandidate, makeDecision, currentJob } = useRecruiter();
  
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [match, setMatch] = useState<any>(null);
  const [challenges, setChallenges] = useState<any>(null);
  const [decision, setDecision] = useState<RecruiterDecision['decision'] | null>(null);
  const [notes, setNotes] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  
  useEffect(() => {
    if (candidateId) {
      let foundCandidate = getCandidate(candidateId);
      let foundMatch = getMatch(candidateId);
      
      if (!foundCandidate) {
        const demoCandidate = DEMO_CANDIDATES.find(dc => dc.id === candidateId);
        if (demoCandidate) {
          foundCandidate = demoCandidate.profile;
          foundMatch = demoCandidate.match;
          setChallenges(demoCandidate.challenges);
        }
      }
      
      if (foundCandidate) setCandidate(foundCandidate);
      if (foundMatch) setMatch(foundMatch);
    }
  }, [candidateId, getCandidate, getMatch]);
  
  const handleDecision = () => {
    if (candidate && decision) {
      makeDecision(candidate.id, decision, notes);
      setShowDecisionModal(false);
      navigate('/recruiter');
    }
  };
  
  if (!candidate || !match) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading candidate...</p>
        </div>
      </div>
    );
  }
  
  const demoCandidate = DEMO_CANDIDATES.find(dc => dc.id === candidateId);
  const resume = demoCandidate?.resume;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-cyan-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/recruiter')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/recruiter/challenge/${candidateId}`)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <Zap className="w-4 h-4" />
                Challenge This Resume
              </button>
              <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-xl transition-colors">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Candidate Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{candidate.name}</h1>
                <p className="text-slate-400 mt-1">{candidate.email}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-sm text-slate-400">{candidate.yearsExperience} years experience</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-sm text-slate-400">{candidate.education}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{match.overallFit}%</p>
                <p className="text-xs text-slate-400">Job Fit</p>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div className="text-center">
                <p className={`text-3xl font-bold ${getScoreColor(candidate.evidenceScore)}`}>
                  {candidate.evidenceScore}%
                </p>
                <p className="text-xs text-slate-400">Evidence</p>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div className="text-center">
                <p className={`text-3xl font-bold ${match.riskLevel === 'low' ? 'text-emerald-400' : match.riskLevel === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>
                  {match.riskLevel.charAt(0).toUpperCase() + match.riskLevel.slice(1)}
                </p>
                <p className="text-xs text-slate-400">Risk Level</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Score Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          {[
            { label: 'Resume Quality', score: candidate.overallScore, icon: FileText },
            { label: 'ATS Compatibility', score: candidate.atsScore, icon: Target },
            { label: 'Evidence Strength', score: candidate.evidenceScore, icon: Shield },
            { label: 'Job Fit', score: match.overallFit, icon: TrendingUp },
            { label: 'Verification Risk', score: match.riskLevel === 'low' ? 90 : match.riskLevel === 'medium' ? 60 : 30, icon: AlertTriangle },
          ].map((item, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getScoreBg(item.score)}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <span className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                  {item.score}%
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`mb-8 rounded-2xl p-6 border ${
            candidate.evidenceScore < 70 && candidate.overallScore >= 80
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-slate-800/30 border-slate-700/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              candidate.evidenceScore < 70 && candidate.overallScore >= 80
                ? 'bg-amber-500/20'
                : 'bg-emerald-500/20'
            }`}>
              {candidate.evidenceScore < 70 && candidate.overallScore >= 80 ? (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {candidate.evidenceScore < 70 && candidate.overallScore >= 80
                  ? 'High Quality Resume, Lower Evidence Strength'
                  : 'Resume Analysis Complete'}
              </h3>
              <p className="text-slate-300">
                {match.recommendationReason}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Skill Match */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Skill Match Analysis
            </h3>
            
            <div className="space-y-3">
              {match.skillMatch.details.slice(0, 8).map((detail: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    {detail.found ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-sm text-white">{detail.skill}</span>
                    {detail.required && (
                      <span className="text-xs px-2 py-0.5 bg-slate-600 rounded text-slate-300">Required</span>
                    )}
                  </div>
                  <span className={`text-xs ${detail.found ? 'text-emerald-400' : 'text-red-400'}`}>
                    {detail.evidence}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* Experience & Education */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Experience & Education Match
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Experience Requirement</span>
                  <span className={`text-sm font-medium ${match.experienceMatch.relevant ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {match.experienceMatch.details}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Required: {match.experienceMatch.yearsRequired} yrs</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-xs text-slate-500">Found: {match.experienceMatch.yearsFound} yrs</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Education Requirement</span>
                  <span className={`text-sm font-medium ${match.educationMatch.meetsRequirement ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {match.educationMatch.details}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Project Relevance</span>
                  <span className="text-sm font-medium text-cyan-400">
                    {match.projectMatch.relevantProjects.length} relevant projects
                  </span>
                </div>
                {match.projectMatch.relevantProjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {match.projectMatch.relevantProjects.map((proj: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                        {proj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Verification Findings */}
        {match.recommendedVerification.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Recommended Verification
            </h3>
            <ul className="space-y-2">
              {match.recommendedVerification.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-200">
                  <span className="text-amber-400">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Recruiter Decision Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Recruiter Decision
          </h3>
          
          <p className="text-sm text-slate-400 mb-4">
            This section remains human-controlled. ResumeGuard provides analysis, not hiring decisions.
          </p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { value: 'strong_match', label: 'Strong Match', color: 'bg-emerald-600 hover:bg-emerald-700' },
              { value: 'needs_interview', label: 'Needs Interview', color: 'bg-cyan-600 hover:bg-cyan-700' },
              { value: 'needs_verification', label: 'Needs Verification', color: 'bg-amber-600 hover:bg-amber-700' },
              { value: 'not_suitable', label: 'Not Suitable', color: 'bg-red-600 hover:bg-red-700' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setDecision(opt.value as RecruiterDecision['decision']);
                  setShowDecisionModal(true);
                }}
                className={`p-4 rounded-xl text-white font-medium transition-colors ${opt.color} ${
                  decision === opt.value ? 'ring-2 ring-white' : ''
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Confirm Decision</h3>
            <p className="text-slate-400 mb-4">
              You are marking <strong className="text-white">{candidate.name}</strong> as{' '}
              <strong className="text-emerald-400">{decision?.replace('_', ' ')}</strong>.
            </p>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional)..."
              className="w-full h-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 resize-none focus:outline-none focus:border-emerald-500 mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecision}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetailPage;
