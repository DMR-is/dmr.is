'use client'

import { useMemo, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import {
  CompanyFilter,
  type CompanyFilters,
} from '../../components/companies/CompanyFilter'
import {
  matchesStatusFilter,
  normalizeId,
} from '../../components/companies/companyStatus'
import { CompanyTable } from '../../components/companies/CompanyTable'
import { CreateCompanyModal } from '../../components/companies/CreateCompanyModal'
import { ReportStatusEnum } from '../../gen/fetch'
import { useCompanies } from '../../hooks/useCompanies'
import { useReports } from '../../hooks/useReports'

export const CompaniesContainer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState<CompanyFilters>({
    employees: [],
    status: [],
    expires: [],
    dailyFines: [],
  })

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
    if (next.length === 0) {
      setFilter({ sortBy: 'name', direction: 'asc', page: 1 })
      return
    }
    const { id, desc } = next[0]
    setFilter({
      sortBy: id as 'name' | 'employeeCount',
      direction: desc ? 'desc' : 'asc',
      page: 1,
    })
  }

  const handleFiltersChange = (key: keyof CompanyFilters, val: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: val }))
    setFilter({ page: 1 })
  }

  const handleReset = () => {
    resetFilter()
    setFilters({ employees: [], status: [], expires: [], dailyFines: [] })
  }

  const rows = useMemo(() => {
    const companies = data?.companies ?? []
    const now = new Date()
    const sixMonthsFromNow = new Date(now)
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    return companies.filter((company) => {
      if (
        filters.employees.length &&
        !filters.employees.includes(company.employeeCountCategory)
      )
        return false

      if (
        filters.status.length &&
        !filters.status.some((f) =>
          matchesStatusFilter(company, approvedReports, f),
        )
      )
        return false

      if (filters.expires.length) {
        const companyId = normalizeId(company.nationalId)
        const companyReports = approvedReports.filter(
          (r) => normalizeId(r.companyNationalId) === companyId,
        )
        const thirtyDaysFromNow = new Date(now)
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        const threeMonthsFromNow = new Date(now)
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
        const matches = filters.expires.some((f) => {
          const cutoff =
            f === '30d'
              ? thirtyDaysFromNow
              : f === '3m'
                ? threeMonthsFromNow
                : sixMonthsFromNow
          return companyReports.some(
            (r) =>
              r.validUntil &&
              new Date(r.validUntil) > now &&
              new Date(r.validUntil) <= cutoff,
          )
        })
        if (!matches) return false
      }

      // TODO: daily fines requires finesStartedAt on the list endpoint
      if (filters.dailyFines.length) return false

      return true
    })
  }, [data, approvedReports, filters])

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '3/12']}>
          <CompanyFilter
            query={filter.q ?? ''}
            onQueryChange={(val) => setFilter({ q: val, page: 1 })}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
          />
          <Box display="flex" marginTop={2}>
            <Button
              icon="add"
              iconType="outline"
              onClick={() => setIsModalOpen(true)}
              size="small"
              variant="utility"
              colorScheme="white"
              fluid
            >
              Nýtt fyrirtæki
            </Button>
          </Box>
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
