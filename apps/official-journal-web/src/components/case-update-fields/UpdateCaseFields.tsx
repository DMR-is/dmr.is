import {
  Accordion,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { CaseDetailed, Department } from '../../gen/fetch'
import { UpdateCaseCommonFields } from './CommonAttributes'
import { UpdateCasePublishingFields } from './UpdatePublishingFields'

type Props = {
  expanded?: boolean
  departments: Department[]
  currentCase: CaseDetailed
}

export const UpdateCaseAttributes = ({ departments, currentCase }: Props) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Accordion
            dividerOnTop={false}
            dividerOnBottom={true}
            singleExpand={false}
          >
            <UpdateCaseCommonFields
              departments={departments}
              currentCase={currentCase}
            />
            <UpdateCasePublishingFields />
          </Accordion>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
