import { z } from "zod"

const subFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  required: z.boolean(),
});

export const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  required: z.boolean(),
  subFields: z.array(subFieldSchema).optional(),
  aiInstructions: z.string().optional(),
  internalFields: z.array(subFieldSchema).optional(),
})

export type Field = z.infer<typeof fieldSchema>
