'use client'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'

import { Box } from '@island.is/island-ui/core'

type Props = {
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
  defaultValue?: string
  disabled?: boolean
}

export const Editor = ({ onChange, onBlur, defaultValue, disabled }: Props) => {
  return (
    <Box border="standard" position="relative" zIndex={10} borderRadius="large">
      <HTMLEditor
        disabled={disabled}
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
