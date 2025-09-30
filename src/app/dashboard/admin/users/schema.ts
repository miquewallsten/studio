import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const userSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  phone: z.string().optional(),
  disabled: z.boolean(),
  tenantId: z.string().optional(),
  tenantName: z.string().nullable().optional(),
  role: z.string(),
  createdAt: z.string(),
})

export type User = z.infer<typeof userSchema>
