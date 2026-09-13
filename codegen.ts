import type { CodegenConfig } from '@graphql-codegen/cli'

const scalars = { DateTime: 'string', JSON: 'unknown' }

function outputs(
  operations: string,
  generated: string,
): CodegenConfig['generates'] {
  return {
    [`${generated}/graphql-request.ts`]: {
      documents: operations,
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        rawRequest: false,
        skipTypename: true,
        onlyOperationTypes: true,
        useTypeImports: true,
        scalars,
        documentMode: 'external',
        importDocumentNodeExternallyFrom: './typed-document-nodes',
      },
    },
    [`${generated}/typed-document-nodes.ts`]: {
      documents: operations,
      plugins: [
        {
          add: { content: "import type * as Types from './graphql-request';" },
        },
        'typed-document-node',
      ],
      config: { importOperationTypesFrom: 'Types' },
    },
  }
}

const config: CodegenConfig = {
  overwrite: true,
  hooks: { afterAllFileWrite: ['prettier --write'] },
  schema: 'src/__generated__/schema.graphql',
  generates: {
    ...outputs(
      'src/modules/agent-configurations/transport/graphql/*.graphql',
      'src/modules/agent-configurations/transport/graphql/__generated__',
    ),
    ...outputs(
      'src/modules/dialogue-engine/transport/graphql/*.graphql',
      'src/modules/dialogue-engine/transport/graphql/__generated__',
    ),
  },
}

export default config
