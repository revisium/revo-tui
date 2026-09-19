# Releasing `@revisium/revo-tui`

Release automation is deliberately limited to bootstrapping the existing
`0.0.0` baseline and starting the first `0.1.0-alpha` train. The shared,
immutable `revisium-actions` workflows own version calculation and write the
release branch/tag; do not edit `package.json` manually for a release.

## Required GitHub and npm setup

Before write mode, an administrator must ensure:

- the Revisium release GitHub App is installed for this repository;
- the repository can read `RELEASE_BOT_CLIENT_ID` as an Actions variable and
  `RELEASE_BOT_PRIVATE_KEY` as an Actions secret;
- npm Trusted Publishing is configured for `revisium/revo-tui` and the exact
  workflow filename `npm-publish.yml`, with the `npm publish` action allowed;
- the Trusted Publisher environment is empty, matching the workflow;
- `package.json` points to `https://github.com/revisium/revo-tui` and the
  publisher runs on GitHub-hosted runners with `id-token: write`;
- tag/branch rules permit the release App to create `v*` tags and
  `release/0.1.x`.

The release train does not probe npm authentication: `npm whoami` cannot verify
OIDC. Authentication is established by npm during `npm publish` in the
tag-triggered `npm-publish.yml` workflow. That workflow requires npm CLI 11.5.1
or newer; Node 26.8.2 supplies a compatible runtime. Dry runs do not require
release App credentials and never write refs or publish packages; they do not
validate the npm Trusted Publisher connection.

## First alpha release

Run these steps in order from `master`:

1. Dispatch **Bootstrap stable release baseline** with `dry_run: true`. It is
   hard-coded to the existing package version `0.0.0`; check the target commit
   and tag in the summary.
2. After reviewing the dry run and confirming the admin setup, dispatch it with
   `dry_run: false`. This creates `v0.0.0` without a GitHub Release. The publish
   workflow explicitly skips this tag because `0.0.0` is already on npm.
3. Dispatch **Release train** with `action: start-minor-alpha` and
   `dry_run: true`. Confirm the plan is `release/0.1.x`,
   `0.1.0-alpha.0`, and `v0.1.0-alpha.0`.
4. After reviewing the plan, dispatch the same transition with `dry_run: false`.
   The shared train updates `package.json` on the release branch and creates
   the alpha tag. That tag triggers the verified-tarball publisher.
5. Confirm the publish workflow and inspect the installed public package. The
   prerelease uses the npm `alpha` dist-tag; it must not move `latest`.

The publisher accepts only `v0.1.0-alpha.N`, verifies that the tag commit is on
`release/0.1.x`, checks the package name/version and registry state, then runs
`pnpm verify` and packs once. It checks that the tarball contains the launcher
and built UI entrypoints, and publishes that exact tarball. Existing registry
versions are never overwritten; registry errors other than a confirmed 404
fail closed.

## Recovery

- A failed dry run creates no branch, tag, release, or npm version.
- A failed bootstrap write must be investigated before retrying; do not create
  or move `v0.0.0` manually.
- If an alpha tag exists but npm publication failed, inspect the failed
  publisher run and credentials. Rerunning the publisher is safe only while
  that npm version remains absent.
- Do not delete or move a release tag automatically. If publication fails
  after tag creation, correct the cause and rerun the publisher for that same
  tag while the package version remains absent from npm.
- If the npm version already exists, the publisher skips it without verifying
  that its contents match the tag's artifact. Do not describe that skip as a
  successful identity check.
- If the npm version already exists, do not retry publication or reuse that
  version. Verify it in a clean consumer, then use the release train's next
  supported transition after updating this repository's intentionally narrow
  first-alpha workflow.
