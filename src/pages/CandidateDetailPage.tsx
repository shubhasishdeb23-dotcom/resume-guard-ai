import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useRecruiter } from '../context/RecruiterContext';
import { useToast } from '../context/ToastContext';
import { CandidateProfile, RecruiterDecision } from '../types/recruiter';
import { generatePDFReport, ExportData } from '../utils/exportReport';
import { buildStructuredSummary } from '../utils/candidateSummary';
import {
  generateNarrativeSummary,
  getOllamaEndpoint,
  getPreferredModel,
  ollamaSetupHint,
} from '../utils/llm';
import { computeShortlistScore } from '../utils/shortlist';
import { computeTrustScore } from '../utils/trustScore';
import { buildEmployerBrief } from '../utils/employerBrief';
import { simulateSkills, skillsCandidateCouldAdd } from '../utils/skillSimulator';

const RECOMMENDATION_LABEL: Record<string, { text: string; className: string }> = {
  strong_match: { text: 'Strong match — recommend advancing to interview', className: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200' },
  potential_match: { text: 'Potential match — interview with focused verification', className: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200' },
  needs_verification: { text: 'Hold — verify key claims before advancing', className: 'bg-amber-500/15 border-amber-500/30 text-amber-200' },
  weak_match: { text: 'Weak match — likely not a fit for this role', className: 'bg-red-500/15 border-red-500/30 text-red-200' },
};

const CandidateDetailPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { getMatch, getCandidate, getParsedResume, makeDecision, currentJob, toggleShortlist, shortlistWeights } = useRecruiter();
  const { showToast } = useToast();
  
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [match, setMatch] = useState<any>(null);
  const [decision, setDecision] = useState<RecruiterDecision['decision'] | null>(null);
  const [notes, setNotes] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [narrative, setNarrative] = useState('');
  const [narrativeBusy, setNarrativeBusy] = useState(false);
  const [simulatedSkills, setSimulatedSkills] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('detailed');
  
  useEffect(() => {
    if (candidateId) {
      const foundCandidate = getCandidate(candidateId);
      const foundMatch = getMatch(candidateId);
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
  
  const resume = candidateId ? getParsedResume(candidateId) : null;
  const structuredSummary = candidate ? buildStructuredSummary(candidate, match, currentJob, resume) : '';
  const shortlist = candidate && match ? computeShortlistScore(candidate, match, shortlistWeights) : null;
  const trust = computeTrustScore(resume, candidate, match);
  const brief = buildEmployerBrief(candidate, match, resume, currentJob, shortlist?.score);
  const skillOptions = skillsCandidateCouldAdd(currentJob, match);
  const simulation = simulateSkills(match, currentJob, simulatedSkills);

  const handleExport = (simpleOnly = false) => {
    if (!candidate || !match) return;
    const exportData: ExportData = {
      candidateName: candidate.name,
      fileName: resume?.fileName || 'session-profile',
      uploadedAt: new Date(candidate.uploadedAt).toLocaleString(),
      overallScore: candidate.overallScore,
      atsScore: candidate.atsScore,
      evidenceScore: candidate.evidenceScore,
      skillMatch: match.skillMatch.score,
      breakdown: [
        { name: 'Job Fit', score: match.overallFit, recommendation: match.recommendationReason },
        { name: 'Evidence', score: candidate.evidenceScore, recommendation: match.riskLevel === 'low' ? 'Evidence is relatively strong' : 'Verify weak claims before advancing' },
        { name: 'Skill Match', score: match.skillMatch.score, recommendation: match.skillMatch.missing.length ? `Missing: ${match.skillMatch.missing.join(', ')}` : 'Required skills are present' },
      ],
      skills: (resume?.skills || candidate.topSkills.map(name => ({ name, supportLevel: 'claimed', evidence: [] }))).map((s: any) => ({
        name: s.name,
        supportLevel: s.supportLevel || 'claimed',
        evidence: Array.isArray(s.evidence) ? s.evidence.map((e: any) => e.source || String(e)) : [],
      })),
      projects: (resume?.projects || []).map((p: any) => ({
        name: p.name,
        depthScore: p.depthScore || 0,
        technologies: p.technologies || [],
      })),
      summary: narrative || structuredSummary,
      jobTitle: currentJob ? `${currentJob.title} at ${currentJob.company}` : undefined,
      recommendation: match.recommendation,
      shortlistScore: shortlist?.score,
      trust: {
        score: trust.score,
        band: trust.band,
        label: trust.label,
        caveat: trust.caveat,
        factors: trust.factors,
      },
      brief: {
        headline: brief.headline,
        strengths: brief.strengths,
        gaps: brief.gaps,
        verificationAsks: brief.verificationAsks,
        interviewFocus: brief.interviewFocus,
        nextSteps: brief.nextSteps,
      },
      simpleOnly,
    };
    generatePDFReport(exportData);
    showToast('success', simpleOnly
      ? 'Employer summary opened. Use the browser print dialog to save a one-pager PDF.'
      : 'Report opened. Use the browser print dialog to save a PDF.');
  };

  const handleNarrative = async () => {
    if (!candidate) return;
    setNarrativeBusy(true);
    try {
      const text = await generateNarrativeSummary(candidate, match, currentJob, resume, getPreferredModel());
      setNarrative(text);
      showToast('success', `Narrative generated with Ollama at ${getOllamaEndpoint()}`);
    } catch {
      showToast('error', ollamaSetupHint());
    } finally {
      setNarrativeBusy(false);
    }
  };
  
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
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1" role="tablist" aria-label="View mode">
                {(['simple', 'detailed'] as const).map(mode => (
                  <button
                    key={mode}
                    role="tab"
                    aria-selected={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
                      viewMode === mode ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                onClick={() => candidate && toggleShortlist(candidate.id)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-xl transition-colors"
              >
                {candidate.shortlisted ? 'Remove shortlist' : 'Shortlist'}
              </button>
              <button
                onClick={() => navigate(`/recruiter/interview/${candidateId}`)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Mock interview
              </button>
              <button
                onClick={() => navigate(`/recruiter/challenge/${candidateId}`)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <Zap className="w-4 h-4" />
                Challenge This Resume
              </button>
              <button
                onClick={() => handleExport(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Employer one-pager
              </button>
              <button
                onClick={() => handleExport()}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-xl transition-colors"
              >
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

        {/* Score Cards (detailed mode only) */}
        {viewMode === 'detailed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8"
        >
          {[
            { label: 'Resume Quality', score: candidate.overallScore, icon: FileText },
            { label: 'ATS Compatibility', score: candidate.atsScore, icon: Target },
            { label: 'Evidence Strength', score: candidate.evidenceScore, icon: Shield },
            { label: 'Job Fit', score: match.overallFit, icon: TrendingUp },
            { label: 'Trust Score', score: trust.score, icon: CheckCircle },
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
        )}

        {/* Simple mode: hiring recommendation banner */}
        {viewMode === 'simple' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 rounded-2xl p-6 border ${RECOMMENDATION_LABEL[match.recommendation]?.className || 'bg-slate-800/50 border-slate-700/50 text-slate-200'}`}
          >
            <h3 className="text-lg font-semibold mb-2">Hiring recommendation</h3>
            <p className="font-medium mb-4">{RECOMMENDATION_LABEL[match.recommendation]?.text || match.recommendationReason}</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-2xl font-bold text-white">{match.overallFit}%</p>
                <p className="text-xs text-slate-300">Job fit</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{candidate.evidenceScore}%</p>
                <p className="text-xs text-slate-300">Evidence</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{trust.score}/100</p>
                <p className="text-xs text-slate-300">Trust</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white capitalize">{match.riskLevel}</p>
                <p className="text-xs text-slate-300">Risk level</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h3 className="text-lg font-semibold text-white">Candidate summary</h3>
            <button
              onClick={handleNarrative}
              disabled={narrativeBusy}
              className="text-sm bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white px-3 py-2 rounded-xl"
            >
              {narrativeBusy ? 'Generating…' : 'Rewrite with Ollama'}
            </button>
          </div>
          {shortlist && (
            <p className="text-sm text-emerald-300 mb-3">
              Shortlist score {shortlist.score}. {shortlist.explanation}
            </p>
          )}
          <p className="text-slate-300 leading-relaxed">{narrative || structuredSummary}</p>
          {narrative && (
            <p className="text-xs text-slate-500 mt-3">Narrative from local Ollama. Facts still come from this candidate’s stored match record.</p>
          )}
        </motion.div>

        {/* Employer Brief + Trust Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Employer Brief
            </h3>
            <p className="text-slate-200 font-medium mb-4">{brief.headline}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h4 className="text-sm font-semibold text-emerald-300 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {brief.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-400">•</span>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-300 mb-2">Gaps &amp; Questions</h4>
                <ul className="space-y-1">
                  {brief.gaps.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-amber-400">•</span>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Verify Before Advancing</h4>
                <ul className="space-y-1">
                  {brief.verificationAsks.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-cyan-400">•</span>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-purple-300 mb-2">Suggested Next Steps</h4>
                <ul className="space-y-1">
                  {brief.nextSteps.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-purple-400">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Trust Score
            </h3>
            <div className="flex items-end gap-2 mb-4">
              <span className={`text-4xl font-bold ${getScoreColor(trust.score)}`}>{trust.score}</span>
              <span className="text-slate-400 mb-1">/100 · {trust.label}</span>
            </div>
            <div className="space-y-3">
              {trust.factors.map((f, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>{f.label}</span>
                    <span>{f.value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getScoreBg(f.value)}`} style={{ width: `${f.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">{trust.caveat}</p>
          </motion.div>
        </div>

        {/* Skill Intelligence - What-if Analysis (detailed mode only) */}
        {viewMode === 'detailed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            Skill Intelligence: What-if Analysis
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            See how this candidate's fit improves if they gain specific missing skills. Choose skills they could realistically acquire to see projected changes in fit, skill match, and overall score for {currentJob ? currentJob.title : 'this role'}.
          </p>
          {skillOptions.length === 0 ? (
            <p className="text-sm text-slate-400">No addable job skills are on file — the candidate already covers the parsed requirements, or no job is selected.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-5">
                {skillOptions.map(opt => {
                  const active = simulatedSkills.includes(opt.skill);
                  return (
                    <button
                      key={opt.skill}
                      onClick={() => setSimulatedSkills(prev =>
                        active ? prev.filter(s => s !== opt.skill) : [...prev, opt.skill])}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        active
                          ? 'bg-cyan-600 border-cyan-500 text-white'
                          : 'bg-slate-700/40 border-slate-600 text-slate-300 hover:text-white'
                      }`}
                    >
                      {opt.skill}
                      {opt.required && <span className="ml-2 text-[10px] uppercase text-cyan-200">required</span>}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Current fit</p>
                  <p className="text-2xl font-bold text-white">{simulation.baseline.fit}%</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Projected fit</p>
                  <p className={`text-2xl font-bold ${getScoreColor(simulation.projected.fit)}`}>{simulation.projected.fit}%</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Skill match</p>
                  <p className="text-2xl font-bold text-white">
                    {simulation.baseline.skillMatch}% <span className="text-slate-500 text-base">→</span> {simulation.projected.skillMatch}%
                  </p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Projected change</p>
                  <p className={`text-2xl font-bold ${simulation.delta.fit > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {simulation.delta.fit > 0 ? '+' : ''}{simulation.delta.fit}
                  </p>
                </div>
              </div>
              {simulation.stillMissing.length > 0 && (
                <p className="text-xs text-amber-300 mt-4">Still missing required skills: {simulation.stillMissing.join(', ')}.</p>
              )}
              <ul className="mt-3 space-y-1">
                {simulation.notes.map((n, i) => (
                  <li key={i} className="text-xs text-slate-500">• {n}</li>
                ))}
              </ul>
            </>
          )}
        </motion.div>
        )}

        {/* Key Insight (detailed mode only) */}
        {viewMode === 'detailed' && (
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
        )}

        {/* Two Column Layout (detailed mode only) */}
        {viewMode === 'detailed' && (
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
        )}

        {/* Verification Findings (detailed mode only) */}
        {viewMode === 'detailed' && match.recommendedVerification.length > 0 && (
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
