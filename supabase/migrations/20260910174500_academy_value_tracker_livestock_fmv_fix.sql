-- Correct the known pig valuation from book-value terminology to current market-value terminology.
-- Acquisition cost / accounting basis remains unverified and is intentionally not recorded as book value.
--
-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RRM property, valuation and capitalization planning

begin;

update public.academy_value_assessments aa
set value_lens = 'market_value',
    valuation_method = 'Current herd FMV planning proxy',
    rationale = 'Six confirmed pigs multiplied by planning unit values of $150 / $250 / $400. This is a current fair-market-value planning estimate, not accounting book value. Acquisition cost, breed, sex, age and breeder status still require inventory documentation.',
    updated_at = now()
from public.academy_value_assets a
join public.academy_value_projects p on p.id = a.project_id
join public.profiles pr on pr.id = p.owner_user_id
where aa.asset_id = a.id
  and p.project_key = 'rrm-2026'
  and pr.display_name = 'rebelranchfl'
  and a.asset_key = 'pigs'
  and aa.value_lens = 'book_value';

commit;
