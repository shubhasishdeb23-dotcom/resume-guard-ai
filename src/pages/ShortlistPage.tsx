import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Star } from 'lucide-react';
import { useRecruiter } from '../context/RecruiterContext';
import { describeWeights, rankForShortlist, ShortlistWeights } from '../utils/shortlist';

const ShortlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { candidates, matches, currentJob, shortlistWeights, setShortlistWeights, toggleShortlist } = useRecruiter();
  const ranked = rankForShortlist(candidates, matches, shortlistWeights);

  const update = (key: keyof ShortlistWeights, value: number) => {
    setShortlistWeights({ ...shortlistWeights, [key]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/recruiter')} className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </button>
          <Link to="/" className="flex items-center gap-2 text-white font-semibold">
            <Shield className="w-5 h-5 text-emerald-400" /> ResumeGuard AI
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Transparent shortlist</h1>
          <p className="text-slate-400 mt-2">
            {currentJob ? `${currentJob.title} at ${currentJob.company}` : 'No job selected'}. The score is a weighted mix of job-related signals already computed for each candidate. It does not invent new ratings.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Criteria weights</h2>
          <p className="text-sm text-slate-400">{describeWeights(shortlistWeights)}</p>
          {([
            ['jobFit', 'Job fit'],
            ['evidence', 'Evidence strength'],
            ['skillMatch', 'Skill match'],
            ['skillDepth', 'Skill depth'],
            ['riskSafety', 'Risk safety (inverse of risk)'],
          ] as const).map(([key, label]) => (
            <label key={key} className="block">
              <div className="flex justify-between text-sm text-slate-300 mb-1">
                <span>{label}</span>
                <span>{shortlistWeights[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={shortlistWeights[key]}
                onChange={(e) => update(key, Number(e.target.value))}
                className="w-full"
              />
            </label>
          ))}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Fit / Evidence / Skills / Depth / Risk safety</th>
                <th className="px-4 py-3">Shortlist</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, i) => (
                <tr key={row.candidateId} className="border-b border-slate-800 text-sm">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/recruiter/candidate/${row.candidateId}`)} className="text-white hover:text-emerald-300">
                      {row.name}
                    </button>
                    <p className="text-xs text-slate-500 mt-1">{row.explanation}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">{row.score}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {row.breakdown.jobFit} / {row.breakdown.evidence} / {row.breakdown.skillMatch} / {row.breakdown.skillDepth} / {row.breakdown.riskSafety}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleShortlist(row.candidateId)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                        row.shortlisted ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${row.shortlisted ? 'fill-amber-300' : ''}`} />
                      {row.shortlisted ? 'Shortlisted' : 'Add'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranked.length === 0 && (
            <p className="text-center text-slate-400 py-10">No scored candidates yet. Upload resumes or load demo data.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default ShortlistPage;
