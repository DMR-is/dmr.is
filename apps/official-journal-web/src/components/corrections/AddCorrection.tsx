import { useState } from 'react'

import { Box, Button, Inline, Input, Stack } from '@island.is/island-ui/core'

import { UpdateAvertAndCorrectionTriggerArgs } from '../../hooks/api/update'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'

type Props = {
  caseId: string
  onAddSuccess: (correction: UpdateAvertAndCorrectionTriggerArgs) => void
}

type InputValueTypes = {
  title?: string
  description?: string
}

export const AddCorrection = ({ caseId, onAddSuccess }: Props) => {
  const { formatMessage } = useFormatMessage()

  const [inputValue, setInputValue] = useState<InputValueTypes>({
    title: '',
    description: '',
  })

  return (
    <Box marginTop={2}>
      <Stack space={2}>
        <Input
          size="sm"
          type="text"
          name="corrections"
          label={formatMessage(messages.corrections.titleLabel)}
          placeholder={formatMessage(messages.corrections.titlePlaceholder)}
          value={inputValue.title}
          onChange={(e) =>
            setInputValue({ ...inputValue, title: e.target.value })
          }
        />
        <Input
          type="text"
          name="corrections"
          label={formatMessage(messages.corrections.descLabel)}
          placeholder={formatMessage(messages.corrections.descPlaceholder)}
          value={inputValue.description}
          onChange={(e) =>
            setInputValue({ ...inputValue, description: e.target.value })
          }
          textarea
        />
        <Inline justifyContent="flexEnd">
          <Button
            size="small"
            disabled={!inputValue.description || !inputValue.title}
            onClick={() => {
              onAddSuccess({
                caseId: caseId,
                title: inputValue.title ?? '',
                description: inputValue.description ?? '',
                advertHtml: '',
              })
              setInputValue({
                title: '',
                description: '',
              })
            }}
          >
            {formatMessage(messages.corrections.save)}
          </Button>
        </Inline>
      </Stack>
    </Box>
  )
}
