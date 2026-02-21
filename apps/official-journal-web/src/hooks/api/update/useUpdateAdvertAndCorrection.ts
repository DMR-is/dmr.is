import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'
export type UpdateAvertAndCorrectionTriggerArgs = {
  caseId: string
  title: string
  description: string
  advertHtml: string
}

import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

type SWRAddCorrectionOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateAvertAndCorrectionTriggerArgs
>

type UseAddCorrectionParams = {
  options?: SWRAddCorrectionOptions
}

export const useUpdateAdvertAndCorrection = ({
  options,
}: UseAddCorrectionParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    UpdateAvertAndCorrectionTriggerArgs
  >(
    APIRoutes.UpdateAdvertWithCorrection,
    async (
      url: string,
      { arg }: { arg: UpdateAvertAndCorrectionTriggerArgs },
    ) =>
      await fetcher<Response, UpdateAvertAndCorrectionTriggerArgs>(
        url.replace(':id', arg.caseId),
        {
          arg: { withAuth: true, method: 'POST', body: arg },
        },
      ),
    {
      ...options,
      throwOnError: false,
    },
  )

  return {
    trigger,
    isMutating,
  }
}
