-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: Rebel Ranch Marketplace — Social Content Hub
-- Purpose: Add covering indexes for Social Content Hub foreign keys flagged by the Supabase performance advisor after the V1 production migration.

create index if not exists social_post_history_content_item_id_idx
  on public.social_post_history(content_item_id);

create index if not exists social_post_history_reel_id_idx
  on public.social_post_history(reel_id);

create index if not exists social_reel_frames_content_item_id_idx
  on public.social_reel_frames(content_item_id);
