'use client'

import { ErrorBoundary } from 'react-error-boundary'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { CompanyDto } from '../../gen/fetch'
import { companiesText } from '../../lib/text'
import { CompanyFormContainer } from './CompanyFormContainer'

type CompanyContainerProps = {
  company: CompanyDto
}

export function CompanyContainer({ company }: CompanyContainerProps) {
  return (
    <Box paddingY={[2, 2, 6]} background="purple100">
      <GridContainer className="print-hidden">
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '10/12']}
            order={[2, 2, 1]}
            offset={['0', '0', '0', '1/12']}
          >
            <ErrorBoundary
              fallback={<div>{companiesText.detailView.reportsLoadError}</div>}
            >
              <CompanyFormContainer company={company} />
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
