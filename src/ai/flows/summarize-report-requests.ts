
'use server';

/**
 * @fileOverview A flow that summarizes client report requests for analyst managers.
 *
 * - summarizeReportRequests - A function that summarizes client report requests.
 */

import { generateText } from '@/ai/genkit';

export type SummarizeReportRequestsInput = {
  requestDetails: string;
};

export type SummarizeReportRequestsOutput = {
  summary: string;
};

export async function summarizeReportRequests(input: SummarizeReportRequestsInput): Promise<SummarizeReportRequestsOutput> {
  const prompt = `You are an assistant to an analyst manager. Your job is to summarize report requests so that the manager can quickly understand the request and assign it to the appropriate analyst.
  Provide only a concise summary in plain text. Do not add a preamble or any extra formatting.

  Here are the details of the report request:
  ${input.requestDetails}
  `;
  
  const summary = await generateText(prompt);
  return { summary };
}
