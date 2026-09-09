export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

export const createDeferred = <T>(): Deferred<T> => {
  let resolvePromise: ((value: T) => void) | undefined
  let rejectPromise: ((reason?: unknown) => void) | undefined
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  const resolve = (value: T): void => {
    if (!resolvePromise) throw new Error('Deferred promise is not initialized.')
    resolvePromise(value)
  }

  const reject = (reason?: unknown): void => {
    if (!rejectPromise) throw new Error('Deferred promise is not initialized.')
    rejectPromise(reason)
  }

  return { promise, resolve, reject }
}
