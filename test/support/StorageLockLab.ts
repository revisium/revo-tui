import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import type { Readable, Writable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { FileCommandStorage } from '../../src/app/adapters/command-storage/index.js'
import {
  DialogueError,
  type DialogueErrorCode,
  type PendingDialogueCommand,
} from '../../src/modules/dialogue-engine/index.js'
import {
  HOLDER_HELD,
  HOLDER_WAITING,
  type HolderOutcome,
} from './holdStorage.js'

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
    const holder = await this.spawnHolder(commands)
    const outcome = await holder.open()
    if (outcome !== HOLDER_HELD) {
      throw new Error(`The storage holder was refused with ${outcome}.`)
    }
    return holder
  }

  public async startTwoHoldersAtOnce(
    times: number,
  ): Promise<HolderOutcome[][]> {
    const outcomes: HolderOutcome[][] = []
    for (let start = 0; start < times; start += 1) {
      outcomes.push(await this.raceTwoHolders())
    }
    return outcomes
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

  private async raceTwoHolders(): Promise<HolderOutcome[]> {
    const holders = await Promise.all([
      this.spawnHolder([]),
      this.spawnHolder([]),
    ])
    const outcomes = await Promise.all(holders.map((holder) => holder.open()))
    await Promise.all(holders.map((holder) => holder.killAbruptly()))
    return outcomes.toSorted((left, right) => left.localeCompare(right))
  }

  private async spawnHolder(
    commands: readonly PendingDialogueCommand[],
  ): Promise<StorageHolder> {
    const holder = await StorageHolder.spawn([
      this.dataDirectory,
      ENDPOINT,
      JSON.stringify(commands),
    ])
    this.holders.push(holder)
    return holder
  }
}

export class StorageHolder {
  private constructor(
    private readonly child: ChildProcessByStdio<Writable, Readable, null>,
    private readonly lines: AsyncIterator<string>,
    private readonly exited: Promise<unknown>,
  ) {}

  public static async spawn(args: readonly string[]): Promise<StorageHolder> {
    const child = spawn(process.execPath, [HOLDER_ENTRY, ...args], {
      stdio: ['pipe', 'pipe', 'inherit'],
    })
    const lines = createInterface({ input: child.stdout })[
      Symbol.asyncIterator
    ]()
    const holder = new StorageHolder(child, lines, once(child, 'exit'))
    if ((await holder.nextLine()) !== HOLDER_WAITING) {
      throw new Error('The storage holder did not start.')
    }
    return holder
  }

  public async open(): Promise<HolderOutcome> {
    this.child.stdin.write('open\n')
    return (await this.nextLine()) as HolderOutcome
  }

  public async killAbruptly(): Promise<void> {
    if (this.child.exitCode === null && this.child.signalCode === null) {
      this.child.kill('SIGKILL')
    }
    await this.exited
  }

  private async nextLine(): Promise<string> {
    const line = await this.lines.next()
    if (line.done === true) {
      throw new Error('The storage holder exited unexpectedly.')
    }
    return line.value
  }
}
