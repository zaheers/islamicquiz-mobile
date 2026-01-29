import { collection, DocumentData, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Question } from '../types';

export const fetchQuestionsByCategory = async (categorySlug: string): Promise<Question[]> => {
    // Safety check for DB
    if (!db) {
        console.warn("Firestore instance is undefined. Returning empty questions.");
        return [];
    }

    try {
        const questionsRef = collection(db, 'questions');
        let q = query(questionsRef, where('language', '==', 'en'));

        if (categorySlug !== 'general') {
            q = query(questionsRef,
                where('language', '==', 'en'),
                where('category', '==', categorySlug)
            );
        }

        const snapshot = await getDocs(q);

        const questions = snapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            return {
                question: data.question,
                options: data.options || [],
                answer: data.answer,
                explanation: data.explanation || '',
                difficulty: data.difficulty || 'medium',
            } as Question & { difficulty: string };
        });

        return questions;
    } catch (error) {
        console.error(`Error fetching questions for ${categorySlug}:`, error);
        return [];
    }
};
