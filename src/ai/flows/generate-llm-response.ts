'use server';
/**
 * @fileOverview An LLM response generator.
 *
 * - generateLLMResponse - A function that generates a response from an LLM based on a question, persona, and action.
 * - GenerateLLMResponseInput - The input type for the generateLLMResponse function.
 * - GenerateLLMResponseOutput - The return type for the generateLLMResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLLMResponseInputSchema = z.object({
  question: z.string().describe('The question asked by the contestant.'),
  persona: z.string().describe('The selected persona for the response.'),
  action: z.string().describe('The selected action for the response.'),
});
export type GenerateLLMResponseInput = z.infer<
  typeof GenerateLLMResponseInputSchema
>;

const GenerateLLMResponseOutputSchema = z.object({
  response: z.string().describe('The generated response from the LLM.'),
});
export type GenerateLLMResponseOutput = z.infer<
  typeof GenerateLLMResponseOutputSchema
>;

export async function generateLLMResponse(
  input: GenerateLLMResponseInput
): Promise<GenerateLLMResponseOutput> {
  return generateLLMResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLLMResponsePrompt',
  input: {schema: GenerateLLMResponseInputSchema},
  output: {schema: GenerateLLMResponseOutputSchema},
  prompt: `You are an LLM participating in a game. A contestant has asked a question and you must generate a short answer incorporating the selected persona and action. Portray characteristics from multiple personas or actions from the relevant pools.

Question: {{{question}}}
Persona: {{{persona}}}
Action: {{{action}}}

Response:`,
});

const generateLLMResponseFlow = ai.defineFlow(
  {
    name: 'generateLLMResponseFlow',
    inputSchema: GenerateLLMResponseInputSchema,
    outputSchema: GenerateLLMResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
