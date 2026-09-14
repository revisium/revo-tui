# @revisium/revo-tui

Standalone terminal client for an already running Revo Core API.

## Run

```bash
npx @revisium/revo-tui --api-url http://127.0.0.1:3000/graphql
```

The URL can instead be supplied with `REVO_TUI_API_URL`. Use
`--data-dir <directory>` or `REVO_TUI_DATA_DIR` for the client state directory;
the default is `~/.revo/tui`. The client connects to Core and does not install,
start, or update Core.

The package launcher is also available to Node applications:

```js
import { runRevoTui } from '@revisium/revo-tui/launcher'

const exitCode = await runRevoTui({
  apiUrl: 'http://127.0.0.1:3000/graphql',
  dataDir: '/var/tmp/revo-tui',
  signal: abortController.signal,
})
```

The launcher requires a TTY, runs the package-local Bun 1.4.2 runtime, and
returns the child UI exit code. It does not require a global Bun installation.

The supported development and release toolchain is Node 26.8.2, pnpm 12.4.1,
OpenTUI 0.5.11, React 19.3.0, and Bun 1.4.2. Linux glibc x64 is manually
validated; macOS runtime validation remains a release gap.
