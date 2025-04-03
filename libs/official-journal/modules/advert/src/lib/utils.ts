import { Advert } from './dto/advert.dto'

export function removeSubjectFromHtml(html: string, subject: string): string {
  // Remove the subject from the html
  //what if all spaces are newlines?

  let newHtml = html.replace(subject, '')

  //check if subject has newlines and replace
  //replace newline
  newHtml = newHtml.replace(new RegExp(subject.replace(/ /g, '\n'), 'g'), ' ')
  return newHtml
}

export const advertsToRss = (
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
      <atom:link href="https://api.stjornartidindi.is/api/v1/rss/${department}" rel="self" type="application/rss+xml" />
        <title>Stjórnartíðindi - ${department}</title>
        <link>https://api.stjornartidindi.is/api/v1/rss/${department}</link>
        <description>Stjórnartíðindi</description>
        ${items.join('')}
      </channel>
    </rss>
  `
}
