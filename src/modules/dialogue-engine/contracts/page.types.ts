export interface Page<T> {
  readonly items: readonly T[]
  readonly next?: string
}

export interface SnapshotPage<T> extends Page<T> {
  readonly snapshot: string
  readonly total: number
}
