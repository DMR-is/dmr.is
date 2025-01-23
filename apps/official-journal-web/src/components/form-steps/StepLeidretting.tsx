import {
  AlertMessage,
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
} from '@island.is/island-ui/core'

import { Case, CaseStatusTitleEnum } from '../../gen/fetch'
import { UpdateAvertAndCorrectionTriggerArgs, useCase } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Corrections } from '../corrections/Corrections'
import { HTMLEditor } from '../editor/Editor'
import { editorWrapper } from '../editor/Editor.css'
import { messages } from './messages'

type Props = {
  data: Case
  isFixing: boolean
  canPublish: boolean
  timestamp: string
  onAdvertHtmlChange?: (html: string) => void
  onCorrectionAdd: (correction: UpdateAvertAndCorrectionTriggerArgs) => void
  onCorrectionDelete: () => void
}

export const StepLeidretting = ({
  data,
  isFixing,
  timestamp,
  onAdvertHtmlChange,
  onCorrectionDelete,
  onCorrectionAdd,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const {
    case: caseData,
    error: caseError,
    isLoading: isLoadingCase,
  } = useCase({
    caseId: data.id,
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

  const isRejected =
    caseData.status.title === CaseStatusTitleEnum.BirtinguHafnað

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12']}>
          <Box marginBottom={5}>
            <AlertMessage
              type={isRejected || isFixing ? 'error' : 'warning'}
              title={formatMessage(
                isRejected
                  ? messages.leidretting.warningRejectTitle
                  : messages.leidretting.warningTitle,
              )}
              message={formatMessage(
                isRejected
                  ? messages.leidretting.warningRejectMessage
                  : messages.leidretting.warningMessage,
              )}
            />
          </Box>
        </GridColumn>
      </GridRow>

      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Box className={editorWrapper({ error: false })}>
            <HTMLEditor
              key={timestamp}
              readonly={!isFixing}
              defaultValue={caseData.html}
              onChange={onAdvertHtmlChange}
            />
            <HTMLEditor
              readonly={true}
              defaultValue={caseData.signatures
                .map((signature) => signature.html)
                .join(' ')}
            />
          </Box>
        </GridColumn>
      </GridRow>
      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Corrections
            caseId={caseData.id}
            advertCorrections={caseData.advertCorrections}
            onCorrectionAdd={onCorrectionAdd}
            onDeleteCorrection={onCorrectionDelete}
            isFixing={isFixing}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
