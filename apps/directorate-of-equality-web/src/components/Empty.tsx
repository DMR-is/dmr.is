import { Box } from '@dmr.is/ui/components/island-is/Box'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

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
        title={title ?? 'Ekkert fannst'}
        imgSrc={imgSrc ?? '/assets/ritstjorn-image.svg'}
        imgAlt=""
        message={
          message ??
          'Engin gögn fundust. Vinsamlegast hafðu samband við fyrirtækið til að fá frekari upplýsingar.'
        }
      />
    </Box>
  )
}
