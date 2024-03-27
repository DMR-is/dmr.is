import { useRouter } from 'next/router'

export const useQueryParams = () => {
  const router = useRouter()
  const { query } = router

  const get = (key: string) => {
    return query[key] as string
  }

  const add = (params: Record<string, string>) => {
    router.push({
      query: {
        ...query,
        ...params,
      },
    })
  }

  const remove = (params: string[]) => {
    const newQuery = { ...query }
    params.forEach((param) => {
      delete newQuery[param]
    })

    router.push({
      query: newQuery,
    })
  }

  const refresh = () => {
    router.replace(router.asPath)
  }

  return {
    query,
    add,
    remove,
    get,
    refresh,
  }
}
