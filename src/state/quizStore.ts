import { QUIZ_CONFIG } from '@/lib/config';
import { selectQuestionsForQuiz } from '@/lib/engine/quizEngine';
import { fetchQuestionsByCategory } from '@/lib/repositories/quizRepo';
import { Question } from '@/lib/types';
import { create } from 'zustand';

interface QuizState {
    questions: Question[];
    currentQuestionIndex: number;
    score: number;
    status: 'idle' | 'loading' | 'active' | 'completed' | 'error';
    timer: number;
    selectedOption: string | null;
    answers: { question: string; selected: string; correct: string }[];

    // Actions
    startQuiz: (categorySlug: string) => Promise<void>;
    selectOption: (option: string) => void;
    submitAnswer: () => void;
    nextQuestion: () => void;
    tickTimer: () => void;
    reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    status: 'idle',
    timer: QUIZ_CONFIG.DEFAULT_TIME_PER_QUESTION,
    selectedOption: null,
    answers: [],

    startQuiz: async (categorySlug) => {
        set({ status: 'loading', reset: () => { }, answers: [], score: 0, currentQuestionIndex: 0 });
        try {
            // Fetch ALL matching questions (Web logic fetches all then filters/slices)
            const allQuestions = await fetchQuestionsByCategory(categorySlug);

            // Engine handles shuffling and slicing to DEFAULT_QUESTION_COUNT (12)
            const gameQuestions = selectQuestionsForQuiz(allQuestions, QUIZ_CONFIG.DEFAULT_QUESTION_COUNT);

            if (gameQuestions.length === 0) {
                set({ status: 'error' }); // Or handle empty state
                return;
            }

            set({
                questions: gameQuestions,
                status: 'active',
                currentQuestionIndex: 0,
                score: 0,
                timer: QUIZ_CONFIG.DEFAULT_TIME_PER_QUESTION,
            });
        } catch (error) {
            console.error(error);
            set({ status: 'error' });
        }
    },

    selectOption: (option) => {
        const { status, selectedOption, answers, currentQuestionIndex, questions } = get();

        // Prevent changing answer if already submitted (Web parity: locked after selection?)
        // Web: handleAnswer is immediate. Mobile: Select -> Confirm.
        // If "Question Done" (in answers), lock it.
        const isDone = answers.some(a => a.question === questions[currentQuestionIndex].question);

        if (status !== 'active' || isDone) return;

        set({ selectedOption: option });
    },

    submitAnswer: () => {
        const { questions, currentQuestionIndex, selectedOption, score, answers } = get();
        const question = questions[currentQuestionIndex];

        if (!question || !selectedOption) return;

        // Prevent double submission
        const isDone = answers.some(a => a.question === question.question);
        if (isDone) return;

        const isCorrect = selectedOption === question.answer;
        const newScore = isCorrect ? score + 1 : score;

        set({
            score: newScore,
            answers: [...answers, {
                question: question.question,
                selected: selectedOption,
                correct: question.answer
            }]
        });
    },

    nextQuestion: () => {
        const { questions, currentQuestionIndex } = get();
        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex >= questions.length) {
            set({ status: 'completed' });
        } else {
            set({
                currentQuestionIndex: nextIndex,
                selectedOption: null,
                timer: QUIZ_CONFIG.DEFAULT_TIME_PER_QUESTION,
            });
        }
    },

    tickTimer: () => {
        const { status, timer, currentQuestionIndex, questions, answers } = get();
        if (status !== 'active') return;

        // Make sure we aren't ticking if question is already done/submitted
        const question = questions[currentQuestionIndex];
        const isDone = answers.some(a => a.question === question?.question);
        if (isDone) return; // Don't tick if answered, waiting for user to click Next

        if (timer <= 1) {
            // Time up! Auto-submit empty
            const { selectedOption } = get();
            if (!selectedOption) {
                // No selection: Submit blank/wrong
                // Web Parity: handleAnswer("")
                get().selectOption(""); // Select empty to trigger store logic
                get().submitAnswer();
                // Web auto-advances. Mobile UI waits.
                // We can force next or let user see timeout?
                // Let's force next conform to "auto-submit"
                setTimeout(() => get().nextQuestion(), QUIZ_CONFIG.AUTO_ADVANCE_DELAY_MS);
            } else {
                // Determine if we submit what they have selected?
                // Web: If time sends handleAnswer("").
                // Let's stick to strict timeout = wrong.
                get().submitAnswer();
                setTimeout(() => get().nextQuestion(), QUIZ_CONFIG.AUTO_ADVANCE_DELAY_MS);
            }
        } else {
            set({ timer: timer - 1 });
        }
    },

    reset: () => {
        set({
            status: 'idle',
            questions: [],
            currentQuestionIndex: 0,
            score: 0,
            timer: QUIZ_CONFIG.DEFAULT_TIME_PER_QUESTION,
            selectedOption: null,
            answers: []
        });
    }
}));
