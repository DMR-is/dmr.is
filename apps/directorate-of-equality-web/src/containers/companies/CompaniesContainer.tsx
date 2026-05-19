'use client'

import { useMemo, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { CompanyFilter } from '../../components/companies/CompanyFilter'
import { inRange, matchesStatusFilter, normalizeId } from '../../components/companies/companyStatus'
import { CompanyTable } from '../../components/companies/CompanyTable'
import { CreateCompanyModal } from '../../components/companies/CreateCompanyModal'
import { ReportStatusEnum } from '../../gen/fetch'
import { useCompanies } from '../../hooks/useCompanies'
import { useReports } from '../../hooks/useReports'

export const CompaniesContainer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [employeeRanges, setEmployeeRanges] = useState<string[]>([])
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [expiresFilter, setExpiresFilter] = useState<string[]>([])
  const [dagsektirFilter, setDagsektirFilter] = useState<string[]>([])

  const { data, filter, setFilter, resetFilter } = useCompanies({
    pageSize: 10,
    sortBy: 'name',
    direction: 'asc',
  })

  const { data: reportsData } = useReports({
    status: [ReportStatusEnum.APPROVED],
  })
  const approvedReports = reportsData?.reports ?? []

  const sorting = filter.sortBy
    ? [{ id: filter.sortBy, desc: filter.direction === 'desc' }]
    : []

  const handleSortingChange = (next: { id: string; desc: boolean }[]) => {
    if (next.length === 0) return
    const { id, desc } = next[0]
    setFilter({ sortBy: id as 'name' | 'employeeCount', direction: desc ? 'desc' : 'asc', page: 1 })
  }

  const handleReset = () => {
    resetFilter()
    setEmployeeRanges([])
    setStatusFilters([])
    setExpiresFilter([])
    setDagsektirFilter([])
  }

  const rows = useMemo(() => {
    const companies = data?.companies ?? []
    const now = new Date()
    const sixMonthsFromNow = new Date(now)
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    return companies.filter((company) => {
      if (
        employeeRanges.length &&
        !employeeRanges.some((r) => inRange(company.averageEmployeeCountFromRsk, r))
      )
        return false

      if (
        statusFilters.length &&
        !statusFilters.some((f) => matchesStatusFilter(company, approvedReports, f))
      )
        return false

      if (expiresFilter.length) {
        const companyId = normalizeId(company.nationalId)
        const companyReports = approvedReports.filter(
          (r) => normalizeId(r.companyNationalId) === companyId,
        )
        const thirtyDaysFromNow = new Date(now)
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        const threeMonthsFromNow = new Date(now)
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
        const matches = expiresFilter.some((f) => {
          const cutoff =
            f === '30d' ? thirtyDaysFromNow : f === '3m' ? threeMonthsFromNow : sixMonthsFromNow
          return companyReports.some(
            (r) => r.validUntil && new Date(r.validUntil) > now && new Date(r.validUntil) <= cutoff,
          )
        })
        if (!matches) return false
      }

      // TODO: dagsektir requires finesStartedAt on the list endpoint
      if (dagsektirFilter.length) return false

      return true
    })
  }, [data, approvedReports, employeeRanges, statusFilters, expiresFilter, dagsektirFilter])

  return (
    <GridContainer>
      <Box display="flex" justifyContent="flexEnd" marginBottom={3}>
        <Button
          icon="add"
          iconType="outline"
          onClick={() => setIsModalOpen(true)}
          size="small"
          variant="utility"
          colorScheme="white"
        >
          Nýtt fyrirtæki
        </Button>
      </Box>
      <GridRow>
        <GridColumn span={['12/12', '3/12']}>
          <CompanyFilter
            query={filter.q ?? ''}
            employeeRanges={employeeRanges}
            statusFilters={statusFilters}
            expiresFilter={expiresFilter}
            dagsektirFilter={dagsektirFilter}
            onQueryChange={(val) => setFilter({ q: val, page: 1 })}
            onEmployeeRangesChange={(val) => { setEmployeeRanges(val); setFilter({ page: 1 }) }}
            onStatusFiltersChange={(val) => { setStatusFilters(val); setFilter({ page: 1 }) }}
            onExpiresFilterChange={(val) => { setExpiresFilter(val); setFilter({ page: 1 }) }}
            onDagsektirFilterChange={(val) => { setDagsektirFilter(val); setFilter({ page: 1 }) }}
            onReset={handleReset}
          />
        </GridColumn>
        <GridColumn span={['12/12', '9/12']}>
          {data?.paging && (
            <CompanyTable
              rows={rows}
              approvedReports={approvedReports}
              paging={data.paging}
              onPageChange={(p) => setFilter({ page: p })}
              sorting={sorting}
              onSortingChange={handleSortingChange}
            />
          )}
        </GridColumn>
      </GridRow>

      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </GridContainer>
  )
}
