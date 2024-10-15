import {
  GridColumn,
  GridContainer,
  GridRow,
  Select,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useCase, useTags, useUpdateTag } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate, getSignatureDate } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { messages } from './messages'

type Props = {
  data: Case
}

export const StepYfirlestur = ({ data }: Props) => {
  const { formatMessage } = useFormatMessage()

  const {
    data: caseData,
    error: caseError,
    isLoading: isLoadingCase,
    mutate: refetchCase,
  } = useCase({
    caseId: data.id,
    options: {
      fallback: data,
    },
  })

  const { data: tagsData } = useTags({
    options: {},
  })

  const { trigger: updateTag } = useUpdateTag({
    caseId: data.id,
    options: {
      onSuccess: () => refetchCase(),
    },
  })

  if (isLoadingCase) {
    return <div>Loading...</div>
  }

  if (caseError) {
    return <div>Error: {caseError.message}</div>
  }

  if (!caseData) {
    return <div>No data</div>
  }

  const activeCase = caseData._case

  const signatureDate = getSignatureDate(activeCase.signatures)

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
            advertNumber={`${activeCase.caseNumber}`}
            signatureDate={
              signatureDate
                ? formatDate(signatureDate, 'dd. MMMM yyyy')
                : undefined
            }
            advertType={activeCase.advertType.title}
            advertSubject={activeCase.advertTitle}
            advertText={activeCase.html}
            isLegacy={activeCase.isLegacy}
          />
        </GridColumn>
      </GridRow>

      {tagsData && (
        <GridRow marginBottom={2} rowGap={2} alignItems="center">
          <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
            <Select
              name="tag"
              defaultValue={{
                label: activeCase.tag.title,
                value: activeCase.tag.id,
              }}
              options={tagsData.tags.map((tag) => ({
                label: tag.title,
                value: tag.id,
              }))}
              label={formatMessage(messages.yfirlestur.tag)}
              size="sm"
              isSearchable={false}
              onChange={(option) => {
                if (!option) return
                updateTag({
                  tagId: option.value,
                })
              }}
            />
          </GridColumn>
        </GridRow>
      )}
    </GridContainer>
  )
}
