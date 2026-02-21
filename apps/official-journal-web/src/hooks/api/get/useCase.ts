import { useSession } from 'next-auth/react'

import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation'

import {
  CreateCaseRequest,
  CreateCaseResponseDto,
  GetCaseResponse,
} from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants-legacy'

type UseCaseParams = {
  caseId?: string
  options?: SWRConfiguration<GetCaseResponse, Error>
  createCaseOptions?: SWRMutationConfiguration<
    CreateCaseResponseDto,
    Error,
    Key,
    CreateCaseRequest
  >
}

export const useCase = ({
  caseId,
  options,
  createCaseOptions,
}: UseCaseParams = {}) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session && caseId ? ['getCase', session?.user, caseId] : null,
    ([_key, _user, id]) =>
      swrFetcher({
        func: () => dmrClient.getCase({ id }),
      }),
    {
      ...options,
    },
  )

  const { trigger: createCase, isMutating } = useSWRMutation<
    CreateCaseResponseDto,
    Error,
    Key,
    CreateCaseRequest
  >(
    session ? ['createCase', session.user] : null,
    (_key: string, { arg }: { arg: CreateCaseRequest }) =>
      swrFetcher({
        func: () => dmrClient.createCase(arg),
      }),
    {
      ...createCaseOptions,
      throwOnError: false,
    },
  )

  return {
    case: data?._case,
    error,
    isLoading,
    isValidating,
    mutate,
    createCase,
    isCreatingCase: isMutating,
  }
}
