import { makeAutoObservable, observable } from 'mobx'
import type { DialogueSummary } from '../contracts/dialogue.types.js'
import type { DialogueView } from '../contracts/public.types.js'
import { DialogueError } from '../errors/DialogueError.js'
import { DialogueModel } from './DialogueModel.js'

export class DialogueStore {
  private readonly dialogues = observable.map<string, DialogueModel>()
  private listIds: string[] = []

  public constructor() {
    makeAutoObservable<this, 'dialogues'>(this, { dialogues: false })
  }

  public get listed(): readonly DialogueView[] {
    return Object.freeze(
      this.listIds.flatMap((id) => {
        const model = this.dialogues.get(id)
        return model === undefined ? [] : [model.view]
      }),
    )
  }

  public model(id: string): DialogueModel | undefined {
    return this.dialogues.get(id)
  }

  public include(summary: DialogueSummary): {
    model: DialogueModel
    changed: boolean
  } {
    let model = this.dialogues.get(summary.id)
    const changed = model === undefined ? true : model.applySummary(summary)
    if (model === undefined) {
      model = new DialogueModel(summary)
      this.dialogues.set(summary.id, model)
    }
    if (!this.listIds.includes(summary.id)) this.listIds.push(summary.id)
    return { model, changed }
  }

  public require(id: string): DialogueModel {
    const model = this.dialogues.get(id)
    if (model === undefined) {
      throw new DialogueError(
        'invalid-change',
        'Dialogue snapshot is required before applying this change.',
        'refresh',
      )
    }
    return model
  }
}
