import {
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Tag,
} from '@island.is/island-ui/core'

import { Case, CaseWithApplication } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: CaseWithApplication
}

export const StepInnsending = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <GridContainer>
      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Inline space={1}>
            {[activeCase.advertDepartment, ...activeCase.categories]?.map(
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
            advertNumber={activeCase.publicationNumber}
            signatureDate={
              activeCase.signatureDate
                ? formatDate(activeCase.signatureDate, 'dd. MMMM yyyy')
                : undefined
            }
            advertType={activeCase.advertType.title}
            advertSubject={activeCase.advertTitle}
            advertText={activeCase.document}
            isLegacy={activeCase.isLegacy}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
