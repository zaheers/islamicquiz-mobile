export interface QuranVerse {
  surah_name: string;
  surah_number: number;
  ayah_number: number;
  arabic_text: string;
  translation: string;
}

export interface NoorAnswer {
  answer: string;
  verses: QuranVerse[];
  tafsir: string[];
}

const API_URL = 'https://noor-ai-core-922550074816.me-central1.run.app/ask';

export async function askNoor(options: { mode?: string, topic?: string, systemPrompt?: string } | string): Promise<any> {
  try {
    const payload = typeof options === 'string' 
      ? { question: options } 
      : { 
          question: options.systemPrompt || '', 
          mode: options.mode,
          topic: options.topic 
        };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Unable to reach Noor AI service. Please try again.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Noor API:', error);
    throw error;
  }
}
