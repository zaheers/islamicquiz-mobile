import { askNoor } from '@/services/noorApi';
import { 
  ESCALATION_CRISIS_RESPONSE, 
  ESCALATION_SCHOLAR_RESPONSE,
  GENERAL_REFLECTION_PROMPT
} from './promptTemplates';
import { MindfulnessResponse } from './types';
import { MINDFULNESS_REGISTRY } from './contentRegistry';
import { IntentCategory } from './intentRouter';

/**
 * Composes the final response using the 80/20 Library-First Hybrid approach.
 * 80% of flows hit the static registry. 20% hit the LLM for safe fallback.
 */
export async function composeResponse(
  input: string,
  intent: IntentCategory
): Promise<MindfulnessResponse> {
  
  // 1. Human-First for Crisis
  if (intent === 'crisis') {
    return {
      emotion: 'unknown',
      escalationType: 'crisis',
      confidence: 'high',
      acknowledgment: ESCALATION_CRISIS_RESPONSE,
      quickReplies: ['I will get help', 'Thank you']
    };
  }

  // 2. Scholar-First for Rulings
  if (intent === 'scholar_needed') {
    return {
      emotion: 'unknown',
      escalationType: 'scholar_needed',
      confidence: 'high',
      acknowledgment: ESCALATION_SCHOLAR_RESPONSE,
      quickReplies: ['I understand', 'How do I find a scholar?']
    };
  }

  // 3. Library-First for Supported Emotional Journeys
  const supportedEmotions = ['anxious', 'restless', 'sad', 'overwhelmed', 'guilty', 'angry', 'lonely', 'grateful'];
  
  if (supportedEmotions.includes(intent)) {
    // Fetch all variants for this emotion
    const variants = MINDFULNESS_REGISTRY.filter(item => item.emotion === intent);
    if (variants.length > 0) {
      // Pick a random variant to keep it feeling fresh but 100% safe
      const content = variants[Math.floor(Math.random() * variants.length)];
      
      return {
        emotion: content.emotion,
        escalationType: 'none',
        confidence: content.confidence,
        acknowledgment: content.fullResponseText || content.reflection,
        quranReference: content.quranReference,
        sunnahReference: content.sunnahReference,
        actionPrompt: content.actionPrompt,
        followUpQuestion: content.followUpQuestion,
        quickReplies: content.quickReplies || ['Thank you', 'Alhamdulillah']
      };
    }
  }

  // 4. LLM-Assisted for Safe Reflection and Specific Guidance
  if (intent === 'safe_reflection' || intent === 'specific_guidance') {
    try {
      const prompt = `Here is what's on my mind: ${input}. Act as a therapeutic Islamic companion using the 'Sakina Method'. Structure your exact response in 3 short stages: 1. Validate Context (1 sentence), 2. Reveal Revelation (1 short Quranic ayah or ONE complete authentic Prophetic Dua including full Arabic text), 3. Prescribe Action (1 actionable sentence). Finally, generate 3 relevant short quick reply phrases for the user to tap, and append them formatted exactly like this: [QR: Phrase 1 | Phrase 2 | Phrase 3]. Ensure you replace 'Phrase 1' etc with your actual generated text. Keep the main text strictly under 80 words.`;
      
      const response = await askNoor({
        mode: 'ask_my_day',
        topic: intent,
        systemPrompt: prompt
      });

      const verses = response.verses || response.answer?.verses || [];
      let reflectionText = response.reflection || response.answer?.reflection || response.answer || "Reflect deeply on these verses and how they apply to your life.";
      
      let dynamicQuickReplies = ['Alhamdulillah', 'Thank you', 'I need more time to think'];
      const qrMatch = reflectionText.match(/\[QR:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]/i);
      if (qrMatch) {
        dynamicQuickReplies = [qrMatch[1].trim(), qrMatch[2].trim(), qrMatch[3].trim()];
        reflectionText = reflectionText.replace(qrMatch[0], '').trim();
      }

      let quranRef;
      if (verses && verses.length > 0) {
        quranRef = {
          surahNumber: verses[0].surah_number || verses[0].surah || 0,
          ayahNumber: verses[0].ayah_number || verses[0].ayah || 0,
          arabicText: verses[0].arabic_text || '',
          translation: verses[0].translation || verses[0].text || '',
          surahName: verses[0].surah_name_en || verses[0].surah_name || 'Unknown'
        };
      }

      return {
        emotion: 'unknown',
        escalationType: 'none',
        confidence: 'low',
        acknowledgment: reflectionText.trim(),
        quranReference: quranRef,
        quickReplies: dynamicQuickReplies
      };
    } catch (error) {
      console.error('[IslamicMindfulnessV2] Specific guidance generation failed, using fallback.', error);
    }
  }

  // 5. Ultimate Fallback
  return {
    emotion: 'unknown',
    escalationType: 'none',
    confidence: 'low',
    acknowledgment: "I hear you, and your feelings are valid. May Allah grant you ease and clarity in all your affairs.",
    quickReplies: ['I need more time to think', 'Alhamdulillah', 'Thank you']
  };
}
