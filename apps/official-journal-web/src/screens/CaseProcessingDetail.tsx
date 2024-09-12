import { isReponse } from '@dmr.is/utils/client'

import {
  AlertMessage,
  Box,
  Button,
  Input,
  LinkV2,
  Select,
  SkeletonLoader,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { Attachments } from '../components/attachments/Attachments'
import { CaseOverviewGrid } from '../components/case-overview-grid/CaseOverviewGrid'
import { Comments } from '../components/comments/Comments'
import { FormShell } from '../components/form/FormShell'
import { Section } from '../components/form-stepper/Section'
import { FormStepperThemes } from '../components/form-stepper/types'
import { StepGrunnvinnsla } from '../components/form-steps/StepGrunnvinnsla'
import { StepInnsending } from '../components/form-steps/StepInnsending'
import { StepTilbuid } from '../components/form-steps/StepTilbuid'
import { StepYfirlestur } from '../components/form-steps/StepYfirlestur'
import { Meta } from '../components/meta/Meta'
import { Case, CaseStatusEnum } from '../gen/fetch'
import {
  useCase,
  useUpdateCaseStatus,
  useUpdateEmployee,
  useUpdateNextCaseStatus,
} from '../hooks/api'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { messages } from '../lib/messages/caseSingle'
import { messages as errorMessages } from '../lib/messages/errors'
import { Screen } from '../lib/types'
import { CaseStep, caseSteps, generateSteps } from '../lib/utils'
import { CustomNextError } from '../units/error'

type Props = {
  activeCase: Case
  step: CaseStep
}

const CaseSingle: Screen<Props> = ({ activeCase, step }) => {
  const { formatMessage } = useFormatMessage()

  const {
    data: caseData,
    error,
    isLoading,
    mutate: refetchCase,
  } = useCase({
    caseId: activeCase.id,
    options: {
      fallback: activeCase,
    },
  })

  const { trigger: onAssignEmployee, isMutating: isAssigning } =
    useUpdateEmployee({
      caseId: activeCase.id,
      options: {
        onSuccess: () => refetchCase(),
      },
    })

  const { trigger: onUpdateCaseStatus, isMutating: isUpdatingStatus } =
    useUpdateCaseStatus({
      caseId: activeCase.id,
      options: {
        onSuccess: () => refetchCase(),
      },
    })

  const { trigger: onUpdateNextCaseStatus, isMutating: isUpdatingNextStatus } =
    useUpdateNextCaseStatus({
      caseId: activeCase.id,
      options: {
        onSuccess: () => refetchCase(),
      },
    })

  if (isLoading) {
    return (
      <CaseOverviewGrid>
        <SkeletonLoader space={2} repeat={5} height={44} />
      </CaseOverviewGrid>
    )
  }

  if (error) {
    return (
      <CaseOverviewGrid>
        <AlertMessage
          type="error"
          title={formatMessage(errorMessages.errorFetchingData)}
          message={formatMessage(errorMessages.internalServerError)}
        />
      </CaseOverviewGrid>
    )
  }

  if (!caseData) {
    return (
      <CaseOverviewGrid>
        <AlertMessage
          type="warning"
          title={formatMessage(errorMessages.noDataTitle)}
          message={formatMessage(errorMessages.noDataText)}
        />
      </CaseOverviewGrid>
    )
  }

  // const { advert, activeCase: activeCase } = caseData._case

  const stepper = generateSteps(caseData._case)
  const prevStep =
    caseSteps.indexOf(step) > 0
      ? caseSteps[caseSteps.indexOf(step) - 1]
      : undefined

  const nextStep =
    caseSteps.indexOf(step) < 3
      ? caseSteps[caseSteps.indexOf(step) + 1]
      : undefined

  const employeesMock = [
    {
      label: 'Ármann',
      value: '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    },
    {
      label: 'Pálína J',
      value: '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    },
  ]

  const caseStatusOptions = Object.values(CaseStatusEnum).map((c) => ({
    label: c,
    value: c,
  }))

  const assignedCaseStatus = caseStatusOptions.find(
    (c) => c.value === activeCase?.status,
  )

  const isUpdatingCaseStatus = isUpdatingStatus || isUpdatingNextStatus

  return (
    <>
      <Meta
        title={`${formatMessage(messages.breadcrumbs.case)} - ${formatMessage(
          messages.breadcrumbs.dashboard,
        )}`}
      />
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
            key={item.step}
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
            <Text variant="h5">{formatMessage(messages.actions.title)}</Text>
            <Select
              isOptionDisabled={(option) =>
                activeCase.assignedTo?.id === option.value
              }
              isDisabled={isAssigning}
              isLoading={isAssigning}
              name="assignedTo"
              options={employeesMock.map((e) => ({
                label: e.label,
                value: e.value,
                disabled: activeCase.assignedTo?.id === e.value,
              }))}
              defaultValue={employeesMock.find(
                (e) => e.value === activeCase.assignedTo?.id,
              )}
              label={formatMessage(messages.actions.assignedTo)}
              placeholder={formatMessage(
                messages.actions.assignedToPlaceholder,
              )}
              size="sm"
              onChange={(e) => {
                if (!e) return
                onAssignEmployee({
                  userId: e.value,
                })
              }}
            />
            <Select
              isDisabled={isUpdatingCaseStatus}
              isLoading={isUpdatingCaseStatus}
              name="status"
              options={caseStatusOptions.map((c) => ({
                label: c.label,
                value: c.value,
                disabled: c.value === activeCase.status,
              }))}
              defaultValue={assignedCaseStatus}
              value={assignedCaseStatus}
              label={formatMessage(messages.actions.status)}
              size="sm"
              onChange={(e) => {
                if (!e) return
                onUpdateCaseStatus({
                  statusId: e.value,
                })
              }}
            />
            <Input
              name="status"
              disabled
              value={activeCase?.communicationStatus.value}
              type="text"
              label={formatMessage(messages.actions.communicationsStatus)}
              size="sm"
              backgroundColor={'blue'}
            />
          </Stack>
        }
      >
        <Stack space={[2, 3, 4]}>
          {step === 'innsending' && (
            <StepInnsending activeCase={caseData._case} />
          )}
          {step === 'grunnvinnsla' && (
            <StepGrunnvinnsla data={caseData._case} />
          )}
          {step === 'yfirlestur' && <StepYfirlestur data={caseData._case} />}
          {step === 'tilbuid' && <StepTilbuid activeCase={caseData._case} />}

          {advert.attachments.length > 0 && (
            <Attachments activeCase={caseData._case} />
          )}

          <Comments activeCase={caseData._case} />

          <Box
            display="flex"
            justifyContent="spaceBetween"
            borderTopWidth="standard"
            borderColor="purple200"
            paddingTop={[2, 3, 4]}
          >
            {prevStep ? (
              <LinkV2 href={`/ritstjorn/${activeCase.id}/${prevStep}`}>
                <Button as="span" variant="ghost" unfocusable>
                  {formatMessage(messages.paging.goBack)}
                </Button>
              </LinkV2>
            ) : (
              <LinkV2 href={`/ritstjorn`}>
                <Button as="span" variant="ghost" unfocusable>
                  {formatMessage(messages.paging.goBackOverview)}
                </Button>
              </LinkV2>
            )}
            {nextStep && activeCase.assignedTo === null ? (
              <Button icon="arrowForward" disabled>
                {formatMessage(messages.paging.nextStep)}
              </Button>
            ) : nextStep ? (
              <LinkV2 href={`/ritstjorn/${activeCase.id}/${nextStep}`}>
                <Button
                  loading={isUpdatingNextStatus}
                  as="span"
                  icon="arrowForward"
                  onClick={() => onUpdateNextCaseStatus()}
                  unfocusable
                >
                  {formatMessage(messages.paging.nextStep)}
                </Button>
              </LinkV2>
            ) : null}
          </Box>
        </Stack>
      </FormShell>
    </>
  )
}
CaseSingle.getProps = async ({ query }): Promise<Props> => {
  const dmrClient = createDmrClient()
  const caseId = query.uid?.[0]
  const step = query.uid?.[1] as CaseStep | undefined
  let activeCase

  if (!caseId || !step || !caseSteps.includes(step)) {
    throw new CustomNextError(404, 'Slóð inniheldur ekki rétt gögn!')
  }

  try {
    // TODO: getCase should return null if no case is found
    activeCase = await dmrClient.getCase({
      id: caseId,
    })

    return {
      activeCase: activeCase._case,
      step,
    }
  } catch (error) {
    if (isReponse(error)) {
      const errorResponse = await error.json()
      throw new CustomNextError(
        errorResponse.statusCode,
        'Þessi auglýsing finnst ekki!',
        errorResponse.message,
      )
    }

    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja auglýsingu!',
      (error as Error)?.message,
    )
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
