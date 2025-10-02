'use server';

/**
 * @fileOverview An AI agent that suggests specialized compliance questions to include in forms.
 *
 * - suggestComplianceQuestions - A function that suggests compliance questions for a given report type.
 * - SuggestComplianceQuestionsInput - The input type for the suggestComplianceQuestions function.
 * - SuggestComplianceQuestionsOutput - The return type for the suggestComplianceQuestions function.
 */

import {ai, DEFAULT_MODEL} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestComplianceQuestionsInputSchema = z.object({
  reportType: z.string().describe('The type of report requested (e.g., background check, tenant screening).'),
  description: z.string().optional().describe('A description of the person or company to be investigated.'),
});
export type SuggestComplianceQuestionsInput = z.infer<typeof SuggestComplianceQuestionsInputSchema>;

const SuggestComplianceQuestionsOutputSchema = z.object({
  suggestedQuestions: z.array(z.string()).describe('An array of specialized compliance questions to include in the form.'),
});
export type SuggestComplianceQuestionsOutput = z.infer<typeof SuggestComplianceQuestionsOutputSchema>;

export async function suggestComplianceQuestions(input: SuggestComplianceQuestionsInput): Promise<SuggestComplianceQuestionsOutput> {
  return suggestComplianceQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestComplianceQuestionsPrompt',
  input: {schema: SuggestComplianceQuestionsInputSchema},
  output: {schema: SuggestComplianceQuestionsOutputSchema},
  prompt: `You are an AI assistant that suggests specialized compliance questions to include in forms based on the report type requested.

  Given the report type and description below, suggest a list of compliance questions that should be included in the form to improve the quality of the report and make the creation process more efficient.

  Report Type: {{{reportType}}}
  Description: {{{description}}}

  Suggest compliance questions:
  `,
});

const suggestComplianceQuestionsFlow = ai.defineFlow(
  {
    name: 'suggestComplianceQuestionsFlow',
    inputSchema: SuggestComplianceQuestionsInputSchema,
    outputSchema: SuggestComplianceQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: DEFAULT_MODEL });
    return output!;
  }
);
