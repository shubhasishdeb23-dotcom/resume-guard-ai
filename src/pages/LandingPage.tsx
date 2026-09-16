import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Shield, 
  Target, 
  ArrowRight, 
  FileSearch, 
  Users,
  BarChart3,
  CheckCircle,
  Sparkles,
  Eye,
  AlertTriangle
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Search,
      title: 'Analyze',
      description: 'Turn an unstructured resume into structured candidate intelligence.',
      color: 'bg-blue-500',
    },
    {
      icon: Brain,
      title: 'Understand',
      description: 'Identify skills, experience, projects, education and achievements.',
      color: 'bg-purple-500',
    },
    {
      icon: Shield,
      title: 'Verify',
      description: 'Identify inconsistencies, unsupported claims and evidence gaps.',
      color: 'bg-amber-500',
    },
    {
      icon: Target,
      title: 'Match',
      description: 'Compare candidates against real job requirements.',
      color: 'bg-emerald-500',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Resumes Analyzed' },
    { value: '98%', label: 'ATS Detection Accuracy' },
    { value: '2.5M+', label: 'Skills Extracted' },
    { value: '15K+', label: 'Active Users' },
  ];

  const differentiators = [
    {
      icon: Eye,
      title: 'Evidence-Based Scoring',
      description: 'Every score comes with supporting evidence. Know exactly why a score was given.',
    },
    {
      icon: AlertTriangle,
      title: 'Suspicion Detection',
      description: 'Identify unsupported claims, timeline inconsistencies, and weak evidence signals.',
    },
    {
      icon: Target,
      title: 'Claim Verification',
      description: 'Click any claim to see evidence, missing context, and suggested verification questions.',
    },
    {
      icon: Brain,
      title: 'Skill Evidence Analysis',
      description: 'Distinguish between claimed skills and skills with real project evidence.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ResumeGuard AI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#differentiator" className="text-slate-300 hover:text-white transition-colors">Why Us</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                to="/recruiter"
                className="text-slate-300 hover:text-white transition-colors px-4 py-2"
              >
                Recruiter Mode
              </Link>
              <Link
                to="/upload"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Resume Intelligence
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Don't just read resumes.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Verify the story behind them.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered resume intelligence, evidence analysis and recruiter decision support. 
              Go beyond simple scoring to understand the real candidate.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/upload"
                className="group bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-8 py-4 rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center gap-2"
              >
                Analyze a Resume
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/recruiter"
                className="bg-slate-800 text-white font-medium px-8 py-4 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Recruiter Mode
              </Link>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Complete Resume Intelligence
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Four powerful modules working together to give you the full picture.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all hover:-translate-y-1"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section id="differentiator" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/50 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why ResumeGuard AI?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We don't just give you a score. We give you the evidence behind it.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {differentiators.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Key Differentiator Callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-8"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Eye className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Resume Quality ≠ Evidence Strength
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  A resume can be beautifully written with a 91/100 quality score, but have only 67/100 evidence strength.
                  ResumeGuard AI shows you both — and explains <strong className="text-white">WHY</strong>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Three simple steps to comprehensive resume intelligence.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Resume', desc: 'Upload PDF, DOCX, or TXT. Our parser extracts all structured information.' },
              { step: '02', title: 'AI Analysis', desc: 'Our engine analyzes skills, evidence, consistency, and credibility.' },
              { step: '03', title: 'Get Insights', desc: 'Review detailed scores, evidence, and actionable recommendations.' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-slate-700/50 absolute -top-4 left-0">{item.step}</div>
                <div className="pt-8 pl-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-slate-500 mt-12 max-w-3xl mx-auto"
          >
            Under the hood: documents are read in-browser (pdf.js, mammoth) and structured with
            rule-based section detection — heuristic NLP, not a trained BERT model. Scoring and
            verification run locally; the optional AI Insights narrative uses a local LLM.
          </motion.p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-3xl p-8 sm:p-12 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to analyze your first resume?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Start with a free analysis. No credit card required.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-white text-emerald-600 font-semibold px-8 py-4 rounded-xl hover:shadow-xl transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">ResumeGuard AI</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2025 ResumeGuard AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
