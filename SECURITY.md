# Security Policy

## Supported versions

Only the latest minor release of the current major version receives security fixes.

| Version | Supported |
|---------|-----------|
| 3.x (latest minor) | ✅ |
| < 3.0 | ❌ |

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Report it privately through GitHub: open the [Security tab](https://github.com/FeliceC/html-scoped-component-importer/security) and click **Report a vulnerability**. If that is not available, email felice.caricati@gmail.com with `[security] html-scoped-component-importer` in the subject.

Please include:

- the affected version;
- a description of the issue and its impact;
- the smallest code or HTML that reproduces it.

This is a project maintained in spare time: expect an acknowledgement within 7 days. Once the issue is confirmed, a fix is released as soon as possible and the reporter is credited in the advisory, unless they prefer otherwise.

## Scope

In scope:

- the published package: `ComponentDispatcher`, `EventBus`, `SharedState`, `Logger`;
- the `init` command (`npx html-scoped-component-importer init`).

Out of scope:

- the demo site and the files under `example/`, `benchmark/` and `test/`;
- vulnerabilities in development dependencies that do not ship with the package;
- issues that require the attacker to already control the page's HTML or scripts. Component names in `data-component` attributes and the `loadComponent` function are treated as trusted application code.
