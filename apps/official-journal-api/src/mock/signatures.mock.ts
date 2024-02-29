import { JournalSignatureType } from '../dto/journal-constants.dto'
import { JournalSignature } from '../dto/signatures/journal-signature.dto'

export const ALL_MOCK_SIGNATURES: JournalSignature[] = [
  {
    id: 'bd7238ee-5e7c-48c9-9185-94a3cec31836',
    type: JournalSignatureType.Regular,
    additional: 'Laufey Helga Guðmundsdóttir',
    advertId: 'bcbefaf4-c021-4b63-877b-001dde880052',
    data: [
      {
        institution: 'Borgarstjórn Reykjavíkur',
        date: '2021-10-17 00:00:00.0000',
        members: [
          {
            isChairman: false,
            name: 'Dagur B. Eggertsson',
            textBelow: 'borgarstjóri',
            textAfter: null,
            textAbove: null,
          },
          {
            isChairman: false,
            name: 'Anna Tryggvadóttir',
            textBelow: 'formaður',
            textAfter: null,
            textAbove: null,
          },
          {
            isChairman: false,
            name: 'Páll Halldórsson',
            textBelow: 'skrifstofustjóri',
            textAfter: null,
            textAbove: null,
          },
        ],
      },
    ],
  },
  {
    id: '12f4feb6-efef-43ea-897b-b1d66462f8cb',
    type: JournalSignatureType.Committee,
    additional: 'Rannveig Júníusdóttir',
    advertId: '749f1eff-236d-4c67-a4cc-eb7a7bbd373f',
    data: [
      {
        institution: 'Landsstjórn',
        date: '2024-02-13 00:00:00.0000',
        members: [
          {
            isChairman: true,
            name: 'Guðni Th. Jóhannesson',
            textBelow: 'forseti',
            textAfter: null,
            textAbove: null,
          },
          {
            isChairman: false,
            name: 'Katrin Jakobsdóttir',
            textBelow: 'forsætisráðherra',
            textAfter: null,
            textAbove: null,
          },
          {
            isChairman: false,
            name: 'Bjarni Benediktsson',
            textBelow: 'fjármálaráðherra',
            textAfter: null,
            textAbove: null,
          },
        ],
      },
    ],
  },
]
