import { notFound, redirect } from 'next/navigation'

export default async function RedirectToFirstPublication({
  params,
}: {
  params: { id: string }
}) {
  if (params.id) {
    redirect(`/auglysingar/${params.id}/a`)
  }

  return notFound()
}
