import { permanentRedirect } from 'next/navigation';

/**
 * The per-class booking flow has been retired.
 *
 * Classes are no longer booked individually — an admin assigns each member to
 * a recurring batch, and the live class link appears on /dashboard. This route
 * is kept only so existing links, bookmarks and indexed URLs land somewhere
 * sensible instead of a 404. Remove it once the old URLs stop getting traffic.
 */
export default function RetiredBookingPage() {
  permanentRedirect('/membership');
}
