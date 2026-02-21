'use client'

import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Case, CaseStatusEnum, DepartmentEnum } from '../../gen/fetch'
import { useSearchParams } from '../../hooks/useSearchParams'
import { Routes } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { CasePublishingTable } from '../tables/CasePublishingTable'
import CaseTableReady from '../tables/CaseTableReady'
import { Tabs } from './Tabs'

export const ReadyForPublicationTabs = () => {
  const [searchParams] = useSearchParams()
  const { department: _department, status: _status, ...rest } = searchParams

  const [department, setDepartment] = useQueryState(
    'department',
    parseAsStringEnum<DepartmentEnum>(
      Object.values(DepartmentEnum),
    ).withDefault(DepartmentEnum.ADeild),
  )

  const trpc = useTRPC()

  const { data: caseOverview, isLoading } = useQuery(
    trpc.getCasesWithDepartmentCount.queryOptions({
      department: department,
      status: [CaseStatusEnum.Tilbúið],
      search: rest.search ?? undefined,
      category: rest.category ?? undefined,
      type: rest.type ?? undefined,
      published: rest.published ?? undefined,
      page: rest.page,
      pageSize: rest.pageSize,
      sortBy: rest.sortBy || undefined,
      direction: rest.direction || undefined,
    }),
  )

  const [selectedCases, setSelectedCases] = useState<Case[]>([])

  const { data: casesWithPubData, isLoading: isLoadingCWPN } = useQuery({
    ...trpc.getCasesWithPublicationNumber.queryOptions({
      department: department,
      id: selectedCases.map((c) => c.id),
    }),
    enabled: selectedCases.length > 0,
  })
  const casesWithPublicationNumber = casesWithPubData?.cases

  const allSelected = selectedCases.length === caseOverview?.cases.length

  const confirmUrl = `${
    Routes.PublishingConfirm
  }?department=${department}&caseIds=${selectedCases
    .map((c) => c.id)
    .join(',')}`

  const tabs = caseOverview?.departments.map((counter) => ({
    id: counter.department,
    label: `${counter.department} (${counter.count})`,
    content: (
      <Stack space={[2, 2, 3]}>
        <Text variant="h5">{`Mál tilbúin til útgáfu í ${department}:`}</Text>
        <CaseTableReady
          cases={caseOverview.cases}
          selectedCaseIds={selectedCases.map((c) => c.id)}
          paging={caseOverview.paging}
          toggleAll={() =>
            allSelected
              ? setSelectedCases([])
              : setSelectedCases(caseOverview.cases)
          }
          toggle={(c, checked) => {
            if (checked) {
              setSelectedCases([...selectedCases, c])
            } else {
              setSelectedCases(selectedCases.filter((sc) => sc.id !== c.id))
            }
          }}
          isLoading={isLoading}
        />
        <Stack space={2}>
          <Text variant="h5">Valin mál til útgáfu:</Text>
          <CasePublishingTable
            isLoading={isLoadingCWPN}
            cases={selectedCases.length > 0 ? casesWithPublicationNumber : []}
            onReorder={(cases) => setSelectedCases(cases)}
          />
        </Stack>
        <Inline justifyContent="flexEnd">
          <LinkV2 href={confirmUrl}>
            <Button
              disabled={selectedCases.length === 0}
              icon="arrowForward"
              iconType="filled"
            >
              Gefa út valin mál
            </Button>
          </LinkV2>
        </Inline>
      </Stack>
    ),
  }))

  return (
    <Tabs
      tabs={tabs ?? []}
      selectedTab={department}
      onTabChange={(id) => setDepartment(id as DepartmentEnum)}
      label={'Deildir'}
    />
  )
}

export default ReadyForPublicationTabs
