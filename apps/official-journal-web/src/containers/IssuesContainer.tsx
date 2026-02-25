import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import Banner from '../components/banner/Banner'
import { CreateIssue } from '../components/issues/CreateIssue'
import { IssuesList } from '../components/issues/IssuesList'
import { Routes } from '../lib/constants'

export default function IssuesContainer() {
  return (
    <>
      <Banner
        title="Útgáfur á heftum"
        description="Hér getur þú séð allar útgáfur á heftum og bætt við nýjum útgáfum."
        variant="small"
        imgSrc="/assets/banner-publish-image.svg"
        contentColumnSpan={['12/12', '12/12', '7/12']}
        imageColumnSpan={['12/12', '12/12', '3/12']}
        enableSearch={false}
        breadcrumbs={[
          { title: 'Stjórnborð', href: Routes.Dashboard },
          { title: 'Hefti' },
        ]}
      />
      <GridContainer>
        <GridRow marginBottom={[2,3]}>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <CreateIssue />
          </GridColumn>
        </GridRow>
      </GridContainer>
      <IssuesList />
    </>
  )
}
