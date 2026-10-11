import React, { useEffect, useState } from 'react';
import { COMMON_PROFESSIONS } from '../data/professions';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Users,
  Target,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Brain,
  FileText,
  Eye,
  ArrowRight,
  Download,
  RefreshCw,
  Zap,
  Award,
} from 'lucide-react';
import { useRecruiter } from '../context/RecruiterContext';
import { useToast } from '../context/ToastContext';
import { CandidateProfile } from '../types/recruiter';

const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentJob, 
    candidates, 
    matches, 
    analytics, 
    loadCommonRoles,
    loadDemoData,
    selectJob,
    createJob,
    jobs,
  } = useRecruiter();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFit, setFilterFit] = useState<string>('all');
  const [filterEvidence, setFilterEvidence] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('fit');
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const handleCreateJob = () => {
    const title = jobTitle.trim() || 'New Position';
    const company = jobCompany.trim() || 'Unnamed Company';
    const description = jobDescription.trim();
    createJob(title, company, description);
    setShowJobModal(false);
    setJobTitle('');
    setJobCompany('');
    setJobDescription('');
    showToast('success', `Created job "${title}" at ${company}`);
  };
  
  useEffect(() => {
    if (!currentJob && jobs.length === 0) {
      loadDemoData();
    }
  }, [currentJob, jobs.length, loadDemoData]);
  
  const filteredCandidates = candidates.filter(c => {
    const match = matches.find(m => m.resumeId === c.id);
    if (!match) return false;
    
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterFit !== 'all') {
      const fitRange = filterFit.split('-').map(Number);
      if (match.overallFit < fitRange[0] || match.overallFit > fitRange[1]) return false;
    }
    if (filterEvidence !== 'all') {
      const evRange = filterEvidence.split('-').map(Number);
      if (c.evidenceScore < evRange[0] || c.evidenceScore > evRange[1]) return false;
    }
    if (filterRisk !== 'all' && match.riskLevel !== filterRisk) return false;
    
    return true;
  }).sort((a, b) => {
    const matchA = matches.find(m => m.resumeId === a.id);
    const matchB = matches.find(m => m.resumeId === b.id);
    if (!matchA || !matchB) return 0;
    
    switch (sortBy) {
      case 'fit': return matchB.overallFit - matchA.overallFit;
      case 'evidence': return b.evidenceScore - a.evidenceScore;
      case 'risk': {
        const riskOrder = { low: 0, medium: 1, high: 2 };
        return riskOrder[matchB.riskLevel] - riskOrder[matchA.riskLevel];
      }
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });
  
  const getRecommendationBadge = (rec: string) => {
    const badges = {
      strong_match: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Strong Match' },
      potential_match: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Potential' },
      needs_verification: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Verify' },
      weak_match: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Weak' },
    };
    return badges[rec as keyof typeof badges] || badges.weak_match;
  };
  
  const getRiskBadge = (risk: string) => {
    const badges = {
      low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
      medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: AlertTriangle },
      high: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
    };
    return badges[risk as keyof typeof badges] || badges.medium;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ResumeGuard AI</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/recruiter/shortlist" className="text-slate-300 hover:text-white transition-colors">
                Shortlist
              </Link>
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                Candidate Mode
              </Link>
              <div className="w-px h-6 bg-slate-700" />
              <span className="text-emerald-400 font-medium">Recruiter Mode</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Target className="w-4 h-4" />
                <span>Active Position</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {currentJob?.title || 'Select or Create a Job'}
              </h1>
              <p className="text-slate-400 mt-1">
                {currentJob?.company || 'TechCorp AI'} â€¢ {currentJob?.location || 'San Francisco, CA'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {jobs.length > 0 && (
                <select
                  value={currentJob?.id || ''}
                  onChange={(e) => selectJob(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              )}
              <button
                onClick={loadCommonRoles}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
                title="Load common professions as job options"
              >
                <Zap className="w-4 h-4" />
                Load Common Roles
              </button>
              
              <button
                onClick={loadDemoData}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <Zap className="w-4 h-4" />
                Load Demo
              </button>
              <button
                onClick={() => setShowJobModal(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Job
              </button>
            </div>
          </div>
        </motion.div>

        {/* Analytics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Candidates</span>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.totalCandidates}</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm">Avg Fit</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{analytics.averageFit}%</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Avg Evidence</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{analytics.averageEvidence}%</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Needs Verification</span>
            </div>
            <p className="text-3xl font-bold text-amber-400">{analytics.needsVerification}</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">High Risk</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{analytics.highRiskSignals}</p>
          </div>
        </motion.div>

        {/* Key Differentiator Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                ResumeGuard: Evidence Over Writing Quality
              </h3>
              <p className="text-purple-200 text-sm">
                Unlike generic AI resume reviewers, ResumeGuard distinguishes between <strong>resume quality</strong> and <strong>evidence strength</strong>. 
                A candidate with a 94% quality score might have only 62% evidence strength. 
                <span className="text-white font-medium"> Click "Challenge This Resume" on any candidate to see the difference.</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates..."
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={filterFit}
                onChange={(e) => setFilterFit(e.target.value)}
                className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Fit Scores</option>
                <option value="81-100">Fit: 81-100%</option>
                <option value="61-80">Fit: 61-80%</option>
                <option value="41-60">Fit: 41-60%</option>
                <option value="0-40">Fit: 0-40%</option>
              </select>
              
              <select
                value={filterEvidence}
                onChange={(e) => setFilterEvidence(e.target.value)}
                className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Evidence</option>
                <option value="81-100">Evidence: 81-100%</option>
                <option value="61-80">Evidence: 61-80%</option>
                <option value="0-60">Evidence: 0-60%</option>
              </select>
              
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="fit">Sort by Fit</option>
                <option value="evidence">Sort by Evidence</option>
                <option value="risk">Sort by Risk</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Candidates Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Candidate</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Overall Fit</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Evidence</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">ATS</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Skill Match</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Risk</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Experience</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => {
                  const match = matches.find(m => m.resumeId === candidate.id);
                  if (!match) return null;
                  
                  const recBadge = getRecommendationBadge(match.recommendation);
                  const riskBadge = getRiskBadge(match.riskLevel);
                  const RiskIcon = riskBadge.icon;
                  
                  return (
                    <motion.tr
                      key={candidate.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-white">{candidate.name}</p>
                            <p className="text-sm text-slate-400">{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${match.overallFit >= 80 ? 'bg-emerald-500' : match.overallFit >= 60 ? 'bg-cyan-500' : 'bg-amber-500'}`}
                              style={{ width: `${match.overallFit}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-white">{match.overallFit}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${candidate.evidenceScore >= 80 ? 'bg-emerald-500' : candidate.evidenceScore >= 60 ? 'bg-cyan-500' : 'bg-red-500'}`}
                              style={{ width: `${candidate.evidenceScore}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${candidate.evidenceScore >= 80 ? 'text-emerald-400' : candidate.evidenceScore >= 60 ? 'text-cyan-400' : 'text-red-400'}`}>
                            {candidate.evidenceScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{candidate.atsScore}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{match.skillMatch.score}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${riskBadge.bg} ${riskBadge.text}`}>
                          <RiskIcon className="w-3 h-3" />
                          {match.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{candidate.yearsExperience} yrs</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${recBadge.bg} ${recBadge.text}`}>
                          {recBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/recruiter/candidate/${candidate.id}`)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/recruiter/challenge/${candidate.id}`)}
                            className="p-2 hover:bg-purple-700 rounded-lg transition-colors text-purple-400 hover:text-white"
                            title="Challenge This Resume"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/recruiter/interview/${candidate.id}`)}
                            className="p-2 hover:bg-cyan-700 rounded-lg transition-colors text-cyan-400 hover:text-white"
                            title="Mock interview"
                          >
                            <Brain className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No candidates match your filters</p>
            </div>
          )}
        </motion.div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/recruiter/shortlist"
              className="block bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Transparent shortlist</h3>
                    <p className="text-sm text-slate-400">Weighted job fit, evidence, skills, and risk â€” formula shown</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          {candidates.length >= 2 && (
            <Link
              to="/recruiter/compare"
              className="block bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Compare Candidates</h3>
                    <p className="text-sm text-slate-400">Side-by-side evidence-based comparison</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          )}
        </div>

        {/* Why ResumeGuard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8"
        >
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            Why ResumeGuard AI is Different
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">Generic AI Resume Reviewer</h3>
              <div className="flex items-center gap-3 text-slate-400">
                <span>Resume</span>
                <ArrowRight className="w-4 h-4" />
                <span>AI</span>
                <ArrowRight className="w-4 h-4" />
                <span>Suggestions</span>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                Single score based on writing quality and keywords.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">ResumeGuard AI</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>Resume</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2 text-emerald-300 pl-4">
                  <span>Structured Profile</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2 text-emerald-300 pl-8">
                  <span>Claim Extraction</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2 text-emerald-300 pl-12">
                  <span>Evidence Mapping</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2 text-emerald-300 pl-16">
                  <span>Verification Engine</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2 text-cyan-300 pl-20">
                  <span>Human Decision</span>
                </div>
              </div>
              <p className="text-sm text-emerald-200 mt-4 font-medium">
                AI is a component of ResumeGuard â€” not the product itself.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {showJobModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
            onClick={() => setShowJobModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Job</h2>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Job Title</label>
                  <select
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select a profession</option>
                    {COMMON_PROFESSIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Or type custom job title"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 mt-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Company</label>
                  <input
                    type="text"
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    placeholder="Paste the full job description here. Required skills, experience and education will be extracted automatically."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateJob}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Job
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterDashboard;
