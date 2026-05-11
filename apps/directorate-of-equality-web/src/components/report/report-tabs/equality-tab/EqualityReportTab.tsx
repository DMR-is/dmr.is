'use client'

import { useRef } from 'react'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

import { GridRow } from '@island.is/island-ui/core'

import { EqualityReportDto } from '../../../../gen/fetch'
import { Empty } from '../../../Empty'
import { EqualityReportInputs } from './EqualityReportInputs'

type EqualityReportTabProps = {
  report?: EqualityReportDto
}

export const EqualityReportTab = ({ report }: EqualityReportTabProps) => {
  const editorKey = useRef(0)

  if (!report?.content) {
    return (
      <Empty
        title="Engin jafnréttisáætlun"
        message="Engin jafnréttisáætlun fannst fyrir þessa skýrslu. Vinsamlegast hafðu samband við fyrirtækið til að fá frekari upplýsingar."
      />
    )
  }

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
