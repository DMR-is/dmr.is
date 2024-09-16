import {
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Tag,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { formatDate, getSignatureDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
type Props = {
  activeCase: Case
}

export const StepInnsending = ({ activeCase }: Props) => {
  const signatureDate = getSignatureDate(activeCase.signatures)

  return (
    <GridContainer>
      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Inline space={1}>
            {[activeCase.advertDepartment, ...activeCase.advertCategories]?.map(
              (cat) => (
                <Tag key={cat.id} variant="white" outlined disabled>
                  {cat.title}
                </Tag>
              ),
            )}
          </Inline>
        </GridColumn>
      </GridRow>

      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <AdvertDisplay
            advertNumber={`${activeCase.caseNumber}`} // TODO: add publication number to case
            signatureDate={
              signatureDate
                ? formatDate(signatureDate, 'dd. MMMM yyyy')
                : undefined
            }
            advertType={activeCase.advertType.title}
            advertSubject={activeCase.advertTitle}
            advertText={activeCase.html}
            isLegacy={activeCase.isLegacy}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
