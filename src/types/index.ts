export interface Question {
    id: string;
    category: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
}

export interface QuizCategory {
    id: string;
    title: string;
    description: string;
    icon: string; // Emoji char
}

export interface QuizResult {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    missingAnswers: number;
}

export type RootStackParamList = {
    Home: undefined;
    Quiz: { categoryId: string; categoryTitle: string };
    Result: { result: QuizResult; categoryId: string };
};
