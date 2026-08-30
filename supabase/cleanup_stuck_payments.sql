-- Optional cleanup: earlier versions of the booking/membership API routes
-- used a shared literal 'pending' placeholder for razorpay_order_id before
-- the real Razorpay order was created. Any payment row still sitting at
-- exactly 'pending' is a leftover from a failed attempt (the code has
-- since been fixed to use a unique placeholder per attempt, and to clean
-- up automatically going forward). Safe to delete — none of these ever
-- became a real booking or membership.

delete from public.payments where razorpay_order_id = 'pending';
