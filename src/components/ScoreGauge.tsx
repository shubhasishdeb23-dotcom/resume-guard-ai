import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  value: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ value, label, size = 'md' }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  const sizes = {
    sm: { container: 80, stroke: 6, text: 'text-lg' },
    md: { container: 100, stroke: 8, text: 'text-xl' },
    lg: { container: 140, stroke: 10, text: 'text-3xl' },
  };
  
  const config = sizes[size];
  const radius = (config.container - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.container / 2;
  
  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setAnimatedValue(easeOut * value);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  const getColor = (val: number): string => {
    if (val >= 80) return '#10b981';
    if (val >= 60) return '#06b6d4';
    if (val >= 40) return '#f59e0b';
    return '#ef4444';
  };
  
  const progress = (animatedValue / 100) * circumference;
  const color = getColor(animatedValue);
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center">
      <div className="relative" style={{ width: config.container, height: config.container }}>
        <svg width={config.container} height={config.container} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={config.stroke}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-white ${config.text}`}>
            {Math.round(animatedValue)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400 text-center">{label}</p>
    </div>
  );
};

export default ScoreGauge;
