import Kennitala from 'kennitala'
import z from 'zod'

import { LegalEntityDto } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

import { TRPCError } from '@trpc/server'

const getPersonByNationalIdInputSchema = z.object({
  nationalId: z
    .string()
    .min(10, 'National ID must be 10 characters')
    .max(10, 'National ID must be 10 characters'),
})

export const nationalRegistryRouter = router({
  getLegalEntityNameByNationalId: protectedProcedure
    .input(getPersonByNationalIdInputSchema)
    .mutation(async ({ input, ctx }): Promise<string> => {
      const { nationalId } = input

      if (!Kennitala.isValid(nationalId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid national ID format',
        })
      }

      const isPerson = Kennitala.isPerson(nationalId)

      if (isPerson) {
        const person = await ctx.api.getPersonByNationalId({ nationalId })

        if (person.person === null) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Person not found',
          })
        }

        return person.person.nafn
      }

      const company = await ctx.api.getCompanyByNationalId({ nationalId })

      if (company.legalEntity === null) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      return company.legalEntity.name
    }),
  getPersonByNationalId: protectedProcedure
    .input(getPersonByNationalIdInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { nationalId } = input

      const person = await ctx.api.getPersonByNationalId({ nationalId })

      return person
    }),
  getCompanyByNationalId: protectedProcedure
    .input(getPersonByNationalIdInputSchema)
    .mutation(async ({ input, ctx }): Promise<LegalEntityDto> => {
      const { nationalId } = input

      const company = await ctx.api.getCompanyByNationalId({ nationalId })

      if (company.legalEntity === null) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
      }

      return company.legalEntity
    }),
})
