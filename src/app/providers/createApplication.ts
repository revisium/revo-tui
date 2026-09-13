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
  endpoint.username = ''
  endpoint.password = ''
  endpoint.search = ''
  endpoint.hash = ''
  endpoint.pathname = `${endpoint.pathname.replace(/\/$/, '')}/graphql/stream`
  return endpoint.toString()
}
