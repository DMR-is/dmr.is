import React from 'react'

import {
  AlertMessage,
  Box,
  Button,
  Icon,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { ApplicationAttachmentTypeTitleEnum } from '../../gen/fetch'
import { useAttachments } from '../../hooks/useAttachments'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'

export const Attachments = () => {
  const { formatMessage } = useFormatMessage()
  const { currentCase, refetch, canEdit } = useCaseContext()

  const {
    loading,
    downloadAttachment,
    overwriteAttachment,
    uploadAttachment,
    error,
  } = useAttachments()
  const fileReUploadRefs = React.useRef<{
    [key: string]: HTMLInputElement | null
  }>({})
  const fileUploadRef = React.useRef<HTMLInputElement>(null)

  const onOpenOverwriteAttachment = (id: string) => {
    const ref = fileReUploadRefs.current[id]
    if (ref) {
      ref.click()
    }
  }

  const onOpenUploadAttachment = () => {
    if (fileUploadRef.current) {
      fileUploadRef.current.click()
    }
  }

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    await uploadAttachment({
      caseId: currentCase.id,
      file,
    })
    refetch()
  }

  const onFileReUpload = async (
    attachmentId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]

    // If there is no applicationId, we use the case id as a fallback
    const tempApplicationId = currentCase?.applicationId ?? currentCase.id

    if (!file) {
      return
    }

    if (!tempApplicationId) {
      return
    }

    overwriteAttachment({
      attachmentId,
      caseId: currentCase.id,
      applicationId: tempApplicationId,
      file,
      onSuccess: () => {
        refetch()
      },
    })
  }

  if (currentCase.attachments.length === 0) {
    return (
      <>
        <AlertMessage
          type="warning"
          title={formatMessage(messages.attachments.noAttachments)}
        />
        <Box marginTop={2}>
          <input
            type="file"
            ref={fileUploadRef}
            name="file-upload"
            style={{ display: 'none' }}
            accept={['.pdf', '.doc', '.docx'].join(',')}
            onChange={onFileUpload}
          />
          <Button
            disabled={!canEdit}
            variant="text"
            icon="share"
            iconType="outline"
            size="small"
            onClick={onOpenUploadAttachment}
          >
            Hlaða upp fylgiskjali
          </Button>
        </Box>
      </>
    )
  }

  return (
    <Box>
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
          {currentCase.attachments.map((a, i) => {
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
                        ref={(el) => {
                          fileReUploadRefs.current[a.id] = el
                        }}
                        id={`file-re-upload-${a.id}`}
                        style={{ display: 'none' }}
                        accept={['.pdf', '.doc', '.docx'].join(',')}
                        onChange={(e) => onFileReUpload(a.id, e)}
                        name="file-re-upload"
                      />
                      <Button
                        disabled={!canEdit}
                        variant="text"
                        icon="share"
                        iconType="outline"
                        size="small"
                        onClick={() => onOpenOverwriteAttachment(a.id)}
                      >
                        {formatMessage(messages.attachments.overwrite)}
                      </Button>
                    </>
                  )}
                  <Box>
                    <Button
                      disabled={!canEdit}
                      variant="text"
                      icon="download"
                      iconType="outline"
                      size="small"
                      loading={loading}
                      onClick={() =>
                        downloadAttachment({
                          caseId: currentCase.id,
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
      <Box marginTop={2}>
        <input
          type="file"
          ref={fileUploadRef}
          name="file-upload"
          style={{ display: 'none' }}
          accept={['.pdf', '.doc', '.docx'].join(',')}
          onChange={onFileUpload}
        />
        <Button
          disabled={!canEdit}
          variant="text"
          icon="share"
          iconType="outline"
          size="small"
          onClick={onOpenUploadAttachment}
        >
          Hlaða upp fylgiskjali
        </Button>
      </Box>
    </Box>
  )
}
