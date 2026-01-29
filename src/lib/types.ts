export interface Category {
    id: number;
    title: string;
    slug: string;
    icon: string;
    description: string;
}

export interface Question {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

export type QuizData = Record<string, Question[]>;

export interface QuizResult {
    categoryId: string;
    score: number;
    totalQuestions: number;
    date: string;
}
