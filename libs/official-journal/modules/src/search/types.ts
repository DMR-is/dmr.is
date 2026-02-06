import { AdvertLean } from '@dmr.is/shared/dto'

export type SearchAdvertType = AdvertLean & {
  bodyText: string
  caseNumber: string
  mainType?: {
    id: string
    title: string
    slug: string
  }
}

export type UpdateAdvertInIndexRes = { advertId: string; success: boolean }
