'use client'

import { CompanySidebar } from '../../components/company/company-sidebar/CompanySidebar'
import { CompanyStatusSelect } from '../../components/company/company-sidebar/CompanyStatusSelect'

type CompanySidebarContainerProps = {
  status: string
  onStatusChange: (status: string) => void
}

export function CompanySidebarContainer({
  status,
  onStatusChange,
}: CompanySidebarContainerProps) {
  return (
    <CompanySidebar>
      <CompanyStatusSelect status={status} onChange={onStatusChange} />
    </CompanySidebar>
  )
}
