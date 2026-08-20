# Change Description

- Purpose: separate Academy hosting from the final RRM link cutover.
- Safety reason: the Academy domain must load successfully before existing RRM links are changed.
- Files returned temporarily to their pre-cutover links: `index.html`, `account.html`, `freedom.html`, and `assets/js/public-shell.js`.
- The old `academy.html` sitemap entry is temporarily restored until the new Academy domain is verified.
- Recovery: the already committed cutover state remains available in commit `0872582528af6a22eaff5eb50c1a04f25b3b26fc` and the earlier timestamped backup.
