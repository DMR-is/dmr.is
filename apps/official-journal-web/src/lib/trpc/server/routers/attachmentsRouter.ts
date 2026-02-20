import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const attachmentsRouter = router({
  createAttachment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        createAdvertAppendixBody: z.object({
          title: z.string(),
          content: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.createAdvertAppendix(input)
    }),

  deleteAttachment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        additionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteAdvertAppendix({
        id: input.id,
        deleteAdvertAppendixBody: {
          additionId: input.additionId,
        },
      })
    }),

  updateAttachment: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        attachmentId: z.string(),
        fileName: z.string(),
        originalFileName: z.string(),
        fileFormat: z.string(),
        fileExtension: z.string(),
        fileLocation: z.string(),
        fileSize: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { caseId, attachmentId, ...fileData } = input
      return ctx.api.overwriteCaseAttachment({
        caseId,
        attachmentId,
        postApplicationAttachmentBody: fileData,
      })
    }),

  uploadAssets: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        key: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.api.uploadApplicationAttachment({
        caseId: input.caseId,
        postApplicationAssetBody: {
          key: input.key,
        },
      })

      return {
        url: response.url,
        cdn: process.env.ADVERTS_CDN_URL,
      }
    }),
})
