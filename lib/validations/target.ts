import { z } from 'zod'

export const targetBulkSchema = z.object({
  periode: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format periode tidak valid'),
  items: z.array(
    z.object({
      idSales: z.coerce.number().int().positive(),
      targetOmzet: z.coerce.number().min(0),
    })
  ),
})

export type TargetBulkInput = z.infer<typeof targetBulkSchema>