import {
  AlertMessage,
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useCase } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { HTMLEditor } from '../editor/Editor'
import { editorWrapper } from '../editor/Editor.css'
import { messages } from './messages'

type Props = {
  data: Case
  isFixing: boolean
  canPublish: boolean
}

export const StepLeidretting = ({ data, isFixing }: Props) => {
  const { formatMessage } = useFormatMessage()

  const {
    data: caseData,
    error: caseError,
    isLoading: isLoadingCase,
  } = useCase({
    caseId: data.id,
    options: {
      fallback: data,
    },
  })

  if (isLoadingCase) {
    return (
      <SkeletonLoader
        repeat={3}
        height={88}
        space={2}
        borderRadius="standard"
      />
    )
  }

  if (caseError) {
    return (
      <AlertMessage
        type="error"
        title={formatMessage(messages.leidretting.errorFetching)}
        message={formatMessage(messages.leidretting.errorFetchingMessage)}
      />
    )
  }

  if (!caseData) {
    return (
      <AlertMessage
        type="warning"
        title={formatMessage(messages.leidretting.noData)}
        message={formatMessage(messages.leidretting.noDataMessage)}
      />
    )
  }

  const activeCase = caseData._case

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12']}>
          <Box marginBottom={5}>
            <AlertMessage
              type={isFixing ? 'error' : 'warning'}
              title={formatMessage(messages.leidretting.warningTitle)}
              message={formatMessage(messages.leidretting.warningMessage)}
            />
          </Box>
        </GridColumn>
      </GridRow>

      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Box className={editorWrapper({ error: false })}>
            <Box position="relative" zIndex={20}>
              <HTMLEditor
                key={`is-fixing=${isFixing}`}
                readonly={!isFixing}
                defaultValue={activeCase.html}
              />
            </Box>
            <Box position="relative" zIndex={10}>
              <HTMLEditor
                readonly={true}
                defaultValue={activeCase.signatures
                  .map((signature) => signature.html)
                  .join(' ')}
              />
            </Box>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
