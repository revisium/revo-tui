import type { CodegenConfig } from '@graphql-codegen/cli'

const operations =
  'src/modules/agent-configurations/transport/graphql/*.graphql'
const generated =
  'src/modules/agent-configurations/transport/graphql/__generated__'
const scalars = { DateTime: 'string', JSON: 'unknown' }

const config: CodegenConfig = {
  overwrite: true,
  hooks: { afterAllFileWrite: ['prettier --write'] },
  schema: 'src/__generated__/schema.graphql',
  documents: [operations],
  generates: {
    [`${generated}/graphql-request.ts`]: {
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
      plugins: [
        {
          add: { content: "import type * as Types from './graphql-request';" },
        },
        'typed-document-node',
      ],
      config: { importOperationTypesFrom: 'Types' },
    },
  },
}

export default config
