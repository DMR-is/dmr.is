import {
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { CaseWithApplication } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: CaseWithApplication
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
            advertNumber={activeCase.publicationNumber}
            signatureDate={
              activeCase.signatureDate
                ? formatDate(activeCase.signatureDate, 'dd. MMMM yyyy')
                : undefined
            }
            advertType={activeCase.advertTitle}
            advertSubject={activeCase.advertDepartment.title}
            advertText={activeCase.document}
            isLegacy={activeCase.isLegacy}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
