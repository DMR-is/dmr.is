import slugify from 'slugify'

export function slugit(str: string) {
  try {
    const slug = slugify(str, { lower: true })
    return slug
  } catch (e) {
    throw new Error(`Error generating slug for: ${str}`)
  }
}
