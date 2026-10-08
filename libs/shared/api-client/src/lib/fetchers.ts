import { ApiErrorDto } from '@dmr.is/shared-dto'

type SafeReturnType<T> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: ApiErrorDto
    }

export const serverFetcher = async <T>(
  func: () => Promise<T>,
): Promise<SafeReturnType<T>> => {
  try {
    const res = await func()
    return {
      data: res,
      error: null,
    }
  } catch (error) {
    // Not an HTTP response (e.g. a network failure): keep the original error
    if (typeof (error as Response | undefined)?.json !== 'function') {
      throw error
    }

    const response = error as Response
    const err = await response.json().catch((parseError: unknown) => {
      throw Object.assign(
        new Error(`HTTP ${response.status} with a non-JSON body`),
        { cause: parseError },
      )
    })
    return {
      data: null,
      error: err as ApiErrorDto,
    }
  }
}
