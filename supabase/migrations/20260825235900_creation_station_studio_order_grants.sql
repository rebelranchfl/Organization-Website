-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: Creation Station Studio Publishing and Orders
-- Studio buyers submit only through submit-creation-studio-order.
-- Authenticated Studio owners need only SELECT and UPDATE, with RLS + update trigger enforcing ownership/integrity.

revoke all privileges on table public.studio_order_requests from anon;
revoke all privileges on table public.studio_order_requests from authenticated;
grant select, update on table public.studio_order_requests to authenticated;
