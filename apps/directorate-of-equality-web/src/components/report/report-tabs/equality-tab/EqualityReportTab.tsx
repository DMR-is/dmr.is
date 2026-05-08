'use client'

import { useRef } from 'react'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'

import { GridRow } from '@island.is/island-ui/core'

import { EqualityReportInputs } from './EqualityReportInputs'

type EqualityReportTabProps = {
  equalityReportContent?: string | null
}

export const EqualityReportTab = ({
  equalityReportContent,
}: EqualityReportTabProps) => {
  const editorKey = useRef(0)

  return (
    <GridRow>
      <GridColumn span="12/12">
        <Box
          border="standard"
          position="relative"
          zIndex={10}
          borderRadius="large"
          marginTop={4}
          marginBottom={3}
        >
          <HTMLEditor
            key={editorKey.current}
            defaultValue={equalityReportContent ?? ''}
            handleUpload={() => new Error('File upload not supported')}
            disabled
            readonly
          />
        </Box>
        <Box marginBottom={6}>
          <EqualityReportInputs />
        </Box>
      </GridColumn>
    </GridRow>
  )
}
