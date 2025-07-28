import { ApiErrorDto, ApiErrorDtoFromJSON } from '../gen/fetch'

type SafeCallReturn<T> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: ApiErrorDto
    }

export async function safeCall<T>(
  call: () => Promise<T>,
): Promise<SafeCallReturn<T>> {
  try {
    const data = await call()

    return {
      data,
      error: null,
    }
  } catch (error) {
    const response = error as unknown as Response
    const json = await response.json()
    const errorDto = ApiErrorDtoFromJSON(json)

    return {
      data: null,
      error: errorDto,
    }
  }
}
