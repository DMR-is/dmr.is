import { useQueryState } from 'next-usequerystate'
import { createContext, useState } from 'react'

import { toast } from '@island.is/island-ui/core'

import {
  CreateUserRequest,
  DeleteUserRequest,
  GetUserResponse,
  Institution,
  Paging,
  UpdateUserRequest,
  UserDto,
} from '../gen/fetch'
import { useUsers } from '../hooks/users/useUsers'

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
  deleteUser: (req: DeleteUserRequest) => void
  setSearch: (search: string | null) => void
  setRole: (role: string | null) => void
  setInstitution: (institution: string | null) => void
}

export const UserContext = createContext<UserState>({
  users: [],
  paging: {} as Paging,
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
  const [users, setUsers] = useState<UserDto[]>([])
  const [paging, setPaging] = useState<Paging>({
    page: 1,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: 1,
    previousPage: 1,
    totalItems: 0,
    totalPages: 0,
  })

  const [institution, setInstitution] = useQueryState('stofnun')
  const [role, setRole] = useQueryState('hlutverk')
  const [search, setSearch] = useQueryState('leit')

  const {
    involedParties,
    getUserInvoledParties,
    mutate,
    updateUser,
    deleteUser,
    createUser,
  } = useUsers({
    params: {
      page: 1,
      pageSize: 10,
      role: role ?? undefined,
      involvedParty: institution ?? undefined,
      search: search ?? undefined,
    },
    options: {
      revalidateOnFocus: true,
      onSuccess: ({ users, paging }) => {
        setUsers(users)
        setPaging(paging)
      },
    },
    createUserOptions: {
      onSuccess: ({ user }) => {
        setUsers((prev) => [...prev, user])
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
    },
    updateUserOptions: {
      onSuccess: ({ user }) => {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)))
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
    },
    deleteUserOptions: {
      onSuccess: ({ id }) => {
        const userToDelete = users.find((u) => u.id === id)
        if (!userToDelete) return
        const filteredUsers = users.filter((u) => u.id !== id)
        setUsers(filteredUsers)
        toast.success(`Notandi ${userToDelete.displayName} hefur verið eytt`, {
          closeButton: true,
          toastId: 'delete-user',
        })
      },
      onError: () => {
        toast.error('Ekki tókst að eyða notanda', {
          closeButton: true,
          toastId: 'delete-user',
        })
      },
    },
  })

  const handleCreateUser = (
    req: CreateUserRequest,
    onSuccess?: (res: GetUserResponse) => void,
  ) => {
    createUser(req, {
      onSuccess: (data) => {
        if (!data) return
        const user = data.user
        setUsers((prev) => [user, ...prev])
        toast.success(`Notandi ${user.displayName} hefur verið stofnaður`, {
          closeButton: true,
          toastId: 'create-user',
        })
        if (onSuccess) onSuccess(data)
      },
    })
  }

  const userInvolvedPartiesOptions = involedParties?.involvedParties.map(
    (party) => ({
      label: party.title,
      value: party,
    }),
  )

  return (
    <UserContext.Provider
      value={{
        users,
        paging,
        userInvolvedPartiesOptions: userInvolvedPartiesOptions ?? [],
        getUserInvoledParties,
        refetchUsers: mutate,
        search: search ?? undefined,
        role: role ?? undefined,
        institution: institution ?? undefined,
        updateUser,
        deleteUser,
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
