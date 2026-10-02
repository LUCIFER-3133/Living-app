// Hand-authored mirror of supabase/schema.sql.
// If you use the Supabase CLI, you can replace this with:
//   supabase gen types typescript --project-id <id> > types/database.ts

export type UserRole = 'user' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type MembershipStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';
export type BillingInterval = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type ClassLocation = 'studio' | 'online';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface YogaClass {
  id: string;
  slug: string;
  name: string;
  category: string;
  short_description: string;
  long_description: string | null;
  image_url: string | null;
  duration_minutes: number;
  difficulty: Difficulty;
  price: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassSchedule {
  id: string;
  class_id: string;
  instructor_name: string;
  start_time: string;
  end_time: string;
  location: ClassLocation;
  capacity: number;
  booked_count: number;
  is_cancelled: boolean;
  created_at: string;
  class?: YogaClass;
}

export interface Payment {
  id: string;
  user_id: string;
  type: 'booking' | 'membership';
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  schedule_id: string;
  payment_id: string | null;
  status: BookingStatus;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  schedule?: ClassSchedule;
}

export type AppointmentType = 'general' | 'appointment';

export interface Appointment {
  id: string;
  user_id: string | null;
  type: AppointmentType;
  name: string;
  email: string;
  phone: string | null;
  // Only present when type is 'appointment' — a general enquiry has no
  // slot to pick, so these stay null rather than being forced to a value
  // nobody chose.
  preferred_date: string | null;
  preferred_time: string | null;
  service: string | null;
  message: string | null;
  status: AppointmentStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  billing_interval: BillingInterval;
  features: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  plan_id: string;
  payment_id: string | null;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  plan?: MembershipPlan;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  category: string | null;
  author_name: string;
  is_published: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  rating: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_published: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Live class batches ──────────────────────────────────────────────────────
export type BatchStatus = 'active' | 'paused' | 'archived';
export type BatchMemberStatus = 'active' | 'removed';
export type MeetingProvider = 'zoom' | 'google_meet' | 'other';

/** 0 = Sunday … 6 = Saturday (matches Date.prototype.getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Batch {
  id: string;
  name: string;
  class_id: string;
  instructor_name: string;
  weekdays: Weekday[];
  /** Wall-clock IST time, "HH:MM:SS". */
  start_time: string;
  /** Wall-clock IST time, "HH:MM:SS". */
  end_time: string;
  capacity: number;
  /** Public blurb — shown on the /classes timetable and the member card. */
  description: string | null;
  starts_on: string;
  ends_on: string | null;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  class?: YogaClass;
}

/**
 * Kept in its own table so RLS can guard it more tightly than the batch row
 * itself — RLS is row-level, so credentials on `batches` would leak to anyone
 * who could read a batch. See the security note in supabase/batches.sql.
 */
export interface BatchMeetingCredentials {
  batch_id: string;
  provider: MeetingProvider;
  meeting_url: string;
  meeting_id: string | null;
  passcode: string | null;
  host_note: string | null;
  updated_at: string;
}

/**
 * The subset a member is allowed to receive. `host_note` is the admin's private
 * jotting, so member-facing queries select these columns by name and pass this
 * type — RLS is row-level and cannot make that distinction for us.
 */
export type MemberMeetingCredentials = Pick<
  BatchMeetingCredentials,
  'batch_id' | 'provider' | 'meeting_url' | 'meeting_id' | 'passcode'
>;

export interface BatchMember {
  id: string;
  batch_id: string;
  user_id: string;
  status: BatchMemberStatus;
  assigned_by: string | null;
  assigned_at: string;
}

export interface BatchCancellation {
  id: string;
  batch_id: string;
  session_date: string;
  reason: string | null;
  created_at: string;
}

/** Row shape of the `batch_roster` view. */
export interface BatchRosterEntry {
  assignment_id: string;
  batch_id: string;
  user_id: string;
  assignment_status: BatchMemberStatus;
  assigned_at: string;
  full_name: string | null;
  phone: string | null;
  membership_active: boolean;
}

export type InboxCategory = 'admin' | 'class_reminder' | 'membership_renewal' | 'system';

export interface InboxMessage {
  id: string;
  user_id: string;
  sender_id: string | null;
  category: InboxCategory;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// Supabase generic Database type, used by the typed client.
//
// `Relationships` on every table/view, and the top-level `Functions` map,
// are required by @supabase/supabase-js's `GenericSchema` constraint (added
// in the v2 typings this project upgraded to) — without them TypeScript
// can't confirm `public` satisfies `GenericSchema`, and every `.from(...)`
// call silently resolves to `never`. We don't track real foreign-key
// relationship metadata here (this file is hand-authored, not generated),
// so every table gets an empty `Relationships: []`; that's enough to
// satisfy the type without changing any runtime behavior.
//
// `Rec<T>` intersects a plain interface with `Record<string, unknown>`.
// supabase-js's `GenericTable`/`GenericView` require `Row`/`Insert`/`Update`
// to satisfy `Record<string, unknown>` (an index signature), and a plain
// TypeScript `interface` never structurally satisfies that on its own
// ("Index signature for type 'string' is missing") even though every
// property it has is perfectly compatible — this intersection adds the
// index signature the constraint wants without changing any property's
// actual type or any runtime behavior.
type Rec<T> = T & Record<string, unknown>;

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Rec<Profile>; Insert: Rec<Partial<Profile> & { id: string }>; Update: Rec<Partial<Profile>>; Relationships: [] };
      classes: { Row: Rec<YogaClass>; Insert: Rec<Partial<YogaClass>>; Update: Rec<Partial<YogaClass>>; Relationships: [] };
      class_schedules: { Row: Rec<ClassSchedule>; Insert: Rec<Partial<ClassSchedule>>; Update: Rec<Partial<ClassSchedule>>; Relationships: [{ foreignKeyName: 'class_schedules_class_id_fkey'; columns: ['class_id']; isOneToOne: false; referencedRelation: 'classes'; referencedColumns: ['id'] }] };
      bookings: { Row: Rec<Booking>; Insert: Rec<Partial<Booking>>; Update: Rec<Partial<Booking>>; Relationships: [{ foreignKeyName: 'bookings_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }, { foreignKeyName: 'bookings_schedule_id_fkey'; columns: ['schedule_id']; isOneToOne: false; referencedRelation: 'class_schedules'; referencedColumns: ['id'] }] };
      appointments: { Row: Rec<Appointment>; Insert: Rec<Partial<Appointment>>; Update: Rec<Partial<Appointment>>; Relationships: [] };
      membership_plans: { Row: Rec<MembershipPlan>; Insert: Rec<Partial<MembershipPlan>>; Update: Rec<Partial<MembershipPlan>>; Relationships: [] };
      memberships: { Row: Rec<Membership>; Insert: Rec<Partial<Membership>>; Update: Rec<Partial<Membership>>; Relationships: [{ foreignKeyName: 'memberships_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }, { foreignKeyName: 'memberships_plan_id_fkey'; columns: ['plan_id']; isOneToOne: false; referencedRelation: 'membership_plans'; referencedColumns: ['id'] }] };
      payments: { Row: Rec<Payment>; Insert: Rec<Partial<Payment>>; Update: Rec<Partial<Payment>>; Relationships: [{ foreignKeyName: 'payments_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }] };
      blog_posts: { Row: Rec<BlogPost>; Insert: Rec<Partial<BlogPost>>; Update: Rec<Partial<BlogPost>>; Relationships: [] };
      demo_videos: { Row: Rec<DemoVideo>; Insert: Rec<Partial<DemoVideo>>; Update: Rec<Partial<DemoVideo>>; Relationships: [] };
      batches: { Row: Rec<Batch>; Insert: Rec<Partial<Batch>>; Update: Rec<Partial<Batch>>; Relationships: [{ foreignKeyName: 'batches_class_id_fkey'; columns: ['class_id']; isOneToOne: false; referencedRelation: 'classes'; referencedColumns: ['id'] }] };
      batch_meeting_credentials: {
        Row: Rec<BatchMeetingCredentials>;
        Insert: Rec<Partial<BatchMeetingCredentials> & { batch_id: string }>;
        Update: Rec<Partial<BatchMeetingCredentials>>;
        Relationships: [];
      };
      batch_members: { Row: Rec<BatchMember>; Insert: Rec<Partial<BatchMember>>; Update: Rec<Partial<BatchMember>>; Relationships: [] };
      batch_cancellations: { Row: Rec<BatchCancellation>; Insert: Rec<Partial<BatchCancellation>>; Update: Rec<Partial<BatchCancellation>>; Relationships: [] };
      testimonials: { Row: Rec<Testimonial>; Insert: Rec<Partial<Testimonial>>; Update: Rec<Partial<Testimonial>>; Relationships: [] };
      inbox_messages: { Row: Rec<InboxMessage>; Insert: Rec<Partial<InboxMessage> & { user_id: string; title: string; body: string }>; Update: Rec<Partial<InboxMessage>>; Relationships: [] };
    };
    Views: {
      batch_roster: { Row: Rec<BatchRosterEntry>; Relationships: [] };
    };
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number };
        Returns: boolean;
      };
      cleanup_rate_limits: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
  };
}
