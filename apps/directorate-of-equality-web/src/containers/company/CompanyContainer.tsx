'use client'

import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { CompanyDto, ReportListItemDto } from '../../gen/fetch'
import { companiesText } from '../../lib/text'
import { CompanyFormContainer } from './CompanyFormContainer'

type CompanyContainerProps = {
  company: CompanyDto
  approvedReports: ReportListItemDto[]
}

export function CompanyContainer({
  company,
  approvedReports,
}: CompanyContainerProps) {
  return (
    <Box paddingY={[2, 2, 6]} background="purple100">
      <GridContainer className="print-hidden">
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '9/12', '9/12']}
            order={[2, 2, 1]}
          >
            <ErrorBoundary
              fallback={<div>{companiesText.detailView.reportsLoadError}</div>}
            >
              <CompanyFormContainer
                company={company}
                approvedReports={approvedReports}
              />
            </ErrorBoundary>
          </GridColumn>
          {/* Hidden for now - decide later what should be in the sidebar */}
          {/* <GridColumn
            span={['12/12', '12/12', '12/12', '3/12', '3/12']}
            order={[1, 1, 2]}
            className="report-sidebar-column"
          >
            <CompanySidebarContainer
              status={status}
              onStatusChange={(s) => setStatus(s as typeof derivedStatus)}
            />
          </GridColumn> */}
        </GridRow>
      </GridContainer>
    </Box>
  )
}
