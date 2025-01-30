import {
  Box,
  Breadcrumbs,
  Button,
  Divider,
  GridColumn,
  GridContainer,
  GridRow,
  LinkV2,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import {
  useRejectCase,
  useUpdateEmployee,
  useUpdateNextCaseStatus,
  useUpdatePreviousCaseStatus,
  useUpdateTag,
} from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/caseSingle'
import {
  generateSteps,
  getNextStatus,
  getPreviousStatus,
} from '../../lib/utils'
import { FormStepperV2 } from '../form-stepper/FormStepperV2'
import { Section } from '../form-stepper/Section'
import { FormStepperThemes } from '../form-stepper/types'
import { messages as statusMessages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import * as styles from './FormShell.css'
type FormShellType = {
  children?: React.ReactNode
}

export const FormShell = ({ children }: FormShellType) => {
  const { formatMessage } = useFormatMessage()

  const { currentCase, employeeOptions, tagOptions, canEdit, refetch } =
    useCaseContext()

  const steps = generateSteps(currentCase)

  const { trigger: updateTag } = useUpdateTag({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        refetch()
        toast.success('Merking máls uppfært')
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra merkingu málsins')
      },
    },
  })

  const { trigger: assignEmployee, isMutating: isAssigning } =
    useUpdateEmployee({
      caseId: currentCase.id,
      options: {
        onSuccess: () => {
          refetch()
          toast.success('Máli úthlutað á starfsmann')
        },
        onError: () => {
          toast.error('Ekki tókst að úthluta máli á starfsmann')
        },
      },
    })

  const {
    trigger: updateCaseNextStatus,
    isMutating: isUpdatingNextCaseStatus,
  } = useUpdateNextCaseStatus({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        refetch()
        toast.success('Staða máls uppfærð')
      },
      onError: () => {
        toast.error('Ekki tókst að færa máli í næsta stig')
      },
    },
  })

  const { trigger: updatePrevStatus, isMutating: isUpdatingPrevCaseStatus } =
    useUpdatePreviousCaseStatus({
      caseId: currentCase.id,
      options: {
        onSuccess: () => {
          refetch()
          toast.success('Staða máls uppfærð')
        },
        onError: () => {
          toast.error('Ekki tókst að færa máli í fyrri stig')
        },
      },
    })

  const { trigger: rejectCase } = useRejectCase({
    options: {
      onSuccess: () => {
        refetch()
        toast.success('Máli hafnað')
      },
      onError: () => {
        toast.error('Ekki tókst að hafna máli')
      },
    },
  })

  const breadcrumbs = [
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
  ]

  const handleRejectCase = () => {
    const confirmReject = window.confirm(
      'Ertu viss um að þú viljir hafna máli?',
    )
    if (confirmReject) {
      rejectCase({ caseId: currentCase.id })
    }
  }

  const prevStatus = getPreviousStatus(currentCase.status.title)
  const nextStatus = getNextStatus(currentCase.status.title)

  return (
    <Box className={styles.root}>
      <Box
        paddingTop={[0, 4]}
        paddingBottom={[0, 5]}
        width="full"
        height="full"
      >
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '9/12', '9/12']}
              className={styles.shellContainer}
            >
              <Box
                paddingTop={[3, 6, 8]}
                height="full"
                borderRadius="large"
                background="white"
              >
                <Box
                  marginBottom={[2, 3, 4]}
                  paddingLeft={[0, 0, 6, 8, 12]}
                  paddingRight={[0, 0, 6, 8, 12]}
                >
                  <Breadcrumbs items={breadcrumbs} />
                  <Text marginTop={1} marginBottom={1} variant={'h1'}>
                    {formatMessage(messages.banner.title)}
                  </Text>
                  <Text>{formatMessage(messages.banner.description)}</Text>
                </Box>
                <Box
                  marginBottom={[2, 3, 4]}
                  paddingLeft={[0, 0, 6, 8, 12]}
                  paddingRight={[0, 0, 6, 8, 12]}
                >
                  {children}
                </Box>
              </Box>
            </GridColumn>
            <GridColumn
              span={['12/12', '12/12', '3/12', '3/12']}
              className={styles.sidebarContainer}
            >
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="spaceBetween"
                height="full"
                paddingTop={[0, 0, 8]}
                paddingLeft={[0, 0, 0, 4]}
                className={styles.sidebarInner}
              >
                <Stack space={2}>
                  <OJOISelect
                    backgroundColor="white"
                    name="employee"
                    isValidating={isAssigning}
                    label="Starfsmaður"
                    options={employeeOptions}
                    placeholder="Úthluta máli á starfsmann"
                    value={employeeOptions.find(
                      (employee) =>
                        employee.value === currentCase.assignedTo?.id,
                    )}
                    onChange={(opt) => {
                      if (!opt) return
                      assignEmployee({ userId: opt.value })
                    }}
                  />
                  <OJOIInput
                    disabled
                    name="status"
                    value={currentCase.status.title}
                    label={formatMessage(messages.actions.status)}
                    size="sm"
                  />
                  <OJOIInput
                    name="status"
                    disabled
                    value={currentCase.communicationStatus.title}
                    type="text"
                    label={formatMessage(messages.actions.communicationsStatus)}
                    size="sm"
                    backgroundColor={'blue'}
                  />
                  <OJOISelect
                    backgroundColor={'white'}
                    name="internal-tag"
                    label={formatMessage(statusMessages.yfirlestur.tag)}
                    defaultValue={tagOptions.find(
                      (tag) => tag.value === currentCase.tag.id,
                    )}
                    options={tagOptions}
                    onChange={(opt) => {
                      if (!opt) return
                      updateTag({ tagId: opt.value })
                    }}
                  />
                  <Box background="white" borderRadius="large">
                    <Button
                      disabled={
                        prevStatus === null ||
                        isUpdatingPrevCaseStatus ||
                        !canEdit
                      }
                      fluid
                      variant="ghost"
                      size="small"
                      preTextIcon="arrowBack"
                      loading={isUpdatingPrevCaseStatus}
                      onClick={() => updatePrevStatus()}
                    >
                      <Text
                        color="blue400"
                        variant="small"
                        fontWeight="semiBold"
                      >
                        {prevStatus
                          ? `Færa mál í ${prevStatus}`
                          : `${currentCase.status.title}`}
                      </Text>
                    </Button>
                  </Box>
                  {nextStatus ? (
                    <Button
                      disabled={
                        nextStatus === null ||
                        isUpdatingNextCaseStatus ||
                        !canEdit
                      }
                      fluid
                      loading={isUpdatingNextCaseStatus}
                      size="small"
                      icon="arrowForward"
                      onClick={() => updateCaseNextStatus()}
                    >
                      <Text color="white" variant="small" fontWeight="semiBold">
                        {nextStatus
                          ? `Færa mál í ${nextStatus}`
                          : `${currentCase.status.title}`}
                      </Text>
                    </Button>
                  ) : (
                    <LinkV2
                      href={`${Routes.PublishingOverview}?department=${currentCase.advertDepartment.title}`}
                    >
                      <Button size="small" fluid icon="arrowForward">
                        <Text
                          color="white"
                          variant="small"
                          fontWeight="semiBold"
                        >
                          Fara í útgáfu
                        </Text>
                      </Button>
                    </LinkV2>
                  )}
                  <Button
                    disabled={!canEdit}
                    fluid
                    colorScheme="destructive"
                    size="small"
                    icon="close"
                    onClick={() => handleRejectCase()}
                  >
                    <Text color="white" variant="small" fontWeight="semiBold">
                      Hafna máli
                    </Text>
                  </Button>
                  <Divider weight="purple200" />
                  <FormStepperV2
                    sections={steps.map((step, i) => (
                      <Section
                        key={step.step}
                        isActive={step.isActive}
                        section={step.title}
                        theme={FormStepperThemes.PURPLE}
                        sectionIndex={i}
                        subSections={step.notes?.map((note, i) => (
                          <Text key={i} variant="medium">
                            {note}
                          </Text>
                        ))}
                        isComplete={step.isComplete}
                      />
                    ))}
                  />
                </Stack>
              </Box>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </Box>
  )
}
