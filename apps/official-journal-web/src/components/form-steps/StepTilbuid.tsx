import {
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { CaseWithAdvert } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: CaseWithAdvert
}

export const StepTilbuid = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <GridContainer>
      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Text variant="h5">
            {formatMessage(messages.tilbuid.group1title)}
          </Text>
        </GridColumn>
      </GridRow>

      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <AdvertDisplay
            advertNumber={`${activeCase.activeCase.caseNumber}`}
            signatureDate={
              activeCase.advert.signatureDate
                ? formatDate(activeCase.advert.signatureDate, 'dd. MMMM yyyy')
                : undefined
            }
            advertType={activeCase.activeCase.advertTitle}
            advertSubject={activeCase.advert.title}
            advertText={activeCase.advert.documents.advert}
            isLegacy={activeCase.activeCase.isLegacy}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
