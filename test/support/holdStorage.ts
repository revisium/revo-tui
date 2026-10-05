import { once } from 'node:events'
import { parseArgs } from 'node:util'
import { FileCommandStorage } from '../../src/app/adapters/command-storage/index.js'
import {
  DialogueError,
  type DialogueErrorCode,
  type PendingDialogueCommand,
} from '../../src/modules/dialogue-engine/index.js'

export const HOLDER_WAITING = 'waiting'
export const HOLDER_HELD = 'held'

export type HolderOutcome = typeof HOLDER_HELD | DialogueErrorCode

const KEEPALIVE_INTERVAL_MS = 60_000

if (import.meta.main) {
  await holdStorage(parseArgs({ allowPositionals: true }).positionals)
}

async function holdStorage([
  dataDirectory = '',
  endpoint = '',
  commands = '[]',
]: readonly string[]): Promise<void> {
  const storage = new FileCommandStorage(dataDirectory, endpoint)
  process.stdout.write(`${HOLDER_WAITING}\n`)
  await once(process.stdin, 'data')
  const outcome = await openWithCommands(
    storage,
    JSON.parse(commands) as PendingDialogueCommand[],
  )
  process.stdout.write(`${outcome}\n`)
  // Keeps the open storage reachable: a collected storage would release its lock.
  setInterval(() => storage, KEEPALIVE_INTERVAL_MS)
}

async function openWithCommands(
  storage: FileCommandStorage,
  commands: readonly PendingDialogueCommand[],
): Promise<HolderOutcome> {
  try {
    await storage.open()
  } catch (error) {
    if (error instanceof DialogueError) {
      return error.code
    }
    throw error
  }
  for (const command of commands) {
    await storage.save(command)
  }
  return HOLDER_HELD
}
