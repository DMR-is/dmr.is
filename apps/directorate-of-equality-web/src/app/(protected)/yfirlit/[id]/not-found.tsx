import Link from 'next/link'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

import { reportNotFoundText } from '../../../../lib/text'

export default function ReportNotFound() {
  return (
    <GridContainer>
      <Box marginTop={10}>
        <ProblemTemplate
          variant="info"
          title={reportNotFoundText.title}
          message={reportNotFoundText.message}
          noBorder={false}
          imgSrc="/assets/tolfraedi-image.svg"
        />
        <Box display="flex" justifyContent="center" marginTop={4}>
          <Link href="/yfirlit">
            <Button variant="primary">{reportNotFoundText.backToOverview}</Button>
          </Link>
        </Box>
      </Box>
    </GridContainer>
  )
}
