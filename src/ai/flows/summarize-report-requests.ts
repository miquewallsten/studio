'use server';

/**
 * @fileOverview A flow that summarizes client report requests for analyst managers.
 *
 * - summarizeReportRequests - A function that summarizes client report requests.
 * - SummarizeReportRequestsInput - The input type for the summarizeReportRequests function.
 * - SummarizeReportRequestsOutput - The return type for the summarizeReportRequests function.
 */

import {ai, DEFAULT_MODEL} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeReportRequestsInputSchema = z.object({
  requestDetails: z
    .string()
    .describe('Details of the report request, including client information, report type, and any specific instructions.'),
});
export type SummarizeReportRequestsInput = z.infer<typeof SummarizeReportRequestsInputSchema>;

const SummarizeReportRequestsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the report request.'),
});
export type SummarizeReportRequestsOutput = z.infer<typeof SummarizeReportRequestsOutputSchema>;

export async function summarizeReportRequests(input: SummarizeReportRequestsInput): Promise<SummarizeReportRequestsOutput> {
  return summarizeReportRequestsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeReportRequestsPrompt',
  input: {schema: SummarizeReportRequestsInputSchema},
  output: {schema: SummarizeReportRequestsOutputSchema},
  prompt: `You are an assistant to an analyst manager. Your job is to summarize report requests so that the manager can quickly understand the request and assign it to the appropriate analyst.

  Here are the details of the report request:
  {{requestDetails}}

  Please provide a concise summary.`,  
  model: DEFAULT_MODEL,
});

const summarizeReportRequestsFlow = ai.defineFlow(
  {
    name: 'summarizeReportRequestsFlow',
    inputSchema: SummarizeReportRequestsInputSchema,
    outputSchema: SummarizeReportRequestsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
