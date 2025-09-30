import { z } from "zod"

export const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  required: z.boolean(),
})

export type Field = z.infer<typeof fieldSchema>
