import z from 'zod'

import { protectedProcedure, router } from '../trpc'

export const getTbrSettingsInput = z.object({
  search: z.string().optional(),
  activeOnly: z.boolean().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
})

export const createTbrSettingInput = z.object({
  name: z.string(),
  nationalId: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
})

export const idInput = z.object({
  id: z.string(),
})

export const updateTbrSettingInput = createTbrSettingInput
  .extend(idInput.shape)
  .partial()
  .required({ id: true })

export const toggleTbrSettingStatusInput = idInput.extend({
  isActive: z.boolean(),
})

export const tbrSettingsRouter = router({
  getTbrSettings: protectedProcedure
    .input(getTbrSettingsInput)
    .query(
      async ({ ctx, input }) => await ctx.api.getTBRCompanySettings(input),
    ),
  createTbrSetting: protectedProcedure.input(createTbrSettingInput).mutation(
    async ({ ctx, input }) =>
      await ctx.api.createTBRCompanySettings({
        createTBRCompanySettingsDto: input,
      }),
  ),
  updateTbrSetting: protectedProcedure
    .input(updateTbrSettingInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      return await ctx.api.updateTBRCompanySettings({
        id: id,
        updateTbrCompanySettingsDto: updateData,
      })
    }),
  deleteTbrSetting: protectedProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.deleteTBRCompanySettings({ id: input.id })
    }),
  toggleSettingStatus: protectedProcedure
    .input(toggleTbrSettingStatusInput)
    .mutation(async ({ ctx, input }) => {
      if (input.isActive) {
        return await ctx.api.activateTBRCompanySettings({ id: input.id })
      } else {
        return await ctx.api.deactivateTBRCompanySettings({ id: input.id })
      }
    }),
})
