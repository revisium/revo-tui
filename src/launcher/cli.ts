import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { RevoTuiLaunchError } from './errors.js'
import { readPackageManifest } from './paths.js'
import { runRevoTui } from './run-revo-tui.js'

const HELP = `revo-tui — terminal client for a running Revo Core API

Usage:
  revo-tui --api-url <url> [--data-dir <dir>]
  revo-tui --help
  revo-tui --version

Options:
  --api-url <url>   Absolute HTTP(S) Core URL (or REVO_TUI_API_URL)
  --data-dir <dir>  Local TUI data directory (default: ~/.revo/tui)
  --help, -h        Show help
  --version, -v     Show version

This command connects to an existing API. It does not start Core or install packages.
`
const INPUT_ERROR_EXIT_CODE = 2

interface ParsedArguments {
  readonly apiUrl?: string
  readonly dataDir?: string
  readonly help: boolean
  readonly version: boolean
}

class CliInputError extends Error {}

export async function runCli(
  argv: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<number> {
  let parsed: ParsedArguments

  try {
    parsed = parseArguments(argv)
  } catch (error) {
    writeError(error)
    return INPUT_ERROR_EXIT_CODE
  }

  if (parsed.help) {
    process.stdout.write(HELP)
    return 0
  }

  if (parsed.version) {
    process.stdout.write(`${packageVersion()}\n`)
    return 0
  }

  const apiUrl = parsed.apiUrl ?? env.REVO_TUI_API_URL

  if (!apiUrl) {
    process.stderr.write('Missing --api-url or REVO_TUI_API_URL.\n')
    return INPUT_ERROR_EXIT_CODE
  }

  const dataDir = resolve(
    parsed.dataDir ??
      env.REVO_TUI_DATA_DIR ??
      resolve(homedir(), '.revo', 'tui'),
  )

  try {
    return await runRevoTui({ apiUrl, dataDir })
  } catch (error) {
    writeError(error)
    return isInputError(error) ? INPUT_ERROR_EXIT_CODE : 1
  }
}

function parseArguments(argv: readonly string[]): ParsedArguments {
  let apiUrl: string | undefined
  let dataDir: string | undefined
  let help = false
  let version = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--help' || argument === '-h') {
      help = true
    } else if (argument === '--version' || argument === '-v') {
      version = true
    } else if (argument === '--api-url' || argument?.startsWith('--api-url=')) {
      const parsed = optionValue(argument, '--api-url', argv[index + 1])
      apiUrl = parsed.value
      index += parsed.consumedNext ? 1 : 0
    } else if (
      argument === '--data-dir' ||
      argument?.startsWith('--data-dir=')
    ) {
      const parsed = optionValue(argument, '--data-dir', argv[index + 1])
      dataDir = parsed.value
      index += parsed.consumedNext ? 1 : 0
    } else {
      throw new CliInputError(
        'Unknown argument. Run --help for supported options.',
      )
    }
  }

  return { apiUrl, dataDir, help, version }
}

function optionValue(
  argument: string,
  option: string,
  next: string | undefined,
): { readonly value: string; readonly consumedNext: boolean } {
  const inlinePrefix = `${option}=`
  const inline = argument.startsWith(inlinePrefix)
  const value = inline ? argument.slice(inlinePrefix.length) : next

  if (!value || (!inline && value.startsWith('-'))) {
    throw new CliInputError(`Missing value for ${option}.`)
  }

  return { value, consumedNext: !inline }
}

function packageVersion(): string {
  const manifest = readPackageManifest()

  if (typeof manifest.version !== 'string') {
    throw new TypeError('Package metadata does not contain a version.')
  }

  return manifest.version
}

function isInputError(error: unknown): boolean {
  return (
    error instanceof RevoTuiLaunchError &&
    (error.code === 'invalid-api-url' || error.code === 'no-tty')
  )
}

function writeError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
}
