// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SdkFunction = (...args: any[]) => any

type DataResponse<T> =
  T extends Promise<infer TResult>
    ? TResult extends { data: infer TData }
      ? Promise<Exclude<TData, undefined>>
      : Promise<TResult>
    : T

type BoundSdkOptions<T> = Omit<T, 'client' | 'responseStyle' | 'throwOnError'>

type BoundSdkFn<T extends SdkFunction> =
  Parameters<T> extends []
    ? () => DataResponse<ReturnType<T>>
    : undefined extends Parameters<T>[0]
      ? (
          options?: BoundSdkOptions<NonNullable<Parameters<T>[0]>>,
        ) => DataResponse<ReturnType<T>>
      : (
          options: BoundSdkOptions<Parameters<T>[0]>,
        ) => DataResponse<ReturnType<T>>

type BoundSdk<T extends Record<string, SdkFunction>> = {
  [K in keyof T]: BoundSdkFn<T[K]>
}

/**
 * Binds every function of a hey-api generated SDK module to one client, so
 * callers invoke `api.getThing({...})` instead of threading `client` through
 * every call. Every bound call is forced to `{ responseStyle: 'data',
 * throwOnError: true }`, so callers get the resolved data or a thrown error,
 * never the `{ data, error }` envelope.
 *
 * `TClient` is a type parameter rather than a concrete `Client` import
 * because each app's own `@hey-api/openapi-ts` run generates its own
 * `src/gen/fetch/client` module — this lib has no generated client of its
 * own to import, and the function body never inspects `client`, only
 * forwards it.
 */
export function bindSdk<TClient, T extends Record<string, SdkFunction>>(
  client: TClient,
  sdk: T,
): BoundSdk<T> {
  return Object.fromEntries(
    Object.entries(sdk).map(([key, fn]) => [
      key,
      async (options?: unknown) =>
        fn(
          options === undefined
            ? { client, responseStyle: 'data', throwOnError: true }
            : {
                ...options,
                client,
                responseStyle: 'data',
                throwOnError: true,
              },
        ),
    ]),
  ) as BoundSdk<T>
}
