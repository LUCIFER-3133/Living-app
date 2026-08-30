'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { DemoVideo } from '@/types/database';

export default function VideoGrid({ videos }: { videos: DemoVideo[] }) {
  const [active, setActive] = useState<DemoVideo | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const router = useRouter();

  if (videos.length === 0) {
    return <p className="text-sm text-ink/55">Demo videos will appear here once uploaded from the admin dashboard.</p>;
  }

  // Free to browse, but watching requires an account — this is our main lead
  // capture moment, so a click with no session redirects to sign-up/login
  // and brings the visitor straight back here afterwards.
  async function handlePlay(video: DemoVideo) {
    setChecking(video.id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setChecking(null);
    if (!user) {
      router.push('/signup?redirectedFrom=/demo-sessions');
      return;
    }
    setActive(video);
  }

  return (
    <>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <button
            key={v.id}
            onClick={() => handlePlay(v)}
            disabled={checking === v.id}
            className="group text-left"
            aria-label={`Play ${v.title} (login required)`}
          >
            <div className="relative aspect-video overflow-hidden rounded-lg bg-ink/10">
              {v.thumbnail_url ? (
                // Thumbnails are plain <img> (not next/image) since these
                // come from user-uploaded Storage URLs of arbitrary size.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover img-zoom" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-moss/10" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-ink/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-ink">
                  <Play size={20} className="ml-0.5" fill="currentColor" />
                </span>
              </div>
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-ink/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-canvas backdrop-blur-sm">
                <Lock size={10} /> Login to watch
              </span>
            </div>
            <p className="eyebrow mt-4">{v.category}</p>
            <h3 className="mt-1 font-display text-xl text-ink">{v.title}</h3>
            {v.description && <p className="mt-1 line-clamp-2 text-sm text-ink/60">{v.description}</p>}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-ink/90 p-4"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActive(null)}
                aria-label="Close video"
                className="absolute -top-10 right-0 text-canvas/80 hover:text-canvas"
              >
                <X size={22} />
              </button>
              {/* Loaded only on click — keeps the listing page light. */}
              <video src={active.video_url} controls autoPlay className="w-full rounded-lg bg-black" />
              <p className="mt-4 font-display text-xl text-canvas">{active.title}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
