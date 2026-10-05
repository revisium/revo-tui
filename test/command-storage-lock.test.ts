import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { PendingDialogueCommand } from '../src/modules/dialogue-engine/index.js'
import { StorageLockLab } from './support/StorageLockLab.js'

const REFUSAL_TIMEOUT_MS = 2_000
const SIMULTANEOUS_STARTS = 20
const SIMULTANEOUS_STARTS_TIMEOUT_MS = 30_000

const unsentMessage: PendingDialogueCommand = {
  kind: 'message',
  commandId: 'command-1',
  dialogueId: 'dialogue-1',
  prompt: 'Unsent prompt',
}

describe('pending command storage lock', () => {
  let lab: StorageLockLab

  beforeEach(async () => {
    lab = await StorageLockLab.create()
  })

  afterEach(async () => {
    await lab.dispose()
  })

  test(
    'refuses a second process while another process holds the storage',
    async () => {
      await lab.leaveStorageOfEarlierRun()
      await lab.startHolder([unsentMessage])

      expect(await lab.openStorage()).toEqual({ refused: 'storage-locked' })
    },
    REFUSAL_TIMEOUT_MS,
  )

  test(
    'lets exactly one of two processes started at once hold the storage',
    async () => {
      expect(await lab.startTwoHoldersAtOnce(SIMULTANEOUS_STARTS)).toEqual(
        Array.from({ length: SIMULTANEOUS_STARTS }, () => [
          'held',
          'storage-locked',
        ]),
      )
    },
    SIMULTANEOUS_STARTS_TIMEOUT_MS,
  )

  test('opens the storage with unsent commands after the holder is killed', async () => {
    const holder = await lab.startHolder([unsentMessage])

    await holder.killAbruptly()

    expect(await lab.openStorage()).toEqual({
      pendingCommands: [unsentMessage],
    })
  })
})
