import * as z from 'zod'

export const DMRSequelizeConfigSchema = z.object({
  username: z.string(),
  password: z.string(),
  database: z.string(),
  host: z.string(),
  port: z.number().optional(),
  clsNamespace: z.string().optional(),
  models: z.array(z.any()).optional(),
  debugLog: z.boolean().optional(),
})

export interface DMRSequelizeConfig
  extends z.infer<typeof DMRSequelizeConfigSchema> {}

export const IDMRSequelizeConfig = 'IDMRSequelizeConfig'
