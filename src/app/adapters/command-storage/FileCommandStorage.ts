import { createHash, randomUUID } from 'node:crypto'
import {
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  type FileHandle,
} from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type {
  DialogueCommandStorage,
  PendingDialogueCommand,
} from '../../../modules/dialogue-engine/index.js'
import {
  DialogueError,
  PersistentCommandStorage,
} from '../../../modules/dialogue-engine/index.js'

const PRIVATE_DIRECTORY_MODE = 0o700
const PRIVATE_FILE_MODE = 0o600
const ACCESS_BITS = 0o077
type StorageState = 'closed' | 'opening' | 'open' | 'failed' | 'closing'

export class FileCommandStorage implements DialogueCommandStorage {
  private readonly directoryPath: string
  private readonly filePath: string
  private readonly lockPath: string
  private lockHandle: FileHandle | undefined
  private commands = PersistentCommandStorage.empty()
  private pendingWrite: Promise<void> = Promise.resolve()
  private state: StorageState = 'closed'

  public constructor(dataDirectory: string, endpoint: string) {
    const namespace = endpointNamespace(endpoint)
    this.directoryPath = join(resolve(dataDirectory), 'command-storage')
    this.filePath = join(this.directoryPath, `${namespace}.json`)
    this.lockPath = join(this.directoryPath, `${namespace}.lock`)
  }

  public async open(): Promise<void> {
    if (this.state === 'open') return
    if (this.state !== 'closed') throw unavailableError()
    this.state = 'opening'
    try {
      await mkdir(this.directoryPath, {
        recursive: true,
        mode: PRIVATE_DIRECTORY_MODE,
      })
      await assertPrivateDirectory(this.directoryPath)
      this.lockHandle = await acquireLock(this.lockPath)
      this.commands = await readCommands(this.filePath)
      this.pendingWrite = Promise.resolve()
      this.state = 'open'
    } catch (error) {
      try {
        await this.releaseLock()
      } catch {
        // The original safe diagnostic has priority over lock cleanup failure.
      } finally {
        this.state = 'closed'
      }
      throw storageErrorOf(error, 'read')
    }
  }

  public async load(): Promise<readonly PendingDialogueCommand[]> {
    this.assertOpen()
    await this.pendingWrite
    return this.commands.commands
  }

  public save(command: PendingDialogueCommand): Promise<void> {
    this.assertOpen()
    const copy = validatedCommand(command)
    return this.enqueue(async () => {
      const next = this.commands.save(copy)
      if (next === this.commands) return
      await writeCommands(this.directoryPath, this.filePath, next)
      this.commands = next
    })
  }

  public remove(command: PendingDialogueCommand): Promise<void> {
    this.assertOpen()
    const copy = validatedCommand(command)
    return this.enqueue(async () => {
      const next = this.commands.remove(copy)
      if (next.commands.length === this.commands.commands.length) return
      await writeCommands(this.directoryPath, this.filePath, next)
      this.commands = next
    })
  }

  public async close(): Promise<void> {
    if (this.state === 'closed') return
    if (this.state !== 'open' && this.state !== 'failed')
      throw unavailableError()
    this.state = 'closing'
    let failure: unknown
    try {
      await this.pendingWrite
    } catch (error) {
      failure = error
    }
    try {
      await this.releaseLock()
    } catch (error) {
      failure ??= error
    } finally {
      this.commands = PersistentCommandStorage.empty()
      this.state = 'closed'
    }
    if (failure !== undefined) throw storageErrorOf(failure, 'write')
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    this.assertOpen()
    const result = this.pendingWrite.then(operation)
    this.pendingWrite = result.catch((error: unknown) => {
      if (error instanceof DialogueError && error.code === 'storage-corrupt') {
        return
      }
      this.state = 'failed'
      throw error
    })
    this.pendingWrite.catch(() => undefined)
    return result
  }

  private assertOpen(): void {
    if (this.state !== 'open') throw unavailableError()
  }

  private async releaseLock(): Promise<void> {
    const handle = this.lockHandle
    this.lockHandle = undefined
    if (handle === undefined) return
    let closeError: unknown
    try {
      await handle.close()
    } catch (error) {
      closeError = error
    }
    await rm(this.lockPath, { force: true })
    if (closeError !== undefined) throw closeError
  }
}

function validatedCommand(
  command: PendingDialogueCommand,
): PendingDialogueCommand {
  const [copy] = PersistentCommandStorage.empty().save(command).commands
  if (copy === undefined) throw corruptError()
  return copy
}

async function acquireLock(path: string): Promise<FileHandle> {
  try {
    return await open(path, 'wx', PRIVATE_FILE_MODE)
  } catch (error) {
    if (errorCode(error) === 'EEXIST') {
      throw new DialogueError(
        'storage-locked',
        'Pending dialogue commands are already open in another process.',
        'stop',
      )
    }
    throw error
  }
}

async function readCommands(path: string): Promise<PersistentCommandStorage> {
  try {
    const file = await lstat(path)
    if (!file.isFile() || file.isSymbolicLink()) throw corruptError()
    assertPrivateMode(file.mode, 'Pending command file permissions are unsafe.')
    return PersistentCommandStorage.parse(
      JSON.parse(await readFile(path, 'utf8')),
    )
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return PersistentCommandStorage.empty()
    if (error instanceof DialogueError) throw error
    if (error instanceof SyntaxError) throw corruptError()
    throw error
  }
}

async function writeCommands(
  directoryPath: string,
  filePath: string,
  commands: PersistentCommandStorage,
): Promise<void> {
  const temporaryPath = join(directoryPath, `.pending-${randomUUID()}.tmp`)
  let temporary: FileHandle | undefined
  try {
    temporary = await open(temporaryPath, 'wx', PRIVATE_FILE_MODE)
    await temporary.writeFile(commands.serialize(), 'utf8')
    await temporary.sync()
    await temporary.close()
    temporary = undefined
    await rename(temporaryPath, filePath)
    const directory = await open(directoryPath, 'r')
    try {
      await directory.sync()
    } finally {
      await directory.close()
    }
  } catch (error) {
    await temporary?.close().catch(() => undefined)
    await rm(temporaryPath, { force: true }).catch(() => undefined)
    throw storageErrorOf(error, 'write')
  }
}

async function assertPrivateDirectory(path: string): Promise<void> {
  const directory = await lstat(path)
  if (!directory.isDirectory() || directory.isSymbolicLink())
    throw unavailableError()
  assertPrivateMode(
    directory.mode,
    'Pending command directory permissions are unsafe.',
  )
}

function assertPrivateMode(mode: number, message: string): void {
  if (mode % (ACCESS_BITS + 1) !== 0) {
    throw new DialogueError('storage-unavailable', message, 'stop')
  }
}

function endpointNamespace(endpoint: string): string {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    throw new TypeError('Command storage endpoint must be an absolute URL.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('Command storage endpoint must use HTTP or HTTPS.')
  }
  return createHash('sha256')
    .update(`${url.protocol}//${url.host}${url.pathname}`)
    .digest('hex')
}

function storageErrorOf(
  error: unknown,
  operation: 'read' | 'write',
): DialogueError {
  if (error instanceof DialogueError) return error
  return new DialogueError(
    operation === 'write' ? 'storage-write' : 'storage-unavailable',
    operation === 'write'
      ? 'Pending dialogue commands could not be saved durably.'
      : 'Pending dialogue commands could not be opened.',
    'stop',
  )
}

function corruptError(): DialogueError {
  return new DialogueError(
    'storage-corrupt',
    'Pending dialogue command data is malformed.',
    'stop',
  )
}

function unavailableError(): DialogueError {
  return new DialogueError(
    'storage-unavailable',
    'Pending dialogue command storage is unavailable.',
    'stop',
  )
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return
  return typeof error.code === 'string' ? error.code : undefined
}
