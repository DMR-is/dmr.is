import { publicProcedure, router } from '..'

export const advertsRouter = router({
  getAdverts: publicProcedure.query(async ({ ctx }) => {
    return {
      success: true,
      message: 'Whoop',
    }
  }),
})
