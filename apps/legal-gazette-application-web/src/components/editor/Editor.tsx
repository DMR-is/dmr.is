'use client'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

type Props = {
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
  defaultValue?: string
  error?: string
}

export const Editor = ({ onChange, onBlur, defaultValue, error }: Props) => {
  return (
    <>
      <Box
        border="standard"
        borderColor={error ? 'red600' : 'standard'}
        position="relative"
        zIndex={10}
        borderRadius="large"
      >
        <HTMLEditor
          defaultValue={defaultValue}
          handleUpload={() => new Error('File upload not implemented')}
          onChange={onChange}
          onBlur={onBlur}
          config={{
            toolbar:
              'bold italic underline | align numlist bullist table | link | customInsertButton',
          }}
        />
      </Box>
      {error && (
        <Text
          marginTop={1}
          variant="small"
          fontWeight="semiBold"
          color="red600"
        >
          {error}
        </Text>
      )}
    </>
  )
}
