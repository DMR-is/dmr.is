type AdvertTemplateProps = {
  type?: string
  title?: string
  content?: string
  signature?: string
  additions?: string
}

export const advertPdfTemplate = ({
  type,
  title,
  content,
  additions,
  signature,
}: AdvertTemplateProps) => {
  const typeMarkup = type
    ? `<p align="center" style="margin-bottom: 0;">${type.toUpperCase()}</p>`
    : ''
  const titleMarkup = title
    ? `<p align="center"><strong>${title}</strong></p>`
    : ''

  return `
    ${typeMarkup}
    ${titleMarkup}
    ${content}
    ${additions}
    ${signature}
  `
}
