import * as z from 'zod'

export const baseEntitySchema = z.object({
  id: z.uuid('Auðkenni er nauðsynlegt'),
  title: z.string('Titill tegundar er nauðsynlegur'),
  slug: z.string('Slóð tegundar er nauðsynleg'),
})
