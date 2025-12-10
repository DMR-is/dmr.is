import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getChannelsSchema = z.object({ advertId: z.uuid() })

const createCommunicationChannelSchema = z.object({
  advertId: z.uuid(),
  email: z.email(),
  name: z.string().optional(),
  phone: z.string().optional(),
})

const updateCommunicationChannelSchema = z.object({
  advertId: z.uuid(),
  channelId: z.uuid(),
  email: z.email().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
})

const deleteCommunicationChannelSchema = z.object({
  advertId: z.uuid(),
  channelId: z.uuid(),
})

export const channelsRouter = router({
  getChannels: protectedProcedure
    .input(getChannelsSchema)
    .query(async ({ input, ctx }) => {
      return await ctx.api.getCommunicationChannels(input)
    }),
  createChannel: protectedProcedure
    .input(createCommunicationChannelSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.api.createCommunicationChannel({
        advertId: input.advertId,
        createCommunicationChannelDto: {
          email: input.email,
          name: input.name,
          phone: input.phone,
        },
      })
    }),
  updateChannel: protectedProcedure
    .input(updateCommunicationChannelSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.api.updateCommunicationChannel({
        advertId: input.advertId,
        channelId: input.channelId,
        updateCommunicationChannelDto: {
          email: input.email,
          name: input.name,
          phone: input.phone,
        },
      })
    }),
  deleteChannel: protectedProcedure
    .input(deleteCommunicationChannelSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.api.deleteCommunicationChannel({
        advertId: input.advertId,
        channelId: input.channelId,
      })
    }),
})
