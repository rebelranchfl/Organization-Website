# Intended change — Overview project intake shortcut

Owner reported that **Start New Academy Project** works from Projects but does nothing from Overview.

Cause: Overview intentionally hides `#content`; the shortcut was toggling the intake panel while it remained inside that hidden container.

Fix:
- keep the existing intake form and submission behavior unchanged;
- when the header shortcut is used from Overview, switch to the Projects view first;
- then open, scroll to, and focus the existing intake form;
- preserve the existing Hide New Project Form toggle when already open;
- do not change pipeline, database, workflow, review, pricing, publishing, or release behavior.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — fix Overview project intake
