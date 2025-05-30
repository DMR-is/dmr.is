import { parseAsStringEnum, useQueryState } from 'next-usequerystate'

import { useState } from 'react'

import { Button, Inline, LinkV2, Stack, Text } from '@island.is/island-ui/core'

import { Case, CaseStatusEnum, DepartmentEnum } from '../../gen/fetch'
import {
  useCasesWithDepartmentCount,
  useCasesWithPublicationNumber,
} from '../../hooks/api'
import { useSearchParams } from '../../hooks/useSearchParams'
import { Routes } from '../../lib/constants'
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

  const { caseOverview, isLoading, paging } = useCasesWithDepartmentCount({
    params: {
      department: department,
      status: [CaseStatusEnum.Tilbúið],
      ...rest,
    },
  })

  const [selectedCases, setSelectedCases] = useState<Case[]>([])

  const { cases: casesWithPublicationNumber, isLoading: isLoadingCWPN } =
    useCasesWithPublicationNumber({
      params: {
        department: department,
        id: selectedCases.map((c) => c.id),
      },
    })

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
          paging={paging}
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
