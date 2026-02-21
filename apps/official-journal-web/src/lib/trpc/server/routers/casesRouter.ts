import { z } from 'zod'

import { CaseStatusEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

export const casesRouter = router({
  getCase: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getCase({ id: input.id })
    }),

  getCases: protectedProcedure
    .input(
      z.object({
        id: z.array(z.string()).optional(),
        applicationId: z.string().optional(),
        search: z.string().optional(),
        year: z.number().optional(),
        status: z.array(z.string()).optional(),
        department: z.array(z.string()).optional(),
        type: z.array(z.string()).optional(),
        category: z.array(z.string()).optional(),
        employeeId: z.string().optional(),
        published: z.boolean().optional(),
        fastTrack: z.boolean().optional(),
        institution: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
        sortBy: z.string().optional(),
        direction: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getCases(input)
    }),

  rejectCase: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.rejectCase({ id: input.id })
    }),

  unpublishCase: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.unpublish({ id: input.id })
    }),

  updateNextStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateNextStatus({ id: input.id })
    }),

  updatePreviousStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updatePreviousStatus({ id: input.id })
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        statusId: z.nativeEnum(CaseStatusEnum),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateCaseStatus({
        id: input.id,
        updateCaseStatusBody: {
          status: input.statusId,
        },
      })
    }),

  updateAdvertHtml: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        advertHtml: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateAdvertHtml({
        id: input.id,
        updateAdvertHtmlBody: {
          advertHtml: input.advertHtml,
        },
      })
    }),

  updateAdvertWithCorrection: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        title: z.string(),
        description: z.string(),
        advertHtml: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { caseId, ...rest } = input
      await ctx.api.updateCaseAndAddCorrection({
        id: caseId,
        updateAdvertHtmlCorrection: rest,
      })
    }),

  updateCategories: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        categoryIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateCategories({
        id: input.id,
        updateCategoriesBody: {
          categoryIds: input.categoryIds,
        },
      })
    }),

  updateDepartment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        departmentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateDepartment({
        id: input.id,
        updateCaseDepartmentBody: {
          departmentId: input.departmentId,
        },
      })
    }),

  updateEmployee: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.assignEmployee({
        id: input.id,
        userId: input.userId,
      })
    }),

  updateFasttrack: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fastTrack: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateFasttrack({
        id: input.id,
        updateFasttrackBody: {
          fasttrack: input.fastTrack,
        },
      })
    }),

  updatePrice: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        imageTier: z.string().optional(),
        customBaseDocumentCount: z.number().optional(),
        customAdditionalDocCount: z.number().optional(),
        customBodyLengthCount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...priceBody } = input
      await ctx.api.updatePrice({
        id,
        updateCasePriceBody: priceBody,
      })
    }),

  updatePublishDate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updatePublishDate({
        id: input.id,
        updatePublishDateBody: {
          date: input.date,
        },
      })
    }),

  updateTag: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateTag({
        id: input.id,
        updateTagBody: {
          tagId: input.tagId,
        },
      })
    }),

  updateTitle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateTitle({
        id: input.id,
        updateTitleBody: {
          title: input.title,
        },
      })
    }),

  updateType: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        typeId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateCaseType({
        id: input.id,
        updateCaseTypeBody: {
          typeId: input.typeId,
        },
      })
    }),

  previewPdf: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const pdfBlob = await ctx.api.getCasePdfPreview({ id: input.id })
      const buffer = await pdfBlob.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return { pdf: base64 }
    }),

  updateCommunicationStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        statusId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateCommunicationStatus({
        id: input.id,
        updateCommunicationStatusBody: {
          statusId: input.statusId,
        },
      })
    }),

  migrateAdvertToCase: protectedProcedure
    .input(z.object({ advertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.createCaseFromAdvert({ advertId: input.advertId })
    }),

  getDepartments: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getDepartments(input)
    }),

  getTags: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getTags()
  }),

  getFeeCodes: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getFeeCodes()
  }),

  getAdvert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getAdvert({ id: input.id })
    }),
})
