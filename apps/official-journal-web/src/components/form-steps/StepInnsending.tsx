import {
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Tag,
} from '@island.is/island-ui/core'

import { CaseWithAdvert } from '../../gen/fetch'
import { formatDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
type Props = {
  activeCase: CaseWithAdvert
}

export const StepInnsending = ({ activeCase }: Props) => {
  return (
    <GridContainer>
      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Inline space={1}>
            {[
              activeCase.advert.department,
              ...activeCase.advert.categories,
            ]?.map((cat) => (
              <Tag key={cat.id} variant="white" outlined disabled>
                {cat.title}
              </Tag>
            ))}
          </Inline>
        </GridColumn>
      </GridRow>

      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <AdvertDisplay
            advertNumber={`${activeCase.activeCase.caseNumber}`} // TODO: add publication number to case
            signatureDate={
              activeCase.advert.signatureDate
                ? formatDate(activeCase.advert.signatureDate, 'dd. MMMM yyyy')
                : undefined
            }
            advertType={activeCase.advert.type.title}
            advertSubject={activeCase.activeCase.advertTitle}
            advertText={activeCase.advert.documents.advert}
            isLegacy={activeCase.activeCase.isLegacy}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
