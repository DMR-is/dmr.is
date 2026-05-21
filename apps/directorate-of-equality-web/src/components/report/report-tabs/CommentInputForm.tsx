'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Input } from '@dmr.is/ui/components/island-is/Input'

import { reportText } from '../../../lib/text'

type Props = {
  body: string
  isExternal: boolean
  isPending: boolean
  onBodyChange: (value: string) => void
  onExternalChange: (value: boolean) => void
  onSubmit: () => void
}

export function CommentInputForm({
  body,
  isExternal,
  isPending,
  onBodyChange,
  onExternalChange,
  onSubmit,
}: Props) {
  return (
    <Box display="flex" flexDirection="column" rowGap={3}>
      <Input
        name="comment"
        label={reportText.comments.label}
        placeholder={reportText.comments.placeholder}
        textarea
        rows={5}
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
      />
      <Checkbox
        label={reportText.comments.sendToApplicant}
        checked={isExternal}
        onChange={(e) => onExternalChange(e.target.checked)}
      />
      <Box alignSelf="flexEnd">
        <Button onClick={onSubmit} loading={isPending} disabled={!body.trim()}>
          {reportText.comments.submit}
        </Button>
      </Box>
    </Box>
  )
}
