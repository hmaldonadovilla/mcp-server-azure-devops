# Security maintenance 0.1.55

Zod 4.6.7 replaces Zod 3 and its separate schema converter. The same parser now
publishes Draft-07 MCP input schemas. SDK 1.32.2 preserves stdio interoperability;
protocol tests narrow text content explicitly. Regression tests cover oversized
constrained collections and the JSON-schema/parser boundary.

Azure Identity is pinned to 4.13.0 and its supported MSAL 3 line, outside the
MSAL 5–7.0 authorization-code disclosure range. Its UUID v4 API is checked against
patched CommonJS UUID 11.1.1. The Azure Identity runtime dependency tree is bundled, and npm-shrinkwrap.json
publishes the reviewed graph, so consumers retain the UUID fix. A fresh independent
consumer installation reports zero vulnerabilities. Overrides alone are not
published as consumer policy. Runtime direct dependencies are pinned exactly.

Validation: build, lint, 336 unit tests passed, one existing skipped test, two
snapshots passed; production npm audit reports zero vulnerabilities. Live Azure
SSO/PAT service calls are not part of the offline unit suite. The framework uses
synthetic endpoints and separate per-invocation identities for local acceptance.
