import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { formatINR } from '@/lib/utils';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';

// POST /api/chatbot
// A deliberately simple, rule-based FAQ assistant — no external AI API key
// required. It matches the visitor's message against a small set of intents
// and answers from LIVE data (membership plans, classes, demo videos) so the
// answers never drift from what the admin dashboard actually shows.
//
// This keeps running cost at zero and avoids handing an AI provider a key
// with production Supabase access. Swapping in a real LLM later just means
// replacing `matchIntent` below with a call to that provider, using the same
// `context` data fetched here as grounding/context for the prompt.

type Intent = {
  id: string;
  keywords: string[];
  reply: (ctx: Context) => string;
};

type Context = {
  planLines: string[];
  categories: string[];
  demoCount: number;
  studioPhone: string;
};

const INTENTS: Intent[] = [
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening'],
    reply: () => "Namaste! I'm the Living Yoga assistant. Ask me about classes, membership pricing, demo videos, timings, or how to book — or tap a quick question below.",
  },
  {
    id: 'pricing',
    keywords: ['price', 'pricing', 'cost', 'fee', 'membership', 'plan', 'how much', 'charges'],
    reply: (ctx) =>
      ctx.planLines.length
        ? `Here's our current membership pricing:\n${ctx.planLines.join('\n')}\n\nAll plans include a 7-day free trial. See full details at /membership.`
        : "You can see current membership pricing at /membership — plans include a 7-day free trial.",
  },
  {
    id: 'classes',
    keywords: ['class', 'classes', 'style', 'types of yoga', 'hatha', 'vinyasa', 'ashtanga', 'category'],
    reply: (ctx) =>
      ctx.categories.length
        ? `We currently offer: ${ctx.categories.join(', ')}. Browse full details and instructors at /classes.`
        : 'Browse our full class list at /classes.',
  },
  {
    id: 'demo',
    keywords: ['demo', 'trial video', 'free video', 'sample class', 'watch'],
    reply: (ctx) =>
      `Yes! We have ${ctx.demoCount || 'several'} free demo session video(s) at /demo-sessions. You'll need to log in or sign up first (it's free) so we can save your progress and recommend the right batch.`,
  },
  {
    id: 'booking',
    keywords: ['book', 'booking', 'join', 'sign up', 'signup', 'register', 'enroll', 'enrol'],
    reply: () => 'To join a batch: create a free account at /signup, choose a membership at /membership, then our team places you in a batch that fits your schedule. You can also request a specific batch/timing from /contact.',
  },
  {
    id: 'timing',
    keywords: ['timing', 'time', 'schedule', 'when', 'slot', 'morning', 'evening'],
    reply: () => "Batch timings vary by instructor and class — most run early morning and evening slots (IST). Tell us your preferred timing at /contact and we'll match you to a batch, or ask about a specific class on its page.",
  },
  {
    id: 'contact',
    keywords: ['contact', 'phone', 'number', 'email', 'whatsapp', 'talk to', 'human', 'agent', 'support'],
    reply: (ctx) => `You can reach us on WhatsApp at ${ctx.studioPhone}, email hello@livingyoga.in, or use the form at /contact — we reply within 24 hours.`,
  },
  {
    id: 'cancel',
    keywords: ['cancel', 'refund', 'pause', 'lock-in', 'lockin'],
    reply: () => 'No long-term lock-in — you can pause or cancel your membership anytime from your dashboard. See /cancellation-refund for the full policy.',
  },
];

function matchIntent(message: string): Intent | null {
  const lower = message.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.keywords.some((k) => lower.includes(k))) return intent;
  }
  return null;
}

const FALLBACK =
  "I'm not sure about that one — but our team can help. Chat with us on WhatsApp using the button below, or send a message at /contact and we'll reply within 24 hours.";

export async function POST(req: NextRequest) {
  // Every message hits the DB three times (plans/classes/demo count), so
  // this is as much a cost control as an abuse control — 20 messages per 5
  // minutes is well above any real conversation.
  const allowed = await checkRateLimit(`chatbot:${clientIp(req)}`, { max: 20, windowSeconds: 300 });
  if (!allowed) {
    return NextResponse.json({ error: 'Too many messages — please wait a moment.' }, { status: 429 });
  }

  let message = '';
  try {
    const body = await req.json();
    message = typeof body?.message === 'string' ? body.message.slice(0, 500) : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!message.trim()) return NextResponse.json({ error: 'Message required.' }, { status: 400 });

  const supabase = await createClient();
  const [{ data: plans }, { data: classes }, { count: demoCount }] = await Promise.all([
    supabase.from('membership_plans').select('name, price, billing_interval').eq('status', 'active').order('price'),
    supabase.from('classes').select('category').eq('is_active', true),
    supabase.from('demo_videos').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ]);

  const context: Context = {
    planLines: (plans ?? []).map((p) => `• ${p.name}: ${formatINR(p.price)}`),
    categories: Array.from(new Set((classes ?? []).map((c) => c.category))).slice(0, 8),
    demoCount: demoCount ?? 0,
    studioPhone: process.env.NEXT_PUBLIC_STUDIO_PHONE || '+91-79849-25843',
  };

  const intent = matchIntent(message);
  const reply = intent ? intent.reply(context) : FALLBACK;

  return NextResponse.json({ reply });
}
