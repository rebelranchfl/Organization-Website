-- AI-Agent: ChatGPT/Codex
-- Session: Audit Repository Handoff
-- Minimum server-only privileges required by submit-marketplace-order.

grant select on public.seller_listings to service_role;
grant insert, select on public.seller_orders to service_role;
grant usage, select on sequence public.seller_orders_order_number_seq to service_role;
