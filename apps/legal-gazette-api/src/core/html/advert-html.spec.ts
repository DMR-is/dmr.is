import type { AdvertModel } from '../../models/advert.model'
import { AdvertTemplateType } from '../../models/advert.model'
import { AdvertVersionEnum } from '../../models/advert-publication.model'
import { formatCompanyAnnouncement } from '../../modules/external-systems/company/utils'
import { getAdvertHtmlMarkup, PENDING_PUBLICATION_NUMBER } from './advert-html'

const JUDGEMENT_DATE = new Date('2026-05-06T00:00:00.000Z')
// "kl. 14:00" as the applicant typed it, anchored at the Reykjavik wall clock
const MEETING_DATE = new Date('2026-06-10T14:00:00.000Z')

const buildAdvert = (templateType: AdvertTemplateType) =>
  ({
    additionalText: null,
    content: '<p>Skiptum lauk</p>',
    courtDistrict: { possessiveTitle: 'Héraðsdóms Reykjavíkur' },
    divisionMeetingDate: MEETING_DATE,
    divisionMeetingLocation: 'Skrifstofu skiptastjóra',
    judgementDate: JUDGEMENT_DATE,
    publicationNumber: '1',
    publications: [
      {
        versionLetter: AdvertVersionEnum.A,
        publishedAt: new Date('2026-08-03T08:00:00.000Z'),
        scheduledAt: new Date('2026-08-03T08:00:00.000Z'),
      },
    ],
    settlement: {
      address: 'Einhversstaðar 1',
      deadline: new Date('2026-04-28T00:00:00.000Z'),
      endingDate: new Date('2026-07-30T00:00:00.000Z'),
      liquidatorLocation: 'Reykjavík',
      liquidatorName: 'Lögmaður',
      name: 'Þrotabú ehf.',
      nationalId: '1234567890',
    },
    signature: null,
    templateType,
    title: 'Auglýsing',
  }) as unknown as AdvertModel

/**
 * The Innkollun and the Skiptalok name the same urskurdardagur, but they are
 * rendered at different moments and the division-ending branch hands the
 * template a string where the recall branch hands it a Date. They must still
 * agree, whatever timezone the API process happens to run in.
 */
describe('getAdvertHtmlMarkup', () => {
  it('names the same ruling date in the Innkollun and the Skiptalok', () => {
    const recall = getAdvertHtmlMarkup(
      buildAdvert(AdvertTemplateType.RECALL_BANKRUPTCY),
    )
    const divisionEnding = getAdvertHtmlMarkup(
      buildAdvert(AdvertTemplateType.DIVISION_ENDING),
    )

    expect(recall).toContain('uppkveðnum 6. maí 2026')
    expect(divisionEnding).toContain('uppkveðnum 6. maí 2026')
  })
})

/**
 * Reported by a lawyer filing from abroad: he entered a skiptafundur time and
 * the advert published a different one. The advert must print the clock face
 * that was stored, whatever timezone the rendering process is in.
 */
describe('getAdvertHtmlMarkup, division meeting time', () => {
  it('prints the stored clock face for the skiptafundur', () => {
    const divisionMeeting = getAdvertHtmlMarkup(
      buildAdvert(AdvertTemplateType.DIVISION_MEETING_BANKRUPTCY),
    )

    expect(divisionMeeting).toContain('kl. 14:00')
  })

  it('prints the same time in the Innkollun that carries the meeting', () => {
    const recall = getAdvertHtmlMarkup(
      buildAdvert(AdvertTemplateType.RECALL_BANKRUPTCY),
    )

    expect(recall).toContain('kl. 14:00')
  })
})

/**
 * Production: an aukatilkynning was published and the PDF still read
 * "(Reiknast við útgáfu)-001". The per-company numbers are written into the
 * content at creation, before the advert has a publication number, so the
 * render has to fill them in.
 */
describe('getAdvertHtmlMarkup, additional announcement numbers', () => {
  const buildAnnouncement = (publicationNumber: string | null) =>
    ({
      ...buildAdvert(AdvertTemplateType.ADDITIONAL_ANNOUNCEMENT),
      content: formatCompanyAnnouncement({
        index: 1,
        name: 'A ehf.',
        nationalId: '',
        location: '',
        items: [],
      }),
      publicationNumber,
    }) as unknown as AdvertModel

  it('replaces the placeholder with the publication number', () => {
    const html = getAdvertHtmlMarkup(buildAnnouncement('20260922001'))

    expect(html).toContain('20260922001-001')
    expect(html).not.toContain(PENDING_PUBLICATION_NUMBER)
  })

  it('keeps the placeholder until a number is assigned', () => {
    const html = getAdvertHtmlMarkup(buildAnnouncement(null))

    expect(html).toContain(`${PENDING_PUBLICATION_NUMBER}-001`)
  })
})
