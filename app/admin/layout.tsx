import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/dashboard/LogoutButton';

// Belt-and-suspenders: middleware already blocks non-admins from /admin/**,
// but every layout/page that touches sensitive data re-checks server-side
// too, since middleware matcher config can change independently of routes.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/admin');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const links = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/batches', label: 'Live Batches' },
    { href: '/admin/classes', label: 'Classes' },
    { href: '/admin/bookings', label: 'Bookings' },
    { href: '/admin/appointments', label: 'Appointments' },
    { href: '/admin/memberships', label: 'Memberships' },
    { href: '/admin/demo-videos', label: 'Demo Sessions' },
    { href: '/admin/testimonials', label: 'Testimonials' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/payments', label: 'Payments' },
  ];

  return (
    <div className="container-editorial grid gap-10 py-16 md:grid-cols-[210px_1fr]">
      <aside>
        <p className="eyebrow">Admin</p>
        <nav className="mt-6 flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 hover:bg-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          <LogoutButton />
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
