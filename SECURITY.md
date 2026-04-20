# Security Policy

## Reporting a vulnerability

If you believe you have found a security vulnerability in The Kitchen, please **do not open a public GitHub issue**. Instead, report it privately:

- Open a [GitHub private security advisory](https://github.com/jozef-barton/the-kitchen/security/advisories/new), or
- Email the maintainer at the address listed on the repository owner's GitHub profile.

Include as much of the following as you can:

- A short description of the issue and its impact.
- Steps to reproduce (a minimal proof-of-concept is ideal).
- The version or commit SHA you tested against.
- Your assessment of severity, and any suggested remediation.

We aim to acknowledge reports within **3 business days** and to provide a remediation timeline within **10 business days**.

## Scope

The Kitchen is a local-first application. The security-relevant components are:

- `apps/bridge` — a Node HTTP server that binds to `127.0.0.1` only, talks to the local Hermes CLI, and stores data in a local SQLite database.
- `apps/web` — a Vite/React frontend that communicates with the bridge over same-origin HTTP.

In-scope issues include but are not limited to:

- Path traversal, command injection, SQL injection, SSRF, XSS, CSRF, and DNS-rebinding attacks against the bridge.
- Bugs that cause the bridge to bind to a non-loopback interface.
- Secret leakage in logs, error responses, or committed source.
- Supply-chain issues in pinned dependencies.

Out of scope:

- Attacks that require an already-compromised local machine (e.g., physical access, another local process reading our SQLite file).
- Self-XSS, clickjacking on pages that require local execution, or theoretical weaknesses with no exploit path.
- Denial of service of a local app against the machine that runs it.

## Supported versions

The Kitchen is pre-1.0. Only `main` receives security updates. Once the project reaches 1.0, this section will list a supported-version matrix.

## Hardening notes for users

- Never expose the bridge to other hosts. It binds to `127.0.0.1` by default. Do not reverse-proxy it to the public internet.
- Keep your Node runtime on a supported version (>=22.5).
- Run `pnpm audit` periodically to pick up new advisories against pinned dependencies.
