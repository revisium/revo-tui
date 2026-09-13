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
    try {
      model.mount?.()
    } catch (error) {
      model.dispose?.()
      throw error
    }

    return () => model.dispose?.()
  }, [model])

  return model
}
