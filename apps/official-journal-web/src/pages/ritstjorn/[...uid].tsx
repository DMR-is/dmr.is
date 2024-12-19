import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router'
import { getSession } from 'next-auth/react'
import { useState } from 'react'
import { AuthMiddleware } from '@dmr.is/middleware'
import { isResponse } from '@dmr.is/utils/client'

import {
  AlertMessage,
  Button,
  Input,
  Select,
  SkeletonLoader,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { Attachments } from '../../components/attachments/Attachments'
import { CaseOverviewGrid } from '../../components/case-overview-grid/CaseOverviewGrid'
import { Comments } from '../../components/comments/Comments'
import { EditorMessageDisplay } from '../../components/editor-message/EditorMessageDisplay'
import { FormShell } from '../../components/form/FormShell'
import { FormFooter } from '../../components/form-footer/FormFooter'
import { Section } from '../../components/form-stepper/Section'
import { FormStepperThemes } from '../../components/form-stepper/types'
import { StepGrunnvinnsla } from '../../components/form-steps/StepGrunnvinnsla'
import { StepInnsending } from '../../components/form-steps/StepInnsending'
import { StepLeidretting } from '../../components/form-steps/StepLeidretting'
import { StepTilbuid } from '../../components/form-steps/StepTilbuid'
import { StepYfirlestur } from '../../components/form-steps/StepYfirlestur'
import { Meta } from '../../components/meta/Meta'
import { Case, CaseStatusTitleEnum } from '../../gen/fetch'
import { useCase, useRejectCase, useUpdateEmployee } from '../../hooks/api'
import { useUnpublishCase } from '../../hooks/api/post/useUnpublish'
import { useUpdateAdvertHtml } from '../../hooks/api/update/useUpdateAdvertHtml'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/caseSingle'
import { messages as errorMessages } from '../../lib/messages/errors'
import {
  caseStatusToCaseStep,
  CaseStep,
  deleteUndefined,
  generateSteps,
  getTimestamp,
  loginRedirect,
} from '../../lib/utils'
import { CustomNextError } from '../../units/error'

type Props = {
  thisCase: Case
  step: CaseStep
}

export default function CaseSingle(
  data: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { step } = data

  const router = useRouter()

  const { formatMessage } = useFormatMessage()
  const [isFixing, setIsFixing] = useState(false)
  const [canPublishFixedChanges, setCanPublishFixedChanges] = useState(false)
  const [updatedAdvertHtml, setUpdatedAdvertHtml] = useState('')
  const [timestamp, setTimestamp] = useState(getTimestamp())

  const {
    data: caseData,
    error,
    isLoading,
    mutate: refetchCase,
  } = useCase({
    caseId: data.thisCase.id,
    options: {
      fallback: data,
    },
  })

  const { trigger: updateAdvertHtmlTrigger } = useUpdateAdvertHtml({
    caseId: data.thisCase.id,
    options: {
      onSuccess: () => {
        setIsFixing(false)
        setCanPublishFixedChanges(false)
        refetchCase()
        setTimeout(() => {
          setTimestamp(getTimestamp())
        }, 250)
      },
      onError: () => {
        setIsFixing(false)
        setCanPublishFixedChanges(false)
      },
    },
  })

  const { trigger: rejectCase } = useRejectCase({
    caseId: data.thisCase.id,
    options: {
      onSuccess: () => {
        router.push(Routes.ProcessingOverview)
      },
    },
  })

  const { trigger: onAssignEmployee, isMutating: isAssigning } =
    useUpdateEmployee({
      caseId: data.thisCase.id,
      options: {
        onSuccess: () => {
          refetchCase()
        },
      },
    })

  const { trigger: unpublish, isMutating: isUnpublishing } = useUnpublishCase({
    caseId: data.thisCase.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const onRejectCaseHandler = () => {
    const proceed = confirm(
      'Viltu hafna málinu? Þetta eyðir málinu og umsókninni sem fylgir því.',
    )

    if (proceed) {
      rejectCase()
    }
  }

  const onUnpublishCaseHandler = () => {
    const proceed = confirm(
      'Viltu taka málið úr birtingu? Það verður óaðgengilegt á vefnum.',
    )

    if (proceed) {
      unpublish()
    }
  }

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

  const stepper = generateSteps(caseData._case)

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

  const fixStep = step === 'leidretting'

  const activeCase = caseData._case

  const isCaseRejected =
    activeCase.status.title === CaseStatusTitleEnum.BirtinguHafnað

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
              isDisabled={isAssigning || isCaseRejected}
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
            <Input
              disabled
              name="status"
              value={activeCase.status.title}
              label={formatMessage(messages.actions.status)}
              size="sm"
            />
            <Input
              name="status"
              disabled
              value={activeCase.communicationStatus.title}
              type="text"
              label={formatMessage(messages.actions.communicationsStatus)}
              size="sm"
              backgroundColor={'blue'}
            />

            {!fixStep && isCaseRejected && (
              <Button
                colorScheme="destructive"
                size="medium"
                fluid
                disabled={activeCase.publishedAt !== null}
                onClick={onRejectCaseHandler}
              >
                {formatMessage(messages.actions.rejectCase)}
              </Button>
            )}

            {fixStep && !isCaseRejected && (
              <>
                {!isFixing ? (
                  <Button
                    fluid
                    colorScheme="destructive"
                    size="medium"
                    disabled={!fixStep}
                    onClick={() => setIsFixing(true)}
                  >
                    {formatMessage(messages.paging.fixStep)}
                  </Button>
                ) : (
                  <Button
                    fluid
                    disabled={activeCase.publishedAt === null}
                    size="medium"
                    colorScheme="destructive"
                    loading={isUnpublishing}
                    onClick={onUnpublishCaseHandler}
                  >
                    {formatMessage(messages.actions.unpublishCase)}
                  </Button>
                )}
              </>
            )}
          </Stack>
        }
      >
        <Stack space={[2, 3, 4]}>
          {step === 'innsent' && <StepInnsending activeCase={activeCase} />}
          {step === 'grunnvinnsla' && <StepGrunnvinnsla data={activeCase} />}
          {step === 'yfirlestur' && <StepYfirlestur data={activeCase} />}
          {step === 'tilbuid' && <StepTilbuid activeCase={activeCase} />}
          {step === 'leidretting' && (
            <StepLeidretting
              isFixing={isFixing}
              canPublish={canPublishFixedChanges}
              data={activeCase}
              timestamp={timestamp}
              onAdvertHtmlChange={(html) => setUpdatedAdvertHtml(html)}
            />
          )}

          <Attachments activeCase={activeCase} refetchCase={refetchCase} />

          {activeCase.message && (
            <EditorMessageDisplay message={activeCase.message} />
          )}

          <Comments
            onAddCommentSuccess={() => {
              if (isFixing) {
                setCanPublishFixedChanges(true)
              }
            }}
            activeCase={activeCase}
          />
          <FormFooter
            activeCase={activeCase}
            caseStep={step}
            canPublishFix={canPublishFixedChanges}
            updateAdvertHtmlTrigger={() =>
              updateAdvertHtmlTrigger({ advertHtml: updatedAdvertHtml })
            }
            refetch={refetchCase}
          />
        </Stack>
      </FormShell>
    </>
  )
}
export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  query,
  resolvedUrl,
}) => {
  const session = await getSession({ req })

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const dmrClient = createDmrClient()
  const caseId = query.uid?.[0]
  // const step = query.uid?.[1] as CaseStep | undefined

  if (!caseId) {
    throw new CustomNextError(404, 'Slóð inniheldur ekki auðkenni (id)!')
  }

  const layout: LayoutProps = {
    showFooter: false,
    headerWhite: true,
    bannerProps: {
      showBanner: false,
      showFilters: false,
      title: messages.banner.title,
    },
  }

  try {
    // TODO: getCase should return null if no case is found
    const activeCase = await dmrClient
      .withMiddleware(new AuthMiddleware(session.accessToken))
      .getCase({
        id: caseId,
      })

    const queryStep = query.uid?.[1] as CaseStep | undefined

    const caseStep = caseStatusToCaseStep(activeCase._case.status.slug)

    if (!caseStep) {
      throw new CustomNextError(404, 'Slóð inniheldur ekki rétt gögn!')
    }

    if (!queryStep || queryStep !== caseStep) {
      return {
        redirect: {
          destination: `/ritstjorn/${caseId}/${caseStep}`,
          permanent: false,
        },
      }
    }

    return {
      props: deleteUndefined({
        session,
        layout,
        thisCase: activeCase._case,
        step: caseStep,
      }),
    }
  } catch (error) {
    if (isResponse(error)) {
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
