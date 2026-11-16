'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { type WithholdingTaxJobCountDto } from '../../gen/fetch/types.gen'
import { withholdingTaxText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'

const t = withholdingTaxText

const PAGE_SIZE = 50

const lastYear = new Date().getFullYear() - 1
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const year = lastYear - i
  return { label: String(year), value: year }
})

const columns: ColumnDef<WithholdingTaxJobCountDto>[] = [
  { accessorKey: 'nationalId', header: t.columns.nationalId },
  {
    accessorKey: 'name',
    header: t.columns.name,
    cell: ({ row }) => row.original.name ?? '',
  },
  {
    accessorKey: 'legalAddress',
    header: t.columns.address,
    enableSorting: false,
    cell: ({ row }) => row.original.legalAddress ?? '',
  },
  {
    accessorKey: 'postcode',
    header: t.columns.postcode,
    cell: ({ row }) => row.original.postcode ?? '',
  },
  {
    accessorKey: 'city',
    header: t.columns.city,
    cell: ({ row }) => row.original.city ?? '',
  },
  {
    accessorKey: 'isatCode',
    header: t.columns.isat,
    enableSorting: false,
    cell: ({ row }) =>
      [row.original.isatCode, row.original.isatText].filter(Boolean).join(' '),
  },
  { accessorKey: 'jobCountBand', header: t.columns.band },
]

const Panel = ({ children }: { children: React.ReactNode }) => (
  <Box background="white" borderRadius="large" padding={[3, 3, 4]}>
    {children}
  </Box>
)

/**
 * Read-only view of Skatturinn's job-count feed for one income year. Writes
 * nothing: it exists to see what the feed returns before the register uses it.
 */
export const WithholdingTaxContainer = () => {
  const trpc = useTRPC()
  const [year, setYear] = useState(lastYear)
  // Set by the fetch button, so changing the select alone does not call
  // Skatturinn: every call downloads the whole 25+ list for the year.
  const [requestedYear, setRequestedYear] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { data, isFetching, isError, refetch } = useQuery({
    ...trpc.withholdingTax.getJobCounts.queryOptions({
      incomeYear: requestedYear ?? lastYear,
    }),
    enabled: requestedYear !== null,
    staleTime: Infinity,
    retry: false,
  })

  const check = useMutation({
    ...trpc.withholdingTax.check.mutationOptions(),
    onSuccess: (result) => {
      if (result.ok) toast.success(t.checkOk)
      else toast.error(t.checkFailed(result.reason), { autoClose: 8000 })
    },
    onError: () => toast.error(t.checkFailed(null)),
  })

  const bands = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of data?.companies ?? []) {
      counts.set(c.jobCountBand, (counts.get(c.jobCountBand) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [data])

  const companies = data?.companies ?? []
  const totalPages = Math.max(1, Math.ceil(companies.length / PAGE_SIZE))
  const pageRows = companies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const onFetch = () => {
    setPage(1)
    if (requestedYear === year) refetch()
    else setRequestedYear(year)
  }

  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '10/12']}
          offset={['0', '0', '1/12']}
        >
          <Stack space={3}>
            <Panel>
              <Inline space={2} alignY="bottom">
                <Box style={{ minWidth: 160 }}>
                  <Select
                    name="withholding-tax-income-year"
                    size="xs"
                    label={t.incomeYearLabel}
                    options={YEAR_OPTIONS}
                    value={YEAR_OPTIONS.find((o) => o.value === year) ?? null}
                    onChange={(opt) => {
                      if (opt) setYear(opt.value)
                    }}
                  />
                </Box>
                <Button size="small" onClick={onFetch} loading={isFetching}>
                  {t.fetch}
                </Button>
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => check.mutate()}
                  loading={check.isPending}
                >
                  {t.check}
                </Button>
              </Inline>
            </Panel>

            {requestedYear === null && <Text>{t.idle}</Text>}

            {isError && !isFetching && (
              <AlertMessage type="error" title={t.fetchError} />
            )}

            {isFetching && !data && <SkeletonLoader height={200} repeat={2} />}

            {data && (
              <>
                <Panel>
                  <Stack space={2}>
                    <Text variant="h4" fontWeight="semiBold">
                      {t.summaryHeading} – {data.incomeYear}
                    </Text>
                    <Inline space={4}>
                      <Text>
                        {t.total}: <strong>{companies.length}</strong>
                      </Text>
                      {bands.map(([band, n]) => (
                        <Text key={band}>
                          {band}: <strong>{n}</strong>
                        </Text>
                      ))}
                      <Text>
                        {t.skippedCount}: <strong>{data.skipped.length}</strong>
                      </Text>
                    </Inline>
                    <Text variant="small">{t.absentNote}</Text>
                  </Stack>
                </Panel>

                {data.skipped.length > 0 && (
                  <Panel>
                    <Stack space={1}>
                      <Text variant="h4" fontWeight="semiBold">
                        {t.skippedHeading}
                      </Text>
                      {data.skipped.map((s) => (
                        <Text key={s.index} variant="small">
                          {t.skippedRow(s.index)}: {s.issues.join(', ')}
                        </Text>
                      ))}
                    </Stack>
                  </Panel>
                )}

                <Panel>
                  <Stack space={2}>
                    <Text variant="h4" fontWeight="semiBold">
                      {t.companiesHeading}
                    </Text>
                    <Table
                      columns={columns}
                      data={pageRows}
                      noDataMessage={t.noData}
                      paging={{
                        page,
                        pageSize: PAGE_SIZE,
                        totalItems: companies.length,
                        totalPages,
                      }}
                      onPageChange={setPage}
                    />
                  </Stack>
                </Panel>
              </>
            )}
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
