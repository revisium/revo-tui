import { DIContainer } from '../../shared/lib/index.js'
import { GraphqlSubscriptions } from '../../modules/graphql-subscriptions/index.js'
import {
  DialogueActions,
  DialogueCommands,
  DialogueEngine,
  GraphqlDialogueBackend,
} from '../../modules/dialogue-engine/index.js'
import { FileCommandStorage } from '../adapters/command-storage/FileCommandStorage.js'
import {
  AppViewModel,
  type AppViewModelOptions,
} from '../model/AppViewModel.js'
import {
  ApplicationLifecycle,
  applicationFactories,
} from './ApplicationLifecycle.js'

export function createApplication(
  options: AppViewModelOptions,
): ApplicationLifecycle {
  const container = new DIContainer()
  const endpoints = graphqlEndpoints(options.apiUrl)

  container.register(
    GraphqlSubscriptions,
    () =>
      new GraphqlSubscriptions({
        endpoint: endpoints.subscription,
      }),
    'singleton',
  )
  container.register(
    FileCommandStorage,
    () => new FileCommandStorage(options.dataDir, options.apiUrl),
    'singleton',
  )
  container.register(
    GraphqlDialogueBackend,
    () => {
      const subscriptions = container.get(GraphqlSubscriptions)
      return new GraphqlDialogueBackend(
        { endpoint: endpoints.request },
        subscriptions,
      )
    },
    'singleton',
  )
  container.register(
    DialogueCommands,
    () => {
      const backend = container.get(GraphqlDialogueBackend)
      const storage = container.get(FileCommandStorage)
      return new DialogueCommands(backend, storage)
    },
    'singleton',
  )
  container.register(
    DialogueEngine,
    () => {
      const backend = container.get(GraphqlDialogueBackend)
      const commands = container.get(DialogueCommands)
      return new DialogueEngine(backend, commands)
    },
    'singleton',
  )
  container.register(
    DialogueActions,
    () => {
      const backend = container.get(GraphqlDialogueBackend)
      const engine = container.get(DialogueEngine)
      return new DialogueActions(backend, engine)
    },
    'singleton',
  )
  container.register(
    ApplicationLifecycle,
    () => {
      const subscriptions = container.get(GraphqlSubscriptions)
      const commands = container.get(DialogueCommands)
      const engine = container.get(DialogueEngine)
      const actions = container.get(DialogueActions)
      const initializeServices = async (): Promise<void> => {
        await commands.start()
        engine.start()
      }
      const disposeServices = async (): Promise<void> => {
        let failure: unknown
        try {
          engine.dispose()
        } catch (error) {
          failure = error
        }
        try {
          await actions.dispose()
        } catch (error) {
          failure ??= error
        }
        try {
          await commands.dispose()
        } catch (error) {
          failure ??= error
        } finally {
          subscriptions.dispose()
        }
        if (failure !== undefined) throw failure
      }
      return new ApplicationLifecycle({
        createViewModel: () => container.get(AppViewModel),
        createRenderer: applicationFactories.createRenderer,
        createRoot: applicationFactories.createRoot,
        initializeServices,
        disposeServices,
      })
    },
    'singleton',
  )
  container.register(
    AppViewModel,
    () => {
      const application = container.get(ApplicationLifecycle)
      const requestExit = (): void => application.quit()
      return new AppViewModel(options, requestExit)
    },
    'transient',
  )

  return container.get(ApplicationLifecycle)
}

function graphqlEndpoints(apiUrl: string): {
  readonly request: string
  readonly subscription: string
} {
  const request = new URL(apiUrl)
  const endpoint = request
  if (endpoint.username !== '' || endpoint.password !== '') {
    throw new TypeError('API URL credentials are not supported.')
  }
  endpoint.hash = ''
  let path = endpoint.pathname
  while (path.endsWith('/')) path = path.slice(0, -1)
  const requestPath = path.endsWith('/graphql') ? path : `${path}/graphql`
  request.pathname = requestPath
  const subscription = new URL(request)
  subscription.pathname = `${requestPath}/stream`
  return { request: request.toString(), subscription: subscription.toString() }
}
