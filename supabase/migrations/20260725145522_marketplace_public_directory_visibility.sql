-- Marketplace public directory: the visibility gate, and the first ever
-- anonymous read access to seller data. Gate 1/2 intentionally blocked all
-- public access to seller_profiles because there was no public page yet.
--
-- Corrective note: seller_category_assignments_public_read (applied in
-- Gate 1) only checked profile_status = 'active', which a seller can
-- self-set at any time through their own update privilege -- independent
-- of whether an admin has ever approved them. That policy sat unused
-- (nothing queried it publicly) so the gap never mattered until now. This
-- closes it before it does: public visibility requires BOTH the seller's
-- own "active" listing toggle AND an admin-approved seller_reviews row.

create or replace function private.seller_is_publicly_listed(p_seller_profile_id uuid)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1
    from public.seller_profiles sp
    join public.seller_reviews sr on sr.seller_profile_id = sp.id
    where sp.id = p_seller_profile_id
      and sp.profile_status = 'active'
      and sr.review_status = 'approved'
  );
$$;
revoke all on function private.seller_is_publicly_listed(uuid) from public;
grant execute on function private.seller_is_publicly_listed(uuid) to anon, authenticated;

drop policy if exists seller_category_assignments_public_read on public.seller_category_assignments;
create policy seller_category_assignments_public_read
on public.seller_category_assignments
for select to anon, authenticated
using (private.seller_is_publicly_listed(seller_profile_id));

-- Row-level policy only -- anon has no table-level grant on seller_profiles
-- yet, so this has no practical effect until the column-scoped grant lands
-- in the next migration (which also adds the public-facing columns).
create policy seller_profiles_public_read
on public.seller_profiles
for select to anon, authenticated
using (private.seller_is_publicly_listed(id));
