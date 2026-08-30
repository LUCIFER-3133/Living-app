import TestimonialForm from '@/components/admin/TestimonialForm';
import { requireAdminPage } from '@/lib/auth';

export default async function NewTestimonialPage() {
  await requireAdminPage();
  return (
    <div>
      <h1 className="text-display-md">Add Testimonial</h1>
      <div className="mt-8">
        <TestimonialForm />
      </div>
    </div>
  );
}
