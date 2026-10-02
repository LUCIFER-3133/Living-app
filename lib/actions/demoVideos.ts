'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAction as requireAdmin } from '@/lib/auth';

const BUCKET = 'demo-videos';

/**
 * A Supabase public storage URL looks like
 * `.../storage/v1/object/public/<bucket>/<path>` — everything after the
 * bucket name is the object's storage path, which is what `.remove()` needs.
 * Returns null for anything that isn't actually a URL into this bucket (a
 * blank thumbnail, a stray value from bad data, etc.) so callers can skip it
 * instead of sending a bogus delete.
 */
function storagePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length));
}

/**
 * Deletes a demo video completely: the row AND the actual video/thumbnail
 * files in storage. The previous implementation (client-side, in
 * DemoVideoManager) only ever deleted the `demo_videos` row — the uploaded
 * files stayed in the `demo-videos` bucket forever, taking up storage with
 * no way to reach them from the app again. This is a server action (not a
 * client-side call) so it can use the service-role client: storage deletes
 * need the actual object path resolved server-side, and doing the row-delete
 * and the storage-delete from two different trust boundaries is exactly how
 * one of them silently gets skipped.
 */
export async function deleteDemoVideo(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: video, error: fetchErr } = await admin
    .from('demo_videos')
    .select('video_url, thumbnail_url')
    .eq('id', id)
    .single();
  if (fetchErr) throw new Error(`Could not find that video: ${fetchErr.message}`);

  const paths = [
    storagePathFromPublicUrl(video.video_url),
    storagePathFromPublicUrl(video.thumbnail_url),
  ].filter((p): p is string => !!p);

  if (paths.length > 0) {
    const { error: storageErr } = await admin.storage.from(BUCKET).remove(paths);
    // Fail closed the other direction from most deletes here: if storage
    // cleanup fails, don't delete the row either — that would leave an
    // orphaned file with nothing pointing at it, permanently invisible to
    // the admin UI (no row = no way to ever select it for deletion again).
    if (storageErr) throw new Error(`Could not remove the video's files from storage: ${storageErr.message}`);
  }

  const { error } = await admin.from('demo_videos').delete().eq('id', id);
  if (error) throw new Error(`Could not delete the video: ${error.message}`);

  revalidatePath('/admin/demo-videos');
  revalidatePath('/demo-sessions');
}

export async function toggleDemoVideoPublished(id: string, isPublished: boolean) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('demo_videos').update({ is_published: isPublished }).eq('id', id);
  if (error) throw new Error(`Could not update the video: ${error.message}`);

  revalidatePath('/admin/demo-videos');
  revalidatePath('/demo-sessions');
}
