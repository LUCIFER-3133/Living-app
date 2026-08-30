import Hero from '@/components/home/Hero';
import Benefits from '@/components/home/Benefits';
import ServicesSection from '@/components/home/ServicesSection';
import QuoteSection from '@/components/home/QuoteSection';
import BookCTA from '@/components/home/BookCTA';
import Testimonials from '@/components/home/Testimonials';
import BlogTeasers from '@/components/home/BlogTeasers';
import { createClient } from '@/lib/supabase/server';
import type { Testimonial } from '@/types/database';

export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(9);

  return (
    <>
      <Hero />
      <Benefits />
      <ServicesSection />
      <QuoteSection />
      <BookCTA />
      <Testimonials testimonials={(testimonials as Testimonial[]) ?? []} />
      <BlogTeasers />
    </>
  );
}
