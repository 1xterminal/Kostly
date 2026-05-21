-- Index nullable review/sender foreign keys flagged by Supabase advisors.

create index if not exists idx_extend_requests_reviewed_by
  on public.extend_requests (reviewed_by);

create index if not exists idx_payments_verified_by
  on public.payments (verified_by);

create index if not exists idx_ticket_replies_sender_id
  on public.ticket_replies (sender_id);
