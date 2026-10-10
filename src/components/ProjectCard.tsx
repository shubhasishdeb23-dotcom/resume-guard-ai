import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, CheckCircle, XCircle } from 'lucide-react';
import { ProjectEntry } from '../types';

interface ProjectCardProps {
  project: ProjectEntry;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const depthItems = [
    { label: 'Problem', present: !!project.problem },
    { label: 'Solution', present: !!project.solution },
    { label: 'Tools / Skills', present: project.technologies.length > 0 },
    { label: 'Features', present: project.features.length > 0 },
    { label: 'Metrics', present: project.metrics.length > 0 },
    { label: 'Public link', present: !!(project.github || project.demo) },
  ];
  
  const presentCount = depthItems.filter(i => i.present).length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{project.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{project.role || 'Contributor'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            project.depthScore >= 80 ? 'text-emerald-400' :
            project.depthScore >= 60 ? 'text-cyan-400' : 'text-amber-400'
          }`}>
            {project.depthScore}/100
          </span>
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
              <Github className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
      
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
      
      {/* Technologies */}
      <div className="flex flex-wrap gap-2 mb-4">
        {project.technologies.slice(0, 4).map((tech, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded">
            {tech}
          </span>
        ))}
        {project.technologies.length > 4 && (
          <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">
            +{project.technologies.length - 4}
          </span>
        )}
      </div>
      
      {/* Depth Indicators */}
      <div className="grid grid-cols-3 gap-2">
        {depthItems.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            {item.present ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className={item.present ? 'text-slate-300' : 'text-slate-500'}>{item.label}</span>
          </div>
        ))}
      </div>
      
      {/* Depth Score Bar */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Project Depth</span>
          <span>{presentCount}/{depthItems.length} criteria met</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              project.depthScore >= 80 ? 'bg-emerald-500' :
              project.depthScore >= 60 ? 'bg-cyan-500' : 'bg-amber-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${(presentCount / depthItems.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
