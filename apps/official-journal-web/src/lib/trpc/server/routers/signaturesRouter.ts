import { z } from 'zod'

import { CreateSignatureMemberMemberTypeEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

export const signaturesRouter = router({
  getSignature: protectedProcedure
    .input(z.object({ signatureId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getSignature({ signatureId: input.signatureId })
    }),

  updateSignatureDisplay: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        hide: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateCaseSignatureDateDisplay({
        id: input.id,
        updateCaseSignatureDateDisplayBody: {
          hide: input.hide,
        },
      })
    }),

  createSignatureRecord: protectedProcedure
    .input(z.object({ signatureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.createSignatureRecord({
        signatureId: input.signatureId,
      })
    }),

  updateSignatureRecord: protectedProcedure
    .input(
      z.object({
        signatureId: z.string(),
        recordId: z.string(),
        institution: z.string().optional(),
        signatureDate: z.string().optional(),
        additional: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { signatureId, recordId, ...updateData } = input
      await ctx.api.updateSignatureRecord({
        signatureId,
        recordId,
        updateSignatureRecord: updateData,
      })
    }),

  deleteSignatureRecord: protectedProcedure
    .input(
      z.object({
        signatureId: z.string(),
        recordId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteSignatureRecord({
        signatureId: input.signatureId,
        recordId: input.recordId,
      })
    }),

  addSignatureMember: protectedProcedure
    .input(
      z.object({
        signatureId: z.string(),
        recordId: z.string(),
        memberType: z.nativeEnum(CreateSignatureMemberMemberTypeEnum),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.createSignatureMember({
        signatureId: input.signatureId,
        recordId: input.recordId,
        memberType: input.memberType,
      })
    }),

  updateSignatureMember: protectedProcedure
    .input(
      z.object({
        signatureId: z.string(),
        recordId: z.string(),
        memberId: z.string(),
        name: z.string().optional(),
        textAbove: z.string().optional(),
        textBelow: z.string().optional(),
        textBefore: z.string().optional(),
        textAfter: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { signatureId, recordId, memberId, ...updateData } = input
      await ctx.api.updateSignatureMember({
        signatureId,
        recordId,
        memberId,
        updateSignatureMember: updateData,
      })
    }),

  deleteSignatureMember: protectedProcedure
    .input(
      z.object({
        signatureId: z.string(),
        recordId: z.string(),
        memberId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteSignatureMember({
        signatureId: input.signatureId,
        recordId: input.recordId,
        memberId: input.memberId,
      })
    }),
})
