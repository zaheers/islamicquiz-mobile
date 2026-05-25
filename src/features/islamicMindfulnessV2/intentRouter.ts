import { askNoor } from '@/services/noorApi';
import { INTENT_ROUTING_PROMPT } from './promptTemplates';

export type IntentCategory = 
  | 'crisis' 
  | 'scholar_needed' 
  | 'anxious' 
  | 'restless' 
  | 'sad' 
  | 'overwhelmed' 
  | 'guilty' 
  | 'angry' 
  | 'lonely' 
  | 'grateful' 
  | 'safe_reflection' 
  | 'specific_guidance'
  | 'unsupported';

/**
 * Maps unstructured user input to a unified IntentCategory.
 * This handles both safety escalations and emotional mapping in a single pass.
 */
export async function routeIntent(input: string): Promise<IntentCategory> {
  // 1. Fast-path for critical safety (fallback if LLM fails)
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('suicide') || lowerInput.includes('kill myself') || lowerInput.includes('hurt myself')) {
    return 'crisis';
  }
  if (lowerInput.includes('fatwa') || lowerInput.includes('halal') || lowerInput.includes('haram')) {
    return 'scholar_needed';
  }

  // 2. Exact match for mood chips (triggers fast, safe library responses)
  const exactEmotions = ['anxious', 'restless', 'sad', 'overwhelmed', 'guilty', 'angry', 'lonely', 'grateful'];
  if (exactEmotions.includes(lowerInput)) {
    return lowerInput as IntentCategory;
  }

  // If it's a 2-3 word chip tap that is NOT an exact mood (like "Verse reflection" or "The dua")
  // or a full conversational sentence (like "I have debt"), we want it to feel completely natural.
  // So we will route ALL of these to specific_guidance to trigger the generative LLM pipeline.

  // 3. LLM Routing for nuanced text
  try {
    const prompt = `${INTENT_ROUTING_PROMPT}\n\nUser Input: "${input}"\nCategory:`;
    
    const response = await askNoor({
      mode: 'intent_routing',
      systemPrompt: prompt
    });

    const resultString = (response.answer || response.reflection || '').toLowerCase().trim();

    const validCategories: IntentCategory[] = [
      'crisis', 'scholar_needed', 'anxious', 'restless', 'sad', 'overwhelmed', 
      'guilty', 'angry', 'lonely', 'grateful', 'safe_reflection', 'specific_guidance', 'unsupported'
    ];

    // For conversational input, if it's not a crisis or scholar issue, treat as specific_guidance 
    // to give a fully personalized, generative response.
    if (resultString.includes('crisis')) return 'crisis';
    if (resultString.includes('scholar_needed')) return 'scholar_needed';
    
    return 'specific_guidance';
  } catch (error) {
    console.error('[IslamicMindfulnessV2] Intent routing failed:', error);
    return 'specific_guidance';
  }
}
