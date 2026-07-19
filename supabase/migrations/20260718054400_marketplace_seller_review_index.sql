-- Marketplace Gate 1: performance-advisor remediation for seller moderation.
-- Approved for final migration preparation on 2026-07-18.
-- Production application still requires separate owner approval.

create index if not exists seller_reviews_reviewer_user_id_idx
on public.seller_reviews(reviewer_user_id);
