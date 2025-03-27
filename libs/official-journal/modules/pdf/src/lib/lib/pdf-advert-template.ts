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
  return `
    <div class="regulation__prefix">${type?.toUpperCase()}</div>
    <h1 class="regulation__title">${title}</h1>
    <div class="regulation__text">
      ${content}
      <section class="regulation__signature">
        ${signature}
      </section>
    </div>
    <div class="appendixes">
      ${additions}
    </div>
  `
}
