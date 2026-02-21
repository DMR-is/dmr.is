import { redirect } from 'next/navigation'

import { DEPARTMENTS, Routes } from '../../../lib/constants'
import { OverviewClient } from './OverviewClient'

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>
}) {
  const { department } = await searchParams

  if (!department || !DEPARTMENTS.includes(department)) {
    redirect(`${Routes.Overview}?department=${DEPARTMENTS[0]}`)
  }

  return <OverviewClient />
}
