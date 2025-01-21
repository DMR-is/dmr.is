import {
  Accordion,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { Department } from '../../gen/fetch'
import { UpdateCaseCommonFields } from './CommonAttributes'
import { UpdateCasePublishingFields } from './UpdatePublishingFields'

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
            <UpdateCaseCommonFields departments={departments} />
            <UpdateCasePublishingFields />
          </Accordion>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
