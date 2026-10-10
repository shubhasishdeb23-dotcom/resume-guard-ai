import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  Loader2, 
  ArrowRight,
  Shield,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { useResume } from '../context/ResumeContext';

const SAMPLE_RESUME = `Alex Carter
San Francisco, CA | alex.carter@email.com | (415) 555-0134
linkedin.com/in/alexcarter | github.com/alexcarter

PROFESSIONAL SUMMARY
Senior full-stack engineer with 7 years of experience building scalable web applications. 
Specialized in React, TypeScript, and Node.js with a strong focus on performance, 
accessibility, and automated testing. Led teams of 4-6 engineers delivering products 
that serve over 2 million monthly users.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL
Frameworks: React, Node.js, Express, Next.js
Cloud & DevOps: AWS, Docker, Kubernetes, GitHub Actions, Terraform
Databases: PostgreSQL, MongoDB, Redis
Testing: Jest, Cypress, Playwright
Tools: Git, Jira, Figma

EXPERIENCE
Senior Software Engineer, TechCorp AI | San Francisco, CA
March 2021 - Present
- Led migration of a legacy monolith to React and Node.js microservices, reducing API latency by 62%
- Designed and built a real-time analytics dashboard processing 40M+ events daily
- Mentored 5 junior engineers; established code review and CI/CD best practices
- Reduced cloud infrastructure costs by 28% through auto-scaling and caching optimizations

Software Engineer, DataStream Ltd | Austin, TX
June 2018 - February 2021
- Built customer-facing React applications used by 500,000+ monthly active users
- Implemented a GraphQL API layer that cut data fetching time in half
- Introduced automated end-to-end testing with Cypress, raising test coverage from 20% to 85%

PROJECTS
Real-Time Collaboration Editor
- Built a distributed document editor with CRDT algorithms and WebSocket sync
- Technologies: React, TypeScript, Node.js, Redis, WebSockets
- Supports 1,000+ concurrent editors with sub-100ms latency

ML Resume Analyzer
- Developed a resume analysis pipeline extracting and scoring structured candidate data
- Technologies: React, Python, TensorFlow, Docker
- Achieved 92% accuracy on skill extraction across 10k test documents

EDUCATION
Bachelor of Science in Computer Science
University of Texas at Austin | 2014 - 2018
GPA: 3.6/4.0

CERTIFICATIONS
- AWS Solutions Architect - Associate (2023)
- Certified Kubernetes Administrator (2022)
`;

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { uploadResume, isUploading, isParsing, currentResume } = useResume();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const acceptedExtensions = '.pdf,.docx,.txt';

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return 'PDF';
    if (type.includes('word')) return 'DOCX';
    return 'TXT';
  };

  const handleFile = useCallback(async (file: File) => {
    if (!acceptedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      alert('Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    
    setSelectedFile(file);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    
    await uploadResume(file);
    
    setTimeout(() => {
      navigate('/analysis');
    }, 1000);
  }, [uploadResume, navigate]);

  const loadSampleFile = useCallback(async (kind: string) => {
    if (kind === 'txt') {
      handleFile(new File([SAMPLE_RESUME], 'sample_resume.txt', { type: 'text/plain' }));
      return;
    }

    const files: Record<string, { name: string; type: string }> = {
      pdf: { name: 'Alex_Carter_Resume.pdf', type: 'application/pdf' },
      docx: { name: 'Alex_Carter_Resume.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'nurse-txt': { name: 'Maria_Gonzalez_RN_Resume.txt', type: 'text/plain' },
      'nurse-pdf': { name: 'Maria_Gonzalez_RN_Resume.pdf', type: 'application/pdf' },
      'teacher-txt': { name: 'David_Okafor_Teacher_Resume.txt', type: 'text/plain' },
      'teacher-pdf': { name: 'David_Okafor_Teacher_Resume.pdf', type: 'application/pdf' },
    };
    const file = files[kind];
    if (!file) return;

    try {
      setLoadingSample(kind);
      const response = await fetch(`${import.meta.env.BASE_URL}samples/${file.name}`);
      if (!response.ok) throw new Error(`Sample fetch failed: HTTP ${response.status}`);
      const blob = await response.blob();
      await handleFile(new File([blob], file.name, { type: file.type }));
    } catch (error) {
      console.error('Failed to load sample file:', error);
      alert('Could not load the sample file. Please upload your own resume instead.');
    } finally {
      setLoadingSample(null);
    }
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ResumeGuard AI</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/recruiter" className="text-slate-300 hover:text-white transition-colors">
                Recruiter Mode
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Upload Your Resume
          </h1>
          <p className="text-slate-400">
            We'll extract and analyze all the important information.
          </p>
        </motion.div>

        {/* Upload Area */}
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
                ${isDragOver 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                }
              `}
            >
              <input
                type="file"
                accept={acceptedExtensions}
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="flex flex-col items-center">
                <div className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all
                  ${isDragOver ? 'bg-emerald-500/20' : 'bg-slate-700/50'}
                `}>
                  <Upload className={`w-10 h-10 ${isDragOver ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                
                <p className="text-xl font-medium text-white mb-2">
                  {isDragOver ? 'Drop your file here' : 'Drag and drop your resume'}
                </p>
                <p className="text-slate-400 mb-6">
                  or click to browse
                </p>
                
                <div className="flex items-center gap-3">
                  {['PDF', 'DOCX', 'TXT'].map((format) => (
                    <span
                      key={format}
                      className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 text-sm font-medium"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                {/* File Icon */}
                <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-emerald-400">
                    {getFileIcon(selectedFile.type)}
                  </span>
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white truncate">{selectedFile.name}</p>
                      <p className="text-sm text-slate-400 mt-1">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    {!isUploading && !isParsing && uploadProgress < 100 && (
                      <button
                        onClick={handleRemove}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">
                        {isParsing ? 'Parsing resume...' : isUploading ? 'Uploading...' : uploadProgress >= 100 ? 'Complete' : 'Ready'}
                      </span>
                      <span className="text-emerald-400 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>
                  
                  {/* Status */}
                  {isParsing && (
                    <div className="mt-4 flex items-center gap-2 text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Extracting structured data...</span>
                    </div>
                  )}
                  
                  {uploadProgress >= 100 && !isParsing && (
                    <div className="mt-4 flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Upload complete! Redirecting...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample Resumes */}
        {!selectedFile && (
          <div className="text-center mt-6">
            <p className="text-slate-400 text-sm mb-3">No resume handy? Try a sample (tech, healthcare or teaching):</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {([
                { kind: 'txt', label: 'Tech TXT' },
                { kind: 'pdf', label: 'Tech PDF' },
                { kind: 'docx', label: 'Tech DOCX' },
                { kind: 'nurse-txt', label: 'Nurse TXT' },
                { kind: 'nurse-pdf', label: 'Nurse PDF' },
                { kind: 'teacher-txt', label: 'Teacher TXT' },
                { kind: 'teacher-pdf', label: 'Teacher PDF' },
              ]).map(({ kind, label }) => (
                <button
                  key={kind}
                  onClick={() => loadSampleFile(kind)}
                  disabled={loadingSample !== null}
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm border border-slate-700/60 hover:border-slate-500 rounded-lg px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSample === kind ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Privacy First</h3>
                <p className="text-sm text-slate-400">Your resume data is processed securely and never shared.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Full Extraction</h3>
                <p className="text-sm text-slate-400">We extract skills, projects, experience, and more.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">How Parsing Works</h3>
                <p className="text-sm text-slate-400">
                  Text is extracted in your browser (pdf.js / mammoth) and structured with rule-based
                  section detection — no trained BERT model. Optional AI insights can run on a local LLM.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default UploadPage;
