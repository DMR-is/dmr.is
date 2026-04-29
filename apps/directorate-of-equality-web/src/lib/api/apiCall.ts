export async function apiCall<T>(
  result: Promise<{ data?: T; error?: unknown; response?: Response }>,
): Promise<T> {
  const { data, error, response } = await result
  if (error !== undefined) throw response ?? error
  return data as T
}
