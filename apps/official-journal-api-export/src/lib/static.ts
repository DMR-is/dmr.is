import { SuperCategory } from '../types'

export function getSuperCategories(): Promise<Array<SuperCategory>> {
  // Manually generted via spreadsheet!
  const data = [
    {
      title: 'Fjármál',
      slug: 'fjarmal',
      id: '',
      children: ['foo'],
    },
  ]

  return Promise.resolve(data)
}
