# Verification

Run the canonical checks with Node 26.8.2 and pnpm 12.4.1 in an isolated container or lab:

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm test:storage-lock
bash -n scripts/sonar-issues-local.sh
git diff --check
```

`verify:sources` requires strict TypeScript, Steiger, and a launcher build. Formatting and zero-warning ESLint always run. GraphQL codegen is N/A until the first GraphQL change.

CI scans the exact checked-out revision, waits for the Sonar quality gate, verifies the analyzed revision, and fails on open issues. Sonar credentials are required in CI and must never be printed or committed. Coverage is not collected because the storage lock check is the only automated test; bugs, vulnerabilities, smells, and duplication remain analyzed.

Runtime behavior is checked manually for each implementation task in a dedicated lab. Do not add an automated TUI test suite.

## Storage lock check

`pnpm test:storage-lock` is the only automated test, approved by the owner as an exception to the manual-validation rule. It runs the real `FileCommandStorage` adapter under Bun's built-in test runner with a second Bun process holding the storage, and proves that:

- a second process opening the same storage is refused with `storage-locked` without waiting;
- after the holder is killed with `SIGKILL`, the next process acquires the lock at once and loads the unsent commands from the JSON outbox.

CI runs it on `ubuntu-24.04`, `ubuntu-24.04-arm`, `macos-15` and `macos-15-intel` and prints the SQLite version in use: Bun's bundled SQLite on Linux and the system SQLite on macOS. It is the only runtime behavior that CI proves on macOS; everything else in the TUI stays manually validated.

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
new product check script. When npm approval is enabled, approve only the exact
installed `bun@1.4.2` script as described in README.

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
