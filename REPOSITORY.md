# Repository structure

Production source follows these ownership boundaries:

- `bin/`: package launcher entrypoint.
- `src/launcher/`: Node launcher and POSIX terminal adapter; never imports UI or Bun modules.
- `src/app/`: Bun entrypoint, providers, dependency registration, and shutdown.
- `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`: FSD application layers.
- `src/modules/`: framework-independent observable requests, agent configuration, GraphQL subscriptions, and dialogue engine.

Use public `index.ts` entrypoints between slices and modules. Avoid generic `utils`, shared type dumps, wrappers without a current boundary, and deep imports into dependencies. Keep fields, constructor, public methods, then private methods in classes, with one abstraction level per method.
