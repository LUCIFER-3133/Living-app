import { z } from 'zod';

// One form serves two intents: a quick "just get in touch" enquiry, and a
// "book me a specific slot" request. `type` decides which fields are
// actually required — a general enquiry never has to fake a date/time it
// was never asked to pick, but a real appointment still needs all three
// slot fields to be worth anything to the admin reviewing it. Kept as one
// flat object (rather than a discriminated union) so react-hook-form's
// `register()` has a single stable field set to work with regardless of
// which tab is active.
export const appointmentSchema = z
  .object({
    type: z.enum(['general', 'appointment']),
    name: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().optional().or(z.literal('')),
    preferred_date: z.string().optional().or(z.literal('')),
    preferred_time: z.string().optional().or(z.literal('')),
    service: z.string().optional().or(z.literal('')),
    message: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'general') {
      if (!data.message || data.message.trim().length < 10) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tell us a little more (10+ characters)', path: ['message'] });
      }
    } else {
      if (!data.phone || data.phone.trim().length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid phone number', path: ['phone'] });
      }
      if (!data.preferred_date) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose a preferred date', path: ['preferred_date'] });
      }
      if (!data.preferred_time) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose a preferred time', path: ['preferred_time'] });
      }
      if (!data.service) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a service', path: ['service'] });
      }
    }
  });
export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const signupSchema = z
  .object({
    full_name: z.string().min(2, 'Please enter your name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;
