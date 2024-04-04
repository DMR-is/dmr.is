import {
  Box,
  Button,
  LinkV2,
  Select,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { Attachments } from '../components/attachments/Attachments'
import { Comments } from '../components/comments/Comments'
import { FormShell } from '../components/form/FormShell'
import { Section } from '../components/form-stepper/Section'
import { FormStepperThemes } from '../components/form-stepper/types'
import { StepGrunnvinnsla } from '../components/form-steps/StepGrunnvinnsla'
import { StepInnsending } from '../components/form-steps/StepInnsending'
import { StepTilbuid } from '../components/form-steps/StepTilbuid'
import { StepYfirlestur } from '../components/form-steps/StepYfirlestur'
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

const CaseSingle: Screen<Props> = ({ activeCase, step }) => {
  const { formatMessage } = useFormatMessage()

  if (!activeCase || !step) {
    return null
  }
  const stepper = generateSteps(activeCase)
  const prevStep =
    caseSteps.indexOf(step) > 0
      ? caseSteps[caseSteps.indexOf(step) - 1]
      : undefined

  const nextStep =
    caseSteps.indexOf(step) < 3
      ? caseSteps[caseSteps.indexOf(step) + 1]
      : undefined

  const employeesMock = [
    { label: 'Ármann', value: 'Ármann' },
    { label: 'Pálína J', value: 'Pálína J' },
  ]

  const caseStatusOptions = Object.values(CaseStatusEnum).map((c) => ({
    label: c,
    value: c,
  }))

  console.log({ a: activeCase.advert.attachments })

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
      steps={stepper.map((item, i) => (
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
        {step === 'innsending' && <StepInnsending activeCase={activeCase} />}
        {step === 'grunnvinnsla' && (
          <StepGrunnvinnsla activeCase={activeCase} />
        )}
        {step === 'yfirlestur' && <StepYfirlestur activeCase={activeCase} />}
        {step === 'tilbuid' && <StepTilbuid activeCase={activeCase} />}

        <Comments activeCase={activeCase} />

        {activeCase.advert.attachments.length ? (
          <Attachments activeCase={activeCase} />
        ) : null}

        <Box
          display="flex"
          justifyContent="spaceBetween"
          borderTopWidth="standard"
          borderColor="purple200"
          paddingTop={[2, 3, 4]}
        >
          {prevStep ? (
            <LinkV2 href={`/ritstjorn/${activeCase.id}/${prevStep}`}>
              <Button as="span" unfocusable>
                Til baka
              </Button>
            </LinkV2>
          ) : (
            <Button disabled={!prevStep}>Til baka</Button>
          )}
          {nextStep ? (
            <LinkV2 href={`/ritstjorn/${activeCase.id}/${nextStep}`}>
              <Button as="span" icon="arrowForward" unfocusable>
                Næsta skref
              </Button>
            </LinkV2>
          ) : (
            <Button disabled={!nextStep}>Næsta skref</Button>
          )}
        </Box>
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
