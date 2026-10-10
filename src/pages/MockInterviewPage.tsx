import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Brain, MessageSquare, Shield } from 'lucide-react';
import { useRecruiter } from '../context/RecruiterContext';
import { useToast } from '../context/ToastContext';
import {
  AI_MODELS,
  buildCandidateContext,
  checkOllamaStatus,
  getOllamaEndpoint,
  getPreferredModel,
  ollamaSetupHint,
  scoreInterviewAnswerWithLlm,
  setOllamaEndpoint,
  setPreferredModel,
} from '../utils/llm';
import {
  buildInterviewQuestions,
  interviewAverage,
  InterviewSession,
  scoreInterviewAnswerHeuristic,
} from '../utils/mockInterview';
import { loadState, saveState } from '../utils/storage';

const sessionKey = (candidateId: string) => `rg.interview_${candidateId}`;

const MockInterviewPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { getCandidate, getMatch, getParsedResume, currentJob } = useRecruiter();
  const { showToast } = useToast();

  const candidate = candidateId ? getCandidate(candidateId) : null;
  const match = candidateId ? getMatch(candidateId) : null;
  const resume = candidateId ? getParsedResume(candidateId) : null;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [useOllama, setUseOllama] = useState(true);
  const [endpoint, setEndpoint] = useState(getOllamaEndpoint());
  const [model, setModel] = useState(getPreferredModel());
  const [models, setModels] = useState<string[]>([]);
  const [ollamaReady, setOllamaReady] = useState(false);

  useEffect(() => {
    checkOllamaStatus(endpoint).then(status => {
      setOllamaReady(status.available);
      setModels(status.models);
    });
  }, [endpoint]);

  useEffect(() => {
    if (!candidateId || !candidate || !match) return;
    const existing = loadState<InterviewSession | null>(sessionKey(candidateId), null);
    if (existing && existing.candidateId === candidateId && existing.questions.length > 0) {
      setSession(existing);
      return;
    }
    const created: InterviewSession = {
      id: `int_${Date.now()}`,
      candidateId,
      candidateName: candidate.name,
      jobTitle: currentJob?.title || 'Open role',
      questions: buildInterviewQuestions(match, candidate),
      answers: [],
      currentIndex: 0,
      startedAt: new Date().toISOString(),
    };
    setSession(created);
    saveState(sessionKey(candidateId), created);
  }, [candidateId, candidate, match, currentJob?.title]);

  useEffect(() => {
    if (session && candidateId) saveState(sessionKey(candidateId), session);
  }, [session, candidateId]);

  const question = session?.questions[session.currentIndex];
  const average = session ? interviewAverage(session) : null;
  const done = Boolean(session && session.currentIndex >= session.questions.length);

  const contextBlock = useMemo(() => {
    if (!candidate) return '';
    return buildCandidateContext(candidate, match, currentJob, resume);
  }, [candidate, match, currentJob, resume]);

  const submit = async () => {
    if (!session || !question || busy) return;
    const answer = draft.trim();
    if (!answer) {
      showToast('error', 'Type an answer before scoring.');
      return;
    }
    setBusy(true);
    try {
      let record = scoreInterviewAnswerHeuristic(question, answer);
      if (useOllama && ollamaReady) {
        try {
          const llm = await scoreInterviewAnswerWithLlm(question, answer, contextBlock, model);
          record = { ...llm, questionId: question.id, answer };
        } catch {
          showToast('error', `${ollamaSetupHint()} Using offline heuristic scoring instead.`);
        }
      } else if (useOllama && !ollamaReady) {
        showToast('error', `${ollamaSetupHint()} Using offline heuristic scoring.`);
      }
      setSession({
        ...session,
        answers: [...session.answers, record],
        currentIndex: session.currentIndex + 1,
        completedAt: session.currentIndex + 1 >= session.questions.length ? new Date().toISOString() : undefined,
      });
      setDraft('');
    } finally {
      setBusy(false);
    }
  };

  if (!candidate || !match) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Candidate not found. Open recruiter mode and select someone from the pool.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(`/recruiter/candidate/${candidate.id}`)} className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back to candidate
          </button>
          <Link to="/" className="flex items-center gap-2 text-white font-semibold">
            <Shield className="w-5 h-5 text-emerald-400" /> ResumeGuard AI
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <p className="text-sm text-slate-400">Text mock interview</p>
          <h1 className="text-3xl font-bold text-white">{candidate.name}</h1>
          <p className="text-slate-400 mt-1">{session?.jobTitle} · questions are generated from this candidate’s job-match and verification flags</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={useOllama} onChange={(e) => setUseOllama(e.target.checked)} />
            Score answers with local Ollama when reachable
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={endpoint}
              onChange={(e) => {
                setEndpoint(e.target.value);
                setOllamaEndpoint(e.target.value);
              }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm"
              placeholder="http://localhost:11434"
            />
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setPreferredModel(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm"
            >
              {Array.from(new Set([...AI_MODELS, ...models, model])).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">
            {ollamaReady ? `Ollama reachable. ${models.length} model(s) listed.` : 'Ollama offline — answers are scored with a labeled heuristic, not a fake model.'}
          </p>
        </div>

        {session && !done && question && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-cyan-400 text-sm mb-2">
              <MessageSquare className="w-4 h-4" />
              Question {session.currentIndex + 1} of {session.questions.length} · {question.category} · {question.priority} priority
            </div>
            <p className="text-white text-lg font-medium">{question.question}</p>
            <p className="text-sm text-slate-400 mt-2">Claim under test: {question.claim}</p>
            <p className="text-xs text-slate-500 mt-1">{question.reason}</p>
            {question.followUp.length > 0 && (
              <ul className="mt-3 text-sm text-slate-400 list-disc list-inside">
                {question.followUp.map(f => <li key={f}>{f}</li>)}
              </ul>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={7}
              placeholder="Type a specific answer: project, your role, tools, and a result."
              className="mt-4 w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={submit}
              disabled={busy}
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-medium px-5 py-2.5 rounded-xl"
            >
              {busy ? 'Scoring…' : 'Submit answer'}
            </button>
          </div>
        )}

        {done && session && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              Interview complete
            </h2>
            <p className="text-slate-300 mt-2">
              Average score {average ?? 0}% across {session.answers.length} answers.
              This is practice scoring for recruiters, not a hiring decision.
            </p>
          </div>
        )}

        {session && session.answers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Scored answers</h3>
            {session.answers.map((a, i) => {
              const q = session.questions.find(item => item.id === a.questionId);
              return (
                <div key={a.questionId} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Q{i + 1} · {a.score}% · {a.method === 'ollama' ? 'Ollama' : 'Offline heuristic'}</p>
                  <p className="text-white mt-1">{q?.question}</p>
                  <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{a.answer}</p>
                  <p className="text-sm text-cyan-200 mt-2">{a.feedback}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MockInterviewPage;
