import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { FileCommandStorage } from '../../src/app/adapters/command-storage/index.js'
import {
  DialogueError,
  type DialogueErrorCode,
  type PendingDialogueCommand,
} from '../../src/modules/dialogue-engine/index.js'
import { HOLDER_READY } from './holdStorage.js'

const ENDPOINT = 'https://storage-lock.invalid/graphql'
const HOLDER_ENTRY = fileURLToPath(new URL('holdStorage.ts', import.meta.url))

export type OpenOutcome =
  | { readonly pendingCommands: readonly PendingDialogueCommand[] }
  | { readonly refused: DialogueErrorCode }

export class StorageLockLab {
  private readonly holders: StorageHolder[] = []
  private readonly storages: FileCommandStorage[] = []

  private constructor(private readonly dataDirectory: string) {}

  public static async create(): Promise<StorageLockLab> {
    const dataDirectory = await mkdtemp(join(tmpdir(), 'revo-tui-lock-'))
    return new StorageLockLab(dataDirectory)
  }

  public async leaveStorageOfEarlierRun(): Promise<void> {
    const storage = new FileCommandStorage(this.dataDirectory, ENDPOINT)
    await storage.open()
    await storage.close()
  }

  public async startHolder(
    commands: readonly PendingDialogueCommand[],
  ): Promise<StorageHolder> {
    const holder = await StorageHolder.start([
      this.dataDirectory,
      ENDPOINT,
      JSON.stringify(commands),
    ])
    this.holders.push(holder)
    return holder
  }

  public async openStorage(): Promise<OpenOutcome> {
    const storage = new FileCommandStorage(this.dataDirectory, ENDPOINT)
    try {
      await storage.open()
    } catch (error) {
      if (error instanceof DialogueError) {
        return { refused: error.code }
      }
      throw error
    }
    this.storages.push(storage)
    return { pendingCommands: await storage.load() }
  }

  public async dispose(): Promise<void> {
    await Promise.all(this.holders.map((holder) => holder.killAbruptly()))
    await Promise.all(this.storages.map((storage) => storage.close()))
    await rm(this.dataDirectory, { recursive: true, force: true })
  }
}

export class StorageHolder {
  private constructor(
    private readonly child: ChildProcess,
    private readonly exited: Promise<unknown>,
  ) {}

  public static async start(args: readonly string[]): Promise<StorageHolder> {
    const child = spawn(process.execPath, [HOLDER_ENTRY, ...args], {
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    const holder = new StorageHolder(child, once(child, 'exit'))
    await holder.waitUntilReady()
    return holder
  }

  public async killAbruptly(): Promise<void> {
    if (this.child.exitCode === null && this.child.signalCode === null) {
      this.child.kill('SIGKILL')
    }
    await this.exited
  }

  private async waitUntilReady(): Promise<void> {
    if (this.child.stdout === null) {
      throw new Error('The storage holder has no output stream.')
    }
    for await (const line of createInterface({ input: this.child.stdout })) {
      if (line === HOLDER_READY) {
        return
      }
    }
    throw new Error('The storage holder exited before it held the storage.')
  }
}
