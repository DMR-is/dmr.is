'use client'

import { useRef } from 'react'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'

import { Button, GridRow, Text } from '@island.is/island-ui/core'

import {
  EqualityContentTypeEnum,
  EqualityCoverageSourceEnum,
  EqualityReportDto,
} from '../../../../gen/fetch'
import { formatDateIS } from '../../../../lib/constants'
import { reportText } from '../../../../lib/text'
import { Empty } from '../../../Empty'
import { EqualityReportInputs } from './EqualityReportInputs'

type EqualityReportTabProps = {
  report?: EqualityReportDto | null
  supervisor?: string
  /**
   * What met the equality obligation this report was filed under. `LEGACY`
   * means there is no plan to show and none is missing either — see the
   * legacy branch below.
   */
  source?: EqualityCoverageSourceEnum
  /** The legacy certificate's stated expiry. Set only when `source` is LEGACY. */
  legacyValidUntil?: string | null
}

/**
 * Tall enough to read a page of A4 without the inner scrollbar dominating, and
 * a fixed height rather than an aspect ratio because the viewer is chrome plus
 * one page — matching a page's proportions would leave the toolbar eating the
 * space the text needs.
 */
const PDF_FRAME_HEIGHT = 800

export const EqualityReportTab = ({
  report,
  supervisor,
  source,
  legacyValidUntil,
}: EqualityReportTabProps) => {
  const editorKey = useRef(0)

  const isPdf = report?.contentType === EqualityContentTypeEnum.PDF

  /*
   * Tested BEFORE the empty state, because the two are opposite claims about
   * the same missing content. A salary report filed against a certificate from
   * the Directorate's retired register has no equality report to load — the
   * register load mints none — so falling through here told a reviewer the
   * company had no jafnréttisáætlun when the Directorate's own records say it
   * holds one.
   */
  if (source === EqualityCoverageSourceEnum.LEGACY) {
    return (
      <Empty
        title={reportText.equalityTab.legacyTitle}
        message={
          legacyValidUntil
            ? `${reportText.equalityTab.legacyMessage} ${
                reportText.equalityTab.legacyValidUntilLabel
              }: ${formatDateIS(legacyValidUntil)}.`
            : reportText.equalityTab.legacyMessage
        }
      />
    )
  }

  /*
   * A PDF-backed report has `content: null` by design — the bytes are served
   * from the proxy route instead of riding along on the read — so the empty
   * check has to accept it, or every uploaded plan would render as "engin
   * jafnréttisáætlun".
   */
  if (!report || (!isPdf && !report.content)) {
    return (
      <Empty
        title={reportText.equalityTab.emptyTitle}
        message={reportText.equalityTab.emptyMessage}
      />
    )
  }

  const pdfHref = `/api/equality-content/${report.id}`

  return (
    <GridRow>
      <GridColumn span="12/12">
        {isPdf ? (
          <Box marginTop={4} marginBottom={3}>
            <Box
              display="flex"
              justifyContent="spaceBetween"
              alignItems="center"
              marginBottom={2}
            >
              <Text variant="medium" fontWeight="semiBold">
                {report.contentFilename}
              </Text>
              <Button
                variant="text"
                size="small"
                icon="open"
                iconType="outline"
                onClick={() => window.open(pdfHref, '_blank')}
              >
                {reportText.equalityTab.pdfOpenInNewTab}
              </Button>
            </Box>
            <Box border="standard" borderRadius="large" overflow="hidden">
              {/*
                `title` is what a screen reader announces for the frame, so it
                names the document rather than leaving an unlabelled region.

                No fallback child: browsers ignore `iframe` children (that
                mechanism belongs to `object`), so anything in here would never
                render. The "open in new tab" button above is the real escape
                hatch when the browser declines to embed the PDF.
              */}
              <iframe
                src={pdfHref}
                title={reportText.equalityTab.pdfFrameTitle}
                width="100%"
                height={PDF_FRAME_HEIGHT}
                style={{ border: 'none', display: 'block' }}
              />
            </Box>
          </Box>
        ) : (
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
        )}
        <Box marginBottom={6}>
          <EqualityReportInputs
            supervisor={supervisor}
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
