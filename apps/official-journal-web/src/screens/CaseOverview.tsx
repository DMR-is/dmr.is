import {
  GridColumn,
  GridContainer,
  GridRow,
  Table as T,
} from '@island.is/island-ui/core'
import { withMainLayout } from '../layout/Layout'
import { CaseOverviewTable } from '../components/tables/CaseOverviewTable'

const CaseOverviewPage = () => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn offset={['0', '1/12']} span={['12/12', '10/12']}>
          <CaseOverviewTable />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

export default withMainLayout(CaseOverviewPage, {
  bannerProps: {
    showBanner: true,
    imgSrc: '/assets/banner-small-image.svg',
    title: 'Case overview',
    description: 'This is the case overview page',
  },
})
