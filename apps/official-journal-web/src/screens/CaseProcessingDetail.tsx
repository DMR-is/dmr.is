import { useEffect, useState } from 'react'
import { active } from 'submodules/island.is/libs/island-ui/core/src/lib/Tag/Tag.css'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

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
import {
  AdvertType,
  CaseStatusEnum,
  CaseWithAdvert,
  Department,
} from '../gen/fetch'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { APIRotues, assignEmployee, updateCaseStatus } from '../lib/constants'
import { messages } from '../lib/messages/caseSingle'
import { Screen } from '../lib/types'
import { CaseStep, caseSteps, generateSteps } from '../lib/utils'

type Props = {
  activeCase: CaseWithAdvert | null
  advertTypes: Array<AdvertType>
  departments: Array<Department>
  step: CaseStep | null
}

const CaseSingle: Screen<Props> = ({
  activeCase,
  advertTypes,
  departments,
  step,
}) => {
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

  const { trigger: onAssignEmployee } = useSWRMutation(
    APIRotues.AssignEmployee,
    assignEmployee,
  )

  const { trigger: onUpdateCaseStatus } = useSWRMutation(
    APIRotues.UpdateCaseStatus,
    updateCaseStatus,
  )

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
            name="assignedTo"
            options={employeesMock}
            defaultValue={employeesMock.find(
              (e) => e.value === activeCase.activeCase.assignedTo?.id,
            )}
            label={formatMessage(messages.actions.assignedTo)}
            placeholder={formatMessage(messages.actions.assignedToPlaceholder)}
            size="sm"
            onChange={(e) => {
              if (!e) return
              onAssignEmployee({
                id: activeCase.activeCase.id,
                userId: e.value,
              })
            }}
          ></Select>
          <Select
            name="status"
            options={caseStatusOptions}
            defaultValue={caseStatusOptions.find(
              (c) => c.value === activeCase.activeCase.status,
            )}
            label={formatMessage(messages.actions.status)}
            size="sm"
            onChange={(e) => {
              if (!e) return
              onUpdateCaseStatus({
                caseId: activeCase.activeCase.id,
                status: e.value,
              })
            }}
          ></Select>
        </Stack>
      }
    >
      <Stack space={[2, 3, 4]}>
        {step === 'innsending' && <StepInnsending activeCase={activeCase} />}
        {step === 'grunnvinnsla' && (
          <StepGrunnvinnsla
            activeCase={activeCase}
            advertTypes={advertTypes.sort((a, b) =>
              a.slug.localeCompare(b.slug),
            )}
            departments={departments.sort((a, b) =>
              a.slug.localeCompare(b.slug),
            )}
          />
        )}
        {step === 'yfirlestur' && <StepYfirlestur activeCase={activeCase} />}
        {step === 'tilbuid' && <StepTilbuid activeCase={activeCase} />}

        {activeCase.advert.attachments.length > 0 && (
          <Attachments activeCase={activeCase} />
        )}

        <Comments activeCase={activeCase} />

        <Box
          display="flex"
          justifyContent="spaceBetween"
          borderTopWidth="standard"
          borderColor="purple200"
          paddingTop={[2, 3, 4]}
        >
          {prevStep ? (
            <LinkV2 href={`/ritstjorn/${activeCase.activeCase.id}/${prevStep}`}>
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
          {nextStep && activeCase.activeCase.assignedTo === null ? (
            <Button icon="arrowForward" disabled>
              {formatMessage(messages.paging.nextStep)}
            </Button>
          ) : nextStep ? (
            <LinkV2 href={`/ritstjorn/${activeCase.activeCase.id}/${nextStep}`}>
              <Button as="span" icon="arrowForward" unfocusable>
                {formatMessage(messages.paging.nextStep)}
              </Button>
            </LinkV2>
          ) : null}
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
    return { activeCase: null, advertTypes: [], step: null, departments: [] }
  }

  const activeCase = await dmrClient.getCase({
    id: caseId,
  })

  const departments = await dmrClient.getDepartments()

  const selectedDepartment =
    (query.department as string) ?? activeCase._case.advert.department.id

  const activeTypes = await dmrClient.getTypes({
    department: selectedDepartment,
    pageSize: 100,
  })

  return {
    activeCase: activeCase._case,
    departments: departments.departments,
    advertTypes: activeTypes.types,
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
