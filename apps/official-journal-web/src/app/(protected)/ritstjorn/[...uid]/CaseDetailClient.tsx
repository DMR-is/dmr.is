'use client'

import { useSession } from 'next-auth/react'

import { CaseFields } from '../../../../components/case-update-fields/CaseFields'
import { FormShell } from '../../../../components/form/FormShell'
import { Meta } from '../../../../components/meta/Meta'
import { CaseProvider } from '../../../../context/caseContext'
import {
  AdvertType,
  CaseDetailed,
  CaseTag,
  Category,
  Department,
  TransactionFeeCode,
  UserDto,
} from '../../../../gen/fetch'
import { useFormatMessage } from '../../../../hooks/useFormatMessage'
import { messages } from '../../../../lib/messages/caseSingle'

type Props = {
  caseData: CaseDetailed
  departments: Department[]
  admins: UserDto[]
  categories: Category[]
  tags: CaseTag[]
  types: AdvertType[]
  feeCodes: TransactionFeeCode[]
}

export function CaseDetailClient({
  caseData,
  departments,
  categories,
  admins,
  tags,
  types,
  feeCodes,
}: Props) {
  const { formatMessage } = useFormatMessage()
  const { data: session } = useSession()

  return (
    <CaseProvider
      tags={tags}
      initalCase={caseData}
      categories={categories}
      departments={departments}
      employees={admins}
      types={types}
      feeCodes={feeCodes}
      currentUserId={session?.user?.id}
    >
      <Meta
        title={`${formatMessage(messages.breadcrumbs.case)} - ${formatMessage(
          messages.breadcrumbs.dashboard,
        )}`}
      />
      <FormShell>
        <CaseFields />
      </FormShell>
    </CaseProvider>
  )
}
