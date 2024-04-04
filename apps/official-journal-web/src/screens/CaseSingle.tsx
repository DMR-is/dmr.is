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
import { useFormatMessage } from '../hooks/useFormatMessage'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { messages } from '../lib/messages/caseSingle'
import { Screen } from '../lib/types'
import { CaseStep, caseSteps, generateSteps } from '../lib/utils'

type Props = {
  activeCase: Case | null
  step: CaseStep | null
}

const CaseSingle: Screen<Props> = ({ activeCase }) => {
  const { formatMessage } = useFormatMessage()

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
        title: formatMessage(messages.banner.title),
        description: formatMessage(messages.banner.description),
        breadcrumbs: [
          {
            title: formatMessage(messages.breadcrumbs.dashboard),
            href: '/',
          },
          {
            title: formatMessage(messages.breadcrumbs.caseOverview),
            href: '/ritstjorn',
          },
          {
            title: formatMessage(messages.breadcrumbs.case),
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
  const caseId = query.uid?.[0]
  const step = query.uid?.[1] as CaseStep | undefined

  if (!caseId || !step || !caseSteps.includes(step)) {
    return { activeCase: null, step: null }
  }

  const [activeCase] = await Promise.all(
    [
      dmrClient.getCase({
        id: caseId,
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
    step,
  }
}

export default withMainLayout(CaseSingle, {
  showFooter: false,
  headerWhite: true,
  bannerProps: {
    showBanner: false,
    showFilters: false,
    title: messages.banner.title,
  },
})
