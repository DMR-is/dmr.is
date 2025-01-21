import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { AuthMiddleware } from '@dmr.is/middleware'
import { isResponse } from '@dmr.is/utils/client'

import { Stack } from '@island.is/island-ui/core'

import { Attachments } from '../../components/attachments/Attachments'
import { UpdateCaseAttributes } from '../../components/case-update-fields/UpdateCaseFields'
import { Comments } from '../../components/comments/Comments'
import { EditorMessageDisplay } from '../../components/editor-message/EditorMessageDisplay'
import { FormShell } from '../../components/form/FormShell'
import { Meta } from '../../components/meta/Meta'
import {
  AdminUser,
  CaseDetailed,
  CaseTag,
  Category,
  Department,
} from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { messages } from '../../lib/messages/caseSingle'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { CustomNextError } from '../../units/error'

type Props = {
  caseData: CaseDetailed
  departments: Department[]
  admins: AdminUser[]
  categories: Category[]
  tags: CaseTag[]
}

export default function CaseSingle({
  caseData,
  departments,
  categories,
  admins,
  tags,
}: Props) {
  const { formatMessage } = useFormatMessage()

  return (
    <>
      <Meta
        title={`${formatMessage(messages.breadcrumbs.case)} - ${formatMessage(
          messages.breadcrumbs.dashboard,
        )}`}
      />
      <FormShell caseData={caseData} tags={tags}>
        <Stack space={[2, 3, 4]}>
          <UpdateCaseAttributes
            departments={departments}
            currentCase={caseData}
          />

          <Attachments activeCase={caseData} />

          {caseData.message && (
            <EditorMessageDisplay message={caseData.message} />
          )}

          <Comments activeCase={caseData} />
          {/* <FormFooter
            activeCase={caseData}
            caseStep={step}
            canPublishFix={canPublishFixedChanges}
            updateAdvertHtmlTrigger={() =>
              updateAdvertHtmlTrigger({ advertHtml: updatedAdvertHtml })
            }
          /> */}
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

  const casePromise = dmrClient
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getCase({ id: caseId })

  const departmentsPromise = dmrClient
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getDepartments({})

  const employeesPromise = dmrClient
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getUsers()

  const categoriesPromise = dmrClient
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getCategories({
      page: 1,
      pageSize: 1000,
    })

  const tagPromises = dmrClient
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getTags()

  try {
    const [caseResponse, departments, users, categories, tags] =
      await Promise.all([
        casePromise,
        departmentsPromise,
        employeesPromise,
        categoriesPromise,
        tagPromises,
      ])

    return {
      props: deleteUndefined({
        session,
        layout,
        caseData: caseResponse._case,
        departments: departments.departments,
        categories: categories.categories,
        admins: users.users,
        tags: tags.tags,
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
