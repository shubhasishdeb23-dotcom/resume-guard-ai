import { DemoCandidate } from '../types/recruiter';

export const DEMO_JOB: any = {
  id: 'job_demo_001',
  title: 'AI/ML Engineer',
  company: 'TechCorp AI',
  location: 'San Francisco, CA',
  employmentType: 'Full-time',
  rawText: `
AI/ML Engineer - TechCorp AI

We are looking for an experienced AI/ML Engineer to join our team.

Requirements:
- 3+ years of experience in machine learning
- Strong Python programming skills
- Experience with TensorFlow or PyTorch
- Knowledge of AWS or other cloud platforms
- Docker and Kubernetes experience
- Strong problem-solving skills

Preferred:
- Experience with NLP or computer vision
- Published research papers
- Experience with distributed training

Responsibilities:
- Design and implement ML models
- Optimize model performance
- Deploy models to production
- Collaborate with product teams

Education:
- Bachelor's or Master's in CS, ML, or related field
  `,
  extracted: {
    requiredSkills: ['python', 'machine learning', 'tensorflow', 'pytorch', 'aws', 'docker', 'kubernetes'],
    preferredSkills: ['nlp', 'computer vision', 'distributed training'],
    technologies: ['python', 'tensorflow', 'pytorch', 'aws', 'docker', 'kubernetes'],
    experience: { years: 3, level: 'mid', description: '3+ years' },
    education: [{ degree: 'bachelor', field: 'Computer Science', required: true }],
    responsibilities: ['Design and implement ML models', 'Optimize model performance', 'Deploy models to production'],
    certifications: [],
    domainRequirements: ['machine learning'],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    id: 'candidate_a',
    name: 'Alex Chen',
    profile: {
      id: 'profile_a',
      resumeId: 'resume_a',
      name: 'Alex Chen',
      email: 'alex.chen@email.com',
      summary: 'ML Engineer with 4 years experience building production AI systems',
      yearsExperience: 4,
      topSkills: ['Python', 'TensorFlow', 'Docker', 'AWS'],
      education: 'MS Computer Science, Stanford University',
      experience: '4 years at 2 companies',
      overallScore: 85,
      evidenceScore: 89,
      skillDepthScore: 88,
      atsScore: 91,
      skillMatch: 91,
      riskSignals: 2,
      verificationStatus: 'verified',
      uploadedAt: new Date(),
      status: 'analyzed',
    },
    resume: {
      id: 'resume_a',
      candidate: {
        name: 'Alex Chen',
        email: 'alex.chen@email.com',
        summary: 'Machine Learning Engineer with 4 years of experience building production AI systems. Specialized in NLP and deep learning.',
      },
      skills: [
        { id: 's1', name: 'Python', category: 'Programming', supportLevel: 'supported', evidence: [{ source: 'ML Pipeline Project' }, { source: 'NLP Service' }] },
        { id: 's2', name: 'TensorFlow', category: 'Frameworks', supportLevel: 'supported', evidence: [{ source: 'Recommendation System' }] },
        { id: 's3', name: 'Docker', category: 'DevOps', supportLevel: 'supported', evidence: [{ source: 'Production Deployment' }] },
        { id: 's4', name: 'AWS', category: 'Cloud', supportLevel: 'supported', evidence: [{ source: 'Cloud Infrastructure Project' }] },
        { id: 's5', name: 'Kubernetes', category: 'DevOps', supportLevel: 'weakly_supported', evidence: [{ source: 'Skills section' }] },
      ],
      projects: [
        { id: 'p1', name: 'ML Pipeline', description: 'Built production ML pipeline processing 10K predictions/day', technologies: ['Python', 'TensorFlow', 'Docker'], depthScore: 85, github: 'https://github.com/alex/ml-pipeline' },
        { id: 'p2', name: 'NLP Service', description: 'NLP microservice for sentiment analysis', technologies: ['Python', 'FastAPI', 'AWS'], depthScore: 78 },
      ],
      experience: [
        { id: 'e1', company: 'DataCorp', role: 'ML Engineer', startDate: '2021-06', endDate: null, current: true, technologies: ['Python', 'TensorFlow'] },
        { id: 'e2', company: 'StartupAI', role: 'Data Scientist', startDate: '2020-01', endDate: '2021-05', current: false, technologies: ['Python', 'scikit-learn'] },
      ],
      education: [
        { id: 'edu1', institution: 'Stanford University', degree: 'MS', field: 'Computer Science', startDate: '2018', endDate: '2020' },
      ],
      certifications: [],
    },
    match: {
      id: 'match_a',
      resumeId: 'resume_a',
      jobId: 'job_demo_001',
      overallFit: 88,
      skillMatch: { score: 91, matched: ['python', 'tensorflow', 'docker', 'aws'], missing: ['kubernetes'], additional: ['fastapi'], details: [] },
      experienceMatch: { score: 95, yearsRequired: 3, yearsFound: 4, relevant: true, gap: 0, details: 'Exceeds requirement' },
      projectMatch: { score: 90, relevantProjects: ['ML Pipeline', 'NLP Service'], technologiesMatched: ['Python', 'TensorFlow', 'AWS'], details: '2 relevant projects' },
      educationMatch: { score: 100, meetsRequirement: true, details: 'MS CS from Stanford' },
      evidenceMatch: { score: 89, strongEvidence: 4, weakEvidence: 1, suspiciousSignals: 0 },
      missingRequirements: ['Kubernetes experience limited'],
      recommendedVerification: ['Verify Kubernetes depth'],
      riskLevel: 'low',
      recommendation: 'strong_match',
      recommendationReason: 'Strong technical skills with excellent evidence. Meets all requirements.',
      analyzedAt: new Date(),
    },
    challenges: {
      topStrongClaims: [
        { claim: 'Built production ML pipeline', evidence: 'GitHub link provided, 10K predictions/day metric' },
        { claim: 'Python expertise', evidence: '2 projects, 2 experience entries' },
      ],
      topWeakClaims: [
        { claim: 'Kubernetes experience', missing: 'Only in skills section, no project evidence' },
      ],
      technicalQuestions: [
        { id: 'q1', category: 'technical', claim: 'Kubernetes experience', question: 'Can you describe a specific Kubernetes deployment you managed?', followUp: ['What challenges did you face?'], priority: 'medium', reason: 'Limited evidence' },
      ],
      behavioralQuestions: [],
      weakestEvidenceAreas: ['Kubernetes'],
      possibleContradictions: [],
    },
  },
  {
    id: 'candidate_b',
    name: 'Brian Taylor',
    profile: {
      id: 'profile_b',
      resumeId: 'resume_b',
      name: 'Brian Taylor',
      email: 'brian.t@email.com',
      summary: 'Elite AI Engineer with exceptional track record of breakthrough results',
      yearsExperience: 5,
      topSkills: ['Python', 'Machine Learning', 'Kubernetes', 'TensorFlow', 'AWS', 'Docker'],
      education: 'PhD Machine Learning, MIT',
      experience: '5 years at top tech companies',
      overallScore: 94,
      evidenceScore: 62,
      skillDepthScore: 35,
      atsScore: 96,
      skillMatch: 96,
      riskSignals: 8,
      verificationStatus: 'flagged',
      uploadedAt: new Date(),
      status: 'analyzed',
    },
    resume: {
      id: 'resume_b',
      candidate: {
        name: 'Brian Taylor',
        email: 'brian.t@email.com',
        summary: 'Visionary AI Engineer with exceptional track record of breakthrough machine learning solutions. Led transformative projects delivering 500%+ improvements.',
      },
      skills: [
        { id: 's1', name: 'Python', category: 'Programming', supportLevel: 'weakly_supported', evidence: [{ source: 'Skills section' }] },
        { id: 's2', name: 'TensorFlow', category: 'Frameworks', supportLevel: 'unsupported', evidence: [] },
        { id: 's3', name: 'Kubernetes', category: 'DevOps', supportLevel: 'unsupported', evidence: [] },
        { id: 's4', name: 'AWS', category: 'Cloud', supportLevel: 'unsupported', evidence: [] },
        { id: 's5', name: 'Docker', category: 'DevOps', supportLevel: 'weakly_supported', evidence: [{ source: 'Brief mention' }] },
      ],
      projects: [
        { id: 'p1', name: 'Revolutionary AI Platform', description: 'Built groundbreaking AI platform serving millions of users', technologies: ['Python', 'TensorFlow'], depthScore: 35, github: undefined },
        { id: 'p2', name: 'Enterprise ML System', description: 'Designed scalable machine learning infrastructure', technologies: ['Kubernetes', 'AWS'], depthScore: 40 },
      ],
      experience: [
        { id: 'e1', company: 'TechGiant', role: 'Senior AI Engineer', startDate: '2022-01', endDate: null, current: true, technologies: ['Python', 'TensorFlow'] },
        { id: 'e2', company: 'InnovationLabs', role: 'AI Engineer', startDate: '2022-06', endDate: '2024-01', current: false, technologies: ['Python'] },
      ],
      education: [
        { id: 'edu1', institution: 'MIT', degree: 'PhD', field: 'Machine Learning', startDate: '2015', endDate: '2020' },
      ],
      certifications: [],
    },
    match: {
      id: 'match_b',
      resumeId: 'resume_b',
      jobId: 'job_demo_001',
      overallFit: 72,
      skillMatch: { score: 96, matched: ['python', 'tensorflow', 'kubernetes', 'aws', 'docker'], missing: [], additional: [], details: [] },
      experienceMatch: { score: 100, yearsRequired: 3, yearsFound: 5, relevant: true, gap: 0, details: 'Exceeds requirement' },
      projectMatch: { score: 45, relevantProjects: [], technologiesMatched: [], details: 'Projects lack technical depth' },
      educationMatch: { score: 100, meetsRequirement: true, details: 'PhD ML from MIT' },
      evidenceMatch: { score: 62, strongEvidence: 0, weakEvidence: 2, suspiciousSignals: 3 },
      missingRequirements: [],
      recommendedVerification: [
        'Verify TensorFlow experience - no supporting evidence',
        'Verify Kubernetes experience - no supporting evidence',
        'Verify AWS experience - no supporting evidence',
        'Timeline overlap detected between TechGiant and InnovationLabs',
        'Project claims lack technical details',
      ],
      riskLevel: 'high',
      recommendation: 'needs_verification',
      recommendationReason: 'Resume appears impressive but evidence is weak. Multiple claims lack supporting proof. Timeline inconsistency detected.',
      analyzedAt: new Date(),
    },
    challenges: {
      topStrongClaims: [
        { claim: 'PhD in Machine Learning from MIT', evidence: 'Education section' },
      ],
      topWeakClaims: [
        { claim: 'Built revolutionary AI platform serving millions', missing: 'No GitHub, no metrics, no architecture details' },
        { claim: 'Kubernetes expertise', missing: 'No project or experience evidence' },
        { claim: 'AWS expertise', missing: 'No deployment or infrastructure evidence' },
        { claim: 'Led transformative projects with 500%+ improvements', missing: 'No baseline, no measurement method, no context' },
      ],
      technicalQuestions: [
        { id: 'q1', category: 'technical', claim: 'Built revolutionary AI platform', question: 'Can you describe the architecture of this AI platform? What specific technologies did you use and what were the actual metrics?', followUp: ['What was your specific contribution?', 'Can you share the GitHub repository?'], priority: 'high', reason: 'High-level claim with no technical evidence' },
        { id: 'q2', category: 'technical', claim: 'Kubernetes expertise', question: 'Describe a specific Kubernetes deployment you configured. What challenges did you solve?', followUp: ['How did you handle scaling?', 'What monitoring did you use?'], priority: 'high', reason: 'Skill claimed but no evidence' },
      ],
      behavioralQuestions: [
        { id: 'q3', category: 'behavioral', claim: 'Led transformative projects', question: 'Tell me about a specific project where you achieved 500% improvement. What was the baseline and how did you measure it?', followUp: [], priority: 'high', reason: 'Extraordinary claim needs verification' },
      ],
      weakestEvidenceAreas: ['TensorFlow', 'Kubernetes', 'AWS', 'Docker'],
      possibleContradictions: ['Timeline overlap: TechGiant (2022-present) and InnovationLabs (2022-2024) overlap by 6 months'],
    },
  },
  {
    id: 'candidate_c',
    name: 'Carol Martinez',
    profile: {
      id: 'profile_c',
      resumeId: 'resume_c',
      name: 'Carol Martinez',
      email: 'carol.m@email.com',
      summary: 'Software Engineer transitioning to ML with strong project portfolio',
      yearsExperience: 3,
      topSkills: ['Python', 'Docker', 'AWS', 'scikit-learn'],
      education: 'BS Computer Science, UC Berkeley',
      experience: '3 years software development',
      overallScore: 78,
      evidenceScore: 92,
      skillDepthScore: 90,
      atsScore: 85,
      skillMatch: 78,
      riskSignals: 1,
      verificationStatus: 'verified',
      uploadedAt: new Date(),
      status: 'analyzed',
    },
    resume: {
      id: 'resume_c',
      candidate: {
        name: 'Carol Martinez',
        email: 'carol.m@email.com',
        summary: 'Software Engineer with growing ML expertise. Built several ML projects while working as a backend developer.',
      },
      skills: [
        { id: 's1', name: 'Python', category: 'Programming', supportLevel: 'supported', evidence: [{ source: 'ML Classifier Project' }, { source: 'Backend Service' }] },
        { id: 's2', name: 'Docker', category: 'DevOps', supportLevel: 'supported', evidence: [{ source: 'Containerized Deployment' }] },
        { id: 's3', name: 'AWS', category: 'Cloud', supportLevel: 'supported', evidence: [{ source: 'EC2 Deployment Project' }] },
        { id: 's4', name: 'scikit-learn', category: 'Frameworks', supportLevel: 'supported', evidence: [{ source: 'ML Classifier Project' }] },
      ],
      projects: [
        { id: 'p1', name: 'Image Classifier', description: 'Built CNN image classifier achieving 94% accuracy on custom dataset. Deployed on AWS EC2.', technologies: ['Python', 'TensorFlow', 'AWS', 'Docker'], depthScore: 82, github: 'https://github.com/carol/image-classifier' },
        { id: 'p2', name: 'ML API Service', description: 'REST API for ML model inference using FastAPI and Docker', technologies: ['Python', 'Docker', 'FastAPI'], depthScore: 75, github: 'https://github.com/carol/ml-api' },
      ],
      experience: [
        { id: 'e1', company: 'WebApp Inc', role: 'Backend Developer', startDate: '2021-03', endDate: null, current: true, technologies: ['Python', 'Docker'] },
      ],
      education: [
        { id: 'edu1', institution: 'UC Berkeley', degree: 'BS', field: 'Computer Science', startDate: '2017', endDate: '2021' },
      ],
      certifications: [],
    },
    match: {
      id: 'match_c',
      resumeId: 'resume_c',
      jobId: 'job_demo_001',
      overallFit: 82,
      skillMatch: { score: 78, matched: ['python', 'docker', 'aws'], missing: ['tensorflow', 'kubernetes'], additional: ['scikit-learn', 'fastapi'], details: [] },
      experienceMatch: { score: 85, yearsRequired: 3, yearsFound: 3, relevant: true, gap: 0, details: 'Meets requirement' },
      projectMatch: { score: 85, relevantProjects: ['Image Classifier', 'ML API Service'], technologiesMatched: ['Python', 'AWS', 'Docker'], details: '2 ML projects with GitHub' },
      educationMatch: { score: 100, meetsRequirement: true, details: 'BS CS from UC Berkeley' },
      evidenceMatch: { score: 92, strongEvidence: 4, weakEvidence: 0, suspiciousSignals: 0 },
      missingRequirements: ['TensorFlow experience', 'Kubernetes experience'],
      recommendedVerification: ['Learn Kubernetes basics before interview'],
      riskLevel: 'low',
      recommendation: 'potential_match',
      recommendationReason: 'Strong evidence for existing skills. Missing TensorFlow and Kubernetes but shows ability to learn quickly.',
      analyzedAt: new Date(),
    },
    challenges: {
      topStrongClaims: [
        { claim: 'Built CNN image classifier with 94% accuracy', evidence: 'GitHub link, specific metric, AWS deployment' },
        { claim: 'Docker expertise', evidence: '2 projects with containerization' },
      ],
      topWeakClaims: [],
      technicalQuestions: [
        { id: 'q1', category: 'technical', claim: 'Missing TensorFlow', question: 'Your projects use scikit-learn. How would you approach learning TensorFlow for this role?', followUp: [], priority: 'low', reason: 'Skill gap but not blocking' },
      ],
      behavioralQuestions: [],
      weakestEvidenceAreas: [],
      possibleContradictions: [],
    },
  },
];
