import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: Case
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
            advertNumber={activeCase.advert.publicationNumber?.full}
            signatureDate={
              activeCase.advert.signatureDate
                ? format(
                    new Date(activeCase.advert.signatureDate),
                    'dd. MMMM yyyy',
                    {
                      locale: is,
                    },
                  )
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
