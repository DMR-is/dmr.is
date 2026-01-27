import * as z from 'zod'

import { createSubscriberInput, updateSubscriberEndDateInput } from '../../../inputs'
import { protectedProcedure, router } from '../trpc'

export const pagingInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
})

export const subscribersRouter = router({
  getSubscribers: protectedProcedure
    .input(
      pagingInput.extend({
        includeInactive: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getSubscribersAdmin({
        page: input.page,
        pageSize: input.pageSize,
        includeInactive: input.includeInactive ? 'true' : 'false',
      })
    }),

  createSubscriber: protectedProcedure
    .input(createSubscriberInput)
    .mutation(async ({ ctx, input }) =>
      ctx.api.createSubscriberAdmin({
        createSubscriberAdminDto: input,
      }),
    ),

  updateSubscriberEndDate: protectedProcedure
    .input(updateSubscriberEndDateInput)
    .mutation(async ({ ctx, input }) =>
      ctx.api.updateSubscriberEndDate({
        subscriberId: input.subscriberId,
        updateSubscriberEndDateDto: {
          subscribedTo: input.subscribedTo,
        },
      }),
    ),

  deactivateSubscriber: protectedProcedure
    .input(z.object({ subscriberId: z.string() }))
    .mutation(async ({ ctx, input }) =>
      ctx.api.deactivateSubscriberAdmin(input),
    ),

  activateSubscriber: protectedProcedure
    .input(z.object({ subscriberId: z.string() }))
    .mutation(async ({ ctx, input }) =>
      ctx.api.activateSubscriberAdmin(input),
    ),
})
