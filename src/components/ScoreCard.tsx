import React from 'react';
import { motion } from 'framer-motion';
import { ScoreComponent } from '../types';

interface ScoreCardProps {
  component: ScoreComponent;
  label: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ component, label }) => {
  const getColor = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-cyan-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const getTextColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };
  
  return (
    <div className="bg-slate-700/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-300">{label}</span>
        <span className={`font-semibold ${getTextColor(component.score)}`}>
          {component.score}/100
        </span>
      </div>
      
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-full rounded-full ${getColor(component.score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${component.score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      
      <p className="text-xs text-slate-500">{component.recommendation}</p>
    </div>
  );
};

export default ScoreCard;
