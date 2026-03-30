import { redirect } from 'next/navigation'

export default async function SearchDashboardRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    preset?: string
  }>
}) {
  const params = await searchParams
  const nextParams = new URLSearchParams()

  nextParams.set('tab', 'leit')

  if (params.from) {
    nextParams.set('from', params.from)
  }

  if (params.to) {
    nextParams.set('to', params.to)
  }

  if (params.preset) {
    nextParams.set('preset', params.preset)
  }

  redirect(`/tolfraedi?${nextParams.toString()}`)
}
