'use client'

import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import {
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { ProblemFromError } from '@dmr.is/ui/components/Problem/ProblemFromError'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { MONTH_OPTIONS, YEAR_OPTIONS } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatDate } from '../../lib/utils'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

const castNullToUndefined = <T,>(value: T | null): T | undefined => {
  return value === null ? undefined : value
}

export const IssuesList = () => {
  const trpc = useTRPC()

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    departmentId: parseAsString,
    month: parseAsInteger,
    year: parseAsInteger,
  })

  const { data: departmentsData } = useSuspenseQuery(
    trpc.getDepartments.queryOptions({}),
  )

  const { data, isPending, error } = useQuery(
    trpc.getMonthlyIssues.queryOptions(
      {
        departmentId: castNullToUndefined(params.departmentId),
        year: castNullToUndefined(params.year),
        month: castNullToUndefined(params.month),
        page: params.page,
        pageSize: params.pageSize,
      },
      {
        placeholderData: keepPreviousData,
      },
    ),
  )

  const columns = [
    {
      field: 'title',
      children: 'Hefti',
    },
    {
      field: 'department',
      children: 'Deild',
    },
    {
      field: 'month',
      children: 'Mánuður',
    },
    {
      field: 'year',
      children: 'Ár',
    },
    {
      field: 'startDate',
      children: 'Tímabil frá',
    },
    {
      field: 'endDate',
      children: 'Tímabil til',
      size: 'tiny' as const,
    },
    {
      field: 'url',
      children: 'Hlekkur',
    },
  ]
  const rows =
    data?.issues.map((issue) => ({
      title: issue.formattedTitle.split(' - ')[0].trim(),
      department: issue.department.title,
      month: format(new Date(issue.startDate), 'LLLL', { locale: is }),
      year: format(new Date(issue.startDate), 'yyyy', { locale: is }),
      startDate: formatDate(issue.startDate),
      endDate: formatDate(issue.endDate),
      url: (
        <Button
          size="small"
          variant="text"
          icon="document"
          iconType="outline"
          onClick={() =>
            window.open(issue.url, '_blank', 'noopener,noreferrer')
          }
        >
          Skoða hefti
        </Button>
      ),
    })) ?? []

  const showPaging = (data?.paging.totalPages ?? 0) > 1
  const departmentOptions = departmentsData?.departments.map((department) => ({
    label: department.title,
    value: department.id,
  }))

  return (
    <GridContainer>
      <GridRow marginBottom={[4, 5, 6]}>
        <GridColumn span={['12/12', '4/12']}>
          <Box background="blue100" borderRadius="standard" padding={2}>
            <Stack space={2} dividers={true}>
              <Stack space={2}>
                <Inline justifyContent="spaceBetween" align="center">
                  <Text variant="h5">Síun</Text>
                  <Button
                    size="small"
                    variant="text"
                    icon="reload"
                    iconType="outline"
                    onClick={() =>
                      setParams({
                        departmentId: null,
                        month: null,
                        year: null,
                        page: 1,
                        pageSize: 10,
                      })
                    }
                  >
                    Hreina síu
                  </Button>
                </Inline>
              </Stack>
              <Stack space={2}>
                <Select
                  label="Deild"
                  size="xs"
                  name="departmentId"
                  placeholder="Sía eftir deild"
                  options={departmentOptions}
                  value={
                    departmentOptions?.find(
                      (opt) => opt.value === params.departmentId,
                    ) ?? null
                  }
                  onChange={(opt) => {
                    if (!opt) return

                    setParams({ departmentId: opt.value, page: 1 })
                  }}
                />
                <Select
                  options={MONTH_OPTIONS}
                  size="xs"
                  name="month"
                  placeholder="Sía eftir mánuði"
                  label="Mánuður"
                  value={
                    MONTH_OPTIONS.find((opt) => opt.value === params.month) ??
                    null
                  }
                  onChange={(opt) => {
                    if (!opt) return

                    setParams({ month: opt.value, page: 1 })
                  }}
                />
                <Select
                  options={YEAR_OPTIONS}
                  size="xs"
                  name="year"
                  placeholder="Sía eftir ári"
                  label="Ár"
                  value={
                    YEAR_OPTIONS.find((opt) => opt.value === params.year) ??
                    null
                  }
                  onChange={(opt) => {
                    if (!opt) return

                    setParams({ year: opt.value, page: 1 })
                  }}
                />
              </Stack>
            </Stack>
          </Box>
        </GridColumn>
        <GridColumn span={['12/12', '8/12']}>
          <Stack space={[2, 3]}>
            {error && <ProblemFromError error={error} />}
            <DataTable
              loading={isPending}
              columns={columns}
              rows={rows}
              paging={showPaging ? data?.paging : undefined}
              onPageChange={(page) => setParams({ page })}
              onPageSizeChange={(pageSize) => setParams({ pageSize })}
            />
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
