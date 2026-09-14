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

## Package release checks

Review the version, run the source build, and create an ordinary npm tarball:

```bash
pnpm build
npm pack --json
```

Inspect the tarball contents: it must contain only the `bin` launcher, built
`dist`, `README.md`, `LICENSE`, and npm's mandatory `package.json` from the
package allowlist. In a fresh
consumer directory, install that local tarball with
`npm install <tarball> --omit=dev --no-audit --no-fund`, then check the bin
help/version, non-TTY error, `@revisium/revo-tui/launcher` import, and that the
package-local Bun 1.4.2 executable resolves. These are manual commands, not a
new product check script.

Publishing is a separately authorized action. After review, use the ordinary
release sequence: verify the version, build, pack, inspect/install the exact
artifact, then publish stable with the `latest` tag or a prerelease with the
`alpha` tag. No publish is performed by this repository task.

The launcher contract is manually evidenced on Linux glibc x64. macOS runtime
validation is not available here and must not be represented as verified.
Core-empty or missing-provider environments do not prove provider generation;
provider E2E remains a separate gap.

## Manual launcher checks

Verify help and version without a TTY, input errors with exit code 2, package-local Bun and missing UI diagnostics, child exit propagation, signal and abort handling, and terminal restoration against the captured `stty -g` state. Record runtime versions, OS, architecture, and observations outside the product repository. Linux validation does not replace the required macOS manual launcher check.

## Manual composition checks

Verify the real OpenTUI renderer in a PTY: initial not-connected status, help visibility, resize, keyboard and signal exits, and terminal restoration. Exercise renderer startup and asynchronous render failures in a disposable lab, confirming that the React root unmounts before the renderer is destroyed and each transient ViewModel is disposed once. Record evidence outside the product repository. Linux validation does not replace the required macOS renderer check.

## Manual subscription checks

Against a dedicated Core lab, verify the initial `agentConfigurations` snapshot,
operation cancellation, connection disposal, and absence of late callbacks. Use a
disposable local responder to inspect typed access, network, protocol, GraphQL, and
timeout failures without recording request payloads or credentials.
