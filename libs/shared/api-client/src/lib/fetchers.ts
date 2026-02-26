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
    const err = await (error as Response).json()
    return {
      data: null,
      error: err as ApiErrorDto,
    }
  }
}
