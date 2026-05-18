'use client'

import { useMemo, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import {
  type CompanyDto,
  type ReportListItemDto,
} from '../../gen/fetch/types.gen'
import { CompanyFilter } from './CompanyFilter'
import { inRange, matchesStatusFilter, normalizeId } from './companyStatus'
import { CompanyTable } from './CompanyTable'
import { CreateCompanyModal } from './CreateCompanyModal'

type Props = {
  companies: CompanyDto[]
  approvedReports: ReportListItemDto[]
}

export const CompaniesView = ({ companies, approvedReports }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [employeeRanges, setEmployeeRanges] = useState<string[]>([])
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [expiresFilter, setExpiresFilter] = useState<string[]>([])
  const [dagsektirFilter, setDagsektirFilter] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const resetPage = (setter: (v: string[]) => void) => (val: string[]) => {
    setter(val)
    setPage(1)
  }

  const handleReset = () => {
    setQuery('')
    setEmployeeRanges([])
    setStatusFilters([])
    setExpiresFilter([])
    setDagsektirFilter([])
    setPage(1)
  }

  const rows = useMemo<CompanyDto[]>(() => {
    const now = new Date()
    const sixMonthsFromNow = new Date(now)
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    return companies.filter((company) => {
      if (query) {
        const q = query.toLowerCase()
        if (
          !company.name.toLowerCase().includes(q) &&
          !company.nationalId.includes(q)
        )
          return false
      }
      if (
        employeeRanges.length &&
        !employeeRanges.some((r) =>
          inRange(company.averageEmployeeCountFromRsk, r),
        )
      )
        return false

      if (statusFilters.length) {
        if (
          !statusFilters.some((f) =>
            matchesStatusFilter(company, approvedReports, f),
          )
        )
          return false
      }

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

      // TODO: dagsektir requires finesStartedAt on the list endpoint
      if (dagsektirFilter.length) return false

      return true
    })
  }, [
    companies,
    approvedReports,
    query,
    employeeRanges,
    statusFilters,
    expiresFilter,
    dagsektirFilter,
  ])

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
            query={query}
            employeeRanges={employeeRanges}
            statusFilters={statusFilters}
            expiresFilter={expiresFilter}
            dagsektirFilter={dagsektirFilter}
            onQueryChange={(val) => {
              setQuery(val)
              setPage(1)
            }}
            onEmployeeRangesChange={resetPage(setEmployeeRanges)}
            onStatusFiltersChange={resetPage(setStatusFilters)}
            onExpiresFilterChange={resetPage(setExpiresFilter)}
            onDagsektirFilterChange={resetPage(setDagsektirFilter)}
            onReset={handleReset}
          />
        </GridColumn>
        <GridColumn span={['12/12', '9/12']}>
          <CompanyTable
            rows={rows}
            approvedReports={approvedReports}
            page={page}
            onPageChange={setPage}
          />
        </GridColumn>
      </GridRow>

      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </GridContainer>
  )
}
