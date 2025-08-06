import { z } from 'zod'

export const bankruptcyAdvertSchema = z.object({
  courtId: z.string().min(1, 'Réttardómstóll er nauðsynlegur'),
  judgementDate: z.date(),
  additionalText: z.string().optional(),
})

export const bankruptcySettlementSchema = z.object({
  name: z.string().min(1, 'Nafn bús er nauðsynlegt'),
  nationalId: z.string().min(1, 'Kennitala bús er nauðsynleg'),
  address: z.string().min(1, 'Heimilisfang bús er nauðsynlegt'),
  deadline: z.date().refine((date) => {
    const today = new Date()
    return date >= today
  }, 'Frestur til að skila kröfum verður að vera í framtíðinni'),
})

export const liquidatorSchema = z.object({
  name: z.string().min(1, 'Nafn skiptastjóra er nauðsynlegt'),
  location: z.string().min(1, 'Staðsetning skiptastjóra er nauðsynleg'),
  onBehalfOf: z.string().optional(),
})

export const bankruptcyDivisionMeetingsSchema = z.object({
  date: z.date().refine((date) => {
    const today = new Date()
    return date >= today
  }, 'Dagsetning fundar verður að vera í framtíðinni'),
  location: z.string().min(1, 'Staðsetning fundar er nauðsynleg'),
})

export const bankruptcySignatureSchema = z.object({
  date: z.date(),
  location: z.string().min(1, 'Staðsetning undirritunar er nauðsynleg'),
})

export const bankruptcyPublishingSchema = z
  .array(z.date())
  .refine(
    (dates) => dates.length > 0,
    'Að minnsta kosti ein dagsetning fyrir birtingu er nauðsynleg',
  )

export const bankruptcyApplicationSchema = z.object({
  advert: bankruptcyAdvertSchema,
  settlement: bankruptcySettlementSchema,
  liquidator: liquidatorSchema,
  divisionMeetings: z.array(bankruptcyDivisionMeetingsSchema).optional(),
  signature: bankruptcySignatureSchema,
  publishing: bankruptcyPublishingSchema,
})
