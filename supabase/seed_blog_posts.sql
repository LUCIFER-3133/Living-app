-- Seeds 5 published journal posts for /blog.
-- Run this once in the Supabase SQL editor (or `psql`) after schema.sql has
-- already created public.blog_posts. Safe to re-run: it upserts on slug, so
-- running it twice just refreshes these five posts instead of duplicating them.

insert into public.blog_posts
  (slug, title, excerpt, content, featured_image, category, author_name, is_published, published_at, seo_title, seo_description)
values

(
  '5-breaths-to-start-your-morning',
  '5 Breaths to Start Your Morning Right',
  'A short breathing sequence you can do before you even leave bed — no mat required.',
  $$Most of us reach for a phone before we take a single conscious breath. The nervous system wakes up to a feed of notifications before it's had a chance to actually wake up on its own terms — and that sets the tone for everything that follows.

Here is a five-breath sequence you can do sitting up in bed, feet still under the blanket. Breath one: inhale slowly through the nose for a count of four, feeling the belly rise before the chest. Breath two: exhale for a count of six — longer than the inhale, which is what tells the body it's safe to stand down from sleep-alertness. Breaths three and four repeat the same pattern, and by breath five, let the exhale carry a long, audible sigh.

That's it. Thirty seconds, no mat, no app. What it does is give your nervous system a vote before your calendar does. Students who add this before checking their phone tell us the rest of the morning feels less reactive — not because anything about the morning changed, but because they met it from a steadier place.

If you want to build on this, the five breaths pair well with our Morning Hatha Flow or Sunrise Vinyasa Flow classes — both start early enough to still count as "before the day gets away from you."$$,
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
  'Practice',
  'Minal Chopra',
  true,
  now() - interval '3 days',
  '5 Breaths to Start Your Morning Right — Living Yoga Journal',
  'A 30-second breathing sequence you can do in bed before checking your phone, from the Living Yoga studio.'
),

(
  'hatha-vs-vinyasa-which-style-fits-you',
  'Hatha vs. Vinyasa: Which Style Actually Fits You?',
  'Both are "yoga," both use breath and posture — and they ask very different things of a first-timer.',
  $$New students almost always ask the same question before their first booking: should I start with Hatha or Vinyasa? The honest answer is that they're built around different relationships with stillness, and it's worth knowing which one you actually want before you pick.

Hatha holds each posture for several breaths at a time. The pace is slow enough that alignment becomes the whole point — you have time to notice a hip that's turned slightly out, a shoulder creeping toward an ear, and to correct it before moving on. It rewards patience and suits anyone recovering from injury, new to movement generally, or simply wanting a practice that feels more like maintenance than exercise.

Vinyasa links postures to breath in a continuous sequence — one inhale, one movement, repeat. There's less time to think about any single shape, which is exactly what some people need: the flow state crowds out the mental chatter that stillness can sometimes leave room for. It also builds more cardiovascular heat, so it reads closer to a workout.

Neither is "harder" in any way that matters for a beginner. The honest test is this: if you're someone who finds stillness calming, start with Hatha. If stillness makes your mind louder rather than quieter, start with Vinyasa and let the movement do the settling instead. You can always try the other — most of our regulars eventually do both, just on different days.$$,
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
  'Guides',
  'Kabir Anand',
  true,
  now() - interval '8 days',
  'Hatha vs. Vinyasa: Which Yoga Style Fits You? — Living Yoga Journal',
  'A plain-language comparison of Hatha and Vinyasa yoga to help first-time students choose where to start.'
),

(
  'why-we-cap-every-batch-at-15-students',
  'Why We Cap Every Batch at 15 Students',
  'It would be easier to sell more seats. Here is why we don''t.',
  $$Every batch at Living Yoga is capped at 15 students, full stop — no exceptions for a popular slot, no "just this once" for a friend who wants to join a full class. That cap costs us revenue we could otherwise collect, so it's fair to ask why we keep it.

The reason is simple: an instructor can only actually see so many bodies in one room. Past roughly 15 students, corrections stop being specific — "a few of you, watch your front knee" instead of "second row, straighten that front knee" — and specific correction is most of what separates a live class from a video you could watch for free. If we can't deliver that, we're not offering what we're charging for.

Fifteen is also small enough that an instructor learns names and the shape of each student's practice over a few sessions — which hip is tighter, which shoulder needs a reminder, who's working around an old injury. That continuity is what makes modifications actually useful instead of generic.

We'd rather run more batches at the right size than fewer batches stretched past it. If your preferred slot is full, that's the cap working as intended — check the timetable for the next nearest time, or let the front desk know and we'll flag you when a seat opens.$$,
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop',
  'Studio Notes',
  'Riya Desai',
  true,
  now() - interval '14 days',
  'Why Every Living Yoga Batch Is Capped at 15 Students',
  'The reasoning behind our studio-wide 15-student cap, and why we keep it even when a class sells out.'
),

(
  'a-10-minute-reset-for-desk-workers',
  'A 10-Minute Reset for Desk Workers',
  'For the stretch of day when your hips have forgotten they can bend.',
  $$Eight hours in a chair does something specific to the body: hip flexors shorten, the upper back rounds forward, and the breath gets shallow because there's no room left in a collapsed chest to take a deep one. None of that announces itself loudly — it just quietly becomes your default posture.

Here's a ten-minute reset you can do next to your desk, chair included. Start with two minutes of seated cat-cow: hands on knees, round the spine on the exhale, arch it gently on the inhale. Stand up for a low lunge against the chair — thirty seconds each side — to finally open those shortened hip flexors. Follow with a standing forward fold, letting the head hang heavy for a full minute; this is the one most people skip and the one that helps most.

Finish with a doorway chest opener — forearms on the frame, step one foot forward, hold for a minute on each side — to undo the forward-rounded shoulders a keyboard builds all day. Close with ten slow breaths, hands on the belly, before you sit back down.

None of this requires a mat, a change of clothes, or leaving your desk area. It requires ten minutes and the honesty to admit your hips have earned them.$$,
  'https://images.unsplash.com/photo-1588286840104-8957b019727f?q=80&w=1200&auto=format&fit=crop',
  'Wellness',
  'Minal Chopra',
  true,
  now() - interval '20 days',
  'A 10-Minute Yoga Reset for Desk Workers — Living Yoga Journal',
  'A no-mat, ten-minute stretching sequence to undo a day of sitting, from the Living Yoga studio.'
),

(
  'building-a-home-practice-that-actually-sticks',
  'Building a Home Practice That Actually Sticks',
  'Most home practices fail for the same two reasons. Neither is willpower.',
  $$Almost everyone who tries to build a home yoga practice starts the same way: an ambitious plan for 45 minutes every morning, enough enthusiasm to follow it for four or five days, and then nothing. The usual explanation is "I just don't have the discipline" — but the real reasons are almost always structural, not personal.

The first problem is scope. A 45-minute plan has to compete with everything else 45 minutes could be spent on, every single day, and it only has to lose once to break the habit. Ten minutes doesn't ask that much of a day, which is exactly why it survives busy weeks that would have killed a longer routine.

The second problem is decision fatigue. "I'll practice yoga this morning" is a decision you have to make fresh every day, and decisions are exactly the kind of thing willpower runs out of by evening — never mind first thing in the morning. "I do five sun salutations right after I brush my teeth" isn't a decision anymore; it's attached to something that already happens automatically.

Start smaller than feels worthwhile, and attach it to something you already do without thinking. A practice that happens is more valuable than a better practice that doesn't — and once the small one is automatic, it's far easier to let it grow on its own than it ever was to sustain a big one from day one.$$,
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop',
  'Practice',
  'Kabir Anand',
  true,
  now() - interval '27 days',
  'Building a Home Yoga Practice That Actually Sticks',
  'Why most home yoga routines fail within a week, and the two structural fixes that make them last.'
)

on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  featured_image = excluded.featured_image,
  category = excluded.category,
  author_name = excluded.author_name,
  is_published = excluded.is_published,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;
