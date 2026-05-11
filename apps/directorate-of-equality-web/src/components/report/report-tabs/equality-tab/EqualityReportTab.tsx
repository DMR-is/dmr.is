'use client'

import { useRef } from 'react'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'

import { GridRow } from '@island.is/island-ui/core'

import { EqualityReportDto } from '../../../../gen/fetch'
import { EqualityReportInputs } from './EqualityReportInputs'

type EqualityReportTabProps = {
  report: EqualityReportDto
}

export const EqualityReportTab = ({ report }: EqualityReportTabProps) => {
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
            defaultValue={report.content ?? ''}
            handleUpload={() => new Error('File upload not supported')}
            disabled
            readonly
          />
        </Box>
        <Box marginBottom={6}>
          <EqualityReportInputs
            supervisor={'TODO'}
            approvalDate={
              report.approvedAt ? new Date(report.approvedAt) : undefined
            }
            validityPeriod={
              report.validUntil ? new Date(report.validUntil) : undefined
            }
          />
        </Box>
      </GridColumn>
    </GridRow>
  )
}
