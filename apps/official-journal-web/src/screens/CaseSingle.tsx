import {
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'
import { withMainLayout } from '../layout/Layout'
import { Screen } from '../lib/types'

type Props = {
  caseId: string
}

const CaseSingle: Screen<Props> = ({ caseId }) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn offset={['0', '1/12']} span={['12/12', '10/12']}>
          <Text variant="h1">Stakt mál - {caseId}</Text>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

CaseSingle.getProps = async ({ query }) => {
  return {
    caseId: query.uid,
  }
}

export default withMainLayout(CaseSingle, {
  showFooter: false,
})
