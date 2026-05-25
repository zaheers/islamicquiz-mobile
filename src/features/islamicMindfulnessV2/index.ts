import { routeIntent } from './intentRouter';
import { composeResponse } from './responseComposer';
import { MindfulnessResponse } from './types';

export { ENABLE_ISLAMIC_MINDFULNESS_V2 } from './flag';
export * from './types';

/**
 * Main entry point for processing a mindfulness chat input using the Hybrid V2 strategy.
 * 
 * @param input The raw user message text
 * @param currentMood Optional currently selected mood chip
 * @returns A strictly formatted MindfulnessResponse
 */
export async function processMindfulnessInput(
  input: string, 
  currentMood?: string
): Promise<MindfulnessResponse> {
  
  // 1. Unified Intent & Emotion Routing
  const intentToMap = currentMood ? `${currentMood} ${input}` : input;
  const intent = await routeIntent(intentToMap);

  // 2. Compose Final Response based strictly on the routed intent
  const response = await composeResponse(input, intent);
  
  return response;
}
