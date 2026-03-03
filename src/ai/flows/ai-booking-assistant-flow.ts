'use server';
/**
 * @fileOverview An AI assistant for streamlining delivery booking creation.
 *
 * - aiBookingAssistant - A function that leverages AI to suggest optimal details and auto-complete booking information.
 * - AiBookingAssistantInput - The input type for the aiBookingAssistant function.
 * - AiBookingAssistantOutput - The return type for the aiBookingAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiBookingAssistantInputSchema = z.object({
  pickupAddress: z.string().describe('The full pickup address for the delivery.'),
  deliveryAddress: z.string().describe('The full delivery address for the delivery.'),
  itemDescription: z.string().describe('A detailed description of the item(s) being shipped.'),
});
export type AiBookingAssistantInput = z.infer<typeof AiBookingAssistantInputSchema>;

const AiBookingAssistantOutputSchema = z.object({
  packageType: z
    .string()
    .describe(
      'Suggested package type (e.g., "Small Parcel", "Document", "Medium Box", "Large Crate") based on item description.'
    ),
  estimatedWeightKg: z
    .number()
    .describe('Estimated weight of the package in kilograms (e.g., 0.5, 2.3, 15.0) based on item description.'),
  recommendedDeliveryWindow: z
    .string()
    .describe(
      'Recommended delivery time window (e.g., "Same Day (within 3 hours)", "Next Business Day (9AM-5PM)", "2-3 Business Days", "Custom Window (specify)") based on pickup/delivery addresses and item type.'
    ),
});
export type AiBookingAssistantOutput = z.infer<typeof AiBookingAssistantOutputSchema>;

export async function aiBookingAssistant(
  input: AiBookingAssistantInput
): Promise<AiBookingAssistantOutput> {
  return aiBookingAssistantFlow(input);
}

const aiBookingAssistantPrompt = ai.definePrompt({
  name: 'aiBookingAssistantPrompt',
  input: { schema: AiBookingAssistantInputSchema },
  output: { schema: AiBookingAssistantOutputSchema },
  prompt: `You are an intelligent booking assistant for "Lean On Delivery Services" (LODS).
Your task is to analyze the provided booking details and suggest optimal values for package type, estimated weight, and a recommended delivery window.

Consider the following information:
Pickup Address: {{{pickupAddress}}}
Delivery Address: {{{deliveryAddress}}}
Item Description: {{{itemDescription}}}

Based on this information, provide the best suggestions for the delivery.
- For packageType, choose a common classification like "Small Parcel", "Document", "Medium Box", "Large Crate".
- For estimatedWeightKg, provide a numerical value in kilograms.
- For recommendedDeliveryWindow, suggest a realistic window such as "Same Day (within 3 hours)", "Next Business Day (9AM-5PM)", "2-3 Business Days", "Custom Window (specify)".`,
});

const aiBookingAssistantFlow = ai.defineFlow(
  {
    name: 'aiBookingAssistantFlow',
    inputSchema: AiBookingAssistantInputSchema,
    outputSchema: AiBookingAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await aiBookingAssistantPrompt(input);
    if (!output) {
      throw new Error('AI Booking Assistant failed to generate output.');
    }
    return output;
  }
);
