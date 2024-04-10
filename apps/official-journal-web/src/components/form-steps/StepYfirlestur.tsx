import {
  GridColumn,
  GridContainer,
  GridRow,
  Select,
  Text,
} from '@island.is/island-ui/core'

import { Case, CaseTagEnum } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { enumToOptions, formatDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: Case
}

export const StepYfirlestur = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  const tagOptions = enumToOptions(CaseTagEnum)

  return (
    <GridContainer>
      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Text variant="h5">
            {formatMessage(messages.yfirlestur.group1title)}
          </Text>
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

      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
          <Select
            name="tag"
            value={tagOptions.find((o) => o.value === activeCase?.tag)}
            options={tagOptions}
            label={formatMessage(messages.yfirlestur.tag)}
            size="sm"
            isSearchable={false}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
