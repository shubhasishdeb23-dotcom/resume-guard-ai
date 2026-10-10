import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, X, Cpu, AlertCircle } from 'lucide-react';
import { useRecruiter } from '../context/RecruiterContext';
import {
  AI_MODELS,
  ChatTurn,
  checkOllamaStatus,
  getOllamaEndpoint,
  getPreferredModel,
  ollamaSetupHint,
  recruiterChatReply,
  setOllamaEndpoint,
  setPreferredModel,
} from '../utils/llm';
import { answerFromLocalData, buildPoolContextBlock, RecruiterChatContext } from '../utils/recruiterChat';

const RecruiterChat: React.FC = () => {
  const location = useLocation();
  const {
    currentJob,
    candidates,
    matches,
    parsedResumes,
    shortlistWeights,
  } = useRecruiter();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [useOllama, setUseOllama] = useState(true);
  const [ollamaReady, setOllamaReady] = useState(false);
  const [endpoint, setEndpoint] = useState(getOllamaEndpoint());
  const [model, setModel] = useState(getPreferredModel());
  const [models, setModels] = useState<string[]>([]);
  const [statusNote, setStatusNote] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const visible = location.pathname.startsWith('/recruiter');

  const focusCandidateId = useMemo(() => {
    const match = location.pathname.match(/\/recruiter\/(?:candidate|challenge|interview)\/([^/]+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  const ctx: RecruiterChatContext = useMemo(() => ({
    job: currentJob,
    candidates,
    matches,
    resumes: parsedResumes,
    weights: shortlistWeights,
    focusCandidateId,
  }), [currentJob, candidates, matches, parsedResumes, shortlistWeights, focusCandidateId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    checkOllamaStatus(endpoint).then(status => {
      if (cancelled) return;
      setOllamaReady(status.available);
      setModels(status.models);
      setStatusNote(status.available ? `Ollama connected (${status.models.length} models)` : 'Ollama offline — answering from local recruiter data only');
      if (status.models[0] && !status.models.includes(model)) {
        setModel(status.models[0]);
        setPreferredModel(status.models[0]);
      }
    });
    return () => { cancelled = true; };
  }, [open, endpoint, model]);

  if (!visible) return null;

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;
    setInput('');
    const history = messages;
    const nextHistory = [...messages, { role: 'user' as const, content: question }];
    setMessages(nextHistory);
    setBusy(true);

    const local = answerFromLocalData(question, ctx);
    try {
      if (useOllama && ollamaReady) {
        const reply = await recruiterChatReply(question, history, buildPoolContextBlock(ctx), model);
        setMessages([...nextHistory, { role: 'assistant', content: reply }]);
      } else {
        setMessages([...nextHistory, { role: 'assistant', content: local }]);
      }
    } catch {
      setMessages([
        ...nextHistory,
        { role: 'assistant', content: `${ollamaSetupHint()}\n\nLocal answer:\n${local}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium px-4 py-3 rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
        title="Recruitment chatbot"
      >
        <MessageSquare className="w-5 h-5" />
        Ask ResumeGuard
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(100vw-2rem,420px)] h-[min(80vh,640px)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80">
            <div>
              <p className="text-sm font-semibold text-white">Recruitment chatbot</p>
              <p className="text-xs text-slate-400">{statusNote || 'Checking Ollama…'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-2 border-b border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <label className="text-xs text-slate-400 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useOllama}
                  onChange={(e) => setUseOllama(e.target.checked)}
                />
                Use Ollama when available
              </label>
            </div>
            <div className="flex gap-2">
              <input
                value={endpoint}
                onChange={(e) => {
                  setEndpoint(e.target.value);
                  setOllamaEndpoint(e.target.value);
                }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                placeholder="http://localhost:11434"
              />
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setPreferredModel(e.target.value);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 max-w-[140px]"
              >
                {Array.from(new Set([...AI_MODELS, ...models, model])).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-slate-400 space-y-2">
                <p>Ask about job fit, missing skills, verification flags, or who ranks on the shortlist.</p>
                <p className="flex items-start gap-2 text-xs text-amber-200/80">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Answers use this session’s recruiter data. Nothing is invented when Ollama is offline.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm rounded-xl px-3 py-2 whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-emerald-600/20 text-emerald-50 ml-8'
                    : 'bg-slate-800 text-slate-200 mr-6'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {busy && <p className="text-xs text-cyan-400">Thinking…</p>}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-slate-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about candidates or this job…"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl px-3"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RecruiterChat;
