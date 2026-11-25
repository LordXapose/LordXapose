# High-level DeFi security review checklist

This checklist is for authorized design and code reviews. It is not an exploit guide or a substitute for a professional audit.

## Scope and trust boundaries

- [ ] Confirm authorization, repository revision, deployment addresses, and review scope.
- [ ] Map assets, roles, external dependencies, bridges, oracles, and privileged actions.
- [ ] Document assumptions, trust boundaries, and emergency controls.

## Design and implementation

- [ ] Review access-control rules and privileged key-management processes.
- [ ] Check accounting invariants, precision, rounding, and state transitions.
- [ ] Review external calls, callbacks, token behavior, and reentrancy protections.
- [ ] Check oracle freshness, market assumptions, and failure handling.
- [ ] Review upgrade, pause, recovery, and migration paths.
- [ ] Validate compiler versions, dependency pinning, and build reproducibility.

## Verification and response

- [ ] Use tests and static analysis on an isolated local copy.
- [ ] Add regression tests for confirmed findings.
- [ ] Rate findings by impact and likelihood; distinguish facts from assumptions.
- [ ] Share results privately with the system owner and agree on remediation timelines.
- [ ] Re-test fixes and document residual risk without publishing sensitive details.
