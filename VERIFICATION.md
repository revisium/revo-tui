# Verification

Run the canonical checks with Node 26.8.2 and pnpm 12.4.1 in an isolated container or lab:

```bash
pnpm install --frozen-lockfile
pnpm verify
bash -n scripts/sonar-issues-local.sh
git diff --check
```

`verify:sources` requires strict TypeScript, Steiger, and a launcher build. Formatting and zero-warning ESLint always run. GraphQL codegen is N/A until the first GraphQL change.

CI scans the exact checked-out revision, waits for the Sonar quality gate, verifies the analyzed revision, and fails on open issues. Sonar credentials are required in CI and must never be printed or committed. Coverage is excluded while the TUI intentionally has no automated tests; bugs, vulnerabilities, smells, and duplication remain analyzed.

Runtime behavior is checked manually for each implementation task in a dedicated lab. Do not add an automated TUI test suite.

## T1 launcher evidence

Source `0c414e63cf88aab9f0684d42101f15d6d92aad0e` was checked with Node 26.8.2, pnpm 12.4.1, and Bun 1.4.2 on Linux x64 in the isolated `revo-prod-20260913-t1` lab. Help and version work without a TTY or Bun startup. Invalid/missing URLs and non-TTY launch fail with input exit code 2. In a PTY, missing or invalid Bun and the reserved T2 UI entry fail distinctly. Manual child probes confirmed normal/nonzero exits, HUP/INT/TERM forwarding, AbortSignal cancellation, and terminal restoration against the captured `stty -g` state. macOS validation remains outstanding; no OpenTUI runtime was exercised in T1.
