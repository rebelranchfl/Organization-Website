# Change Description

- Purpose: add an automated GitHub-to-Cloudflare deployment check for Rebel Ranch Academy.
- Scope: one new GitHub Actions workflow only.
- Safety: pull requests deploy to a separate preview Worker. The public Academy domain is only assigned after an approved merge to `main`.
- Secrets: the workflow reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from GitHub repository secrets. No secret values are stored in the repository.
