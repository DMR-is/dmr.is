import { AdvertLean } from '@dmr.is/shared/dto'
import { formatAnyDate } from '@dmr.is/utils'

export const AdvertsToRss = (
  adverts: Array<AdvertLean>,
  department?: string,
): string => {
  const items = adverts.map((advert) => {
    return `
      <item>
        <title>${advert.department?.title ?? ''} ${advert.publicationNumber?.full}</title>
        <description>${advert.title}</description>
        <pubDate>${
          advert.publicationDate ? formatAnyDate(advert.publicationDate) : ''
        }</pubDate>
        <link>https://www.island.is/stjornartidindi/nr/${advert.id}</link>
        <guid>https://www.island.is/stjornartidindi/nr/${advert.id}</guid>
      </item>
    `
  })

  return `
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
      <atom:link href="https://api.stjornartidindi.is/api/v1/rss/${department}" rel="self" type="application/rss+xml" />
        <title>Stjórnartíðindi - ${department}</title>
        <link>https://api.stjornartidindi.is/api/v1/rss/${department}</link>
        <description>Stjórnartíðindi</description>
        ${items.join('')}
      </channel>
    </rss>
  `
}
