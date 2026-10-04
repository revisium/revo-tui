import { Database, SQLiteError } from 'bun:sqlite'
import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import { DialogueError } from '../../../modules/dialogue-engine/index.js'

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
    await createPrivateFile(path)
    return new SqliteStorageLock(lockDatabase(path))
  }

  public release(): void {
    this.database.close(true)
  }
}

async function createPrivateFile(path: string): Promise<void> {
  const file = await open(
    path,
    constants.O_RDWR | constants.O_CREAT | constants.O_NOFOLLOW,
    PRIVATE_FILE_MODE,
  )
  await file.close()
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
