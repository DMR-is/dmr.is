import { notFound } from 'next/navigation'

export default function ApplicationPage({
  params,
}: {
  params: { type?: string; id?: string }
}) {
  return notFound()
}
