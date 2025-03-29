import { Advert } from '../../../../libs/official-journal/modules/advert/src/lib/dto/advert.dto'

export const AdvertsToRss = (
  adverts: Array<Advert>,
  department?: string,
): string => {
  const items = adverts.map((advert) => {
    return `
      <item>
        <title>${advert.title}</title>
        <link>https://www.island.is/stjornartidindi/nr/${advert.id}</link>
        <description>${advert.subject}</description>
        <guid>https://www.island.is/stjornartidindi/nr/${advert.id}</guid>
        <pubDate>${
          advert.publicationDate &&
          new Date(advert.publicationDate).toUTCString()
        }</pubDate>
      </item>
    `
  })

  return `
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
      <atom:link href="https://www.island.is/stjornartidindi/rss/${department}" rel="self" type="application/rss+xml" />
        <title>Stjórnartíðindi - ${department}</title>
        <link>https://www.island.is/stjornartidindi/rss/${department}</link>
        <description>Stjórnartíðindi</description>
        ${items.join('')}
      </channel>
    </rss>
  `
}
