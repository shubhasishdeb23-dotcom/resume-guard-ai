import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ArrowRight,
  Users,
  BarChart3,
  Award,
  Target,
  Eye,
} from 'lucide-react';
import { useRecruiter } from '../context/RecruiterContext';
import { DEMO_CANDIDATES } from '../data/demoCandidates';

const CompareCandidatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { candidates, matches, compareCandidates, currentJob } = useRecruiter();
  const [comparison, setComparison] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (candidates.length >= 2) {
      const ids = candidates.slice(0, 3).map(c => c.id);
      setSelectedIds(ids);
    } else {
      const demoIds = DEMO_CANDIDATES.slice(0, 3).map(dc => dc.id);
      setSelectedIds(demoIds);
    }
  }, [candidates]);
  
  useEffect(() => {
    if (selectedIds.length >= 2) {
      if (candidates.length >= 2) {
        const result = compareCandidates(selectedIds);
        setComparison(result);
      } else {
        const demoComparison = createDemoComparison(selectedIds);
        setComparison(demoComparison);
      }
    }
  }, [selectedIds, compareCandidates, candidates]);
  
  const createDemoComparison = (ids: string[]) => {
    const selectedDemos = DEMO_CANDIDATES.filter(dc => ids.includes(dc.id));
    
    return {
      candidates: selectedDemos.map(dc => dc.profile),
      categories: [
        {
          name: 'Skill Fit',
          values: selectedDemos.map(dc => dc.match.skillMatch.score),
          highlights: selectedDemos.map((dc, i) => {
            const max = Math.max(...selectedDemos.map(d => d.match.skillMatch.score));
            return dc.match.skillMatch.score === max ? 'Best' : '';
          }),
        },
        {
          name: 'Skill Depth (Context)',
          values: selectedDemos.map(dc => dc.profile.skillDepthScore ?? dc.profile.evidenceScore),
          highlights: selectedDemos.map((dc, i) => {
            const max = Math.max(...selectedDemos.map(d => d.profile.skillDepthScore ?? d.profile.evidenceScore));
            return (dc.profile.skillDepthScore ?? dc.profile.evidenceScore) === max ? 'Best' : '';
          }),
        },
        {
          name: 'Evidence',
          values: selectedDemos.map(dc => dc.profile.evidenceScore),
          highlights: selectedDemos.map((dc, i) => {
            const max = Math.max(...selectedDemos.map(d => d.profile.evidenceScore));
            return dc.profile.evidenceScore === max ? 'Best' : '';
          }),
        },
        {
          name: 'Job Fit',
          values: selectedDemos.map(dc => dc.match.overallFit),
          highlights: selectedDemos.map((dc, i) => {
            const max = Math.max(...selectedDemos.map(d => d.match.overallFit));
            return dc.match.overallFit === max ? 'Best' : '';
          }),
        },
        {
          name: 'Verification Risk',
          values: selectedDemos.map(dc => dc.match.riskLevel === 'low' ? 90 : dc.match.riskLevel === 'medium' ? 60 : 30),
          highlights: selectedDemos.map((dc, i) => {
            const min = Math.min(...selectedDemos.map(d => d.match.riskLevel === 'low' ? 90 : d.match.riskLevel === 'medium' ? 60 : 30));
            const val = dc.match.riskLevel === 'low' ? 90 : dc.match.riskLevel === 'medium' ? 60 : 30;
            return val === min ? 'Lowest Risk' : '';
          }),
        },
      ],
      summary: `Comparing ${selectedDemos.length} candidates for AI/ML Engineer position`,
      recommendation: generateRecommendation(selectedDemos),
    };
  };
  
  const generateRecommendation = (demos: typeof DEMO_CANDIDATES) => {
    const sorted = [...demos].sort((a, b) => {
      const depthA = a.profile.skillDepthScore ?? a.profile.evidenceScore;
      const depthB = b.profile.skillDepthScore ?? b.profile.evidenceScore;
      const scoreA = a.match.overallFit * 0.5 + a.profile.evidenceScore * 0.3 + depthA * 0.2;
      const scoreB = b.match.overallFit * 0.5 + b.profile.evidenceScore * 0.3 + depthB * 0.2;
      return scoreB - scoreA;
    });

    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const bestDepth = best.profile.skillDepthScore ?? best.profile.evidenceScore;

    return `${best.name} proves skills with real project context (Skill Depth ${bestDepth}%) and strong evidence — the AI picks this candidate. Note: ${worst.name} has impressive resume writing but lower evidence strength and skill depth.`;
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

  if (!comparison) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
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
              onClick={() => navigate('/recruiter')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <span className="text-lg font-bold text-white">Compare Candidates</span>
            </div>
            
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Evidence-Based Comparison
          </h1>
          <p className="text-slate-400">
            {comparison.summary}
          </p>
        </motion.div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Eye className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Evidence Over Writing Quality
              </h3>
              <p className="text-emerald-200 text-sm">
                ResumeGuard compares candidates based on <strong>evidence strength</strong>, not just resume writing quality.
                A candidate with a 94% quality score might have only 62% evidence strength. 
                Look at both scores when making decisions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Comparison Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden mb-8"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Category</th>
                  {comparison.candidates.map((candidate: any, i: number) => (
                    <th key={i} className="text-center px-6 py-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                          {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-white">{candidate.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.categories.map((category: any, i: number) => (
                  <tr key={i} className="border-b border-slate-700/30">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-300">{category.name}</span>
                    </td>
                    {category.values.map((value: number, j: number) => (
                      <td key={j} className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`text-2xl font-bold ${getScoreColor(value)}`}>
                            {value}%
                          </span>
                          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${getScoreBg(value)}`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          {category.highlights[j] && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                              {category.highlights[j]}
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                ResumeGuard Recommendation
              </h3>
              <p className="text-purple-200">
                {comparison.recommendation}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Individual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparison.candidates.map((candidate: any, i: number) => {
            const demo = DEMO_CANDIDATES.find(dc => dc.profile.name === candidate.name);
            const match = demo?.match;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{candidate.name}</h3>
                    <p className="text-xs text-slate-400">{candidate.yearsExperience} years experience</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Job Fit</span>
                    <span className={`font-medium ${getScoreColor(match?.overallFit || 0)}`}>
                      {match?.overallFit}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Evidence</span>
                    <span className={`font-medium ${getScoreColor(candidate.evidenceScore)}`}>
                      {candidate.evidenceScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Risk Level</span>
                    <span className={`font-medium ${
                      match?.riskLevel === 'low' ? 'text-emerald-400' : 
                      match?.riskLevel === 'medium' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {(() => {
                      const r = match?.riskLevel;
                      return r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Unknown';
                    })()}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/recruiter/candidate/${demo?.id}`)}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Key Insight
          </h3>
          <p className="text-slate-300 leading-relaxed">
            Notice how <strong className="text-white">Brian Taylor</strong> has an impressive 94% resume quality score, 
            but only 62% evidence strength with high verification risk. Meanwhile, <strong className="text-white">Alex Chen</strong> 
            has a slightly lower 85% quality score but 89% evidence strength with low risk.
            <span className="text-cyan-400 font-medium"> ResumeGuard surfaces this critical difference that generic AI reviewers miss.</span>
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default CompareCandidatesPage;
