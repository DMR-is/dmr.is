import { redirect } from 'next/navigation'

import { CaseStatusEnum } from '../../../gen/fetch'
import { Routes } from '../../../lib/constants'
import { CaseProcessingOverviewClient } from './CaseProcessingOverviewClient'

const mapTabIdToCaseStatus = (param?: string) => {
  if (!param) return CaseStatusEnum.Innsent

  switch (param) {
    case CaseStatusEnum.Innsent:
      return CaseStatusEnum.Innsent
    case CaseStatusEnum.Grunnvinnsla:
      return CaseStatusEnum.Grunnvinnsla
    case CaseStatusEnum.Yfirlestur:
      return CaseStatusEnum.Yfirlestur
    case CaseStatusEnum.Tilbúið:
      return CaseStatusEnum.Tilbúið
    default:
      return CaseStatusEnum.Innsent
  }
}

export default async function CaseProcessingOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: currentStatus } = await searchParams

  if (!currentStatus) {
    const status = mapTabIdToCaseStatus(undefined)
    redirect(`${Routes.ProcessingOverview}?status=${status}`)
  }

  return <CaseProcessingOverviewClient />
}
