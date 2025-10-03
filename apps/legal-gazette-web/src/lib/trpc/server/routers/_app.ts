import { createCallerFactory, mergeRouters } from '..'
import { advertsRouter } from './advertsRouter'
import { testRouter } from './testRouter'
export const appRouter = mergeRouters(advertsRouter, testRouter)

const createCaller = createCallerFactory(appRouter)

export { createCaller }
// export type definition of API
export type AppRouter = typeof appRouter
