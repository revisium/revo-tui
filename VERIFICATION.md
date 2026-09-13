# Verification

Run the canonical checks with Node 26.8.2 and pnpm 12.4.1 in an isolated container or lab:

```bash
pnpm install --frozen-lockfile
pnpm verify
bash -n scripts/sonar-issues-local.sh
git diff --check
```

Before `src/` exists, `verify:sources` reports source gates as N/A. Once `src/` is present it requires strict TypeScript, Steiger, and the build script; a missing build script fails verification. Formatting and zero-warning ESLint always run. GraphQL codegen is N/A until the first GraphQL change.

CI scans the exact checked-out revision, waits for the Sonar quality gate, verifies the analyzed revision, and fails on open issues. Sonar credentials are required in CI and must never be printed or committed. Coverage is not excluded locally; the repository's dedicated no-coverage quality gate is managed outside this repository.

Runtime behavior is checked manually for each implementation task in a dedicated lab. Do not add an automated TUI test suite.
