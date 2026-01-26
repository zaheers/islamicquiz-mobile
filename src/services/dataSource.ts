import questionsData from '../data/questions.json';
import { Question, QuizCategory } from '../types';

export interface QuizDataSource {
    getCategories(): Promise<QuizCategory[]>;
    getQuestionsByCategory(categoryId: string): Promise<Question[]>;
}

export class LocalJsonSource implements QuizDataSource {
    async getCategories(): Promise<QuizCategory[]> {
        return [
            { id: 'quran', title: 'Quran', description: 'Test your knowledge of the Holy Quran', icon: '📖' },
            { id: 'prophets', title: 'Prophets', description: 'Lives and stories of the Prophets', icon: '🕌' },
            { id: 'hadith', title: 'Hadith', description: 'Sayings and traditions of the Prophet (SAW)', icon: '📜' },
            { id: 'salah', title: 'Salah', description: 'Rulings and importance of Prayer', icon: '🤲' },
            { id: 'hajj', title: 'Hajj & Umrah', description: 'Pilgrimage to the House of Allah', icon: '🕋' },
            { id: 'zakat', title: 'Zakat & Finance', description: 'Charity and Islamic Finance', icon: '💰' },
            { id: 'names', title: 'Names of Allah', description: 'The 99 Beautiful Names', icon: '✨' },
        ];
    }

    async getQuestionsByCategory(categoryId: string): Promise<Question[]> {
        const allQuestions = questionsData as Question[];
        // Filter by category
        const filtered = allQuestions.filter(q => q.category === categoryId);

        // Fallback: If no questions for category (stub data limitation), return random subset or repeats to ensure functionality
        // For this demo, we will duplicate questions if we have less than 10 to ensure the app doesn't crash on "load 10 questions" logic
        let result = [...filtered];
        if (result.length === 0) return [];

        while (result.length < 10) {
            result = [...result, ...filtered];
        }

        return result.slice(0, 10);
    }
}

export const dataSource = new LocalJsonSource();
