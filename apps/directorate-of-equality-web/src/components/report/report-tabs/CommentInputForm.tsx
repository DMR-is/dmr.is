'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Input } from '@dmr.is/ui/components/island-is/Input'

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
        label="Athugasemd"
        placeholder="Bættu við athugasemd"
        textarea
        rows={5}
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
      />
      <Checkbox
        label="Senda á innsendanda"
        checked={isExternal}
        onChange={(e) => onExternalChange(e.target.checked)}
      />
      <Box alignSelf="flexEnd">
        <Button onClick={onSubmit} loading={isPending} disabled={!body.trim()}>
          Vista athugasemd
        </Button>
      </Box>
    </Box>
  )
}
