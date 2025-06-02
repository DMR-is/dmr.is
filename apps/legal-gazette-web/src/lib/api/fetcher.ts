type SWRFetcherArgs<T> = {
  func: () => Promise<T>
}
export const swrFetcher = async <T>({
  func,
}: SWRFetcherArgs<T>): Promise<T> => {
  const res = await func()

  return res
}
