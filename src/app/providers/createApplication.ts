import { DIContainer } from '../../shared/lib/index.js'
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
    ApplicationLifecycle,
    () =>
      new ApplicationLifecycle({
        createViewModel: () => container.get(AppViewModel),
        createRenderer: applicationFactories.createRenderer,
        createRoot: applicationFactories.createRoot,
      }),
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
