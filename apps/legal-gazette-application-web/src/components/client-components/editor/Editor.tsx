'use client'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'

import { Box } from '@island.is/island-ui/core'

type Props = {
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
}

export const Editor = ({ onChange, onBlur }: Props) => {
  return (
    <Box border="standard" borderRadius="large">
      <HTMLEditor
        handleUpload={() => new Error('File upload not implemented')}
        onChange={onChange}
        onBlur={onBlur}
        config={{
          toolbar: 'bold italic underline link',
        }}
      />
    </Box>
  )
}
