'use client'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Box } from '@dmr.is/ui/components/island-is'

type Props = {
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
  defaultValue?: string
}

export const Editor = ({ onChange, onBlur, defaultValue }: Props) => {
  return (
    <Box border="standard" position="relative" zIndex={10} borderRadius="large">
      <HTMLEditor
        defaultValue={defaultValue}
        handleUpload={() => new Error('File upload not implemented')}
        onChange={onChange}
        onBlur={onBlur}
        config={{
          toolbar:
            'bold italic underline | numlist bullist table | link | customInsertButton',
        }}
      />
    </Box>
  )
}
