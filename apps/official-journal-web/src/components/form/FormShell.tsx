'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Breadcrumbs } from '@dmr.is/ui/components/island-is/Breadcrumbs'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/caseSingle'
import { useTRPC } from '../../lib/trpc/client/trpc'
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

import { useMutation } from '@tanstack/react-query'

type FormShellType = {
  children?: React.ReactNode
}

export const FormShell = ({ children }: FormShellType) => {
  const { formatMessage } = useFormatMessage()
  const trpc = useTRPC()

  const {
    currentCase,
    employeeOptions,
    tagOptions,
    canEdit,
    isPublishedOrRejected,
    canUpdateAdvert,
    localCorrection,
    refetch,
  } = useCaseContext()

  const steps = generateSteps(currentCase)

  const updateTagMutation = useMutation(
    trpc.updateTag.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success('Merking máls uppfært')
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra merkingu málsins')
      },
    }),
  )

  const assignEmployeeMutation = useMutation(
    trpc.updateEmployee.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success('Máli úthlutað á starfsmann')
      },
      onError: () => {
        toast.error('Ekki tókst að úthluta máli á starfsmann')
      },
    }),
  )

  const updateNextStatusMutation = useMutation(
    trpc.updateNextStatus.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success('Staða máls uppfærð')
      },
      onError: () => {
        toast.error('Ekki tókst að færa máli í næsta stig')
      },
    }),
  )

  const updatePrevStatusMutation = useMutation(
    trpc.updatePreviousStatus.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success('Staða máls uppfærð')
      },
      onError: () => {
        toast.error('Ekki tókst að færa máli í fyrri stig')
      },
    }),
  )

  const rejectCaseMutation = useMutation(
    trpc.rejectCase.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success('Máli hafnað')
      },
      onError: () => {
        toast.error('Ekki tókst að hafna máli')
      },
    }),
  )

  const correctAdvertMutation = useMutation(
    trpc.updateAdvertWithCorrection.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success('Leiðrétting birt')
      },
      onError: () => {
        toast.error('Ekki tókst að birta leiðréttingu')
      },
    }),
  )

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
      rejectCaseMutation.mutate({ id: currentCase.id })
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
                    isValidating={assignEmployeeMutation.isPending}
                    label="Starfsmaður"
                    options={employeeOptions}
                    placeholder="Úthluta máli á starfsmann"
                    value={employeeOptions.find(
                      (employee) =>
                        employee.value === currentCase.assignedTo?.id,
                    )}
                    onChange={(opt) => {
                      if (!opt) return
                      assignEmployeeMutation.mutate({
                        id: currentCase.id,
                        userId: opt.value,
                      })
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
                    name="communication-status"
                    disabled
                    value={currentCase.communicationStatus.title}
                    type="text"
                    label={formatMessage(messages.actions.communicationsStatus)}
                    size="sm"
                    backgroundColor={'blue'}
                    key={currentCase.communicationStatus.id}
                  />
                  <OJOISelect
                    isDisabled={!canEdit}
                    backgroundColor={'white'}
                    name="internal-tag"
                    label={formatMessage(statusMessages.yfirlestur.tag)}
                    defaultValue={tagOptions.find(
                      (tag) => tag.value === currentCase.tag.id,
                    )}
                    options={tagOptions}
                    onChange={(opt) => {
                      if (!opt) return
                      updateTagMutation.mutate({
                        id: currentCase.id,
                        tagId: opt.value,
                      })
                    }}
                  />
                  <Box
                    background={prevStatus ? 'white' : 'blueberry100'}
                    borderRadius="large"
                  >
                    <Button
                      disabled={
                        prevStatus === null ||
                        updatePrevStatusMutation.isPending ||
                        !canEdit
                      }
                      fluid
                      variant="ghost"
                      size="small"
                      preTextIcon={prevStatus ? 'arrowBack' : undefined}
                      loading={updatePrevStatusMutation.isPending}
                      onClick={() =>
                        updatePrevStatusMutation.mutate({
                          id: currentCase.id,
                        })
                      }
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
                        updateNextStatusMutation.isPending ||
                        !canEdit
                      }
                      fluid
                      loading={updateNextStatusMutation.isPending}
                      size="small"
                      icon={nextStatus ? 'arrowForward' : undefined}
                      onClick={() =>
                        updateNextStatusMutation.mutate({
                          id: currentCase.id,
                        })
                      }
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
                      <Button size="small" fluid>
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
                  {!isPublishedOrRejected && (
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
                  )}
                  {isPublishedOrRejected && (
                    <Button
                      disabled={!canUpdateAdvert}
                      fluid
                      size="small"
                      icon="pencil"
                      iconType="outline"
                      loading={correctAdvertMutation.isPending}
                      onClick={() => {
                        if (!localCorrection) return
                        correctAdvertMutation.mutate({
                          advertHtml: currentCase.html,
                          caseId: currentCase.id,
                          description: localCorrection.description,
                          title: localCorrection.title,
                        })
                      }}
                    >
                      <Text color="white" variant="small" fontWeight="semiBold">
                        Birta leiðréttingu
                      </Text>
                    </Button>
                  )}
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
