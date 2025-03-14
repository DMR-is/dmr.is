import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { AuthMiddleware } from '@dmr.is/middleware'
import { isResponse } from '@dmr.is/utils/client'

import { CaseFields } from '../../components/case-update-fields/CaseFields'
import { FormShell } from '../../components/form/FormShell'
import { Meta } from '../../components/meta/Meta'
import { CaseProvider } from '../../context/caseContext'
import {
  AdminUser,
  AdvertType,
  ApplicationFeeCode,
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
  types: AdvertType[]
  feeCodes: ApplicationFeeCode[]
}

export default function CaseSingle({
  caseData,
  departments,
  categories,
  admins,
  tags,
  types,
  feeCodes,
}: Props) {
  const { formatMessage } = useFormatMessage()

  const currentUser = useSession()

  return (
    <CaseProvider
      tags={tags}
      initalCase={caseData}
      categories={categories}
      departments={departments}
      employees={admins}
      types={types}
      feeCodes={feeCodes}
      currentUserId={currentUser?.data?.user?.id}
    >
      <Meta
        title={`${formatMessage(messages.breadcrumbs.case)} - ${formatMessage(
          messages.breadcrumbs.dashboard,
        )}`}
      />
      <FormShell>
        <CaseFields />
      </FormShell>
    </CaseProvider>
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

  const feeCodePromise = dmrClient
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getFeeCodes({
      excludeBaseCodes: true,
    })

  try {
    const [caseResponse, departments, users, categories, tags, feeCodes] =
      await Promise.all([
        casePromise,
        departmentsPromise,
        employeesPromise,
        categoriesPromise,
        tagPromises,
        feeCodePromise,
      ])

    const types = await dmrClient.getTypes({
      department: caseResponse._case.advertDepartment.id,
      page: 1,
      pageSize: 100,
    })

    return {
      props: deleteUndefined({
        session,
        layout,
        caseData: caseResponse._case,
        departments: departments.departments,
        categories: categories.categories,
        admins: users.users,
        tags: tags.tags,
        types: types.types,
        feeCodes: feeCodes.codes,
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
