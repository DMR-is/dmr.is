import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router'
import { getSession } from 'next-auth/react'
import { useState } from 'react'
import { AuthMiddleware } from '@dmr.is/middleware'
import { isResponse } from '@dmr.is/utils/client'

import { Button, Input, Select, Stack, Text } from '@island.is/island-ui/core'

import { Attachments } from '../../components/attachments/Attachments'
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
import { CaseDetailed, CaseStatusEnum } from '../../gen/fetch'
import { useRejectCase, useUpdateEmployee } from '../../hooks/api'
import { useUnpublishCase } from '../../hooks/api/post/useUnpublish'
import { useUpdateAdvertHtml } from '../../hooks/api/update/useUpdateAdvertHtml'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/caseSingle'
import {
  caseStatusToCaseStep,
  CaseStep,
  deleteUndefined,
  generateSteps,
  loginRedirect,
} from '../../lib/utils'
import { CustomNextError } from '../../units/error'

type Props = {
  thisCase: CaseDetailed
  step: CaseStep
}

export default function CaseSingle(
  data: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { thisCase } = data
  const { step } = data

  const router = useRouter()

  const { formatMessage } = useFormatMessage()
  const [isFixing, setIsFixing] = useState(false)
  const [canPublishFixedChanges, setCanPublishFixedChanges] = useState(false)
  const [updatedAdvertHtml, setUpdatedAdvertHtml] = useState('')

  const { trigger: updateAdvertHtmlTrigger } = useUpdateAdvertHtml({
    caseId: data.thisCase.id,
    options: {
      onSuccess: () => {
        setIsFixing(false)
        setCanPublishFixedChanges(false)
      },
      onError: () => {
        setIsFixing(false)
        setCanPublishFixedChanges(false)
      },
    },
  })

  const { trigger: rejectCase } = useRejectCase({
    options: {
      onSuccess: () => {
        router.push(Routes.ProcessingOverview)
      },
    },
  })

  const { trigger: onAssignEmployee, isMutating: isAssigning } =
    useUpdateEmployee({
      caseId: thisCase.id,
    })

  const { trigger: unpublish, isMutating: isUnpublishing } = useUnpublishCase()

  const onRejectCaseHandler = () => {
    const proceed = confirm(
      'Viltu hafna málinu? Þetta eyðir málinu og umsókninni sem fylgir því.',
    )

    if (proceed) {
      rejectCase({ caseId: thisCase.id })
    }
  }

  const onUnpublishCaseHandler = () => {
    const proceed = confirm(
      'Viltu taka málið úr birtingu? Það verður óaðgengilegt á vefnum.',
    )

    if (proceed) {
      unpublish({
        caseId: thisCase.id,
      })
    }
  }

  const stepper = generateSteps(data.thisCase)

  const employeesMock = [
    {
      label: 'Ármann',
      value: 'f450279c-b07e-4f92-a5ae-d8f93360cafe',
    },
    {
      label: 'Pálína J',
      value: 'db710b5d-8745-4f5f-b22b-c7151847c56a',
    },
  ]

  const fixStep = step === 'leidretting'

  const isCaseRejected = thisCase.status.title === CaseStatusEnum.BirtinguHafnað

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
                thisCase.assignedTo?.id === option.value
              }
              isDisabled={isAssigning || isCaseRejected}
              isLoading={isAssigning}
              name="assignedTo"
              options={employeesMock.map((e) => ({
                label: e.label,
                value: e.value,
                disabled: thisCase.assignedTo?.id === e.value,
              }))}
              defaultValue={employeesMock.find(
                (e) => e.value === thisCase.assignedTo?.id,
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
              value={thisCase.status.title}
              label={formatMessage(messages.actions.status)}
              size="sm"
            />
            <Input
              name="status"
              disabled
              value={thisCase.communicationStatus.title}
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
                disabled={thisCase.publishedAt !== null}
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
                    disabled={thisCase.publishedAt === null}
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
          {step === 'innsent' && <StepInnsending activeCase={thisCase} />}
          {step === 'grunnvinnsla' && <StepGrunnvinnsla data={thisCase} />}
          {step === 'yfirlestur' && <StepYfirlestur data={thisCase} />}
          {step === 'tilbuid' && <StepTilbuid activeCase={thisCase} />}
          {step === 'leidretting' && (
            <StepLeidretting
              isFixing={isFixing}
              canPublish={canPublishFixedChanges}
              data={thisCase}
              timestamp={new Date().toISOString()}
              onAdvertHtmlChange={(html) => setUpdatedAdvertHtml(html)}
            />
          )}

          {!!thisCase.applicationId && <Attachments activeCase={thisCase} />}

          {thisCase.message && (
            <EditorMessageDisplay message={thisCase.message} />
          )}

          <Comments
            onAddCommentSuccess={() => {
              if (isFixing) {
                setCanPublishFixedChanges(true)
              }
            }}
            activeCase={thisCase}
          />
          <FormFooter
            activeCase={thisCase}
            caseStep={step}
            canPublishFix={canPublishFixedChanges}
            updateAdvertHtmlTrigger={() =>
              updateAdvertHtmlTrigger({ advertHtml: updatedAdvertHtml })
            }
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
