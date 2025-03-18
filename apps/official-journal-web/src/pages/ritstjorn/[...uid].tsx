import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import { isResponse } from '@dmr.is/utils/client'

import { CaseFields } from '../../components/case-update-fields/CaseFields'
import { FormShell } from '../../components/form/FormShell'
import { Meta } from '../../components/meta/Meta'
import { CaseProvider } from '../../context/caseContext'
import {
  AdvertType,
  CaseDetailed,
  CaseTag,
  Category,
  Department,
  UserDto,
} from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { getDmrClient } from '../../lib/api/createClient'
import { messages } from '../../lib/messages/caseSingle'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { CustomNextError } from '../../units/error'
import { authOptions } from '../api/auth/[...nextauth]'

type Props = {
  caseData: CaseDetailed
  departments: Department[]
  admins: UserDto[]
  categories: Category[]
  tags: CaseTag[]
  types: AdvertType[]
}

export default function CaseSingle({
  caseData,
  departments,
  categories,
  admins,
  tags,
  types,
}: Props) {
  const { formatMessage } = useFormatMessage()

  const { data: session } = useSession()

  return (
    <CaseProvider
      tags={tags}
      initalCase={caseData}
      categories={categories}
      departments={departments}
      employees={admins}
      types={types}
      currentUserId={session?.user?.id}
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
  res,
  query,
  resolvedUrl,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const dmrClient = getDmrClient(session.idToken)
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

  const casePromise = dmrClient.getCase({ id: caseId })

  const departmentsPromise = dmrClient.getDepartments({})

  const employeesPromise = dmrClient.getUsers({
    role: 'ritstjori',
  })

  const categoriesPromise = dmrClient.getCategories({
    page: 1,
    pageSize: 1000,
  })

  const tagPromises = dmrClient.getTags()

  try {
    const [caseResponse, departments, users, categories, tags] =
      await Promise.all([
        casePromise,
        departmentsPromise,
        employeesPromise,
        categoriesPromise,
        tagPromises,
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
