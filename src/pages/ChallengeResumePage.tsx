import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Target,
  Brain,
  FileText,
  Eye,
  Download,
  HelpCircle,
} from 'lucide-react';
import { DEMO_CANDIDATES } from '../data/demoCandidates';
import { useRecruiter } from '../context/RecruiterContext';
import { InterviewQuestion, ChallengeReport } from '../types/recruiter';
import { generateChallengeReport } from '../utils/challengeReport';

const ChallengeResumePage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { getCandidate, getMatch } = useRecruiter();
  
  const [candidate, setCandidate] = useState<any>(null);
  const [challenges, setChallenges] = useState<ChallengeReport | null>(null);
  const [activeTab, setActiveTab] = useState<'strong' | 'weak' | 'technical' | 'behavioral'>('weak');
  
  useEffect(() => {
    if (!candidateId) return;
    
    let demoCandidate = DEMO_CANDIDATES.find(dc => dc.id === candidateId);
    
    if (!demoCandidate) {
      const profile = getCandidate(candidateId);
      demoCandidate = DEMO_CANDIDATES.find(dc => dc.id === profile?.resumeId);
    }
    
    if (demoCandidate) {
      setCandidate(demoCandidate);
      setChallenges(demoCandidate.challenges);
      return;
    }
    
    const profile = getCandidate(candidateId);
    const match = getMatch(candidateId);
    if (profile && match) {
      const generated = generateChallengeReport(match, profile);
      setCandidate({ ...profile, profile, match, challenges: generated, resume: null });
      setChallenges(generated);
    }
  }, [candidateId, getCandidate, getMatch]);
  
  if (!candidate || !challenges) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Generating challenge report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-purple-400" />
              <span className="text-lg font-bold text-white">Challenge This Resume</span>
            </div>
            
            <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-xl transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Candidate Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {candidate.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{candidate.name}</h1>
          <p className="text-slate-400 mt-1">Interview Intelligence Report</p>
        </motion.div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Targeted Interview Questions
              </h3>
              <p className="text-purple-200 text-sm">
                These questions are generated from actual claims in the resume. Each question targets 
                a specific area where evidence is weak or missing. Use these to verify claims during the interview.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {[
            { id: 'weak', label: 'Weak Claims', icon: AlertTriangle, count: challenges.topWeakClaims.length },
            { id: 'technical', label: 'Technical Questions', icon: Brain, count: challenges.technicalQuestions.length },
            { id: 'behavioral', label: 'Behavioral Questions', icon: MessageSquare, count: challenges.behavioralQuestions.length },
            { id: 'strong', label: 'Strong Evidence', icon: CheckCircle, count: challenges.topStrongClaims.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-purple-400/30' : 'bg-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Weak Claims */}
          {activeTab === 'weak' && (
            <div className="space-y-4">
              {challenges.topWeakClaims.length > 0 ? (
                challenges.topWeakClaims.map((claim, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-2">"{claim.claim}"</h4>
                        <p className="text-sm text-red-300 mb-3">
                          <strong>Missing Evidence:</strong> {claim.missing}
                        </p>
                        <div className="p-3 bg-slate-800/50 rounded-xl">
                          <p className="text-xs text-cyan-300 font-medium mb-1">Suggested Question:</p>
                          <p className="text-sm text-slate-300">
                            {claim.claim.includes('%') || claim.claim.includes('improved')
                              ? `You mentioned "${claim.claim.slice(0, 50)}...". What was the baseline, how did you measure it, and what specific changes led to this improvement?`
                              : `Can you provide specific examples and evidence for: "${claim.claim.slice(0, 50)}..."?`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-800/30 rounded-2xl">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-slate-400">No weak claims detected</p>
                </div>
              )}
            </div>
          )}

          {/* Technical Questions */}
          {activeTab === 'technical' && (
            <div className="space-y-4">
              {challenges.technicalQuestions.length > 0 ? (
                challenges.technicalQuestions.map((question, i) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            question.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {question.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        <h4 className="font-medium text-white mb-2">{question.question}</h4>
                        <p className="text-xs text-slate-500 mb-3">
                          Based on claim: "{question.claim}"
                        </p>
                        {question.followUp.length > 0 && (
                          <div className="p-3 bg-slate-700/30 rounded-xl">
                            <p className="text-xs text-slate-400 mb-1">Follow-up questions:</p>
                            <ul className="text-sm text-slate-300 space-y-1">
                              {question.followUp.map((fu, j) => (
                                <li key={j}>• {fu}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-800/30 rounded-2xl">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-slate-400">No technical questions needed</p>
                </div>
              )}
            </div>
          )}

          {/* Behavioral Questions */}
          {activeTab === 'behavioral' && (
            <div className="space-y-4">
              {challenges.behavioralQuestions.length > 0 ? (
                challenges.behavioralQuestions.map((question, i) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-2">{question.question}</h4>
                        <p className="text-xs text-slate-500 mb-3">
                          Based on claim: "{question.claim}"
                        </p>
                        <p className="text-xs text-cyan-300">
                          Reason: {question.reason}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-800/30 rounded-2xl">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-slate-400">No behavioral questions needed</p>
                </div>
              )}
            </div>
          )}

          {/* Strong Evidence */}
          {activeTab === 'strong' && (
            <div className="space-y-4">
              {challenges.topStrongClaims.length > 0 ? (
                challenges.topStrongClaims.map((claim, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-2">"{claim.claim}"</h4>
                        <p className="text-sm text-emerald-300">
                          <strong>Evidence:</strong> {claim.evidence}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-800/30 rounded-2xl">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-slate-400">No strong evidence found</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Weakest Evidence Areas */}
        {challenges.weakestEvidenceAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Weakest Evidence Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {challenges.weakestEvidenceAreas.map((area, i) => (
                <span key={i} className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm">
                  {area}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Possible Contradictions */}
        {challenges.possibleContradictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Possible Contradictions
            </h3>
            <ul className="space-y-2">
              {challenges.possibleContradictions.map((contradiction, i) => (
                <li key={i} className="text-sm text-red-300">
                  • {contradiction}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ChallengeResumePage;
