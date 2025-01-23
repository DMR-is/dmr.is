import React from 'react'
import { KeyedMutator } from 'swr'

import {
  AlertMessage,
  Box,
  Button,
  Icon,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import {
  ApplicationAttachmentTypeTitleEnum,
  CaseDetailed,
  GetCaseResponse,
} from '../../gen/fetch'
import { useAttachments } from '../../hooks/useAttachments'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'
type Props = {
  activeCase: CaseDetailed
  refetchCase?: KeyedMutator<GetCaseResponse>
}

export const Attachments = ({ activeCase, refetchCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { loading, downloadAttachment, overwriteAttachment, error } =
    useAttachments()

  const fileUploadRef = React.useRef<HTMLInputElement>(null)

  const onOpenOverwriteAttachment = () => {
    if (fileUploadRef.current) {
      fileUploadRef.current.click()
    }
  }

  const onFileUpload = async (
    attachmentId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    if (!activeCase.applicationId) {
      return
    }

    overwriteAttachment({
      attachmentId,
      caseId: activeCase.id,
      applicationId: activeCase?.applicationId,
      file,
      onSuccess: () => {
        refetchCase && refetchCase()
      },
    })
  }

  if (activeCase.attachments.length === 0) {
    return (
      <AlertMessage
        type="warning"
        title={formatMessage(messages.attachments.noAttachments)}
      />
    )
  }

  return (
    <Box>
      <Text variant="h5">{formatMessage(messages.attachments.title)}</Text>

      {error && (
        <Box marginY={2}>
          <AlertMessage type="warning" title="Villa kom upp" message={error} />
        </Box>
      )}

      <Box
        marginTop={2}
        borderRadius="large"
        padding={[2, 3]}
        borderWidth="standard"
        borderColor="blue200"
      >
        <Stack space={2}>
          {activeCase.attachments.map((a, i) => {
            return (
              <Box
                key={i}
                display="flex"
                justifyContent="spaceBetween"
                alignItems="center"
                padding={1}
                paddingRight={2}
                paddingLeft={2}
                borderWidth="standard"
                borderColor="blue200"
                background="blue100"
                borderRadius="large"
              >
                <Box display="flex" columnGap={2}>
                  <Icon
                    icon={
                      a.type.title ===
                      ApplicationAttachmentTypeTitleEnum.Frumrit
                        ? 'pencil'
                        : 'attach'
                    }
                    color="blue400"
                  />
                  <Text>{a.fileName}</Text>
                </Box>

                <Box display="flex" alignItems="center" columnGap={2}>
                  {a.type.title ===
                    ApplicationAttachmentTypeTitleEnum.Fylgiskjöl && (
                    <>
                      <input
                        type="file"
                        ref={fileUploadRef}
                        style={{ display: 'none' }}
                        accept={['.pdf', '.doc', '.docx'].join(',')}
                        onChange={(e) => onFileUpload(a.id, e)}
                      />
                      <Button
                        variant="text"
                        icon="share"
                        iconType="outline"
                        size="small"
                        onClick={onOpenOverwriteAttachment}
                      >
                        {formatMessage(messages.attachments.overwrite)}
                      </Button>
                    </>
                  )}
                  <Box>
                    <Button
                      variant="text"
                      icon="download"
                      iconType="outline"
                      size="small"
                      loading={loading}
                      onClick={() =>
                        downloadAttachment({
                          caseId: activeCase.id,
                          attachmentId: a.id,
                        })
                      }
                    >
                      {formatMessage(messages.attachments.fetchFile)}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Stack>
      </Box>
    </Box>
  )
}
