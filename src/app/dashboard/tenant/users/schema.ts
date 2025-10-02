import { z } from "zod"

export const userSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  role: z.string(),
  createdAt: z.string(),
})

export type User = z.infer<typeof userSchema>
