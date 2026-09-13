import type * as Types from './graphql-request'
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
export const DialogueTurnFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueTurnFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueTurnModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commandId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userItemId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dispatchState' } },
          { kind: 'Field', name: { kind: 'Name', value: 'cancelRequested' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'endItemSequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'outcome' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<Types.DialogueTurnFieldsFragment, unknown>
export const DialogueInteractionFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueInteractionFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueInteractionModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'request' } },
          { kind: 'Field', name: { kind: 'Name', value: 'response' } },
          { kind: 'Field', name: { kind: 'Name', value: 'responseCommandId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<Types.DialogueInteractionFieldsFragment, unknown>
export const DialogueItemFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueItemFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueHistoryItemModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'source' } },
          { kind: 'Field', name: { kind: 'Name', value: 'text' } },
          { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'historical' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<Types.DialogueItemFieldsFragment, unknown>
export const DialogueSummaryFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<Types.DialogueSummaryFieldsFragment, unknown>
export const DialogueChangeFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueChangeFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueChangeModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemVersion' } },
          { kind: 'Field', name: { kind: 'Name', value: 'baseItemVersion' } },
          { kind: 'Field', name: { kind: 'Name', value: 'textDelta' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'item' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueItemFields' },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'summary' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueSummaryFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueItemFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueHistoryItemModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'source' } },
          { kind: 'Field', name: { kind: 'Name', value: 'text' } },
          { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'historical' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<Types.DialogueChangeFieldsFragment, unknown>
export const DialogueListDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'DialogueList' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'first' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'after' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dialogues' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'first' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'after' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: {
                                kind: 'Name',
                                value: 'DialogueSummaryFields',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'endCursor' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'hasNextPage' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'snapshotCursor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.DialogueListQuery,
  Types.DialogueListQueryVariables
>
export const DialogueDetailsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'DialogueDetails' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dialogue' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueSummaryFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.DialogueDetailsQuery,
  Types.DialogueDetailsQueryVariables
>
export const DialogueHistoryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'DialogueHistory' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'first' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'after' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dialogueHistory' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'first' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'after' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: {
                                kind: 'Name',
                                value: 'DialogueItemFields',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'endCursor' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'hasNextPage' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'snapshotCursor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'observedSignificantSequence' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueItemFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueHistoryItemModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'source' } },
          { kind: 'Field', name: { kind: 'Name', value: 'text' } },
          { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'historical' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.DialogueHistoryQuery,
  Types.DialogueHistoryQueryVariables
>
export const DialogueItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'DialogueItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'itemId' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dialogueHistoryItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'itemId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'itemId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueItemFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueItemFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueHistoryItemModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'source' } },
          { kind: 'Field', name: { kind: 'Name', value: 'text' } },
          { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'historical' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.DialogueItemQuery,
  Types.DialogueItemQueryVariables
>
export const DialogueTurnsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'DialogueTurns' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'first' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'after' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dialogueTurns' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'first' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'after' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: {
                                kind: 'Name',
                                value: 'DialogueTurnFields',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'endCursor' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'hasNextPage' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'snapshotCursor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueTurnFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueTurnModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commandId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userItemId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dispatchState' } },
          { kind: 'Field', name: { kind: 'Name', value: 'cancelRequested' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'endItemSequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'outcome' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.DialogueTurnsQuery,
  Types.DialogueTurnsQueryVariables
>
export const DialogueInteractionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'DialogueInteractions' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'first' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'after' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dialogueInteractions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'first' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'after' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: {
                                kind: 'Name',
                                value: 'DialogueInteractionFields',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'endCursor' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'hasNextPage' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'snapshotCursor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueInteractionFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueInteractionModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'request' } },
          { kind: 'Field', name: { kind: 'Name', value: 'response' } },
          { kind: 'Field', name: { kind: 'Name', value: 'responseCommandId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.DialogueInteractionsQuery,
  Types.DialogueInteractionsQueryVariables
>
export const CreateDialogueDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateDialogue' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreateDialogueInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createDialogue' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueSummaryFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.CreateDialogueMutation,
  Types.CreateDialogueMutationVariables
>
export const SendDialogueDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendDialogue' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'SendDialogueInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sendDialogueMessage' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueTurnFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueTurnFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueTurnModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commandId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userItemId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dispatchState' } },
          { kind: 'Field', name: { kind: 'Name', value: 'cancelRequested' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'endItemSequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'outcome' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.SendDialogueMutation,
  Types.SendDialogueMutationVariables
>
export const RespondDialogueDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RespondDialogue' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'RespondDialogueInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'respondDialogue' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueInteractionFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueInteractionFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueInteractionModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'request' } },
          { kind: 'Field', name: { kind: 'Name', value: 'response' } },
          { kind: 'Field', name: { kind: 'Name', value: 'responseCommandId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.RespondDialogueMutation,
  Types.RespondDialogueMutationVariables
>
export const CancelDialogueDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CancelDialogue' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'turnId' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'cancelDialogueTurn' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'turnId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'turnId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueTurnFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueTurnFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueTurnModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commandId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userItemId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dispatchState' } },
          { kind: 'Field', name: { kind: 'Name', value: 'cancelRequested' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'endItemSequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'outcome' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.CancelDialogueMutation,
  Types.CancelDialogueMutationVariables
>
export const ReadDialogueDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ReadDialogue' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'through' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'markDialogueRead' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'through' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'through' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueSummaryFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.ReadDialogueMutation,
  Types.ReadDialogueMutationVariables
>
export const ReopenDialogueDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ReopenDialogue' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reopenDialogue' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueSummaryFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.ReopenDialogueMutation,
  Types.ReopenDialogueMutationVariables
>
export const ForkDialogueDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ForkDialogue' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'ForkDialogueInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'forkDialogue' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueSummaryFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.ForkDialogueMutation,
  Types.ForkDialogueMutationVariables
>
export const DialogueEventsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'DialogueEvents' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'after' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ids' } },
          type: {
            kind: 'ListType',
            type: {
              kind: 'NonNullType',
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dialogueChanges' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'after' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueIds' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'ids' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueChangeFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueItemFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueHistoryItemModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'source' } },
          { kind: 'Field', name: { kind: 'Name', value: 'text' } },
          { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'historical' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueChangeFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueChangeModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemVersion' } },
          { kind: 'Field', name: { kind: 'Name', value: 'baseItemVersion' } },
          { kind: 'Field', name: { kind: 'Name', value: 'textDelta' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'item' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueItemFields' },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'summary' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueSummaryFields' },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.DialogueEventsSubscription,
  Types.DialogueEventsSubscriptionVariables
>
export const DialogueSummariesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'DialogueSummaries' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'after' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ids' } },
          type: {
            kind: 'ListType',
            type: {
              kind: 'NonNullType',
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dialogueSummaryChanges' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'after' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'dialogueIds' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'ids' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueChangeFields' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueItemFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueHistoryItemModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sequence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'turnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'source' } },
          { kind: 'Field', name: { kind: 'Name', value: 'text' } },
          { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'historical' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueSummaryFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueSummaryModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'agentVersion' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentInstallationId' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agentConfiguration' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'pendingCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastOutcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'activeTurnId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'version' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'significantSequence' },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'readSignificantSequence' },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contextMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originDialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originTurnId' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DialogueChangeFields' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'DialogueChangeModel' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dialogueId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemVersion' } },
          { kind: 'Field', name: { kind: 'Name', value: 'baseItemVersion' } },
          { kind: 'Field', name: { kind: 'Name', value: 'textDelta' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'item' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueItemFields' },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'summary' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'DialogueSummaryFields' },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  Types.DialogueSummariesSubscription,
  Types.DialogueSummariesSubscriptionVariables
>
