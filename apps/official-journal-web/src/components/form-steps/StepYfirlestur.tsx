import {
  GridColumn,
  GridContainer,
  GridRow,
  Select,
  Text,
} from '@island.is/island-ui/core'

import { CaseTagEnum, CaseWithApplication } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { enumToOptions, formatDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: CaseWithApplication
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
