'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Send, Sparkles, X, PanelRightClose } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';

type ChatMessage = {
  id: number;
  sender: 'user' | 'zeva';
  text: string;
  action?: { label: string; href: string };
};

const welcomeMessage = "Hi, I'm ZEVA. Ask me anything about ANNORA, food donations, shelters, volunteers, or rescue tracking.";

const defaultSuggestions = [
  'Donate surplus food',
  'Find a nearby shelter',
  'Track my donation',
  'Check my impact',
  'How does ANNORA work?',
  'How can I volunteer?',
  'How do I register an NGO?',
  'Is my data safe?',
];

export function ZevaChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'zeva', text: welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handler = () => setOpen(true);
    window.addEventListener('open-zeva', handler);
    return () => window.removeEventListener('open-zeva', handler);
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, error, open]);

  const sendMessage = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text: trimmed };
    const nextMessages = [...messages, userMessage];
    const assistantId = Date.now() + 1;
    setMessages([...nextMessages, { id: assistantId, sender: 'zeva', text: '' }]);
    setInput('');
    setThinking(true);
    setError('');

    try {
      const response = await fetch('/api/zeva/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.map(({ sender, text }) => ({ role: sender === 'zeva' ? 'assistant' : 'user', content: text })) }),
      });
      if (!response.ok || !response.body) throw new Error('ZEVA could not respond right now.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          const payload = JSON.parse(event.slice(6)) as { delta?: string; error?: string };
          if (payload.error) throw new Error(payload.error);
          if (payload.delta) setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: message.text + payload.delta } : message));
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ZEVA could not respond right now.');
    } finally {
      setThinking(false);
    }
  };

  const resetConversation = () => {
    setMessages([{ id: Date.now(), sender: 'zeva', text: welcomeMessage }]);
    setError('');
  };

  if (!mounted) return null;

  return (
    <>
      {!open && (
        <button className="zeva-fab" onClick={() => setOpen(true)} aria-label="Open ZEVA assistant" title="Open ZEVA assistant">
          <img className="zeva-brand-mark" src="/brand/zeva-mark.svg" alt="" />
        </button>
      )}

      {open && (
        <div className={`zeva-panel ${minimized ? 'minimized' : ''}`}>
          <div className="zeva-header-bar">
            <div className="zeva-title-wrap">
              <div className="zeva-mini-avatar"><img className="zeva-brand-mark" src="/brand/zeva-mark.svg" alt="" /></div>
              <div>
                <strong>ZEVA AI</strong>
                <small><span className="zeva-status-dot" /> Powered by Blacksmith</small>
              </div>
            </div>
            <div className="zeva-actions">
              <button type="button" aria-label="New conversation" onClick={resetConversation}>
                <RotateCcw size={15} />
              </button>
              <button type="button" aria-label="Minimize chat" onClick={() => setMinimized((value) => !value)}>
                <PanelRightClose size={16} />
              </button>
              <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div ref={bodyRef} className="zeva-body">
                {messages.map((message) => (
                  <div key={message.id} className={`zeva-message ${message.sender}`}>
                    <div>
                      {message.sender === 'zeva' && <span className="zeva-message-label"><Sparkles size={12} /> ZEVA</span>}
                      {message.text.split('\n').map((line, index) => <p key={`${message.id}-${index}`}>{line}</p>)}
                      {message.action && <Link className="zeva-action-link" href={message.action.href as Route}>{message.action.label} <span aria-hidden="true">→</span></Link>}
                    </div>
                  </div>
                ))}
                {thinking && <div className="zeva-message zeva"><div className="zeva-thinking"><span /><span /><span /></div></div>}
                {error && <div className="zeva-error" role="alert">{error}</div>}
              </div>

              <div className="zeva-suggestions">
                {defaultSuggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="zeva-input-row">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      sendMessage(input);
                    }
                  }}
                  aria-label="Type your message"
                />
                <button type="button" onClick={() => sendMessage(input)} aria-label="Send message" disabled={thinking || !input.trim()}>
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
