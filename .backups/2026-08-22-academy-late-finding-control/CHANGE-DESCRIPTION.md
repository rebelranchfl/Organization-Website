# Intended Change — Academy Late-Finding Control

AI-Agent: ChatGPT/GPT-5.6 Sol  
Session: RR Website — Academy Late-Finding Control

Owner authorized implementation of a durable late-finding routing system for Rebel Ranch Academy.

Scope:
- add a structured `academy_late_findings` database record and owner-only RPCs;
- let an administrator log a late finding from Operations Review or Academy Stage Review;
- present four owner routes: Send Back Now, Add to Current Version, Finish V1 + Queue V2, Spin Off New Project;
- allow owner selection of the responsible stage when a finding requires current-version work;
- preserve finding history, status, routing, resolution notes and spawned-project link;
- surface pending and historical findings in owner review;
- load the new UI module from the existing Supabase client only on Operations Review and Academy Stage Review;
- update scheduled Academy worker instructions so routed findings are processed without bypassing owner gates.

Not in scope:
- public release or publishing;
- pricing changes;
- destructive removal of existing opportunities or project records;
- changing unrelated Operations Review/dashboard behavior;
- automatically creating a public product from a spin-off decision.
