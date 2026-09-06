# Change Description — Shared Hosting Verification

Date: 2026-09-06

Owner-authorized documentation update after current Cloudflare DNS was reviewed.

Target file:

- `docs/shared-systems-operations.md`

Planned changes:

1. Replace the prior `NOT VERIFIED` statement for the main RRM website host.
2. Record the verified current routing shown in Cloudflare DNS:
   - root `rebelranchministries.org` uses GitHub Pages IP addresses;
   - `www` points to `rebelranchfl.github.io`;
   - both are DNS-only through Cloudflare;
   - `academy.rebelranchministries.org` is served by the `rebel-ranch-academy` Cloudflare Worker;
   - `shop.rebelranchministries.org` points to Printify.
3. Clarify the difference between domain/DNS control, source-code storage, and the service that actually serves a website.
4. Record the owner-approved future direction: keep GitHub as the code/source repository, while evaluating program-by-program movement toward Cloudflare Worker/application delivery where it enables useful automation, routing, logic, integration, or interactivity.
5. Explicitly state that this future direction is not authorization for a migration project today.

No website files, DNS records, Cloudflare configuration, GitHub Actions workflows, program systems, or live deployment behavior are authorized to change in this batch.
