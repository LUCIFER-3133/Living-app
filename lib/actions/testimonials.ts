'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAction as requireAdmin } from '@/lib/auth';

export async function saveTestimonial(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const id = formData.get('id') as string | null;
  const name = ((formData.get('name') as string) ?? '').trim();
  const quote = ((formData.get('quote') as string) ?? '').trim();

  if (!name || !quote) redirect('/admin/testimonials?notice=fields_required');

  const payload = {
    name,
    role: (formData.get('role') as string) || null,
    quote,
    rating: Math.min(5, Math.max(1, Number(formData.get('rating')) || 5)),
    is_published: formData.get('is_published') === 'on',
  };

  const { error } = id
    ? await admin.from('testimonials').update(payload).eq('id', id)
    : await admin.from('testimonials').insert(payload);

  if (error) {
    console.error('[testimonials] save failed:', error);
    redirect('/admin/testimonials?notice=save_failed');
  }

  revalidatePath('/admin/testimonials');
  revalidatePath('/');
  redirect('/admin/testimonials');
}

export async function deleteTestimonial(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get('id') as string;
  if (!id) redirect('/admin/testimonials?notice=error');

  const { error } = await admin.from('testimonials').delete().eq('id', id);
  const notice = error ? 'error' : 'deleted';
  if (error) console.error('[testimonials] delete failed:', error);

  revalidatePath('/admin/testimonials');
  revalidatePath('/');
  redirect(`/admin/testimonials?notice=${notice}`);
}
