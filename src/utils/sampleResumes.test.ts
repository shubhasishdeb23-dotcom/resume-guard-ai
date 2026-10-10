import { describe, it, expect } from 'vitest';
import { parseResumeText } from './resumeParser';
import nurseSample from '../../public/samples/Maria_Gonzalez_RN_Resume.txt?raw';
import teacherSample from '../../public/samples/David_Okafor_Teacher_Resume.txt?raw';

describe('domain-agnostic sample parsing', () => {
  it('parses a nursing resume into healthcare structure', () => {
    const resume = parseResumeText(nurseSample, 'r_nurse', 'Maria_Gonzalez_RN_Resume.txt', nurseSample.length, 1);

    expect(resume.candidate.name).toContain('Maria');
    expect(resume.candidate.email).toContain('maria.gonzalez@email.com');
    expect(resume.candidate.location).toContain('Austin');

    const skillNames = resume.skills.map(s => s.name.toLowerCase());
    expect(skillNames).toContain('patient assessment');
    expect(skillNames).toContain('triage');
    expect(skillNames).toContain('communication');

    expect(resume.experience.length).toBeGreaterThanOrEqual(2);
    const rnRole = resume.experience.find(e => /registered nurse/i.test(e.role));
    expect(rnRole).toBeTruthy();
    const allAchievements = resume.experience.flatMap(e => e.achievements).join(' ');
    expect(allAchievements).toMatch(/25%|98%|40%/);
    const metrics = resume.experience.flatMap(e => e.metrics);
    expect(metrics.length).toBeGreaterThan(0);

    expect(resume.education.length).toBeGreaterThanOrEqual(1);
    expect(resume.education[0].field).toMatch(/nursing/i);

    expect(resume.certifications.length).toBeGreaterThanOrEqual(2);
    const certText = resume.certifications.map(c => c.name).join(' ');
    expect(certText).toMatch(/rn|registered nurse/i);
    expect(certText).toMatch(/bls|basic life support/i);
  });

  it('parses a teaching resume into education structure', () => {
    const resume = parseResumeText(teacherSample, 'r_teacher', 'David_Okafor_Teacher_Resume.txt', teacherSample.length, 1);

    expect(resume.candidate.name).toContain('David');
    expect(resume.candidate.location).toContain('Houston');

    const skillNames = resume.skills.map(s => s.name.toLowerCase());
    expect(skillNames).toContain('curriculum development');
    expect(skillNames).toContain('classroom management');

    expect(resume.experience.length).toBeGreaterThanOrEqual(2);
    const teacherRole = resume.experience.find(e => /mathematics teacher/i.test(e.role));
    expect(teacherRole).toBeTruthy();
    const allAchievements = resume.experience.flatMap(e => e.achievements).join(' ');
    expect(allAchievements).toMatch(/72% to 91%|90 points|150\+/);

    expect(resume.education.length).toBeGreaterThanOrEqual(1);
    const eduText = resume.education.map(e => `${e.degree} ${e.field}`).join(' ');
    expect(eduText).toMatch(/education|mathematics/i);

    const certText = resume.certifications.map(c => c.name).join(' ');
    expect(certText).toMatch(/teaching certificate/i);
  });

  it('still parses a tech resume with role-first pipe headers', () => {
    const text = `Alex Carter
San Francisco, CA | alex.carter@email.com | (415) 555-0134
linkedin.com/in/alexcarter | github.com/alexcarter

PROFESSIONAL SUMMARY
Senior full-stack engineer with 7 years of experience building scalable web applications.

TECHNICAL SKILLS
TypeScript, JavaScript, React, Node.js, PostgreSQL, Docker

EXPERIENCE
Senior Software Engineer, TechCorp AI | San Francisco, CA
March 2021 - Present
- Led migration of a legacy monolith to React and Node.js microservices, reducing API latency by 62%
- Reduced cloud infrastructure costs by 28% through auto-scaling

Software Engineer, DataStream Ltd | Austin, TX
June 2018 - February 2021
- Built customer-facing React applications used by 500,000+ monthly active users

EDUCATION
Bachelor of Science in Computer Science
University of Texas at Austin | 2014 - 2018

CERTIFICATIONS
- AWS Solutions Architect - Associate (2023)
`;
    const resume = parseResumeText(text, 'r_tech', 'tech.txt', text.length, 1);

    expect(resume.candidate.name).toBe('Alex Carter');
    expect(resume.experience).toHaveLength(2);

    const senior = resume.experience[0];
    expect(senior.role).toBe('Senior Software Engineer');
    expect(senior.company).toBe('TechCorp AI');
    expect(senior.location).toBe('San Francisco, CA');
    expect(senior.current).toBe(true);
    expect(senior.achievements.length).toBeGreaterThan(0);

    const junior = resume.experience[1];
    expect(junior.role).toBe('Software Engineer');
    expect(junior.company).toBe('DataStream Ltd');

    expect(resume.education.length).toBeGreaterThanOrEqual(1);
    expect(resume.certifications.length).toBeGreaterThanOrEqual(1);
  });
});
