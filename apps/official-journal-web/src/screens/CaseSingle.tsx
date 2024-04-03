import {
  Box,
  Inline,
  Select,
  Stack,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { Comments } from '../components/comments/Comments'
import { FormShell } from '../components/form/FormShell'
import { Section } from '../components/form-stepper/Section'
import { FormStepperThemes } from '../components/form-stepper/types'
import { Case, CaseStatusEnum } from '../gen/fetch'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { messages } from '../lib/messages'
import { Screen } from '../lib/types'
import { generateSteps } from '../lib/utils'

type Props = {
  activeCase: Case | null
}

const CaseSingle: Screen<Props> = ({ activeCase }) => {
  if (!activeCase) {
    return null
  }
  const steps = generateSteps(activeCase)

  const employeesMock = [
    { label: 'Ármann', value: 'Ármann' },
    { label: 'Pálína J', value: 'Pálína J' },
  ]

  const caseStatusOptions = Object.values(CaseStatusEnum).map((c) => ({
    label: c,
    value: c,
  }))

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
      actions={
        <Stack space={[2]}>
          <Text variant="h5">Upplýsingar</Text>
          <Select
            name="assignedTo"
            options={employeesMock}
            defaultValue={employeesMock.find(
              (e) => e.value === activeCase.assignedTo,
            )}
            label="Starfsmaður"
            placeholder="Úthluta máli á starfsmann"
            size="sm"
          ></Select>
          <Select
            name="status"
            options={caseStatusOptions}
            defaultValue={caseStatusOptions.find(
              (c) => c.value === activeCase.status,
            )}
            label="Staða"
            size="sm"
          ></Select>
        </Stack>
      }
    >
      <Stack space={[2, 3, 4]}>
        <Box marginTop={3}>
          <Inline space={1}>
            {[
              { title: activeCase.advert.department.title },
              ...activeCase.advert.categories,
            ]?.map((cat, i) => (
              <Tag key={i} variant="white" outlined disabled>
                {cat.title}
              </Tag>
            ))}
          </Inline>
        </Box>

        <Box>
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
