import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ArrowLeft, 
  Download, 
  Share2,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  FileText,
  Award,
  BarChart3,
  Brain,
  Eye,
  Zap,
  Search,
  Copy,
  Mail,
  Link as LinkIcon,
  UserPlus,
  Cpu
} from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { useRecruiter } from '../context/RecruiterContext';
import { useToast } from '../context/ToastContext';
import { ResumeScore } from '../types';
import { generatePDFReport, generateTextReport, copyToClipboard, shareViaEmail, getShareableLink, ExportData } from '../utils/exportReport';
import { runVerificationEngine } from '../utils/verificationEngine';
import { getAIInsights, getOllamaModels, getOllamaEndpoint, setOllamaEndpoint, AI_MODELS } from '../utils/llm';
import { calculateQualityScore } from '../utils/scoringEngine';
import { analyzeContextualSkillDepth } from '../utils/skillDepth';
import ScoreGauge from '../components/ScoreGauge';
import ScoreCard from '../components/ScoreCard';
import SkillTable from '../components/SkillTable';
import ProjectCard from '../components/ProjectCard';

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentResume, getScore } = useResume();
  const { addCandidate } = useRecruiter();
  const { showToast } = useToast();
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qualityScore, setQualityScore] = useState(0);
  const [evidenceScore, setEvidenceScore] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [addedToPool, setAddedToPool] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiModel, setAiModel] = useState(AI_MODELS[0]);
  const [aiEndpoint, setAiEndpoint] = useState(getOllamaEndpoint());
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const modelOptions = Array.from(new Set([...AI_MODELS, ...availableModels]));

  useEffect(() => {
    let cancelled = false;
    getOllamaModels(aiEndpoint)
      .then(models => {
        if (!cancelled) setAvailableModels(models);
      })
      .catch(() => {
        if (!cancelled) setAvailableModels([]);
      });
    return () => { cancelled = true; };
  }, [aiEndpoint]);

  const handleEndpointChange = (endpoint: string) => {
    setAiEndpoint(endpoint);
    setOllamaEndpoint(endpoint);
  };

  const handleAddToRecruiterPool = () => {
    if (!currentResume || addedToPool) return;
    const evidenceScore = runVerificationEngine(currentResume).overallEvidenceScore;
    addCandidate(currentResume, evidenceScore);
    setAddedToPool(true);
    showToast('success', `${currentResume.candidate.name || 'Candidate'} added to the recruiter pool!`);
  };

  const handleGenerateInsights = async () => {
    if (!currentResume) return;
    setIsGeneratingInsights(true);
    setAiInsights('');
    try {
      const result = await getAIInsights(currentResume, aiModel);
      setAiInsights(result);
      showToast('success', 'AI insights generated');
    } catch (error) {
      console.error('AI insights failed:', error);
      showToast(
        'error',
        `Could not reach Ollama at ${getOllamaEndpoint()}. Make sure it is running, and on the machine running Ollama set OLLAMA_ORIGINS to include "${window.location.origin}", then restart it.`
      );
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    if (!currentResume) {
      navigate('/upload');
      return;
    }
    
    setTimeout(() => {
      const resumeScore = getScore(currentResume.id);
      setScore(resumeScore);
      setQualityScore(calculateQualityScore(currentResume));
      setEvidenceScore(runVerificationEngine(currentResume).overallEvidenceScore);
      setIsLoading(false);
    }, 500);
    setAddedToPool(false);
    setAiInsights('');
  }, [currentResume, getScore, navigate]);

  const handleExportPDF = () => {
    if (!currentResume || !score) return;
    
    const exportData: ExportData = {
      candidateName: currentResume.candidate.name,
      fileName: currentResume.fileName,
      uploadedAt: currentResume.uploadedAt.toLocaleString(),
      overallScore: score.overall,
      atsScore: score.breakdown.atsCompatibility.score,
      evidenceScore,
      skillMatch: score.breakdown.skillRelevance.score,
      breakdown: Object.entries(score.breakdown).map(([key, value]) => ({
        name: formatLabel(key),
        score: value.score,
        recommendation: value.recommendation,
      })),
      skills: currentResume.skills.map(s => ({
        name: s.name,
        supportLevel: s.supportLevel,
        evidence: s.evidence.map(e => e.source),
      })),
      projects: currentResume.projects.map(p => ({
        name: p.name,
        depthScore: p.depthScore,
        technologies: p.technologies,
      })),
    };
    
    generatePDFReport(exportData);
    showToast('success', 'PDF report generated! Use your browser\'s print dialog to save.');
  };

  const handleCopyReport = () => {
    if (!currentResume || !score) return;
    
    const exportData: ExportData = {
      candidateName: currentResume.candidate.name,
      fileName: currentResume.fileName,
      uploadedAt: currentResume.uploadedAt.toLocaleString(),
      overallScore: score.overall,
      atsScore: score.breakdown.atsCompatibility.score,
      evidenceScore,
      skillMatch: score.breakdown.skillRelevance.score,
      breakdown: Object.entries(score.breakdown).map(([key, value]) => ({
        name: formatLabel(key),
        score: value.score,
        recommendation: value.recommendation,
      })),
      skills: currentResume.skills.map(s => ({
        name: s.name,
        supportLevel: s.supportLevel,
        evidence: s.evidence.map(e => e.source),
      })),
      projects: currentResume.projects.map(p => ({
        name: p.name,
        depthScore: p.depthScore,
        technologies: p.technologies,
      })),
    };
    
    const textReport = generateTextReport(exportData);
    copyToClipboard(textReport).then(() => {
      showToast('success', 'Report copied to clipboard!');
    }).catch(() => {
      showToast('error', 'Failed to copy to clipboard');
    });
  };

  const handleShareLink = () => {
    const link = getShareableLink();
    copyToClipboard(link).then(() => {
      showToast('success', 'Link copied to clipboard!');
    }).catch(() => {
      showToast('error', 'Failed to copy link');
    });
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    if (!currentResume || !score) return;
    
    const subject = `ResumeGuard AI Analysis - ${currentResume.candidate.name}`;
    const body = `Check out the resume analysis for ${currentResume.candidate.name}.\n\nOverall Score: ${score.overall}%\nATS Score: ${score.breakdown.atsCompatibility.score}%\nEvidence Score: ${score.breakdown.credibility.score}%\n\nView the full analysis at: ${getShareableLink()}`;
    
    shareViaEmail(subject, body);
    showToast('info', 'Opening email client...');
    setShowShareMenu(false);
  };

  if (!currentResume || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Analyzing your resume...</p>
          </div>
        </div>
      </div>
    );
  }

  const skillDepth = analyzeContextualSkillDepth(currentResume);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ResumeGuard AI</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <button
                      onClick={handleShareLink}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                    >
                      <LinkIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">Copy Link</span>
                    </button>
                    <button
                      onClick={handleShareEmail}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                    >
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">Share via Email</span>
                    </button>
                    <button
                      onClick={handleCopyReport}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">Copy Report</span>
                    </button>
                  </motion.div>
                )}
              </div>
              
              <button 
                onClick={handleAddToRecruiterPool}
                disabled={addedToPool}
                className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-colors ${
                  addedToPool
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {addedToPool ? 'Added to Pool' : 'Add to Recruiter Pool'}
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Candidate Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <FileText className="w-4 h-4" />
                <span>{currentResume.fileName}</span>
                <span className="text-slate-600">•</span>
                <span>Version {currentResume.version}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {currentResume.candidate.name}
              </h1>
              <p className="text-slate-400 mt-1">{currentResume.candidate.summary?.slice(0, 100)}...</p>
            </div>
            
            <div className="flex items-center gap-3">
              {currentResume.candidate.links.github && (
                <a href={currentResume.candidate.links.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              )}
              {currentResume.candidate.links.linkedin && (
                <a href={currentResume.candidate.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <ScoreGauge
            value={score?.overall || 0}
            label="Overall Score"
            size="lg"
          />
          <ScoreGauge
            value={qualityScore}
            label="Quality Score"
            size="md"
          />
          <ScoreGauge
            value={evidenceScore}
            label="Evidence Strength"
            size="md"
          />
          <ScoreGauge
            value={score?.breakdown.atsCompatibility.score || 0}
            label="ATS Compatibility"
            size="md"
          />
        </motion.div>

        {/* Quality vs Evidence note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 border border-indigo-500/30 rounded-2xl p-4">
            <p className="text-sm text-slate-300">
              <strong className="text-white">Two clear scores:</strong>{' '}
              <span className="text-cyan-300">Quality</span> measures how well the resume is written.{' '}
              <span className="text-purple-300">Evidence Strength</span> measures how well claims are backed by real project or work context.
              A well-written resume can still have weak evidence.
            </p>
          </div>
        </motion.div>

        {/* Verification CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Link
            to="/verification"
            className="block bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Open Verification Center</h3>
                  <p className="text-purple-200 text-sm mt-1">
                    Deep dive into claim verification, evidence analysis, and suspicion detection
                  </p>
                </div>
              </div>
              <div className="text-white/70">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Detailed Scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Score Breakdown
            </h2>
            <div className="space-y-4">
              {score && Object.entries(score.breakdown).map(([key, value]) => (
                <ScoreCard key={key} component={value} label={formatLabel(key)} />
              ))}
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Quick Insights
            </h2>
            <div className="space-y-3">
              {skillDepth.score > 0 && (
                <div className="flex items-start gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <Brain className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-indigo-200">
                      {skillDepth.score}% of skills proven in project context
                    </p>
                    <p className="text-xs text-indigo-400/70 mt-1">
                      The AI favors candidates who back skills with real project context
                    </p>
                  </div>
                </div>
              )}
              {currentResume.skills.filter(s => s.supportLevel === 'unsupported').length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-200">
                      {currentResume.skills.filter(s => s.supportLevel === 'unsupported').length} skills lack evidence
                    </p>
                    <p className="text-xs text-amber-400/70 mt-1">
                      Add project or experience context to strengthen these claims
                    </p>
                  </div>
                </div>
              )}
              
              {currentResume.projects.filter(p => p.depthScore < 70).length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-cyan-200">
                      {currentResume.projects.filter(p => p.depthScore < 70).length} projects need more detail
                    </p>
                    <p className="text-xs text-cyan-400/70 mt-1">
                      Add problem statement, solution, and metrics
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-200">
                    {currentResume.skills.filter(s => s.supportLevel === 'supported').length} skills well-supported
                  </p>
                  <p className="text-xs text-emerald-400/70 mt-1">
                    These skills have strong project or experience evidence
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                AI Insights (local Ollama)
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={aiEndpoint}
                  onChange={(e) => handleEndpointChange(e.target.value)}
                  placeholder="http://localhost:11434"
                  title="Ollama server URL (e.g. http://localhost:11434)"
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 w-full sm:w-48"
                />
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                >
                  {modelOptions.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <button
                  onClick={handleGenerateInsights}
                  disabled={isGeneratingInsights}
                  className={`flex items-center gap-2 font-medium px-4 py-2 rounded-xl transition-colors ${
                    isGeneratingInsights
                      ? 'bg-slate-700 text-slate-400 cursor-wait'
                      : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  {isGeneratingInsights ? 'Generating...' : 'Generate Insights'}
                </button>
              </div>
            </div>
            {isGeneratingInsights ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            ) : aiInsights ? (
              <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">{aiInsights}</pre>
            ) : (
              <p className="text-sm text-slate-500">
                Generate a targeted strengths / weaknesses / red flags / suggestions review using a local Ollama model. Requires{' '}
                <code className="text-cyan-400">ollama serve</code> running, with this site's origin in{' '}
                <code className="text-cyan-400">OLLAMA_ORIGINS</code> (e.g. set it to <code className="text-cyan-400">*</code>), then restart Ollama.
              </p>
            )}
          </div>
        </motion.div>

        {/* Skill Intelligence Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" />
              Skill Intelligence
            </h2>
            <span className="text-sm text-slate-400">
              {currentResume.skills.length} skills identified
            </span>
          </div>
          <SkillTable skills={currentResume.skills} />
        </motion.div>

        {/* Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              Projects
            </h2>
            <span className="text-sm text-slate-400">
              {currentResume.projects.length} projects
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentResume.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <Link
            to="/upload"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Analyze another resume
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

export default AnalysisPage;
