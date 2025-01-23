import { Box } from '@island.is/island-ui/core'

import { CaseDetailed } from '../../gen/fetch'
import { CaseStep } from '../../lib/utils'
import { FixStep } from './FixStep'
import { NextStep } from './NextStep'
import { PrevStep } from './PrevStep'

type Props = {
  activeCase: CaseDetailed
  caseStep: CaseStep
  canPublishFix: boolean
  loading?: boolean
  updateAdvertHtmlTrigger: () => void
  refetch?: () => void
}

export const FormFooter = ({
  activeCase,
  caseStep,
  canPublishFix,
  loading,
  updateAdvertHtmlTrigger,
  refetch,
}: Props) => {
  const fixStep = caseStep === 'leidretting'

  return (
    <Box
      display="flex"
      justifyContent="spaceBetween"
      borderTopWidth="standard"
      borderColor="purple200"
      paddingTop={[2, 3, 4]}
    >
      <PrevStep
        caseId={activeCase.id}
        caseStep={caseStep}
        currentStatus={activeCase.status.title}
        refetch={refetch}
      />
      <NextStep
        fixStep={fixStep}
        caseId={activeCase.id}
        caseStep={caseStep}
        currentStatus={activeCase.status.title}
        isAssigned={activeCase.assignedTo ? true : false}
        refetch={refetch}
      />
      <FixStep
        caseId={activeCase.id}
        fixStep={fixStep}
        updateAdvertHtmlTrigger={updateAdvertHtmlTrigger}
        canPublishFix={canPublishFix}
        refetch={refetch}
        loading={loading}
      />
    </Box>
  )
}
