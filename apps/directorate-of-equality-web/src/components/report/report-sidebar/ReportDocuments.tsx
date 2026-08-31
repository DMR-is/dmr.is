'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ReportTypeEnum } from '../../../gen/fetch'
import { reportText } from '../../../lib/text'

const t = reportText.documents

type ReportDocumentsProps = {
  reportId: string
  type: ReportTypeEnum
  /**
   * Whether the report has any detected outlier, and therefore an úrbótaáætlun.
   * `ReportService` computes it as `outlierCount > 0`; groups exist if and only
   * if outliers do, so it is the right gate for the second document.
   */
  includesImprovementPlan: boolean
}

/**
 * Links to the PDFs an approval emails to the company, so a reviewer can read
 * the documents before sending them.
 *
 * ⚠️ **Deliberately not disabled on any status.** A terminal report locks the
 * rest of the sidebar because its actions would change state; reading a document
 * changes nothing, and an approved report is exactly when someone asks "what did
 * we send them?". Drafts never reach this screen — `ReportService` filters them
 * out of every admin list, even when a status filter asks for them.
 *
 * Plain anchors rather than fetch-and-blob: the route sets
 * `Content-Disposition: inline`, so the browser's own viewer opens it in a new
 * tab. Nothing to hold in memory and nothing to revoke.
 */
export const ReportDocuments = ({
  reportId,
  type,
  includesImprovementPlan,
}: ReportDocumentsProps) => {
  const href = (doc: 'skyrsla' | 'urbotaaetlun') =>
    `/api/report-pdf/${reportId}?doc=${doc}`

  return (
    <Box>
      <Stack space={1}>
        <Text variant="h5">{t.heading}</Text>
        <Text variant="small" color="dark300">
          {t.hint}
        </Text>
        <Button
          variant="text"
          icon="open"
          size="small"
          onClick={() => window.open(href('skyrsla'), '_blank')}
        >
          {t.report}
        </Button>
        {/*
          Salary only — an equality report has no outlier groups, and the API
          answers 400 for one.
 
          ⚠️ **Also gated on `includesImprovementPlan`.** A salary report with no
          groups has no plan document, and the endpoint correctly answers 404. It
          used to render the button anyway, on the reasoning that "there is no
          plan" is an answer a reviewer wants — which was right, but a raw 404 in
          a new tab does not communicate it. It is indistinguishable from the
          feature being broken, which is how it was reported. So the answer is
          given here, in words, and the dead button is gone.
        */}
        {type === ReportTypeEnum.SALARY &&
          (includesImprovementPlan ? (
            <Button
              variant="text"
              icon="open"
              size="small"
              onClick={() => window.open(href('urbotaaetlun'), '_blank')}
            >
              {t.improvementPlan}
            </Button>
          ) : (
            <Text variant="small" color="dark300">
              {t.noImprovementPlan}
            </Text>
          ))}
      </Stack>
    </Box>
  )
}
