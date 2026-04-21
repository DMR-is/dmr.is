import { mergeRouters } from '../trpc'
import { userRouter } from './userRouter'

export const appRouter = mergeRouters(userRouter)

export type AppRouter = typeof appRouter
