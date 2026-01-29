import { QUIZ_CONFIG } from "../config/quizConfig";
import { Question } from "../types";

// Web Logic: "arr.sort(() => Math.random() - 0.5)"
// We implement a Fisher-Yates for better randomness, but functionally equivalent for purpose.
export const shuffleArray = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Select questions based on Web logic
export const selectQuestionsForQuiz = (
    allQuestions: (Question & { difficulty?: string })[],
    count: number = QUIZ_CONFIG.DEFAULT_QUESTION_COUNT
): Question[] => {
    if (!allQuestions || allQuestions.length === 0) return [];

    // 1. Shuffle all filtered questions (Web does this for "mixed" difficulty default)
    const shuffledQuestions = shuffleArray(allQuestions);

    // 2. Slice to requested count
    const selected = shuffledQuestions.slice(0, count);

    // 3. Shuffle options for each question (matches web: options: shuffleArray([...q.options]))
    return selected.map(q => ({
        ...q,
        options: shuffleArray(q.options)
    }));
};
