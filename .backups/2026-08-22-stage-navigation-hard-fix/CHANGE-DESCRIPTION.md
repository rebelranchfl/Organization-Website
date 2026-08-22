# Operations Review stage navigation hard fix

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Final Product Review navigation/preview fix

Owner reported that lifecycle cards still behaved like the old long-scroll project page and did not expose the dedicated Final Product Review preview workspace.

Intended changes:
- make stage navigation resolve the project ID from either the selected queue item or visible project detail;
- decorate both legacy lifecycle cards and lifecycle-workspace cards;
- add an unmistakable Open Current Stage Review button near the lifecycle area;
- navigate directly to the dedicated `academy-stage-review.html` URL;
- preserve all workflow, review, database, pricing, publishing, release, and evidence logic.
