import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'

import { Box, Icon, Stack, Text } from '@island.is/island-ui/core'

import { Comments } from '../components/comments/Comments'
import { FormShell } from '../components/form/FormShell'
import { Section } from '../components/form-stepper/Section'
import { FormStepperThemes } from '../components/form-stepper/types'
import { Case, CaseCommentTypeEnum } from '../gen/fetch'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { messages } from '../lib/messages'
import { Screen } from '../lib/types'
import { commentTaskToNode, generateSteps } from '../lib/utils'

type Props = {
  activeCase: Case | null
}

const CaseSingle: Screen<Props> = ({ activeCase }) => {
  if (!activeCase) {
    return null
  }
  const steps = generateSteps(activeCase)
  const now = new Date()

  return (
    <FormShell
      header={{
        title: messages.components.caseBanner.title,
        description: messages.components.caseBanner.description,
        breadcrumbs: [
          {
            title: messages.pages.frontpage.name,
            href: '/',
          },
          {
            title: messages.pages.caseOverview.name,
            href: '/ritstjorn',
          },
          {
            title: messages.pages.case.name,
          },
        ],
      }}
      steps={steps.map((item, i) => (
        <Section
          key={i}
          isActive={item.isActive}
          section={item.title}
          theme={FormStepperThemes.PURPLE}
          sectionIndex={i}
          subSections={item.notes?.map((note, i) => (
            <Text key={i} variant="medium">
              {note}
            </Text>
          ))}
          isComplete={item.isComplete}
        />
      ))}
    >
      <Stack space={[2, 3, 4]}>
        <Box component="section">
          <Text variant="h2">{activeCase?.advert.title}</Text>
        </Box>

        <Comments comments={activeCase.comments} />
      </Stack>
    </FormShell>
  )
}

CaseSingle.getProps = async ({ query }): Promise<Props> => {
  const dmrClient = createDmrClient()

  const [activeCase] = await Promise.all(
    [
      dmrClient.getCase({
        id: query.uid as string,
      }),
    ].map((promise) =>
      promise.catch((err) => {
        console.log('Error fetcing case', { err })
        return null
      }),
    ),
  )

  console.log({ activeCase })

  return {
    activeCase,
  }
}

export default withMainLayout(CaseSingle, {
  showFooter: false,
  headerWhite: true,
  bannerProps: {
    showBanner: false,
    showFilters: false,
    title: messages.components.ritstjornBanner.title,
  },
})
