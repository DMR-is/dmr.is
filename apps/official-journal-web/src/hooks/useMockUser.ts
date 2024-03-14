type MockUser = {
  fullName: string
  name: string
  lastName: string
}

type UseMockUser = {
  mockUser: MockUser
}

export const useMockUser = (): UseMockUser => {
  return {
    mockUser: {
      fullName: 'Ármann Árni Sigurjónsson',
      name: 'Ármann Árni',
      lastName: 'Sigurjónsson',
    },
  }
}
