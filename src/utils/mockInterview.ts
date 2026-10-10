import { ParsedResume } from '../types';
import { CandidateMatch, CandidateProfile, InterviewQuestion } from '../types/recruiter';
import { generateChallengeReport } from './challengeReport';

export interface InterviewAnswerRecord {
  questionId: string;
  answer: string;
  score: number;
  feedback: string;
  method: 'ollama' | 'heuristic';
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  questions: InterviewQuestion[];
  answers: InterviewAnswerRecord[];
  currentIndex: number;
  startedAt: string;
  completedAt?: string;
}

export function buildInterviewQuestions(
  match: CandidateMatch,
  candidate: CandidateProfile,
  resume?: ParsedResume | null,
): InterviewQuestion[] {
  const report = generateChallengeReport(match, candidate, resume);
  const merged = [
    ...(report.credentialQuestions || []),
    ...report.technicalQuestions,
    ...report.behavioralQuestions,
  ];
  const seen = new Set<string>();
  const priorityRank: Record<InterviewQuestion['priority'], number> = { high: 0, medium: 1, low: 2 };
  return merged
    .filter(q => {
      const key = q.question.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 8);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(token => token.length > 2);
}

export function scoreInterviewAnswerHeuristic(question: InterviewQuestion, answer: string): InterviewAnswerRecord {
  const trimmed = answer.trim();
  if (trimmed.length < 20) {
    return {
      questionId: question.id,
      answer,
      score: 8,
      feedback: 'Offline heuristic: the answer is too short to show concrete evidence. Add a specific project, your role, and a result.',
      method: 'heuristic',
    };
  }

  const answerTokens = new Set(tokenize(trimmed));
  const claimTokens = tokenize(`${question.claim} ${question.question} ${question.reason}`);
  const overlap = claimTokens.filter(token => answerTokens.has(token)).length;
  const overlapRatio = claimTokens.length ? overlap / claimTokens.length : 0;
  const hasNumber = /\d/.test(trimmed);
  const hasProjectCue = /(project|built|implemented|designed|deployed|led|owned|migrated|shipped)/i.test(trimmed);
  const lengthBonus = Math.min(20, Math.floor(trimmed.split(/\s+/).length / 8));

  let score = Math.round(overlapRatio * 45) + lengthBonus;
  if (hasNumber) score += 15;
  if (hasProjectCue) score += 15;
  score = Math.max(10, Math.min(78, score));

  const bits: string[] = [
    'Offline heuristic scoring (Ollama was not used).',
    overlapRatio >= 0.2 ? 'The answer referenced terms from the claim.' : 'The answer barely referenced the claimed skill or experience.',
    hasProjectCue ? 'It mentioned delivery work (project/build/deploy).' : 'It did not mention a concrete delivery.',
    hasNumber ? 'It included a number or metric.' : 'No measurable outcome was stated.',
  ];

  return {
    questionId: question.id,
    answer,
    score,
    feedback: bits.join(' '),
    method: 'heuristic',
  };
}

export function interviewAverage(session: InterviewSession): number | null {
  if (session.answers.length === 0) return null;
  return Math.round(session.answers.reduce((sum, a) => sum + a.score, 0) / session.answers.length);
}

export interface InterviewConfidence {
  level: 'strong' | 'mixed' | 'weak';
  label: string;
  rationale: string;
}

// A transparent read on how well the candidate substantiated their claims under
// questioning. This is a consistency signal, NOT a fraud or credential check.
export function interviewConfidence(session: InterviewSession): InterviewConfidence | null {
  if (session.answers.length === 0) return null;

  const avg = interviewAverage(session) ?? 0;
  const weakAnswers = session.answers.filter(a => a.score < 25).length;
  const verificationAnswers = session.answers.filter(a => {
    const q = session.questions.find(x => x.id === a.questionId);
    return q?.category === 'credential' || q?.category === 'verification';
  });
  const verificationAvg = verificationAnswers.length
    ? Math.round(verificationAnswers.reduce((s, a) => s + a.score, 0) / verificationAnswers.length)
    : null;

  let level: InterviewConfidence['level'] = 'mixed';
  if (avg >= 65 && weakAnswers === 0 && (verificationAvg === null || verificationAvg >= 55)) {
    level = 'strong';
  } else if (avg < 40 || weakAnswers >= 2 || (verificationAvg !== null && verificationAvg < 35)) {
    level = 'weak';
  }

  const label = level === 'strong'
    ? 'Strong confidence — claimed skills and credentials backed by consistent, specific detail'
    : level === 'weak'
      ? 'Weak confidence — claims were vague, evasive, or inconsistent under questioning'
      : 'Mixed confidence — some claims are well supported, others need follow-up';

  const rationale =
    `Average ${avg}% across ${session.answers.length} answer(s)` +
    (verificationAvg !== null ? `, ${verificationAvg}% on credential/verification questions` : '') +
    (weakAnswers ? `, ${weakAnswers} weak answer(s)` : '') +
    '. This reflects answer consistency and specificity only — it is not a fraud or credential-verification determination.';

  return { level, label, rationale };
}
