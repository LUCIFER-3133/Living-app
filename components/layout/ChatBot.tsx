'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, X, Loader2 } from 'lucide-react';

type Message = { role: 'bot' | 'user'; text: string };

const QUICK_QUESTIONS = ['Membership pricing?', 'What classes do you offer?', 'How do I book a class?', 'Talk to a human'];

const GREETING: Message = {
  role: 'bot',
  text: "Namaste! I'm the Living Yoga assistant. Ask me about classes, pricing, timings, or booking — or tap a question below.",
};

// Simple rule-based FAQ widget (see /api/chatbot) — no external AI API key
// required. Answers are matched by keyword against live site data, with a
// fallback that hands off to WhatsApp / the contact form for anything it
// doesn't recognise.
export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'bot', text: data.reply || data.error || "Sorry, I couldn't process that — please try again." }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: "I'm having trouble connecting right now — please try WhatsApp or /contact instead." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat assistant'}
        title="Chat with our assistant"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-moss text-canvas shadow-glass transition-transform duration-300 hover:scale-105"
      >
        {open ? <X size={20} /> : <Bot size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
            className="glass-card fixed bottom-40 right-4 z-[95] flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden sm:right-6"
          >
            <div className="flex items-center gap-2 border-b border-ink/10 bg-white/40 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss text-canvas"><Bot size={16} /></span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">Living Yoga Assistant</p>
                <p className="text-[11px] text-ink/50">Usually replies instantly</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                title="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${
                      m.role === 'user' ? 'bg-moss text-canvas' : 'bg-white/70 text-ink'
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <span className="rounded-lg bg-white/70 px-3 py-2 text-sm text-ink/50"><Loader2 size={14} className="animate-spin" /></span>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/70 hover:bg-white/60"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-ink/10 bg-white/40 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                className="flex-1 rounded-full bg-white/70 px-4 py-2 text-sm text-ink placeholder:text-ink/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss text-canvas disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
