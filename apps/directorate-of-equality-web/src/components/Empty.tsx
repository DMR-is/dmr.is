import { Box } from '@dmr.is/ui/components/island-is/Box'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

import { sharedText } from '../lib/text'

interface EmptyProps {
  title?: string
  message?: string
  imgSrc?: string
}
export const Empty = ({ title, message, imgSrc }: EmptyProps) => {
  return (
    <Box marginY={4}>
      <ProblemTemplate
        variant="info"
        title={title ?? sharedText.empty.title}
        imgSrc={imgSrc ?? '/assets/ritstjorn-image.svg'}
        imgAlt=""
        message={message ?? sharedText.empty.message}
      />
    </Box>
  )
}
