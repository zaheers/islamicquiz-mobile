export interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export interface Word {
    id: number;
    position: number;
    text: string;
    transliteration: string;
    translation: string;
}

export interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
    translation?: string;
    transliteration?: string;
    audio?: string;
    words?: Word[];
    segments?: number[][]; // [word_index, start_ms, end_ms]
}

const ALQURAN_BASE = 'https://api.alquran.cloud/v1';
const QURAN_COM_BASE = 'https://api.quran.com/api/v4';

export const quranService = {
    async getSurahs(): Promise<Surah[]> {
        const response = await fetch(`${ALQURAN_BASE}/surah`);
        const data = await response.json();
        return data.data;
    },

    async getAyahWithTranslationAndAudio(
        surahNumber: number,
        ayahNumber: number,
        recitationId: number = 7 // Alafasy
    ): Promise<Ayah> {
        // Fetch from Quran.com API for rich word-level data, timing, and translation (Sahih International ID: 20)
        const response = await fetch(
            `${QURAN_COM_BASE}/verses/by_key/${surahNumber}:${ayahNumber}?language=en&words=true&word_fields=text_uthmani,transliteration,translation&audio=${recitationId}&translations=20`
        );
        const data = await response.json();
        const verse = data.verse;

        if (!verse) {
            throw new Error(`Verse ${surahNumber}:${ayahNumber} not found`);
        }

        // Extract translation from the combined response
        let translationText = '';
        if (verse.translations && verse.translations.length > 0) {
            translationText = verse.translations[0].text.replace(/<(?:.|\n)*?>/gm, '');
        } else {
            // Fallback: construct from word translations if main translation is missing
            translationText = (verse.words || [])
                .map((w: any) => w.translation?.text)
                .filter(Boolean)
                .join(' ');
        }

        // Map words with safety
        const words: Word[] = (verse.words || []).map((w: any) => ({
            id: w.id,
            position: w.position,
            text: w.text_uthmani || '',
            transliteration: w.transliteration?.text || '',
            translation: w.translation?.text || '',
        }));

        const audioUrl = verse.audio?.url || '';
        const fullAudioUrl = audioUrl.startsWith('http')
            ? audioUrl
            : audioUrl
                ? `https://audio.qurancdn.com/${audioUrl}`
                : '';

        return {
            number: verse.id,
            text: verse.text_uthmani || '',
            numberInSurah: ayahNumber,
            translation: translationText,
            transliteration: words.map(w => w.transliteration).filter(Boolean).join(' '),
            audio: fullAudioUrl,
            words: words,
            segments: verse.audio?.segments || [],
        };
    },
};
