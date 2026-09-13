# Development rules

Revo TUI is a terminal client. It does not start or update Revo Core, own provider authentication, or implement browser UI.

- Use Node 26.8.2, pnpm 12.4.1, and the exact dependency versions in `package.json`.
- Do not add automated tests for the TUI, launcher, helpers, or engines. Validate runtime behavior manually in an isolated lab.
- Keep CI gates strict: formatting, zero-warning lint, strict typecheck, Steiger boundaries, build, and Sonar inspection. GraphQL codegen becomes required with the first GraphQL change.
- Add dependencies only for current production behavior. Do not publish packages or change credentials as part of development.

## Architecture

FSD dependencies flow `app -> pages -> widgets -> features -> entities -> shared`. A layer may skip lower layers, but a slice does not import a sibling slice. Import lower slices through public entrypoints.

`src/launcher` and `src/modules` are independent of FSD. They do not import React, OpenTUI, browser globals, or FSD layers. Modules communicate through public entrypoints. Dialogue engine and agent configuration may depend on the public subscription and observable-request modules; reverse dependencies are forbidden.

Register concrete services in `app/providers`. Shared code provides mechanisms only and does not import features or pages. Constructors perform no IO. Owners start, mount, dispose, and unmount resources explicitly; resolve each constructor dependency into a named local first.

Keep one named React component per file with a named props interface. Components render a ViewModel and bind events. ViewModels own presentation state and workflows, `ObservableRequest` owns request state, services own IO, the engine owns dialogue state and commands, and subscriptions own reconnect behavior.
