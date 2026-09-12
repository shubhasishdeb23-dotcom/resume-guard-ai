import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, HelpCircle, XCircle } from 'lucide-react';
import { SkillEntry } from '../types';

interface SkillTableProps {
  skills: SkillEntry[];
}

const SkillTable: React.FC<SkillTableProps> = ({ skills }) => {
  const getSupportIcon = (level: SkillEntry['supportLevel']) => {
    switch (level) {
      case 'supported':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'weakly_supported':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'unsupported':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };
  
  const getSupportBadge = (level: SkillEntry['supportLevel']) => {
    const badges = {
      supported: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'High' },
      weakly_supported: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Medium' },
      unsupported: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Low' },
      claimed: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Claimed' },
    };
    return badges[level];
  };
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Skill</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Category</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Evidence</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill, index) => {
              const badge = getSupportBadge(skill.supportLevel);
              return (
                <motion.tr
                  key={skill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getSupportIcon(skill.supportLevel)}
                      <span className="font-medium text-white">{skill.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{skill.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {skill.evidence.slice(0, 2).map((e, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                          {e.source}
                        </span>
                      ))}
                      {skill.evidence.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-400">
                          +{skill.evidence.length - 2}
                        </span>
                      )}
                      {skill.evidence.length === 0 && (
                        <span className="text-xs text-slate-500">No evidence</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkillTable;
