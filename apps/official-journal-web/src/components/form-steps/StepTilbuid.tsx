import {
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { CaseDetailed } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate, getSignatureDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: CaseDetailed
}

export const StepTilbuid = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  const signatureDate = getSignatureDate(activeCase.signatures)

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
            advertNumber={`${activeCase.caseNumber}`}
            signatureDate={
              signatureDate
                ? formatDate(signatureDate, 'dd. MMMM yyyy')
                : undefined
            }
            advertType={activeCase.advertType.title}
            advertSubject={activeCase.advertTitle}
            advertText={activeCase.html}
            signatureHtml={activeCase.signatures.map((s) => s.html).join('')}
            isLegacy={activeCase.isLegacy}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
