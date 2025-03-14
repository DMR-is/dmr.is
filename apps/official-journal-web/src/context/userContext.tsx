import { useQueryState } from 'next-usequerystate'
import { createContext, useState } from 'react'

import { toast } from '@island.is/island-ui/core'

import {
  CreateUserRequest,
  DeleteUserRequest,
  GetUserResponse,
  UpdateUserRequest,
  UserDto,
} from '../gen/fetch'
import { useUsers } from '../hooks/users/useUsers'

type UserState = {
  users: UserDto[]
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

  const [institution, setInstitution] = useQueryState('stofnun')
  const [role, setRole] = useQueryState('hlutverk')
  const [search, setSearch] = useQueryState('leit')

  const { mutate, updateUser, deleteUser, createUser } = useUsers({
    params: {
      page: 1,
      pageSize: 10,
      role: role ?? undefined,
      involvedParty: institution ?? undefined,
      search: search ?? undefined,
    },
    options: {
      onSuccess: ({ users }) => setUsers(users),
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

  return (
    <UserContext.Provider
      value={{
        users,
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
