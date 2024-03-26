import { JournalAdvert } from '@dmr.is/shared/dto/journal'
import {
  ADVERT_B_1278_2023,
  ADVERT_B_866_2006,
  ADVERT_NEW,
} from './journal.mock'

type Comment = {
  id: string
  type: 'submit' | 'assign' | 'comment'
  createdAt: string
  task: {
    from: string | null
    to: string | null
    title: string
    comment: string | null
  }
}

type Case = {
  id: string
  applicationId: string
  year: number
  caseNumber: number
  status: 'Innsent' | 'Grunnvinnsla' | 'Yfirlestur' | 'Tilbúið til útgáfu'
  tag: 'Í yfirlestri' | 'Samlesin' | 'Þarf skoðun' | null
  createdAt: string
  modifiedAt: string
  published: boolean
  publishedAt: string | null
  paid: boolean
  price: number | null
  fastTrack: boolean
  assignedTo: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  advert: JournalAdvert
  comments: Comment[]
}

export const CASE_SUBMITTED: Case = {
  id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
  applicationId: '3ec5ef68-6dc8-42ee-9eba-1670ff134153',
  year: 2024,
  caseNumber: 1234,
  status: 'Innsent',
  tag: null,
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: false,
  price: null,
  fastTrack: false,
  assignedTo: null,
  advert: ADVERT_NEW,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-76832d2ea1d1',
      type: 'submit',
      createdAt: '2024-03-12T12:45:48.21Z',
      task: {
        from: null,
        to: 'Stofnun x',
        title: 'Innsent af:',
        comment: null,
      },
    },
  ],
}

export const CASE_IN_PROGRESS: Case = {
  id: 'e6d7c050-a462-4183-972a-5c375e6e358d',
  applicationId: '3ec5ef68-6dc8-42ee-9eha-1670ff134153',
  year: 2024,
  caseNumber: 8526,
  status: 'Grunnvinnsla',
  tag: null,
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: false,
  price: null,
  fastTrack: false,
  assignedTo: null,
  advert: ADVERT_B_1278_2023,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-76832d2xa1d1',
      type: 'submit',
      createdAt: '2024-03-12T12:45:48.21Z',
      task: {
        from: null,
        to: 'Stofnun x',
        title: 'Innsent af:',
        comment: null,
      },
    },
    {
      id: 'a72e9b33-ad8c-4a83-84bf-92e109721e0f',
      createdAt: '2024-03-13T12:45:48.21Z',
      type: 'assign',
      task: {
        from: 'Ármann',
        to: null,
        title: 'merkir sér málið',
        comment: null,
      },
    },
    {
      id: 'fb85443f-1d10-4c7c-bef3-d1b8dkc1d462',
      type: 'comment',
      createdAt: '2024-03-13T12:45:48.21Z',
      task: {
        from: 'Ármann',
        to: null,
        title: 'gerir athugasemd',
        comment:
          'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      },
    },
  ],
}

export const CASE_IN_REVIEW: Case = {
  id: 'e637c050-a462-4183-972a-5c375e6e34ad',
  applicationId: '3ec5ef68-6dc8-42ee-9eba-1670ff134z53',
  year: 2024,
  caseNumber: 5824,
  status: 'Yfirlestur',
  tag: 'Í yfirlestri',
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: true,
  price: 23900,
  fastTrack: false,
  assignedTo: 'Pálína J',
  advert: ADVERT_B_866_2006,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-76832d2ea1d1',
      type: 'submit',
      createdAt: '2024-03-12T12:45:48.21Z',
      task: {
        from: null,
        to: 'Stofnun x',
        title: 'Innsent af:',
        comment: null,
      },
    },
    {
      id: 'a72e9b33-ad8c-4d83-84bf-92e109721z0f',
      createdAt: '2024-03-13T12:45:48.21Z',
      type: 'assign',
      task: {
        from: 'Ármann',
        to: null,
        title: 'merkir sér málið',
        comment: null,
      },
    },
    {
      id: 'jk85443f-1d10-4c7c-bef3-d1b8dbc1d462',
      type: 'comment',
      createdAt: '2024-03-13T12:45:48.21Z',
      task: {
        from: 'Ármann',
        to: null,
        title: 'gerir athugasemd',
        comment:
          'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      },
    },
  ],
}

export const CASE_READY: Case = {
  id: 'e637c050-a462-4183-972a-5c375x6e34ad',
  applicationId: '3ec5ef68-6dc8-42xe-9eba-1670ff134z53',
  year: 2024,
  caseNumber: 3211,
  status: 'Tilbúið til útgáfu',
  tag: 'Samlesin',
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: true,
  price: 23000,
  fastTrack: false,
  assignedTo: 'Ármann',
  advert: ADVERT_B_866_2006,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-7683ad2ea1d1',
      type: 'submit',
      createdAt: '2024-03-12T12:45:48.21Z',
      task: {
        from: null,
        to: 'Stofnun x',
        title: 'Innsent af:',
        comment: null,
      },
    },
    {
      id: 'a72e9x33-ad8c-4d83-84bf-92e10972kz0f',
      createdAt: '2024-03-13T12:45:48.21Z',
      type: 'assign',
      task: {
        from: 'Ármann',
        to: null,
        title: 'merkir sér málið',
        comment: null,
      },
    },
    {
      id: 'jk85443f-1d10-4c7c-bef3-d1b8dbcld462',
      type: 'comment',
      createdAt: '2024-03-13T12:45:48.21Z',
      task: {
        from: 'Ármann',
        to: null,
        title: 'gerir athugasemd',
        comment:
          'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      },
    },
  ],
}

export const ALL_MOCK_CASES = [
  CASE_SUBMITTED,
  CASE_IN_PROGRESS,
  CASE_IN_REVIEW,
  CASE_READY,
]
