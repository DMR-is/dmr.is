'use client'

import { useRef } from 'react'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'

type EqualityReportTabProps = {
  equalityReportContent?: string | null
}

export const EqualityReportTab = ({
  equalityReportContent,
}: EqualityReportTabProps) => {
  const editorKey = useRef(0)

  return (
    <GridColumn span="12/12">
      <Box border="standard" position="relative" zIndex={10} borderRadius="large">
        <HTMLEditor
          key={editorKey.current}
          disabled
          defaultValue={equalityReportContent ?? ''}
          handleUpload={() => new Error('File upload not supported')}
          onChange={() => undefined}
          config={{
            toolbar: 'bold italic underline | align numlist bullist | link',
          }}
        />
      </Box>
    </GridColumn>
  )
}
