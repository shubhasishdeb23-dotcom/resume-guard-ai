import { describe, expect, it } from 'vitest';
import { sanitizeChatReply } from './llm';

describe('sanitizeChatReply', () => {
  it('strips a leading echoed role label', () => {
    expect(sanitizeChatReply('Assistant: Alex Chen ranks highest.')).toBe('Alex Chen ranks highest.');
    expect(sanitizeChatReply('Recruiter: hello')).toBe('hello');
  });

  it('cuts off a spurious new recruiter turn', () => {
    const raw = 'Alex Chen ranks highest with 90.\nRecruiter: and Priya?\nAssistant: Priya is second.';
    expect(sanitizeChatReply(raw)).toBe('Alex Chen ranks highest with 90.');
  });

  it('leaves a normal answer untouched', () => {
    expect(sanitizeChatReply('Alex Chen ranks highest with 90.')).toBe('Alex Chen ranks highest with 90.');
  });
});
