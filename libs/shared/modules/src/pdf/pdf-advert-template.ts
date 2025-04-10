type AdvertTemplateProps = {
  type?: string
  title?: string
  content?: string
  signature?: string
  additions?: string
  hiddenSignature?: boolean
  subSignature?: string
}

export const advertPdfTemplate = ({
  type,
  title,
  content,
  additions,
  signature,
  hiddenSignature,
  subSignature,
}: AdvertTemplateProps) => {
  return `
    <div class="regulation__prefix">${type?.toUpperCase()}</div>
    <h1 class="regulation__title">${title}</h1>
    <div class="regulation__text">
      ${content}
      <section class="regulation__signature${hiddenSignature ? ' hidden' : ''}">
        ${signature}
        ${subSignature ?? ''}
      </section>
    </div>
    ${
      additions
        ? `
    <div class="appendixes">
      ${additions}
    </div>`
        : ''
    }
  `
}
