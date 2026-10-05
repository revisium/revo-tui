import { Database, SQLiteError } from 'bun:sqlite'
import { randomInt } from 'node:crypto'
import { lstat, open } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import { DialogueError } from '../../../modules/dialogue-engine/index.js'
import { errorCode } from './errorCode.js'

const PRIVATE_FILE_MODE = 0o600
const SQLITE_BUSY = 5
const LOCK_ATTEMPTS = 5
const MIN_RETRY_DELAY_MS = 5
const MAX_RETRY_DELAY_MS = 25
const LOCK_STATEMENTS = [
  'PRAGMA busy_timeout = 0',
  'PRAGMA journal_mode = DELETE',
  'PRAGMA locking_mode = EXCLUSIVE',
  'CREATE TABLE IF NOT EXISTS holder (id INTEGER PRIMARY KEY CHECK (id = 1), pid INTEGER NOT NULL)',
]
const RECORD_HOLDER = 'INSERT OR REPLACE INTO holder (id, pid) VALUES (1, ?)'

export class SqliteStorageLock {
  private constructor(private readonly database: Database) {}

  public static async acquire(path: string): Promise<SqliteStorageLock> {
    await ensurePrivateFile(path)
    return new SqliteStorageLock(await lockDatabase(path))
  }

  public release(): void {
    this.database.close(true)
  }
}

// Closing any descriptor of a file drops this process's locks on it, so only SQLite opens an existing lock file.
async function ensurePrivateFile(path: string): Promise<void> {
  try {
    await (await open(path, 'wx', PRIVATE_FILE_MODE)).close()
  } catch (error) {
    if (errorCode(error) !== 'EEXIST') {
      throw error
    }
    await assertRegularFile(path)
  }
}

async function assertRegularFile(path: string): Promise<void> {
  if (!(await lstat(path)).isFile()) {
    throw new DialogueError(
      'storage-unavailable',
      'Pending command lock file is not a regular file.',
      'stop',
    )
  }
}

// Two openers that start together can each keep a shared lock that blocks the other's write, so both close and retry.
async function lockDatabase(path: string): Promise<Database> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return openExclusively(path)
    } catch (error) {
      if (!isBusy(error) || attempt === LOCK_ATTEMPTS) {
        throw lockErrorOf(error)
      }
    }
    await sleep(randomInt(MIN_RETRY_DELAY_MS, MAX_RETRY_DELAY_MS + 1))
  }
}

function openExclusively(path: string): Database {
  const database = new Database(path, { readwrite: true })
  try {
    for (const statement of LOCK_STATEMENTS) {
      database.run(statement)
    }
    database.run(RECORD_HOLDER, [process.pid])
    return database
  } catch (error) {
    database.close(true)
    throw error
  }
}

function isBusy(error: unknown): boolean {
  return error instanceof SQLiteError && error.errno === SQLITE_BUSY
}

function lockErrorOf(error: unknown): unknown {
  if (isBusy(error)) {
    return new DialogueError(
      'storage-locked',
      'Pending dialogue commands are already open in another process.',
      'stop',
    )
  }
  return error
}
