
import { z } from "zod"

export const formSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
})

export type Form = z.infer<typeof formSchema>
