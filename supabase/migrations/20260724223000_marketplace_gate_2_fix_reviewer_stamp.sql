-- Marketplace Gate 2 corrective migration.
-- Found during frontend click-through testing on 2026-07-24: approving or
-- rejecting a seller_applications row stamped reviewed_at but never
-- reviewer_user_id, so seller_reviews.reviewer_user_id stayed null after
-- sync. Also, a changes_requested decision was never synced into
-- seller_reviews.review_status at all. Corrects both in place via
-- create or replace function, per the project's standing rule of never
-- rewriting an already-applied migration file.

create or replace function private.guard_seller_application()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_admin boolean := private.is_admin();
begin
  if tg_op = 'INSERT' and not v_admin and new.status <> 'draft' then
    raise exception 'seller_application_must_start_draft';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if v_admin then
      if new.status in ('approved','rejected','changes_requested') then
        new.reviewed_at := now();
        new.reviewer_user_id := (select auth.uid());
      end if;
    else
      if not (
        (old.status in ('draft','changes_requested') and new.status = 'submitted') or
        (old.status = 'draft' and new.status = 'withdrawn')
      ) then
        raise exception 'seller_application_transition_requires_admin';
      end if;
      new.reviewed_at := old.reviewed_at;
      new.reviewer_user_id := old.reviewer_user_id;
      new.review_notes := old.review_notes;
    end if;
  elsif tg_op = 'UPDATE' and not v_admin then
    new.reviewed_at := old.reviewed_at;
    new.reviewer_user_id := old.reviewer_user_id;
    new.review_notes := old.review_notes;
  end if;

  if tg_op = 'UPDATE' and not v_admin and old.status not in ('draft','changes_requested') then
    raise exception 'seller_application_locked_pending_review';
  end if;

  return new;
end $$;
revoke all on function private.guard_seller_application() from public, anon, authenticated;

create or replace function private.sync_seller_review_from_application()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.status = 'approved' then
    update public.seller_reviews
    set review_status = 'approved',
        reviewed_at = new.reviewed_at,
        reviewer_user_id = new.reviewer_user_id
    where seller_profile_id = new.seller_profile_id;
  elsif new.status = 'rejected' then
    update public.seller_reviews
    set review_status = 'rejected',
        reviewed_at = new.reviewed_at,
        reviewer_user_id = new.reviewer_user_id
    where seller_profile_id = new.seller_profile_id;
  elsif new.status = 'changes_requested' then
    update public.seller_reviews
    set review_status = 'changes_requested',
        reviewed_at = new.reviewed_at,
        reviewer_user_id = new.reviewer_user_id
    where seller_profile_id = new.seller_profile_id;
  elsif new.status = 'submitted' and old.status is distinct from new.status then
    update public.seller_reviews
    set review_status = 'pending_review',
        submitted_at = coalesce(new.submitted_at, now())
    where seller_profile_id = new.seller_profile_id
      and review_status <> 'approved';
  end if;
  return new;
end $$;
revoke all on function private.sync_seller_review_from_application() from public, anon, authenticated;
