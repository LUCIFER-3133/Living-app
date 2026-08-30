import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminPage } from '@/lib/auth';
import TestimonialForm from '@/components/admin/TestimonialForm';
import type { Testimonial } from '@/types/database';

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage();
  const admin = createAdminClient();
  const { data: testimonial } = await admin.from('testimonials').select('*').eq('id', id).single();
  if (!testimonial) notFound();

  return (
    <div>
      <h1 className="text-display-md">Edit Testimonial</h1>
      <div className="mt-8">
        <TestimonialForm existing={testimonial as Testimonial} />
      </div>
    </div>
  );
}
