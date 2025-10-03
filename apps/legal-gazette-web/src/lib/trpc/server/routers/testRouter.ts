import { publicProcedure, router } from '..'

export const testRouter = router({
  getTest: publicProcedure.query(async ({ ctx }) => {
    return {
      success: true,
      message: 'Whoop2',
    }
  }),
})
