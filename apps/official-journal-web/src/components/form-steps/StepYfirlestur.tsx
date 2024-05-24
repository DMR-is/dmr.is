import {
  GridColumn,
  GridContainer,
  GridRow,
  Select,
  Text,
} from '@island.is/island-ui/core'

import { CaseTagEnum, CaseWithAdvert } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { enumToOptions, formatDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  activeCase: CaseWithAdvert
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

      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
          <Select
            name="tag"
            value={tagOptions.find(
              (o) => o.value === activeCase?.activeCase.tag,
            )}
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
