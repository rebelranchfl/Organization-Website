-- AI-Agent: Claude Code
-- Session: Creation Station dashboard access + site-wide deploy fix (2026-08-07)
-- Marketplace Gate 3: automatic requirement gate + application-approval gate
-- + seller activation, per owner direction after a real end-to-end walkthrough.
--
-- Owner's own words: "did they fill out the requirement box or not... that
-- immediately opens the gate for approval and if there is no attestation
-- then they cant get in. that should be a simple automatic logic gate."
-- Self-attestation is never independently verified, so a submitted
-- attestation is treated as satisfying an attestation-only requirement
-- automatically - no admin click required. Requirements that also need an
-- uploaded credential still require the existing admin verify step (a real
-- document actually is checked), which now also closes the loop instead of
-- leaving the assignment stuck on 'pending' forever. Waive/N-A remain as
-- manual admin overrides for genuine edge cases only.
--
-- Confirmed directly against production: the owner's own test seller has
-- seller_applications.status='approved' but seller_profiles.profile_status
-- is still 'draft' with public_slug still null - approving an application
-- has never activated the seller or generated their store URL. The new
-- approve_seller_application RPC closes both gaps in one action: it blocks
-- approval while any requirement is still pending, and on success it also
-- activates the seller profile and generates a unique public_slug.

-- 1. Let trusted, security-definer system triggers update assignment_status
--    without needing to look like an admin-originated client update. The
--    flag is transaction-local (set_config(..., true) = SET LOCAL
--    semantics, safe under pooled connections) and can only ever be set
--    from inside the two SECURITY DEFINER functions below, both of which
--    live in `private` and are revoked from anon/authenticated - no client
--    can ever set this flag directly. This does not weaken the RLS grant
--    on seller_requirement_assignments (still admin-only for UPDATE); it
--    only lets this one trusted code path past the trigger-level guard.
create or replace function private.guard_seller_requirement_assignment()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_op = 'UPDATE'
     and not private.is_admin()
     and coalesce(current_setting('rrm.trusted_requirement_sync', true), 'false') <> 'true' then
    raise exception 'seller_requirement_assignment_requires_admin';
  end if;
  return new;
end $$;

-- 2. Submitting an attestation auto-satisfies attestation-only requirements.
create or replace function private.auto_satisfy_attestation_requirement()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_requires_credential boolean;
begin
  select cr.requires_credential into v_requires_credential
  from public.seller_requirement_assignments sra
  join public.compliance_requirements cr on cr.id = sra.requirement_id
  where sra.id = new.requirement_assignment_id;

  if v_requires_credential is false then
    perform set_config('rrm.trusted_requirement_sync', 'true', true);
    update public.seller_requirement_assignments
    set assignment_status = 'satisfied', satisfied_at = now()
    where id = new.requirement_assignment_id and assignment_status = 'pending';
    perform set_config('rrm.trusted_requirement_sync', 'false', true);
  end if;

  return new;
end $$;
revoke all on function private.auto_satisfy_attestation_requirement() from public, anon, authenticated;

drop trigger if exists auto_satisfy_attestation_requirement on public.seller_attestations;
create trigger auto_satisfy_attestation_requirement
after insert on public.seller_attestations
for each row execute function private.auto_satisfy_attestation_requirement();

-- 3. Admin-verifying an uploaded credential auto-satisfies its linked
--    requirement, same as attestation - closes the loop for the
--    requires_credential=true case, which nothing currently ever resolves.
create or replace function private.auto_satisfy_credential_requirement()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.requirement_assignment_id is not null
     and new.verification_status = 'verified'
     and old.verification_status is distinct from new.verification_status then
    perform set_config('rrm.trusted_requirement_sync', 'true', true);
    update public.seller_requirement_assignments
    set assignment_status = 'satisfied', satisfied_at = now()
    where id = new.requirement_assignment_id and assignment_status = 'pending';
    perform set_config('rrm.trusted_requirement_sync', 'false', true);
  end if;

  return new;
end $$;
revoke all on function private.auto_satisfy_credential_requirement() from public, anon, authenticated;

drop trigger if exists auto_satisfy_credential_requirement on public.seller_credentials;
create trigger auto_satisfy_credential_requirement
after update of verification_status on public.seller_credentials
for each row execute function private.auto_satisfy_credential_requirement();

-- 4. Gated approval + activation RPC. Replaces the plain client-side
--    seller_applications update for the 'approved' case only - reject and
--    changes-requested stay as simple client updates, unchanged.
create or replace function public.approve_seller_application(p_application_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_admin boolean := private.is_admin();
  v_app public.seller_applications%rowtype;
  v_profile public.seller_profiles%rowtype;
  v_pending_count integer;
  v_base_slug text;
  v_candidate_slug text;
  v_suffix integer := 0;
begin
  if not v_admin then
    raise exception 'approve_seller_application_requires_admin';
  end if;

  select * into v_app from public.seller_applications where id = p_application_id for update;
  if v_app.id is null then
    raise exception 'application_not_found';
  end if;
  if v_app.status <> 'submitted' then
    raise exception 'application_not_awaiting_review';
  end if;

  select * into v_profile from public.seller_profiles where id = v_app.seller_profile_id for update;
  if v_profile.id is null then
    raise exception 'seller_profile_not_found';
  end if;

  select count(*) into v_pending_count
  from public.seller_requirement_assignments
  where seller_profile_id = v_profile.id and assignment_status = 'pending';
  if v_pending_count > 0 then
    raise exception 'requirements_still_pending';
  end if;

  update public.seller_applications
  set status = 'approved', reviewed_at = now(), reviewer_user_id = (select auth.uid())
  where id = p_application_id;

  if v_profile.public_slug is null then
    v_base_slug := trim(both '-' from regexp_replace(lower(v_profile.business_name), '[^a-z0-9]+', '-', 'g'));
    if v_base_slug = '' then
      v_base_slug := 'seller';
    end if;
    v_candidate_slug := v_base_slug;
    while exists(select 1 from public.seller_profiles where public_slug = v_candidate_slug and id <> v_profile.id) loop
      v_suffix := v_suffix + 1;
      v_candidate_slug := v_base_slug || '-' || v_suffix::text;
    end loop;
  else
    v_candidate_slug := v_profile.public_slug;
  end if;

  update public.seller_profiles
  set profile_status = 'active', public_slug = v_candidate_slug
  where id = v_profile.id;

  return jsonb_build_object(
    'application_id', p_application_id,
    'seller_profile_id', v_profile.id,
    'public_slug', v_candidate_slug,
    'profile_status', 'active'
  );
end $$;

revoke all on function public.approve_seller_application(uuid) from public, anon;
grant execute on function public.approve_seller_application(uuid) to authenticated;
