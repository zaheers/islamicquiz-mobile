export type EmotionCategory = 
  | 'anxious'
  | 'restless'
  | 'grateful'
  | 'sad'
  | 'overwhelmed'
  | 'guilty'
  | 'angry'
  | 'lonely'
  | 'unknown';

export type EscalationType = 'none' | 'scholar_needed' | 'crisis';

export type SunnahType = 'dua' | 'dhikr' | 'practice' | null;

export interface QuranReference {
  surahNumber: number;
  ayahNumber: number;
  arabicText?: string;
  translation: string;
  surahName: string;
}

export interface SunnahReference {
  type: SunnahType;
  arabicText?: string;
  translation: string;
  source: string; // e.g. "Sahih Bukhari 123"
}

export interface MindfulnessResponse {
  emotion: EmotionCategory;
  escalationType: EscalationType;
  
  // The 6-part target response shape
  acknowledgment: string;
  quranReference?: QuranReference;
  sunnahReference?: SunnahReference;
  actionPrompt?: string;
  followUpQuestion?: string;
  quickReplies?: string[];
  
  // Fallback for safety/generic messages
  fallbackMessage?: string;
  
  confidence?: 'high' | 'medium' | 'low';
}

export interface ContentRegistryItem {
  id: string;
  emotion: EmotionCategory;
  theme: string;
  quranReference: QuranReference;
  quranTextShort: string;
  reflection: string;
  sunnahType: SunnahType;
  sunnahReference?: SunnahReference;
  sunnahTextShort?: string;
  actionPrompt: string;
  followUpQuestion: string;
  quickReplies: string[];
  escalationType: EscalationType;
  confidence: 'high' | 'medium' | 'low';
  scholarReviewStatus: boolean;
  fullResponseText?: string;
}
