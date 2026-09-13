export interface Left<E> {
  readonly isRight: false
  readonly error: E
}

export interface Right<T> {
  readonly isRight: true
  readonly data: T
}

export type Either<E, T> = Left<E> | Right<T>

export function isLeft<E, T>(value: Either<E, T>): value is Left<E> {
  return !value.isRight
}

export function isRight<E, T>(value: Either<E, T>): value is Right<T> {
  return value.isRight
}
