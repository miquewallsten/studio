
import { z } from "zod"

export const ticketSchema = z.object({
  id: z.string(),
  subjectName: z.string(),
  reportType: z.string(),
  status: z.enum(['New', 'In Progress', 'Pending Review', 'Completed']),
  createdAt: z.string(),
  clientEmail: z.string(),
  assignedAnalystId: z.string().optional().nullable(),
})

export type Ticket = z.infer<typeof ticketSchema>
