import { Database, SQLiteError } from 'bun:sqlite'
import { lstat, open } from 'node:fs/promises'
import { DialogueError } from '../../../modules/dialogue-engine/index.js'
import { errorCode } from './errorCode.js'

const PRIVATE_FILE_MODE = 0o600
const SQLITE_BUSY = 5
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
    return new SqliteStorageLock(lockDatabase(path))
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

function lockDatabase(path: string): Database {
  const database = new Database(path, { readwrite: true })
  try {
    for (const statement of LOCK_STATEMENTS) {
      database.run(statement)
    }
    database.run(RECORD_HOLDER, [process.pid])
    return database
  } catch (error) {
    database.close()
    throw lockErrorOf(error)
  }
}

function lockErrorOf(error: unknown): unknown {
  if (error instanceof SQLiteError && error.errno === SQLITE_BUSY) {
    return new DialogueError(
      'storage-locked',
      'Pending dialogue commands are already open in another process.',
      'stop',
    )
  }
  return error
}
