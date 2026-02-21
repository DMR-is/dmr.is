'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { createContext } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import {
  CreateUserRequest,
  GetUserResponse,
  Institution,
  Paging,
  UpdateUserRequest,
  UserDto,
} from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type UserState = {
  users: UserDto[]
  paging: Paging
  userInvolvedPartiesOptions: { label: string; value: Institution }[]
  getUserInvoledParties: () => void
  refetchUsers: () => void
  search?: string
  role?: string
  institution?: string
  createUser: (
    req: CreateUserRequest,
    onSuccess?: (data: GetUserResponse) => void,
  ) => void
  updateUser: (req: UpdateUserRequest) => void
  deleteUser: (req: { id: string }) => void
  setSearch: (search: string | null) => void
  setRole: (role: string | null) => void
  setInstitution: (institution: string | null) => void
}

const defaultPaging: Paging = {
  page: 1,
  pageSize: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: 1,
  previousPage: 1,
  totalItems: 0,
  totalPages: 0,
}

export const UserContext = createContext<UserState>({
  users: [],
  paging: defaultPaging,
  userInvolvedPartiesOptions: [],
  getUserInvoledParties: () => undefined,
  search: '',
  role: '',
  institution: '',
  updateUser: () => undefined,
  deleteUser: () => undefined,
  createUser: () => undefined,
  refetchUsers: () => undefined,
  setSearch: () => undefined,
  setRole: () => undefined,
  setInstitution: () => undefined,
})

type UserProviderProps = {
  children: React.ReactNode
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [page] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState('pageSize', parseAsInteger.withDefault(10))

  const [institution, setInstitution] = useQueryState('stofnun')
  const [role, setRole] = useQueryState('hlutverk')
  const [search, setSearch] = useQueryState('leit')

  const { data: usersData } = useQuery(
    trpc.getUsers.queryOptions({
      page: page,
      pageSize: pageSize,
      role: role ?? undefined,
      involvedParty: institution ?? undefined,
      search: search ?? undefined,
    }),
  )

  const { data: involvedPartiesData, refetch: getUserInvoledParties } =
    useQuery(trpc.getInvolvedPartiesByUser.queryOptions())

  const users = usersData?.users ?? []
  const paging = usersData?.paging ?? defaultPaging

  const createUserMutation = useMutation(
    trpc.createUser.mutationOptions({
      onSuccess: ({ user }) => {
        queryClient.invalidateQueries(trpc.getUsers.queryFilter())
        toast.success(`Notandi ${user.displayName} hefur verið stofnaður`, {
          closeButton: true,
          toastId: 'create-user',
        })
      },
      onError: () => {
        toast.error('Ekki tókst að stofna notanda', {
          closeButton: true,
          toastId: 'create-user',
        })
      },
    }),
  )

  const updateUserMutation = useMutation(
    trpc.updateUser.mutationOptions({
      onSuccess: ({ user }) => {
        queryClient.invalidateQueries(trpc.getUsers.queryFilter())
        toast.success(`Notandi ${user.displayName} uppfærður`, {
          closeButton: true,
          toastId: 'update-user',
        })
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra notanda', {
          closeButton: true,
          toastId: 'update-user',
        })
      },
    }),
  )

  const deleteUserMutation = useMutation(
    trpc.deleteUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.getUsers.queryFilter())
      },
      onError: () => {
        toast.error('Ekki tókst að eyða notanda', {
          closeButton: true,
          toastId: 'delete-user',
        })
      },
    }),
  )

  const handleCreateUser = (
    req: CreateUserRequest,
    onSuccess?: (res: GetUserResponse) => void,
  ) => {
    createUserMutation.mutate(req, {
      onSuccess: (data) => {
        if (onSuccess) onSuccess(data)
      },
    })
  }

  const handleUpdateUser = (req: UpdateUserRequest) => {
    updateUserMutation.mutate(req)
  }

  const handleDeleteUser = (req: { id: string }) => {
    const userToDelete = users.find((u) => u.id === req.id)
    deleteUserMutation.mutate(req, {
      onSuccess: () => {
        if (userToDelete) {
          toast.success(
            `Notandi ${userToDelete.displayName} hefur verið eytt`,
            {
              closeButton: true,
              toastId: 'delete-user',
            },
          )
        }
      },
    })
  }

  const userInvolvedPartiesOptions =
    involvedPartiesData?.involvedParties?.map((party) => ({
      label: party.title,
      value: party,
    })) ?? []

  return (
    <UserContext.Provider
      value={{
        users,
        paging,
        userInvolvedPartiesOptions,
        getUserInvoledParties,
        refetchUsers: () =>
          queryClient.invalidateQueries(trpc.getUsers.queryFilter()),
        search: search ?? undefined,
        role: role ?? undefined,
        institution: institution ?? undefined,
        updateUser: handleUpdateUser,
        deleteUser: handleDeleteUser,
        createUser: handleCreateUser,
        setSearch,
        setRole,
        setInstitution,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
