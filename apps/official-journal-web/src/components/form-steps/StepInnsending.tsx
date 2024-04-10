import {
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Tag,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: Case
}

export const StepInnsending = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

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
            advertNumber={activeCase.advert.publicationNumber?.full}
            signatureDate={
              activeCase.advert.signatureDate
                ? formatDate(activeCase.advert.signatureDate, 'dd. MMMM yyyy')
                : undefined
            }
            advertType={activeCase.advert.type.title}
            advertSubject={activeCase.advert.subject ?? ''}
            advertText={activeCase.advert.document.html ?? ''}
            isLegacy={activeCase.advert.document.isLegacy ?? false}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
