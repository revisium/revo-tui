import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { PendingDialogueCommand } from '../src/modules/dialogue-engine/index.js'
import { StorageLockLab } from './support/StorageLockLab.js'

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

  test('refuses a second process while another process holds the storage', async () => {
    await lab.leaveStorageOfEarlierRun()
    await lab.startHolder([unsentMessage])

    expect(await lab.openStorage()).toEqual({ refused: 'storage-locked' })
  })

  test('opens the storage with unsent commands after the holder is killed', async () => {
    const holder = await lab.startHolder([unsentMessage])

    await holder.killAbruptly()

    expect(await lab.openStorage()).toEqual({
      pendingCommands: [unsentMessage],
    })
  })
})
