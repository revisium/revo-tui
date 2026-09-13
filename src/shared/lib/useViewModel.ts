import { useEffect, useState } from 'react'

export interface ViewModelLifecycle {
  mount?: () => void
  dispose?: () => void
}

export function useViewModel<T extends ViewModelLifecycle>(
  createModel: () => T,
): T {
  const [model] = useState(createModel)

  useEffect(() => {
    model.mount?.()

    return () => model.dispose?.()
  }, [model])

  return model
}
