export type ConstructorToken<T> = abstract new (...args: never[]) => T
export type Factory<T> = () => T
export type RegistrationScope = 'singleton' | 'transient'

interface Registration<T> {
  readonly factory: Factory<T>
  readonly scope: RegistrationScope
  instance?: T
}

export class DIContainer {
  readonly #registrations = new Map<
    ConstructorToken<unknown>,
    Registration<unknown>
  >()

  public register<T>(
    token: ConstructorToken<T>,
    factory: Factory<T>,
    scope: RegistrationScope,
  ): void {
    this.#registrations.set(token, { factory, scope })
  }

  public get<T>(token: ConstructorToken<T>): T {
    const registration = this.#registrations.get(token) as
      | Registration<T>
      | undefined

    if (!registration) {
      throw new Error(`No provider is registered for ${token.name}.`)
    }

    if (registration.scope === 'transient') {
      return registration.factory()
    }

    registration.instance ??= registration.factory()
    return registration.instance
  }
}
