import { useSession } from 'next-auth/react'

import { Key } from 'swr'
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation'

import {
  CaseChannel,
  CreateCommunicationChannelRequest,
  DeleteCommunicationChannelRequest,
} from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'

type CreateCommunicationChannelConfiguration = SWRMutationConfiguration<
  CaseChannel,
  Error,
  Key,
  CreateCommunicationChannelRequest
>

type DeleteCommunicationChannelConfiguration = SWRMutationConfiguration<
  void,
  Error,
  Key,
  DeleteCommunicationChannelRequest
>

type UseCommunicationChannelsParams = {
  createChannelOptions?: CreateCommunicationChannelConfiguration
  deleteChannelOptions?: DeleteCommunicationChannelConfiguration
}

export const useCommunicationChannels = ({
  createChannelOptions,
  deleteChannelOptions,
}: UseCommunicationChannelsParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const { trigger: createChannel, isMutating: isCreatingChannel } =
    useSWRMutation<CaseChannel, Error, Key, CreateCommunicationChannelRequest>(
      session ? ['createCommunicationChannel', session.user] : null,
      (_key: string, { arg }: { arg: CreateCommunicationChannelRequest }) =>
        dmrClient.createCommunicationChannel(arg),
      {
        ...createChannelOptions,
        throwOnError: false,
      },
    )

  const { trigger: deleteChannel, isMutating: isDeletingChannel } =
    useSWRMutation<void, Error, Key, DeleteCommunicationChannelRequest>(
      session ? ['deleteCommunicationChannel', session.user] : null,
      (_key: string, { arg }: { arg: DeleteCommunicationChannelRequest }) =>
        dmrClient.deleteCommunicationChannel(arg),
      {
        throwOnError: false,
        ...deleteChannelOptions,
      },
    )

  return {
    createChannel,
    isCreatingChannel,
    deleteChannel,
    isDeletingChannel,
  }
}
