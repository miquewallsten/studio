
'use server';

/**
 * @fileOverview An AI agent that suggests specialized compliance questions to include in forms.
 *
 * - suggestComplianceQuestions - A function that suggests compliance questions for a given report type.
 */

import { generateText } from '@/ai/genkit';

export type SuggestComplianceQuestionsInput = {
  reportType: string;
  description?: string;
};

export type SuggestComplianceQuestionsOutput = {
  suggestedQuestions: string[];
};

export async function suggestComplianceQuestions(input: SuggestComplianceQuestionsInput): Promise<SuggestComplianceQuestionsOutput> {
    const prompt = `You are an AI assistant that suggests specialized compliance questions to include in forms based on the report type requested.

  Given the report type and description below, suggest a list of 3-5 compliance questions that should be included in the form to improve the quality of the report and make the creation process more efficient.
  Return *only* a JSON object with a "suggestedQuestions" key containing an array of strings. Do not add any other text, markdown, or explanation.

  Report Type: ${input.reportType}
  Description: ${input.description}
  `;
  
  const response = await generateText(prompt);
  
  try {
      // Clean the response to ensure it's valid JSON
      const jsonResponse = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonResponse);
      return parsed;
  } catch (e) {
      console.error("Failed to parse AI response for compliance questions:", e);
      // Fallback in case of parsing error
      return { suggestedQuestions: [] };
  }
}
