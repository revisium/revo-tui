import { DIContainer } from '../../shared/lib/index.js'
import { GraphqlSubscriptions } from '../../modules/graphql-subscriptions/index.js'
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

  container.register(
    GraphqlSubscriptions,
    () =>
      new GraphqlSubscriptions({
        endpoint: subscriptionEndpoint(options.apiUrl),
      }),
    'singleton',
  )
  container.register(
    ApplicationLifecycle,
    () => {
      const subscriptions = container.get(GraphqlSubscriptions)
      const disposeServices = (): void => subscriptions.dispose()
      return new ApplicationLifecycle({
        createViewModel: () => container.get(AppViewModel),
        createRenderer: applicationFactories.createRenderer,
        createRoot: applicationFactories.createRoot,
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

function subscriptionEndpoint(apiUrl: string): string {
  const endpoint = new URL(apiUrl)
  if (endpoint.username !== '' || endpoint.password !== '') {
    throw new TypeError('API URL credentials are not supported.')
  }
  endpoint.hash = ''
  let path = endpoint.pathname
  while (path.endsWith('/')) path = path.slice(0, -1)
  endpoint.pathname = path.endsWith('/graphql')
    ? `${path}/stream`
    : `${path}/graphql/stream`
  return endpoint.toString()
}
