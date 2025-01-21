import {
  Accordion,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { Department } from '../../gen/fetch'
import { UpdateCommonFields } from './UpdateCommonFields'
import { UpdatePublishingFields } from './UpdatePublishingFields'

type Props = {
  expanded?: boolean
  departments: Department[]
}

export const UpdateCaseAttributes = ({ departments }: Props) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Accordion
            dividerOnTop={false}
            dividerOnBottom={true}
            singleExpand={false}
          >
            <UpdateCommonFields departments={departments} />
            <UpdatePublishingFields />
          </Accordion>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
