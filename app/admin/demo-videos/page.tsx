import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import DemoVideoManager from '@/components/admin/DemoVideoManager';
import type { DemoVideo } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminDemoVideosPage() {
  // Reads with the service-role client, which bypasses RLS — so the guard
  // lives here rather than only in the layout.
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: videos } = await admin.from('demo_videos').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-display-md">Demo Sessions</h1>
      <p className="mt-2 max-w-md text-sm text-ink/60">
        Upload full-length demo classes for the public /demo-sessions page.
      </p>
      <div className="mt-10">
        <DemoVideoManager initialVideos={(videos as DemoVideo[]) ?? []} />
      </div>
    </div>
  );
}
