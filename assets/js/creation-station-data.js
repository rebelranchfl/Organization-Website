import { supabase } from './supabase-client.js';

export const TIER_RANK = Object.freeze({
  young_creator_family: 1,
  creator_development: 2,
  creator_website: 3
});

export const TIER_NAMES = Object.freeze({
  1: 'Young Creator Family',
  2: 'Creator Development',
  3: 'Creator Website'
});

function throwFirstError(results) {
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
}

export function membershipIsCurrent(membership, now = Date.now()) {
  const startsAt = membership.starts_at ? Date.parse(membership.starts_at) : null;
  const endsAt = membership.ends_at ? Date.parse(membership.ends_at) : null;
  return ['active', 'past_due'].includes(membership.membership_status)
    && (!startsAt || startsAt <= now)
    && (!endsAt || endsAt > now);
}

export function derivePresentationContext({ roles, membership, creators, household }) {
  const isAdmin = roles.some(({ role }) => role === 'admin');
  const tier = isAdmin ? 3 : (TIER_RANK[membership?.offer_code] || 0);
  const creatorKinds = new Set(creators.map(({ creator_type, age_band }) => `${creator_type}:${age_band}`));
  const views = new Set(['operational']);
  if (household && creators.some(({ creator_type }) => creator_type === 'child')) views.add('parent_guardian');
  if (creatorKinds.has('child:young_6_12')) views.add('young_creator');
  if (creatorKinds.has('child:teen_13_17')) views.add('teen_creator');
  if (creatorKinds.has('adult:adult_18_plus')) views.add('adult_maker');
  if (tier >= 2) views.add('business_growth');
  if (isAdmin) views.add('admin');
  return {
    isAdmin,
    tier,
    tierName: isAdmin ? 'Administrator' : TIER_NAMES[tier],
    hasParentGuardianRelationship: views.has('parent_guardian'),
    availableViews: [...views]
  };
}

export async function loadAccountContext() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) return null;
  const user = session.user;
  const results = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase.from('user_roles').select('role').eq('user_id', user.id),
    supabase.from('memberships').select('offer_code,membership_status,starts_at,ends_at,created_at')
      .eq('user_id', user.id).eq('program_code', 'creation_station').order('created_at', { ascending: false }),
    supabase.from('households').select('id,household_name').eq('owner_user_id', user.id).limit(1).maybeSingle(),
    supabase.from('creator_profiles').select('id,household_id,display_name,creator_type,age_band,profile_status')
      .eq('owner_user_id', user.id).eq('profile_status', 'active').order('created_at')
  ]);
  throwFirstError(results);
  const [profileResult, rolesResult, membershipsResult, householdResult, creatorsResult] = results;
  const membership = membershipsResult.data.find(membershipIsCurrent) || null;
  const presentation = derivePresentationContext({
    roles: rolesResult.data,
    membership,
    creators: creatorsResult.data,
    household: householdResult.data
  });
  return {
    user,
    profile: profileResult.data,
    roles: rolesResult.data,
    membership,
    household: householdResult.data,
    creators: creatorsResult.data,
    presentation,
    allowed: presentation.isAdmin || Boolean(membership)
  };
}

export async function loadWorkspaceData(context) {
  const results = await Promise.all([
    supabase.from('project_templates').select('*').eq('is_active', true).order('minimum_tier'),
    supabase.from('creator_projects').select('*').eq('owner_user_id', context.user.id).order('updated_at', { ascending: false }),
    supabase.from('project_progress_events').select('project_id,creator_id,status,completion,recorded_at')
      .eq('owner_user_id', context.user.id).order('recorded_at'),
    supabase.from('creator_portfolios').select('*').eq('owner_user_id', context.user.id),
    supabase.from('portfolio_items').select('id,portfolio_id,project_id,created_at').eq('owner_user_id', context.user.id),
    supabase.from('creation_resources').select('*').eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('live_classes').select('*').eq('is_published', true).gte('starts_at', new Date().toISOString()).order('starts_at').limit(5),
    supabase.from('class_registrations').select('id,creator_id,class_id,attended_at,created_at').eq('owner_user_id', context.user.id),
    supabase.from('creation_activity').select('*').eq('owner_user_id', context.user.id).order('created_at', { ascending: false }).limit(20)
  ]);
  throwFirstError(results);
  const [templates, projects, progressEvents, portfolios, portfolioItems, resources, classes, registrations, activity] = results;
  return { templates: templates.data, projects: projects.data, progressEvents: progressEvents.data,
    portfolios: portfolios.data, portfolioItems: portfolioItems.data, resources: resources.data,
    classes: classes.data, registrations: registrations.data, activity: activity.data };
}

export function calculateWorkspaceMetrics(data) {
  const active = data.projects.filter(({ status }) => status !== 'archived');
  return {
    projectsStarted: data.projects.length,
    projectsCompleted: data.projects.filter(({ status }) => status === 'completed').length,
    completionRate: active.length ? Math.round(data.projects.filter(({ status }) => status === 'completed').length / active.length * 100) : 0,
    overallProgress: active.length ? Math.round(active.reduce((total, project) => total + project.completion, 0) / active.length) : 0,
    portfolioItems: data.portfolioItems.length,
    classRegistrations: data.registrations.length,
    classParticipation: data.registrations.filter(({ attended_at }) => attended_at).length
  };
}

export async function startProject(context, creatorId, template) {
  const { error } = await supabase.from('creator_projects').insert({ owner_user_id: context.user.id,
    creator_id: creatorId, template_id: template.id, membership_offer_code: context.membership?.offer_code || 'creator_website',
    title: template.title, status: 'in_progress', completion: 5, started_at: new Date().toISOString() });
  if (error) throw error;
  return recordActivity(context, 'project_started', 'project', null, `Started ${template.title}`);
}

export async function saveProjectProgress(context, project, updates, file) {
  const { error } = await supabase.from('creator_projects').update(updates).eq('id', project.id).eq('owner_user_id', context.user.id);
  if (error) throw error;
  if (file) await uploadProjectAsset(context, project, file);
  return recordActivity(context, 'project_updated', 'project', project.id, `Saved progress on ${project.title}`);
}

export async function uploadProjectAsset(context, project, file) {
  if (file.size > 20971520) throw new Error('File is larger than 20 MB.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${context.user.id}/${project.creator_id}/${project.id}/${crypto.randomUUID()}-${safeName}`;
  const upload = await supabase.storage.from('creation-station-private').upload(path, file);
  if (upload.error) throw upload.error;
  const asset = await supabase.from('project_assets').insert({ owner_user_id: context.user.id,
    creator_id: project.creator_id, project_id: project.id, storage_path: path, file_name: file.name,
    mime_type: file.type, file_size: file.size });
  if (asset.error) throw asset.error;
}

export async function setProjectFavorite(context, project, isFavorite) {
  const { error } = await supabase.from('creator_projects').update({ is_favorite: isFavorite,
    updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_user_id', context.user.id);
  if (error) throw error;
}

export async function createPortfolio(context, creator) {
  const { error } = await supabase.from('creator_portfolios').insert({ owner_user_id: context.user.id,
    creator_id: creator.id, title: `${creator.display_name}'s Portfolio` });
  if (error) throw error;
  return recordActivity(context, 'portfolio_created', 'portfolio', null, `Created ${creator.display_name}'s portfolio`);
}

export async function setPortfolioState(context, portfolioId, reviewStatus) {
  const { error } = await supabase.from('creator_portfolios').update({ review_status: reviewStatus,
    updated_at: new Date().toISOString() }).eq('id', portfolioId).eq('owner_user_id', context.user.id);
  if (error) throw error;
  const summary = reviewStatus === 'submitted' ? 'Submitted a portfolio for parent and administrator review' : 'Returned a portfolio to private';
  return recordActivity(context, 'portfolio_status', 'portfolio', portfolioId, summary);
}

export async function submitWebsiteRevision(context, input) {
  const previous = await supabase.from('creator_website_requests').select('id,revision_number,status')
    .eq('owner_user_id', context.user.id).eq('creator_id', input.creatorId)
    .order('revision_number', { ascending: false }).limit(1).maybeSingle();
  if (previous.error) throw previous.error;
  if (previous.data && ['submitted', 'approved'].includes(previous.data.status)) throw new Error('This creator already has a website revision in review.');
  const { error } = await supabase.from('creator_website_requests').insert({ owner_user_id: context.user.id,
    creator_id: input.creatorId, brand_name: input.brandName, story: input.story, products: input.products,
    social_links: { links: input.links }, status: 'submitted', submitted_at: new Date().toISOString(),
    revision_number: (previous.data?.revision_number || 0) + 1, replaces_request_id: previous.data?.id || null });
  if (error) throw error;
  return recordActivity(context, 'website_request_submitted', 'website_request', null,
    'Submitted a creator website revision for administrator review');
}

export async function recordResourceUse(context, resourceId) {
  return recordActivity(context, 'resource_opened', 'resource', resourceId, 'Opened a Creation Station resource');
}

export async function recordActivity(context, activityType, subjectType, subjectId, summary) {
  const { error } = await supabase.from('creation_activity').insert({ owner_user_id: context.user.id,
    activity_type: activityType, subject_type: subjectType, subject_id: subjectId, summary });
  if (error) throw error;
}

export async function loadModerationQueue() {
  const results = await Promise.all([
    supabase.from('creator_portfolios').select('id,title,review_status,parent_approved_at,moderation_note,creator_profiles(display_name,creator_type,age_band)').in('review_status', ['submitted','changes_requested','approved','published']),
    supabase.from('creator_website_requests').select('id,brand_name,status,revision_number,story,products,moderation_note,creator_profiles(display_name)').in('status', ['submitted','changes_requested','approved','published'])
  ]);
  throwFirstError(results);
  return { portfolios: results[0].data, websites: results[1].data };
}

export async function moderateSubmission(kind, id, status, note) {
  const table = kind === 'portfolio' ? 'creator_portfolios' : 'creator_website_requests';
  const update = kind === 'portfolio' ? { review_status: status, moderation_note: note, updated_at: new Date().toISOString() }
    : { status, moderation_note: note, updated_at: new Date().toISOString() };
  const { error } = await supabase.from(table).update(update).eq('id', id);
  if (error) throw error;
}
