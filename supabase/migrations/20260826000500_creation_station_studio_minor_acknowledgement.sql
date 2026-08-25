-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: Creation Station Studio Publishing and Orders
-- Adults may acknowledge their own public Studio. Minors still require a parent/guardian relationship.

create or replace function private.guard_website_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_admin boolean := private.is_creation_station_admin();
  v_uid uuid := (select auth.uid());
  v_creator_owner uuid;
  v_creator_age_band text;
  v_has_public_tier boolean := false;
  v_relationship text;
begin
  if v_admin then
    if tg_op = 'UPDATE' then
      if new.status = 'approved' and old.status is distinct from 'approved' then
        new.approved_at := coalesce(new.approved_at, now());
      end if;
      if new.status = 'published' then
        new.published_at := coalesce(old.published_at, new.published_at, now());
      end if;
    elsif tg_op = 'INSERT' and new.status = 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
    return new;
  end if;

  if v_uid is null or new.owner_user_id is distinct from v_uid then
    raise exception 'studio_owner_required';
  end if;

  select c.owner_user_id, c.age_band::text
    into v_creator_owner, v_creator_age_band
  from public.creator_profiles c
  where c.id = new.creator_id;

  if v_creator_owner is distinct from v_uid then
    raise exception 'studio_creator_must_belong_to_owner';
  end if;

  select exists (
    select 1
    from public.memberships m
    where m.user_id = v_uid
      and m.program_code = 'creation_station'
      and m.offer_code in ('creator_website','club_all_access_bundle')
      and m.membership_status in ('active','past_due')
      and (m.starts_at is null or m.starts_at <= now())
      and (m.ends_at is null or m.ends_at > now())
  ) into v_has_public_tier;

  if tg_op = 'INSERT' then
    new.admin_notes := null;
    new.moderation_note := null;
    new.published_url := null;
  else
    new.admin_notes := old.admin_notes;
    new.moderation_note := old.moderation_note;
    new.published_url := old.published_url;
  end if;

  if new.status in ('approved','published') then
    if not v_has_public_tier then
      raise exception 'studio_public_page_membership_required';
    end if;
    if nullif(btrim(new.parent_approver_name), '') is null
       or nullif(btrim(new.parent_approver_relationship), '') is null
       or new.parent_approved_at is null
       or nullif(btrim(new.consent_statement), '') is null then
      raise exception 'studio_public_acknowledgement_required';
    end if;

    v_relationship := lower(btrim(new.parent_approver_relationship));
    if v_creator_age_band in ('young_6_12','teen_13_17')
       and v_relationship in ('self','me','creator','account holder','adult account holder') then
      raise exception 'studio_minor_requires_parent_or_guardian';
    end if;

    new.approved_at := coalesce(case when tg_op='UPDATE' then old.approved_at end, new.approved_at, now());
    new.published_at := coalesce(case when tg_op='UPDATE' then old.published_at end, new.published_at, now());
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft','submitted','approved','published') then
      raise exception 'studio_invalid_start_status';
    end if;
  else
    if old.status in ('approved','published') and new.status in ('approved','published') then
      null;
    elsif new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status in ('submitted','approved','published','archived'))
      or (old.status = 'submitted' and new.status in ('approved','published','archived'))
      or (old.status = 'changes_requested' and new.status in ('submitted','approved','published','archived'))
      or (old.status = 'rejected' and new.status in ('approved','published','archived'))
      or (old.status in ('approved','published') and new.status = 'archived')
    ) then
      raise exception 'studio_invalid_owner_transition';
    end if;
  end if;

  return new;
end
$function$;
