import { ParsedResume } from '../types';

export function emptyResume(): ParsedResume {
  return {
    id: 'r_empty',
    fileName: 'empty.txt',
    fileSize: 100,
    uploadedAt: new Date('2024-01-01'),
    status: 'completed',
    version: 1,
    candidate: { name: '', email: '', links: { other: [] } },
    education: [],
    experience: [],
    internships: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    publications: [],
  };
}

export function richResume(): ParsedResume {
  return {
    ...emptyResume(),
    id: 'r_rich',
    candidate: {
      name: 'Alex Carter',
      email: 'alex@email.com',
      phone: '(555) 555-0100',
      location: 'San Francisco, CA',
      summary: 'Senior full-stack engineer with 7 years of experience',
      links: { github: 'https://github.com/alex', linkedin: 'https://linkedin.com/in/alex', other: [] },
    },
    skills: [
      {
        id: 's1',
        name: 'React',
        category: 'Frontend',
        claimed: true,
        evidence: [{ source: 'Worked on a React analytics dashboard', type: 'experience', context: 'Real-time dashboard' }],
        confidence: 'high',
        supportLevel: 'supported',
      },
      {
        id: 's2',
        name: 'Node.js',
        category: 'Backend',
        claimed: true,
        evidence: [{ source: 'Built Node.js GraphQL API', type: 'project', context: 'API layer' }],
        confidence: 'high',
        supportLevel: 'supported',
      },
    ],
    experience: [
      {
        id: 'e1',
        company: 'TechCorp',
        role: 'Senior Engineer',
        startDate: '2021-03',
        endDate: '2024-01',
        current: false,
        location: 'SF',
        responsibilities: ['Led migration to microservices'],
        technologies: ['React', 'Node.js', 'AWS'],
        achievements: ['Reduced API latency by 62%'],
        metrics: [
          {
            id: 'm1',
            claim: 'Reduced latency by 62%',
            value: 62,
            unit: '%',
            context: 'API',
            supportLevel: 'high',
            verification: 'n/a',
          },
        ],
      },
    ],
    internships: [],
    projects: [
      {
        id: 'p1',
        name: 'Collab Editor',
        description: 'Real-time distributed document editor',
        problem: 'Collaboration latency',
        solution: 'CRDTs',
        technologies: ['React', 'Node.js', 'Redis'],
        role: 'Lead',
        features: ['WebSocket sync'],
        metrics: [],
        depthScore: 85,
      },
    ],
    education: [
      { id: 'ed1', institution: 'University of Texas', degree: 'BS', field: 'Computer Science', startDate: '2014', endDate: '2018', gpa: '3.6' },
    ],
    certifications: [
      { id: 'c1', name: 'AWS Solutions Architect', issuer: 'AWS', date: '2023' },
    ],
    achievements: [],
    publications: [],
  };
}