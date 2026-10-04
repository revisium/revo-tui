import { parseArgs } from 'node:util'
import { FileCommandStorage } from '../../src/app/adapters/command-storage/index.js'
import type { PendingDialogueCommand } from '../../src/modules/dialogue-engine/index.js'

export const HOLDER_READY = 'ready'

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
  await storage.open()
  for (const command of JSON.parse(commands) as PendingDialogueCommand[]) {
    await storage.save(command)
  }
  process.stdout.write(`${HOLDER_READY}\n`)
  // Keeps the open storage reachable: a collected storage would release its lock.
  setInterval(() => storage, KEEPALIVE_INTERVAL_MS)
}
