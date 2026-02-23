import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'

type UpdateAdvertAndCorrectionArgs = {
  caseId: string
  title: string
  description: string
  advertHtml: string
}

type Props = {
  caseId: string
  onAddSuccess: (correction: UpdateAdvertAndCorrectionArgs) => void
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
