import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Backed by the Postgres function in supabase/rate_limits.sql — no Redis or
 * other external service needed. Fails OPEN on any error (logs it, lets the
 * request through) so a limiter outage never takes down the feature it's
 * protecting; the tradeoff is that a broken limiter silently stops limiting,
 * which is the right failure direction for a contact form, not for
 * something security-critical.
 */
export async function checkRateLimit(key: string, opts: { max: number; windowSeconds: number }): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: key,
      p_max: opts.max,
      p_window_seconds: opts.windowSeconds,
    });
    if (error) {
      console.error('[rateLimit] check failed, failing open:', error);
      return true;
    }
    return data as boolean;
  } catch (err) {
    console.error('[rateLimit] unexpected error, failing open:', err);
    return true;
  }
}

/** Best-effort caller IP from standard proxy headers (Vercel and most hosts set these). */
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
