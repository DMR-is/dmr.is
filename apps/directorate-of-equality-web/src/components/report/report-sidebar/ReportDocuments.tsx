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
export const ReportDocuments = ({ reportId, type }: ReportDocumentsProps) => {
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
          answers 400 for one. A compliant salary report answers 404 (no groups,
          so no plan); the button still shows, because "there is no plan" is a
          reviewer-relevant answer and hiding it would be indistinguishable from
          the feature being broken.
        */}
        {type === ReportTypeEnum.SALARY && (
          <Button
            variant="text"
            icon="open"
            size="small"
            onClick={() => window.open(href('urbotaaetlun'), '_blank')}
          >
            {t.improvementPlan}
          </Button>
        )}
      </Stack>
    </Box>
  )
}
