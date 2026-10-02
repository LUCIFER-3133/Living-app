/**
 * Seeds sample classes, schedules and membership plans for local dev.
 * Run with: npm run seed
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import dotenv from 'dotenv';
// dotenv's default `dotenv/config` import only loads a file literally named
// `.env` — it does NOT know about Next.js's `.env.local` convention. Point
// it explicitly at .env.local so this script sees the same credentials the
// app itself uses.
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { addDays, setHours, setMinutes } from 'date-fns';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
    'Make sure yoga-app/.env.local exists and you are running `npm run seed` from inside the yoga-app folder.'
  );
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CLASSES = [
  { slug: 'morning-hatha-flow', name: 'Morning Hatha Flow', category: 'Hatha', short_description: 'Slow, deliberate postures for grounding and alignment.', long_description: 'Hatha is the foundation practice — static postures held with attention to breath and alignment, ideal for building a base you can return to.', duration_minutes: 60, difficulty: 'All Levels', price: 500 },
  { slug: 'sunrise-vinyasa-flow', name: 'Sunrise Vinyasa Flow', category: 'Vinyasa', short_description: 'Breath-linked movement that builds heat and strength.', long_description: 'A dynamic, flowing sequence that links breath to movement, building strength, stamina and focus through continuous transitions.', duration_minutes: 50, difficulty: 'Intermediate', price: 600 },
  { slug: 'lunch-break-power-yoga', name: 'Lunch Break Power Yoga', category: 'Power Yoga', short_description: 'A vigorous, fitness-driven practice.', long_description: 'An athletic, fast-paced practice drawing on Ashtanga sequencing — expect to sweat and build real strength, all inside a 40-minute lunch break.', duration_minutes: 40, difficulty: 'Intermediate', price: 550 },
  { slug: 'prenatal-gentle-flow', name: 'Prenatal Gentle Flow', category: 'Prenatal', short_description: 'Trimester-safe movement for expecting mothers.', long_description: 'A gentle, trimester-safe sequence designed with a certified prenatal instructor — safe modifications for every stage of pregnancy.', duration_minutes: 45, difficulty: 'All Levels', price: 500 },
  { slug: 'evening-ashtanga-release', name: 'Evening Ashtanga & Release', category: 'Ashtanga', short_description: 'A structured, athletic practice to close the day.', long_description: 'Traditional Ashtanga sequencing followed by a slow release sequence — structure and surrender in one session.', duration_minutes: 55, difficulty: 'All Levels', price: 600 },
  { slug: 'night-wind-down-hatha', name: 'Night Wind-Down Hatha', category: 'Hatha', short_description: 'A gentle close to the day.', long_description: 'Slow Hatha postures and long holds designed to prepare the body and mind for sleep.', duration_minutes: 40, difficulty: 'All Levels', price: 450 },
  { slug: 'weekend-deep-flow', name: 'Weekend Deep Flow', category: 'Vinyasa', short_description: 'A longer, deeper weekend Vinyasa session.', long_description: 'With more time than a weekday class, this session goes deeper into transitions, holds and breathwork.', duration_minutes: 75, difficulty: 'Intermediate', price: 650 },
];

const PLANS = [
  { slug: 'monthly', name: 'Monthly', description: '20 live classes', price: 2500, billing_interval: 'monthly', features: ['20 live classes / month', 'Email reminders before your plan renews', 'Community chat access'] },
  { slug: '3-months', name: '3 Months', description: '≈ ₹1,999 / month · 60 live classes', price: 5999, billing_interval: 'quarterly', features: ['60 live classes total', 'Email reminders before your plan renews', 'Community chat access'] },
  { slug: '6-months', name: '6 Months', description: '≈ ₹1,666 / month · 120 live classes', price: 9999, billing_interval: 'half_yearly', features: ['120 live classes total', 'Email reminders before your plan renews', 'Community chat access'] },
  { slug: 'annual', name: 'Annual', description: '≈ ₹1,249 / month · 240 live classes', price: 14999, billing_interval: 'yearly', features: ['240 live classes total', 'Email reminders before your plan renews', 'Community chat access'] },
];

const INSTRUCTORS = ['Minal Chopra', 'Kabir Anand', 'Riya Desai'];

// Matches the reference site's fixed weekly timetable: the same 7 slots
// every weekday, a lighter 4-slot Saturday/Sunday. Each (weekday, slot)
// combination always maps to the same class across every generated week,
// so the /classes page's Regular/Alternate/Weekend tabs show a stable,
// genuinely recurring schedule rather than random noise.
const WEEKDAY_SLOTS = [
  [6, 0], [7, 15], [8, 30], [10, 0], [16, 30], [17, 30], [18, 30],
] as const;
const WEEKEND_SLOTS = [
  [7, 15], [8, 30], [10, 0], [17, 30],
] as const;

function generateRecurringSchedules(classes: { id: string; duration_minutes: number }[]) {
  if (classes.length === 0) return [];
  const schedules: {
    class_id: string;
    instructor_name: string;
    start_time: string;
    end_time: string;
    location: string;
    capacity: number;
  }[] = [];

  for (let d = 1; d <= 21; d++) {
    const day = addDays(new Date(), d);
    const weekday = day.getDay(); // 0 = Sun ... 6 = Sat
    const isWeekend = weekday === 0 || weekday === 6;
    const slots = isWeekend ? WEEKEND_SLOTS : WEEKDAY_SLOTS;

    slots.forEach(([hour, minute], slotIndex) => {
      // Deterministic per (weekday, slot) — same recurring class every week.
      const cls = classes[(weekday * 7 + slotIndex) % classes.length];
      const start = setMinutes(setHours(day, hour), minute);
      const end = new Date(start.getTime() + cls.duration_minutes * 60000);
      schedules.push({
        class_id: cls.id,
        instructor_name: INSTRUCTORS[(weekday + slotIndex) % INSTRUCTORS.length],
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location: slotIndex % 3 === 0 ? 'online' : 'studio',
        capacity: 15,
      });
    });
  }

  return schedules;
}

async function seed() {
  console.log('Seeding classes...');
  const { data: insertedClasses, error: classErr } = await supabase.from('classes').upsert(CLASSES, { onConflict: 'slug' }).select();
  if (classErr) throw classErr;

  console.log('Seeding membership plans...');
  const { error: planErr } = await supabase.from('membership_plans').upsert(PLANS, { onConflict: 'slug' });
  if (planErr) throw planErr;

  console.log('Seeding class schedules (recurring weekly timetable, next 21 days)...');
  const schedules = generateRecurringSchedules(insertedClasses ?? []);
  const { error: schedErr } = await supabase.from('class_schedules').insert(schedules);
  if (schedErr) throw schedErr;

  console.log(`Done — seeded ${insertedClasses?.length ?? 0} classes, ${PLANS.length} plans, ${schedules.length} schedules.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
