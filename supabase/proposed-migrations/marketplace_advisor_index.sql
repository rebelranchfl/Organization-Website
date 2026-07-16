-- PROPOSED ONLY. DO NOT APPLY TO PRODUCTION WITHOUT OWNER APPROVAL.
-- Marketplace Gate 1 performance advisor remediation.

create index if not exists seller_reviews_reviewer_user_id_idx
on public.seller_reviews(reviewer_user_id);
