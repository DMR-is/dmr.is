import { JournalSignatureType } from '../dto/journal-constants.dto'
import { JournalSignature } from '../dto/signatures/journal-signature.dto'

export const ALL_SIGNATURES_MOCK: JournalSignature[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    type: JournalSignatureType.Regular,
    additionalSignature: '',
    signature: {
      items: [
        {
          // maybe add id here too?
          date: '2024-01-01T09:00:00Z',
          institution: 'Borgarstjórn Reykjavíkur',
          members: [
            {
              name: 'Dagur B. Eggertsson',
              textBelow: 'borgarstjóri',
              textAfter: null,
              textAbove: null,
            },
            {
              name: 'Anna Tryggvadóttir',
              textBelow: 'formaður',
              textAfter: null,
              textAbove: null,
            },
            {
              name: 'Páll Halldórsson',
              textBelow: 'skrifstofustjóri',
              textAfter: null,
              textAbove: null,
            },
          ],
        },
      ],
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    additionalSignature: '',
    type: JournalSignatureType.Committee,

    signature: {
      // maybe add id here too ?
      institution: 'Borgarstjórn Reykjavíkur',
      date: '2024-01-01T09:00:00Z',
      chairman: {
        name: 'Dagur B. Eggertsson',
        textBelow: 'borgarstjóri',
        textAfter: null,
        textAbove: null,
      },
      memebers: [
        {
          name: 'Anna Tryggvadóttir',
          textBelow: 'formaður',
        },
        {
          name: 'Páll Halldórsson',
          textBelow: 'skrifstofustjóri',
        },
      ],
    },
  },
]
