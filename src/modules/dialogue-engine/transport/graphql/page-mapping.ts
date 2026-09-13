import type { SnapshotPage } from '../../contracts/page.types.js'
import { protocolError } from './graphql-error.js'

interface Connection<T> {
  readonly edges: readonly { readonly node: T }[]
  readonly pageInfo: {
    readonly hasNextPage: boolean
    readonly endCursor?: string | null
  }
  readonly snapshotCursor: string
  readonly totalCount: number
}

export function snapshotPageOf<T, R>(
  connection: Connection<T>,
  after: string | undefined,
  map: (node: T) => R,
): SnapshotPage<R> {
  const next = nextCursorOf(connection.pageInfo, after)
  if (connection.snapshotCursor.trim() === '') {
    throw protocolError('Dialogue response has no snapshot cursor.')
  }
  if (
    !Number.isSafeInteger(connection.totalCount) ||
    connection.totalCount < 0
  ) {
    throw protocolError('Dialogue response has an invalid total count.')
  }
  return {
    items: connection.edges.map(({ node }) => map(node)),
    next,
    snapshot: connection.snapshotCursor,
    total: connection.totalCount,
  }
}

function nextCursorOf(
  pageInfo: Connection<unknown>['pageInfo'],
  after: string | undefined,
): string | undefined {
  if (!pageInfo.hasNextPage) return undefined
  const next = pageInfo.endCursor
  if (next == null || next.trim() === '' || next === after) {
    throw protocolError('Dialogue response has an invalid page cursor.')
  }
  return next
}
