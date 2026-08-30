import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/dashboard/LogoutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/dashboard');

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();

  return (
    <div className="container-editorial grid gap-10 py-16 md:grid-cols-[220px_1fr] md:py-24">
      <aside>
        <p className="text-xs uppercase tracking-wide text-ink/45">Signed in as</p>
        <p className="mt-1 font-display text-xl">{profile?.full_name || user.email}</p>
        <nav className="mt-8 flex flex-col gap-1 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-white">My Live Classes</Link>
          <Link href="/classes" className="rounded-md px-3 py-2 hover:bg-white">Class Timings</Link>
          <Link href="/membership" className="rounded-md px-3 py-2 hover:bg-white">Membership Plans</Link>
          <Link href="/demo-sessions" className="rounded-md px-3 py-2 hover:bg-white">Demo Sessions</Link>
        </nav>
        <div className="mt-8">
          <LogoutButton />
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
