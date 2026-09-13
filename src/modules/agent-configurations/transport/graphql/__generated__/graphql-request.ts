import type { GraphQLClient, RequestOptions } from 'graphql-request'
import * as Operations from './typed-document-nodes'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never }
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never
    }
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders']
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: unknown; output: unknown }
}

export type AdrAlternativeInput = {
  summary: Scalars['String']['input']
  title: Scalars['String']['input']
}

export type AdrInput = {
  alternatives: Array<AdrAlternativeInput>
  consequences: Scalars['String']['input']
  context: Scalars['String']['input']
  decision: Scalars['String']['input']
  id: Scalars['ID']['input']
  projectId: Scalars['ID']['input']
  relatedRequirements: Array<Scalars['String']['input']>
  status: AdrStatus
  supersededBy: Scalars['String']['input']
  title: Scalars['String']['input']
}

export enum AdrStatus {
  Accepted = 'accepted',
  Deprecated = 'deprecated',
  Proposed = 'proposed',
  Rejected = 'rejected',
  Superseded = 'superseded',
}

export enum AgentConfigurationsStatus {
  Loading = 'LOADING',
  NotInitialized = 'NOT_INITIALIZED',
  Ready = 'READY',
}

export enum CatalogChangeType {
  Added = 'ADDED',
  Modified = 'MODIFIED',
  Removed = 'REMOVED',
  Renamed = 'RENAMED',
  RenamedAndModified = 'RENAMED_AND_MODIFIED',
}

export enum CatalogScope {
  Draft = 'DRAFT',
  Head = 'HEAD',
  Revision = 'REVISION',
}

export enum CatalogTable {
  LaunchProfiles = 'launchProfiles',
  MethodDocuments = 'methodDocuments',
  PipelineRoles = 'pipelineRoles',
  Pipelines = 'pipelines',
  Playbooks = 'playbooks',
  RoleRefs = 'roleRefs',
  Roles = 'roles',
  SharedReferences = 'sharedReferences',
  StackRefs = 'stackRefs',
  Stacks = 'stacks',
}

export type CreateDialogueInput = {
  agentConfiguration?: InputMaybe<Scalars['JSON']['input']>
  agentId: Scalars['String']['input']
  agentInstallationId: Scalars['String']['input']
  agentVersion: Scalars['String']['input']
  metadata?: InputMaybe<Scalars['JSON']['input']>
  systemContext?: InputMaybe<Scalars['String']['input']>
  title: Scalars['String']['input']
}

export type ForkDialogueInput = {
  dialogueId: Scalars['ID']['input']
  title: Scalars['String']['input']
  turnId: Scalars['ID']['input']
}

export type LaunchProfileInput = {
  id: Scalars['ID']['input']
  pipelineId: Scalars['ID']['input']
  profile: Scalars['JSON']['input']
  status: LaunchProfileStatus
}

export enum LaunchProfileStatus {
  Active = 'active',
  Deprecated = 'deprecated',
}

export type MethodDocumentInput = {
  body: Scalars['String']['input']
  id: Scalars['ID']['input']
  kind: MethodDocumentKind
  playbookId: Scalars['ID']['input']
}

export enum MethodDocumentKind {
  Checklist = 'checklist',
  Method = 'method',
  Nav = 'nav',
  Template = 'template',
}

export type PipelineInput = {
  id: Scalars['ID']['input']
  pipeline: Scalars['JSON']['input']
  playbookId: Scalars['ID']['input']
}

export type PipelineRoleInput = {
  id: Scalars['ID']['input']
  membership: PipelineRoleMembership
  pipelineId: Scalars['ID']['input']
  roleId: Scalars['ID']['input']
}

export enum PipelineRoleMembership {
  Alternative = 'alternative',
  Optional = 'optional',
  Required = 'required',
}

export type PlaybookInput = {
  id: Scalars['ID']['input']
  name: Scalars['String']['input']
}

export type ProjectCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>
  name: Scalars['String']['input']
}

export type ProjectInput = {
  id: Scalars['ID']['input']
}

export type ProjectListInput = {
  after?: InputMaybe<Scalars['String']['input']>
  first?: InputMaybe<Scalars['Int']['input']>
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>
  query?: InputMaybe<Scalars['String']['input']>
}

export enum ProjectStatus {
  Active = 'active',
  Archived = 'archived',
}

export type ProjectUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>
  id: Scalars['ID']['input']
  name?: InputMaybe<Scalars['String']['input']>
}

export type RecordDeleteInput = {
  id: Scalars['ID']['input']
  projectId: Scalars['ID']['input']
}

export type RecordListInput = {
  after?: InputMaybe<Scalars['String']['input']>
  first?: InputMaybe<Scalars['Int']['input']>
}

export type RequirementInput = {
  acceptance: Scalars['String']['input']
  id: Scalars['ID']['input']
  projectId: Scalars['ID']['input']
  relatedAdr: Array<Scalars['String']['input']>
  statement: Scalars['String']['input']
  status: RequirementStatus
  title: Scalars['String']['input']
}

export enum RequirementStatus {
  Accepted = 'accepted',
  Deferred = 'deferred',
  Proposed = 'proposed',
  Rejected = 'rejected',
}

export type RespondDialogueInput = {
  commandId: Scalars['String']['input']
  dialogueId: Scalars['ID']['input']
  interactionId: Scalars['ID']['input']
  response: Scalars['JSON']['input']
}

export type RoleInput = {
  body: Scalars['String']['input']
  id: Scalars['ID']['input']
  playbookId: Scalars['ID']['input']
}

export type RoleRefInput = {
  body: Scalars['String']['input']
  id: Scalars['ID']['input']
  roleId: Scalars['ID']['input']
}

export type SendDialogueInput = {
  commandId: Scalars['String']['input']
  dialogueId: Scalars['ID']['input']
  prompt: Scalars['String']['input']
}

export type SharedReferenceInput = {
  body: Scalars['String']['input']
  id: Scalars['ID']['input']
  playbookId: Scalars['ID']['input']
}

export type StackInput = {
  body: Scalars['String']['input']
  id: Scalars['ID']['input']
  playbookId: Scalars['ID']['input']
}

export type StackRefInput = {
  body: Scalars['String']['input']
  id: Scalars['ID']['input']
  stackId: Scalars['ID']['input']
}

export type StartRunInput = {
  input: Scalars['JSON']['input']
  pipeline?: InputMaybe<Scalars['JSON']['input']>
  pipelineId?: InputMaybe<Scalars['ID']['input']>
  profile?: InputMaybe<Scalars['JSON']['input']>
  profileId?: InputMaybe<Scalars['ID']['input']>
}

export type WorkItemInput = {
  acceptance: Scalars['String']['input']
  cancelled: Scalars['Boolean']['input']
  constraints: Scalars['String']['input']
  dependsOn: Array<Scalars['String']['input']>
  goal: Scalars['String']['input']
  id: Scalars['ID']['input']
  inputs: Scalars['String']['input']
  owner: Scalars['String']['input']
  plan: Scalars['String']['input']
  projectId: Scalars['ID']['input']
  relatedAdr: Array<Scalars['String']['input']>
  relatedRequirements: Array<Scalars['String']['input']>
  title: Scalars['String']['input']
}

export type WorkPlanInput = {
  acceptance: Scalars['String']['input']
  baselineId: Scalars['String']['input']
  bounds: Scalars['String']['input']
  id: Scalars['ID']['input']
  outcome: Scalars['String']['input']
  projectId: Scalars['ID']['input']
  status: WorkPlanStatus
  title: Scalars['String']['input']
}

export enum WorkPlanStatus {
  Closed = 'closed',
  Draft = 'draft',
  Ready = 'ready',
}

export type AgentConfigurationDefinitionsQueryVariables = Exact<{
  first: Scalars['Int']['input']
  after?: InputMaybe<Scalars['String']['input']>
}>

export type AgentConfigurationDefinitionsQuery = {
  agentDefinitions: {
    edges: Array<{
      node: {
        displayName: string
        description?: string | null
        agent: { id: string; version: string; installationId: string }
      }
    }>
    pageInfo: { endCursor?: string | null; hasNextPage: boolean }
  }
}

export type AgentConfigurationsSubscriptionVariables = Exact<{
  [key: string]: never
}>

export type AgentConfigurationsSubscription = {
  agentConfigurations: {
    status: AgentConfigurationsStatus
    catalogs: Array<{
      catalogRevision: string
      definitionDigest: string
      schemaVersion: string
      agent: { id: string; version: string; installationId: string }
      launch: { executable: string; reportedVersion: string }
      model?: {
        currentModel: string
        optionId: string
        currentProvider?: { id: string; name: string } | null
        providers: Array<{
          id: string
          name: string
          models: Array<{
            description?: string | null
            name: string
            value: string
            group?: { id: string; name: string } | null
          }>
        }>
        sessionAvailable: Array<{
          description?: string | null
          name: string
          value: string
          group?: { id: string; name: string } | null
        }>
      } | null
      options: Array<
        | {
            __typename: 'AgentConfigurationBooleanModel'
            category?: string | null
            description?: string | null
            id: string
            name: string
            type: string
            booleanValue: boolean
          }
        | {
            __typename: 'AgentConfigurationSelectModel'
            category?: string | null
            description?: string | null
            id: string
            name: string
            type: string
            selectValue: string
            values: Array<{
              description?: string | null
              name: string
              value: string
              group?: { id: string; name: string } | null
            }>
          }
      >
    }>
  }
}

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action()

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    AgentConfigurationDefinitions(
      variables: AgentConfigurationDefinitionsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<AgentConfigurationDefinitionsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AgentConfigurationDefinitionsQuery>(
            Operations.AgentConfigurationDefinitionsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        'AgentConfigurationDefinitions',
        'query',
        variables,
      )
    },
    AgentConfigurations(
      variables?: AgentConfigurationsSubscriptionVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<AgentConfigurationsSubscription> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AgentConfigurationsSubscription>(
            Operations.AgentConfigurationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        'AgentConfigurations',
        'subscription',
        variables,
      )
    },
  }
}
export type Sdk = ReturnType<typeof getSdk>
