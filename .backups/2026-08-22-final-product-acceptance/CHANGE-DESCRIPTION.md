# Intended change — Final Product Acceptance Gate

Add a hard owner-facing Final Product Review acceptance checklist so a product cannot be approved merely because files exist or agent QA says complete.

Scope:
- add Academy Final Product Acceptance standard;
- add structured Supabase acceptance record and admin-only submit RPC;
- block FINAL_PRODUCT_REVIEW APPROVE unless the current revision has a passed acceptance record;
- add Operations Review acceptance checklist UI;
- wire the UI through the existing Supabase client loader;
- preserve Release Workflow as a later, separate owner gate;
- do not alter Water's current Product Design rebuild, pricing, publishing, or release state.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Final Product Acceptance Checklist
